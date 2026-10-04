/*
 * Audio direkt aufnehmen: das Mikrofon rechts in der Medien-Leiste öffnet ein
 * Overlay und nimmt sofort auf — ohne Umweg über eine Rekorder-App oder die
 * Dateiauswahl. Während der Aufnahme laufen Zeit und Welle mit, und wo der
 * Browser es kann, steht das Gesagte als Mitschrift darunter. Unten lässt
 * sich pausieren, stoppen (danach anhören oder neu aufnehmen) und speichern;
 * „Abbrechen“, der Pfeil oben und die Zurück-Geste verwerfen die Aufnahme —
 * ab ein paar Sekunden erst nach einer Rückfrage (recorder-discard.js).
 * Gespeichert wird sie wie jede andere Datei als Medien-Eintrag im Eingang,
 * die Mitschrift wird sein Text (src/features/media/media-import.js).
 *
 * Zwei Arten, das Mikrofon zu nutzen (gemerkt im Browser-Speicher):
 * „audio“ nimmt auf und schreibt mit, „text“ schreibt nur mit und speichert
 * den Text als Notiz. Android gibt das Mikrofon nur an eine App auf einmal:
 * läuft die Aufnahme, bekommt die Spracherkennung keinen Ton. Das merkt die
 * Aufnahme selbst (Ton da, aber nichts gehört) und bietet „Nur Mitschrift“ an.
 *
 * Fragt der Browser nach dem Mikrofon, steht das unter der Zeit; ist es
 * gesperrt, öffnet sich einmal das Blatt mit den Schritten zum Erlauben.
 * In der späteren Android-App treten MediaRecorder und SpeechRecognizer des
 * Geräts an diese Stelle — Ablauf und Knöpfe bleiben dieselben.
 * Wird erst beim ersten Tipp aufs Mikrofon nachgeladen.
 * Pfad: src/features/media/recorder.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * levelEveryMs  -> wie oft ein neuer Strich in die Welle kommt (kleiner = schneller)
 * soundLevel    -> ab welchem Pegel (0 bis 1) die Aufnahme als „hört etwas“ zählt
 * starveAfterMs -> wie lange Ton ohne ein erkanntes Wort vergehen darf, bis die
 *                  Mitschrift als „bekommt keinen Ton“ gilt und „Nur Mitschrift“ erscheint
 * defaultMode   -> wie eine Aufnahme ohne gemerkte Wahl läuft ("audio" oder "text")
 * namePrefix    -> wie eine Aufnahme ohne eigenen Namen heißt („Sprachmemo 04.10.2026 14:03“)
 *
 * Das Mikrofon selbst steht in src/features/media/recorder-mic.js, die
 * Mitschrift in recorder-speech.js, was man mit ihr machen kann (kopieren,
 * umwandeln) in recorder-text.js, das Blatt hinter ⚙ in recorder-setup.js,
 * das Aussehen in recorder-view.js und styles/recorder.css.
 */

import { pad2 } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { readJson, storageKeys, writeJson } from "../../core/storage.js";
import { createEntryInline } from "../../data/mutations-inline.js";
import { ui } from "../../data/state.js";
import { registerOverlay } from "../../ui/router.js";
import { showToast } from "../../ui/toast.js";
import { addMediaFiles } from "./media-import.js";
import { createPlayer, discardMic, finishMic, micFile, micLevel, micSupported, openMic, pauseMic, resumeMic } from "./recorder-mic.js";
import { armDiscardGuard, cancelRecorder, initDiscardGuard, leaveRecorder } from "./recorder-discard.js";
import { micPermission, openRecorderSetup } from "./recorder-setup.js";
import { createSpeech, speechAvailable } from "./recorder-speech.js";
import { convertTranscript, copyTranscript } from "./recorder-text.js";
import { buildRecorder, createWave, showHint, showMicError, showPlaying, showSetupAlert, showState, showText, showTime } from "./recorder-view.js";

const levelEveryMs = 70;
const soundLevel = 0.12;
const starveAfterMs = 3000;
const defaultMode = "audio";
const namePrefix = "Sprachmemo";

/* Fehler der Spracherkennung, die heißen: nicht erlaubt (alles andere: klappt gerade nicht) */
const speechBlocked = ["not-allowed", "service-not-allowed"];

let layer = null;
let wave = null;
let state = "starting";
let mode = readJson(storageKeys.recorderMode, defaultMode) === "text" ? "text" : "audio";
/* Die laufende Sitzung: Mikrofon (im Modus „text“ keins), Zeit, Welle und wie lange Ton ohne Mitschrift kam */
let session = null;
/* Die fertige Aufnahme nach „Stoppen“: { blob, duration } */
let recorded = null;
/* Die Mitschrift dieser Aufnahme (recorder-speech.js), je Start neu */
let speech = null;
/* Spielt die fertige Aufnahme ab (recorder-mic.js) */
let player = null;
/* Zählt jeden Start mit; ein überholter Start räumt sein Mikrofon wieder weg */
let startRun = 0;
/* Das Blatt mit den Schritten öffnet sich je Aufnahme nur einmal von selbst */
let setupShown = false;

function defaultName() {
  const now = new Date();
  return `${namePrefix} ${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function canPlay() {
  return Boolean(recorded);
}

function canSave() {
  if (state === "starting" || state === "error") return false;
  if (mode === "text") return Boolean(speech && speech.text());
  return state === "stopped" ? canPlay() : true;
}

function setState(next) {
  state = next;
  showState(layer, state, { mode, canSave: canSave(), canPlay: canPlay() });
  showProblems();
}

/* Punkt am Zahnrad, solange das Mikrofon nicht aufgeht oder die Mitschrift nicht läuft */
function showProblems() {
  showSetupAlert(layer, state === "error" || Boolean(speech && speech.problem()));
}

/* ---------- Mitschrift ---------- */

/* Jede Aufnahme bekommt ihre eigene Mitschrift; sie hört nur zu, solange aufgenommen wird. */
function newSpeech() {
  const me = createSpeech(
    (final, pending) => {
      /* Eine überholte Mitschrift meldet sich nicht mehr */
      if (speech !== me) return;
      showText(layer, final, pending, me.problem());
      showProblems();
      /* Ohne Aufnahme ist die Mitschrift alles — geht sie nicht, ist das der Fehler */
      if (mode === "text" && me.problem() && state !== "error") {
        fail(speechBlocked.includes(me.problem()) ? "blocked" : "speech");
      }
    },
    () => state === "recording"
  );
  speech = me;
  showText(layer, me.problem() ? null : "", "", me.problem());
}

/* Die Aufnahme hört Ton, die Mitschrift aber nichts: Android gibt das Mikrofon nur an eine App. */
function watchStarving(now, level) {
  if (mode !== "audio" || speech.problem() || speech.heardAnything()) return;
  if (level < soundLevel) return;
  session.soundMs += now - session.lastLevel;
  if (session.soundMs >= starveAfterMs) speech.starve();
}

/* ---------- Pegel und Zeit ---------- */

/* Lautstärke gerade jetzt, 0 bis 1. Ohne Mikrofon-Pegel schlägt die Welle aus, wenn die Mitschrift etwas hört. */
function level() {
  const measured = session.mic ? micLevel(session.mic) : null;
  if (measured !== null) return measured;
  if (session.mic || speech.heard()) return 0.2 + Math.random() * 0.5;
  return 0;
}

/* Läuft nur während der Aufnahme: Zeit weiterzählen, neue Striche in die Welle. */
function tick() {
  session.frame = requestAnimationFrame(tick);
  const now = performance.now();
  showTime(layer, session.elapsed + now - session.startedAt);
  if (now - session.lastLevel < levelEveryMs) return;
  const current = level();
  wave.push(current);
  watchStarving(now, current);
  session.lastLevel = now;
}

/* Wie lang die Aufnahme bisher ist; danach richtet sich die Rückfrage beim Verwerfen. */
function lengthMs() {
  if (session) return session.elapsed + (state === "recording" ? performance.now() - session.startedAt : 0);
  return recorded ? recorded.duration * 1000 : 0;
}

/* ---------- Aufnehmen ---------- */

/* Die laufende Sitzung verwerfen: Mikrofon frei, Zeit steht. */
function dropSession() {
  if (!session) return;
  cancelAnimationFrame(session.frame);
  if (session.mic) discardMic(session.mic);
  session = null;
}

/* Mikrofon oder Mitschrift gehen nicht: Grund zeigen; ist es gesperrt, einmal das Blatt mit den Schritten öffnen. */
function fail(reason) {
  dropSession();
  if (speech) speech.stop();
  showMicError(layer, reason);
  setState("error");
  if (reason === "blocked" && !setupShown) {
    setupShown = true;
    setup();
  }
}

async function start() {
  const run = ++startRun;
  player.stop();
  recorded = null;
  wave.reset();
  showTime(layer, 0);
  newSpeech();
  setState("starting");
  let mic = null;
  if (mode === "audio") {
    if (!micSupported()) {
      fail("failed");
      return;
    }
    /* Steht die Antwort noch aus, fragt der Browser gleich — das soll man wissen */
    if ((await micPermission()) === "prompt" && run === startRun && state === "starting") showHint(layer, "asking");
    try {
      mic = await openMic();
    } catch (error) {
      if (run === startRun) fail(error.reason);
      return;
    }
    /* Inzwischen geschlossen oder neu gestartet: dieses Mikrofon wird nicht mehr gebraucht */
    if (run !== startRun || layer.hidden) {
      discardMic(mic);
      return;
    }
  } else if (speech.problem()) {
    fail("speech");
    return;
  }
  session = { mic, elapsed: 0, startedAt: performance.now(), lastLevel: performance.now(), frame: 0, soundMs: 0 };
  setState("recording");
  speech.start();
  tick();
}

function pause() {
  if (!session || state !== "recording") return;
  if (session.mic) pauseMic(session.mic);
  session.elapsed += performance.now() - session.startedAt;
  cancelAnimationFrame(session.frame);
  speech.stop();
  setState("paused");
}

function resume() {
  if (!session || state !== "paused") return;
  if (session.mic) resumeMic(session.mic);
  session.startedAt = performance.now();
  session.lastLevel = session.startedAt;
  setState("recording");
  speech.start();
  tick();
}

/* Aufnahme beenden und als Datei bereitlegen; danach ist das Mikrofon frei. Gibt die Dauer in ms zurück. */
async function finish() {
  if (!session) return null;
  const current = session;
  session = null;
  if (state === "recording") current.elapsed += performance.now() - current.startedAt;
  cancelAnimationFrame(current.frame);
  speech.stop();
  if (current.mic) {
    const blob = await finishMic(current.mic);
    recorded = blob ? { blob, duration: current.elapsed / 1000 } : null;
  }
  return current.elapsed;
}

async function stop() {
  const elapsed = await finish();
  if (layer.hidden || elapsed === null) return;
  setState("stopped");
  showTime(layer, elapsed);
}

/* ---------- Speichern, Modus, Öffnen, Schließen ---------- */

/* Der getippte Name, sonst der vorgeschlagene („Sprachmemo 04.10.2026 14:03“) */
function recordingName() {
  const input = layer.querySelector(".recorder-name");
  return input.value.trim() || input.placeholder;
}

async function save() {
  if (state === "recording" || state === "paused") await finish();
  const name = recordingName();
  const text = speech.text();
  /* Nur Mitschrift: der Text wird eine Notiz im Eingang */
  if (mode === "text") {
    if (!text) return;
    leaveRecorder();
    createEntryInline({ title: name, type: "notiz", fields: { body: text } });
    showToast({ icon: "mic", title: "Mitschrift gespeichert", note: name });
    return;
  }
  if (!recorded) return;
  const file = micFile(recorded.blob, name);
  const extra = { body: text, duration: recorded.duration };
  /* Erst schließen (das verwirft den Zwischenstand), die Datei ist schon gepackt */
  leaveRecorder();
  await addMediaFiles([file], "audio", extra);
  showToast({ icon: "mic", title: "Aufnahme gespeichert", note: name });
}

/* Wofür das Mikrofon arbeitet; die Wahl bleibt gemerkt, die Aufnahme beginnt neu. */
function setMode(next) {
  if (next === mode || (next === "text" && !speechAvailable())) return;
  mode = next;
  writeJson(storageKeys.recorderMode, mode);
  if (layer.hidden) return;
  dropSession();
  speech.stop();
  start();
}

/* Ohne Verlauf schließen (Zurück-Geste): alles verwerfen, Mikrofon frei. */
function hide() {
  if (!layer || layer.hidden) return;
  startRun += 1;
  layer.hidden = true;
  dropSession();
  speech.stop();
  player.stop();
  recorded = null;
  setupShown = false;
}

/* Wie die Zurück-Geste: der Schritt im Verlauf schließt das Overlay. */
function close() {
  if (history.state && history.state.view === "recorder") history.back();
  else hide();
}

/* ⚙: Zustand, Modus und Schritte; „Erneut anfragen“ fragt die Mitschrift neu an und öffnet das Mikrofon neu, wenn es nicht aufging */
function setup() {
  openRecorderSetup({
    speechProblem: speech.problem(),
    micBlocked: state === "error",
    mode,
    textPossible: speechAvailable(),
    onMode: setMode,
    retry: () => {
      if (state === "error") start();
      else speech.retry();
    },
  });
}

const actions = {
  cancel: cancelRecorder,
  stop,
  pause,
  resume,
  restart: start,
  play: () => player.toggle(recorded && recorded.blob),
  save,
  setup,
  textOnly: () => setMode("text"),
  copy: () => copyTranscript(speech.text()),
  convert: () => convertTranscript(speech.text(), recordingName()),
};

function mount() {
  if (layer) return;
  layer = buildRecorder();
  dom.device.append(layer);
  wave = createWave(layer);
  player = createPlayer((playing) => showPlaying(layer, playing));
  initDiscardGuard({
    isOpen: () => !layer.hidden,
    lengthMs,
    close,
    pushState: () => history.pushState({ view: "recorder", from: ui.sourceView }, "", "#/aufnahme"),
  });
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
  /* Ohne Spracherkennung gibt es nur die Aufnahme */
  if (mode === "text" && !speechAvailable()) mode = "audio";
  layer.hidden = false;
  armDiscardGuard();
  if (push) history.pushState({ view: "recorder", from: ui.sourceView }, "", "#/aufnahme");
  start();
}

/** Vom Mikrofon in der Medien-Leiste aufgerufen. */
export function openRecorder() {
  open(true);
}

registerOverlay("recorder", { open, hide, close });
