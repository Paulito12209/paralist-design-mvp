/*
 * Die Mitschrift einer Audio-Aufnahme: was man sagt, erscheint während der
 * Aufnahme als Text. Im Browser übernimmt das die eingebaute Spracherkennung
 * (Web Speech API); gibt es sie nicht, läuft die Aufnahme ohne Text. In der
 * späteren Android-App tritt der SpeechRecognizer des Geräts an diese Stelle.
 * Benutzt von src/features/media/recorder.js.
 * Pfad: src/features/media/recorder-speech.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * speechLang -> Sprache, auf die die Mitschrift eingestellt ist
 *
 * Wie der Text aussieht, steht in styles/recorder.css (.recorder-text).
 */

const speechLang = "de-DE";

/* Fehler, nach denen einfach weitergehört wird; alle anderen beenden die Mitschrift. */
const harmlessErrors = ["no-speech", "aborted"];

/* Die Spracherkennung heißt je nach Browser anders; ohne beide gibt es sie nicht. */
function speechApi() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/** Kann dieser Browser überhaupt mitschreiben? */
export function speechAvailable() {
  return Boolean(speechApi());
}

/**
 * Eine Mitschrift für eine Aufnahme.
 * @param onChange (final, pending) — der sichere Text und was noch unsicher
 *   ist; `null` statt Text heißt: die Mitschrift geht hier nicht.
 * @param stillRecording sagt, ob nach einer Sprechpause weitergehört werden soll.
 */
export function createSpeech(onChange, stillRecording) {
  const Api = speechApi();
  let recognition = null;
  let final = "";
  let pending = "";
  let failed = !Api;

  function listen() {
    const current = new Api();
    current.lang = speechLang;
    current.continuous = true;
    current.interimResults = true;
    current.onresult = (event) => {
      let open = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) final = [final, text].filter(Boolean).join(" ");
        else open += ` ${text}`;
      }
      pending = open.trim();
      onChange(final, pending);
    };
    current.onerror = (event) => {
      if (harmlessErrors.includes(event.error)) return;
      failed = true;
      if (!final) onChange(null);
    };
    /* Der Browser hört nach einer Sprechpause von selbst auf — solange
       aufgenommen wird, gleich weiterhören. */
    current.onend = () => {
      if (recognition !== current || failed || !stillRecording()) return;
      try {
        current.start();
      } catch (error) {
        recognition = null;
      }
    };
    recognition = current;
    try {
      current.start();
    } catch (error) {
      recognition = null;
    }
  }

  return {
    /** Zuhören (wieder) beginnen. */
    start() {
      if (!failed && !recognition) listen();
    },
    /** Zuhören beenden; was noch unsicher war, zählt jetzt als gesagt. */
    stop() {
      if (!recognition) return;
      const current = recognition;
      recognition = null;
      current.onresult = null;
      current.stop();
      if (pending) final = [final, pending].join(" ").trim();
      pending = "";
      if (!failed) onChange(final, "");
    },
    /** Der ganze Text bis jetzt. */
    text() {
      return [final, pending].join(" ").trim();
    },
  };
}
