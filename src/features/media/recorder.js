/*
 * Audio direkt aufnehmen: das Mikrofon rechts in der Medien-Leiste öffnet ein
 * Overlay und nimmt sofort auf — ohne Umweg über eine Rekorder-App oder die
 * Dateiauswahl. Während der Aufnahme laufen Zeit und Welle mit, und wo der
 * Browser es kann, steht das Gesagte als Mitschrift darunter. Unten lässt
 * sich pausieren, stoppen (danach anhören oder neu aufnehmen) und speichern;
 * „Abbrechen“, der Pfeil oben und die Zurück-Geste verwerfen die Aufnahme.
 * Gespeichert wird sie wie jede andere Datei als Medien-Eintrag im Eingang,
 * die Mitschrift wird sein Text (src/features/media/media-import.js).
 * In der späteren Android-App treten MediaRecorder und SpeechRecognizer des
 * Geräts an diese Stelle — Ablauf und Knöpfe bleiben dieselben.
 * Wird erst beim ersten Tipp aufs Mikrofon nachgeladen.
 * Pfad: src/features/media/recorder.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * levelEveryMs -> wie oft ein neuer Strich in die Welle kommt (kleiner = schneller)
 * levelBoost   -> wie stark leise Töne in der Welle angehoben werden
 * namePrefix   -> wie eine Aufnahme ohne eigenen Namen heißt („Sprachmemo 04.10.2026 14:03“)
 *
 * Die Mitschrift steht in src/features/media/recorder-speech.js, was man mit
 * ihr machen kann (kopieren, umwandeln) in recorder-text.js, das Blatt
 * hinter ⚙ in recorder-setup.js, das Aussehen in recorder-view.js und
 * styles/recorder.css.
 */

import { pad2 } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { registerOverlay } from "../../ui/router.js";
import { showToast } from "../../ui/toast.js";
import { addMediaFiles } from "./media-import.js";
import { openRecorderSetup } from "./recorder-setup.js";
import { createSpeech, speechAvailable } from "./recorder-speech.js";
import { convertTranscript, copyTranscript } from "./recorder-text.js";
import { buildRecorder, createWave, showPlaying, showSetupAlert, showState, showText, showTime } from "./recorder-view.js";

const levelEveryMs = 70;
const levelBoost = 3.2;
const namePrefix = "Sprachmemo";

let layer = null;
let wave = null;
let state = "starting";
/* Die laufende Aufnahme: Mikrofon, Recorder, Pegelmesser und Zeit */
let session = null;
/* Die fertige Aufnahme nach „Stoppen“: { blob, duration } */
let recorded = null;
/* Die Mitschrift dieser Aufnahme (recorder-speech.js) */
let speech = null;
let preview = null;
/* Zählt jeden Start mit; ein überholter Start räumt sein Mikrofon wieder weg */
let startRun = 0;

function defaultName() {
  const now = new Date();
  return `${namePrefix} ${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function canSave() {
  if (state === "recording" || state === "paused") return true;
  return state === "stopped" && Boolean(recorded && recorded.blob.size);
}

function setState(next) {
  state = next;
  showState(layer, state, canSave());
  showProblems();
}

/* Punkt am Zahnrad, solange das Mikrofon nicht aufgeht oder die Mitschrift nicht läuft */
function showProblems() {
  showSetupAlert(layer, state === "error" || Boolean(speech && speech.problem()));
}

/* ---------- Pegel und Zeit ---------- */

/* Pegelmesser am Mikrofon; ohne Web Audio bewegt sich die Welle zufällig. */
function meter(stream) {
  try {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    /* Kam die Freigabe erst nach einer Weile, startet der Browser den Messer mitunter angehalten */
    if (context.state === "suspended") context.resume();
    return { context, analyser, samples: new Uint8Array(analyser.fftSize) };
  } catch (error) {
    return {};
  }
}

/* Lautstärke gerade jetzt, 0 bis 1 (Mittel der Ausschläge, angehoben). */
function level() {
  if (!session.analyser) return 0.2 + Math.random() * 0.5;
  session.analyser.getByteTimeDomainData(session.samples);
  let sum = 0;
  session.samples.forEach((value) => {
    const swing = (value - 128) / 128;
    sum += swing * swing;
  });
  return Math.sqrt(sum / session.samples.length) * levelBoost;
}

/* Läuft nur während der Aufnahme: Zeit weiterzählen, neue Striche in die Welle. */
function tick() {
  session.frame = requestAnimationFrame(tick);
  const now = performance.now();
  showTime(layer, session.elapsed + now - session.startedAt);
  if (now - session.lastLevel < levelEveryMs) return;
  session.lastLevel = now;
  wave.push(level());
}

/* ---------- Aufnehmen ---------- */

/* Mikrofon und Pegelmesser freigeben; die Aufnahme selbst bleibt in `recorded`. */
function release() {
  if (!session) return;
  cancelAnimationFrame(session.frame);
  session.stream.getTracks().forEach((track) => track.stop());
  if (session.context) session.context.close();
  session = null;
}

async function start() {
  const run = ++startRun;
  stopPreview();
  recorded = null;
  wave.reset();
  showTime(layer, 0);
  setState("starting");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    setState("error");
    return;
  }
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (run === startRun) setState("error");
    return;
  }
  /* Inzwischen geschlossen oder neu gestartet: dieses Mikrofon wird nicht mehr gebraucht */
  if (run !== startRun || layer.hidden) {
    stream.getTracks().forEach((track) => track.stop());
    return;
  }
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  session = { stream, recorder, chunks, elapsed: 0, startedAt: performance.now(), lastLevel: 0, frame: 0, ...meter(stream) };
  recorder.start();
  setState("recording");
  speech.start();
  tick();
}

function pause() {
  if (!session || state !== "recording") return;
  session.recorder.pause();
  session.elapsed += performance.now() - session.startedAt;
  cancelAnimationFrame(session.frame);
  speech.stop();
  setState("paused");
}

function resume() {
  if (!session || state !== "paused") return;
  session.recorder.resume();
  session.startedAt = performance.now();
  setState("recording");
  speech.start();
  tick();
}

/* Aufnahme beenden und als Datei bereitlegen; danach ist das Mikrofon frei. */
function finish() {
  if (!session) return Promise.resolve();
  const current = session;
  if (state === "recording") current.elapsed += performance.now() - current.startedAt;
  cancelAnimationFrame(current.frame);
  speech.stop();
  return new Promise((resolve) => {
    current.recorder.addEventListener(
      "stop",
      () => {
        recorded = {
          blob: new Blob(current.chunks, { type: current.recorder.mimeType || "audio/webm" }),
          duration: current.elapsed / 1000,
        };
        resolve();
      },
      { once: true }
    );
    current.recorder.stop();
    release();
  });
}

async function stop() {
  await finish();
  if (layer.hidden) return;
  setState("stopped");
  if (recorded) showTime(layer, recorded.duration * 1000);
}

/* ---------- Anhören ---------- */

function stopPreview() {
  if (!preview) return;
  preview.pause();
  URL.revokeObjectURL(preview.src);
  preview = null;
  if (layer) showPlaying(layer, false);
}

function togglePreview() {
  if (!recorded) return;
  if (preview) {
    stopPreview();
    return;
  }
  preview = new Audio(URL.createObjectURL(recorded.blob));
  preview.addEventListener("ended", stopPreview);
  preview.play();
  showPlaying(layer, true);
}

/* ---------- Speichern, Öffnen, Schließen ---------- */

/* Dateiendung passend zum Format, das der Browser aufgenommen hat. */
function extensionOf(type) {
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mp4")) return "m4a";
  return "webm";
}

/* Der getippte Name, sonst der vorgeschlagene („Sprachmemo 04.10.2026 14:03“) */
function recordingName() {
  const input = layer.querySelector(".recorder-name");
  return input.value.trim() || input.placeholder;
}

async function save() {
  if (state === "recording" || state === "paused") await finish();
  if (!recorded || !recorded.blob.size) return;
  const name = recordingName();
  const file = new File([recorded.blob], `${name}.${extensionOf(recorded.blob.type)}`, { type: recorded.blob.type });
  const extra = { body: speech.text(), duration: recorded.duration };
  /* Erst schließen (das verwirft den Zwischenstand), die Datei ist schon gepackt */
  close();
  await addMediaFiles([file], "audio", extra);
  showToast({ icon: "mic", title: "Aufnahme gespeichert", note: name });
}

/* Ohne Verlauf schließen (Zurück-Geste): alles verwerfen, Mikrofon frei. */
function hide() {
  if (!layer || layer.hidden) return;
  startRun += 1;
  layer.hidden = true;
  if (session && session.recorder.state !== "inactive") session.recorder.stop();
  release();
  speech.stop();
  stopPreview();
  recorded = null;
}

/* Wie die Zurück-Geste: der Schritt im Verlauf schließt das Overlay. */
function close() {
  if (history.state && history.state.view === "recorder") history.back();
  else hide();
}

/* ⚙: „Erneut anfragen“ fragt die Mitschrift neu an und öffnet das Mikrofon neu, wenn es nicht aufging */
function setup() {
  openRecorderSetup({
    speechProblem: speech.problem(),
    micBlocked: state === "error",
    retry: () => {
      speech.retry();
      if (state === "error") start();
    },
  });
}

const actions = {
  cancel: close,
  stop,
  pause,
  resume,
  restart: start,
  play: togglePreview,
  save,
  setup,
  copy: () => copyTranscript(speech.text()),
  convert: () => convertTranscript(speech.text(), recordingName()),
};

function mount() {
  if (layer) return;
  layer = buildRecorder();
  dom.device.append(layer);
  wave = createWave(layer);
  layer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rec]");
    if (button && !button.disabled) actions[button.dataset.rec]();
  });
  /* Enter im Namen schließt nur die Tastatur */
  layer.querySelector(".recorder-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.target.blur();
  });
}

function open(push = true) {
  mount();
  const input = layer.querySelector(".recorder-name");
  input.value = "";
  input.placeholder = defaultName();
  /* Jede Aufnahme bekommt ihre eigene Mitschrift; sie hört nur zu, solange aufgenommen wird */
  speech = createSpeech(
    (final, pending) => {
      showText(layer, final, pending);
      showProblems();
    },
    () => state === "recording"
  );
  showText(layer, speechAvailable() ? "" : null);
  layer.hidden = false;
  if (push) history.pushState({ view: "recorder", from: ui.sourceView }, "", "#/aufnahme");
  start();
}

/** Vom Mikrofon in der Medien-Leiste aufgerufen. */
export function openRecorder() {
  open(true);
}

registerOverlay("recorder", { open, hide, close });
