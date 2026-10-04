/*
 * Das Mikrofon der Audio-Aufnahme: öffnen (dabei fragt der Browser nach der
 * Erlaubnis), den Ton als Datei mitschneiden, den Pegel für die Welle messen,
 * am Ende alles wieder freigeben — und den Mitschnitt anhören. Was mit der
 * Aufnahme passiert (Zustände, Knöpfe, Speichern), steht in
 * src/features/media/recorder.js.
 * In der späteren Android-App übernimmt das der MediaRecorder des Geräts.
 * Pfad: src/features/media/recorder-mic.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * levelBoost -> wie stark leise Töne in der Welle angehoben werden
 * fftSize    -> wie viele Proben in eine Pegelmessung eingehen (größer = ruhiger, träger)
 * micErrors  -> Name des Browser-Fehlers → kurzer Grund in Alltagssprache
 */

const levelBoost = 3.2;
const fftSize = 1024;

/* Warum das Mikrofon nicht aufging — der Browser nennt den Fehler nur technisch. */
const micErrors = {
  NotAllowedError: "blocked",
  SecurityError: "blocked",
  NotFoundError: "missing",
  NotReadableError: "busy",
  AbortError: "busy",
};

/** Kann dieser Browser überhaupt aufnehmen? */
export function micSupported() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

/* Pegelmesser am Mikrofon; ohne Web Audio bleibt er leer und die Welle läuft zufällig. */
function meter(stream) {
  try {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = fftSize;
    context.createMediaStreamSource(stream).connect(analyser);
    /* Kam die Freigabe erst nach einer Weile, startet der Browser den Messer mitunter angehalten */
    if (context.state === "suspended") context.resume();
    return { context, analyser, samples: new Uint8Array(analyser.fftSize) };
  } catch (error) {
    return {};
  }
}

/**
 * Mikrofon öffnen und sofort mitschneiden. Der Browser fragt dabei nach der
 * Erlaubnis, wenn er sie noch nicht hat.
 * Gibt die laufende Mikrofon-Sitzung zurück; geht es nicht, wirft es einen
 * Fehler mit `reason`: "blocked" (nicht erlaubt), "missing" (kein Mikrofon),
 * "busy" (belegt) oder "failed".
 */
export async function openMic() {
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    const failure = new Error(error && error.message ? error.message : "Mikrofon geht nicht auf");
    failure.reason = micErrors[error && error.name] || "failed";
    throw failure;
  }
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  recorder.start();
  return { stream, recorder, chunks, ...meter(stream) };
}

/**
 * Lautstärke gerade jetzt, 0 bis 1 (Mittel der Ausschläge, angehoben).
 * `null`, wenn kein Pegelmesser läuft.
 */
export function micLevel(mic) {
  if (!mic.analyser) return null;
  mic.analyser.getByteTimeDomainData(mic.samples);
  let sum = 0;
  mic.samples.forEach((value) => {
    const swing = (value - 128) / 128;
    sum += swing * swing;
  });
  return Math.sqrt(sum / mic.samples.length) * levelBoost;
}

/** Mitschneiden anhalten; das Mikrofon bleibt offen. */
export function pauseMic(mic) {
  if (mic.recorder.state === "recording") mic.recorder.pause();
}

/** Nach einer Pause weiter mitschneiden. */
export function resumeMic(mic) {
  if (mic.recorder.state === "paused") mic.recorder.resume();
}

/** Mikrofon und Pegelmesser freigeben; der Mitschnitt bleibt in `chunks`. */
export function releaseMic(mic) {
  mic.stream.getTracks().forEach((track) => track.stop());
  if (mic.context) mic.context.close();
}

/**
 * Mitschnitt beenden und als Blob bereitlegen; danach ist das Mikrofon frei.
 * Löst mit `null` auf, wenn gar nichts aufgenommen wurde.
 */
export function finishMic(mic) {
  return new Promise((resolve) => {
    const done = () => {
      const blob = new Blob(mic.chunks, { type: mic.recorder.mimeType || "audio/webm" });
      resolve(blob.size ? blob : null);
    };
    if (mic.recorder.state === "inactive") {
      releaseMic(mic);
      done();
      return;
    }
    mic.recorder.addEventListener("stop", done, { once: true });
    mic.recorder.stop();
    releaseMic(mic);
  });
}

/** Alles verwerfen (Abbrechen, Zurück): Mitschnitt stoppen, Mikrofon frei. */
export function discardMic(mic) {
  if (mic.recorder.state !== "inactive") mic.recorder.stop();
  releaseMic(mic);
}

/* Dateiendung passend zum Format, das der Browser aufgenommen hat. */
function extensionOf(type) {
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4")) return "m4a";
  return "webm";
}

/** Den Mitschnitt als Datei verpacken („Sprachmemo 04.10.2026 14:03.webm“). */
export function micFile(blob, name) {
  return new File([blob], `${name}.${extensionOf(blob.type)}`, { type: blob.type });
}

/**
 * Den Mitschnitt anhören: spielt immer nur eine Aufnahme, ein zweiter Tipp hält an.
 * `onPlaying(true/false)` meldet den Zustand für den Knopf.
 */
export function createPlayer(onPlaying) {
  let audio = null;
  const stop = () => {
    if (!audio) return;
    audio.pause();
    URL.revokeObjectURL(audio.src);
    audio = null;
    onPlaying(false);
  };
  return {
    stop,
    toggle(blob) {
      if (audio) {
        stop();
        return;
      }
      if (!blob) return;
      audio = new Audio(URL.createObjectURL(blob));
      audio.addEventListener("ended", stop);
      audio.play();
      onPlaying(true);
    },
  };
}
