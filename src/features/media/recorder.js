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
 * Diese Datei hält den Ablauf zusammen: Starten (mit Erlaubnis und Fehlern),
 * Modus wechseln, Öffnen, Schließen und welcher Knopf was auslöst. Die Teile:
 * recorder-state.js   -> der gemeinsame Zustand und das Auffrischen der Knöpfe
 * recorder-session.js -> die laufende Aufnahme: Zeit, Welle, Pause, Stoppen,
 *                        Erkennung des Mikrofon-Konflikts
 * recorder-save.js    -> Name und Speichern
 * recorder-mic.js     -> das Mikrofon selbst
 * recorder-speech.js  -> die Mitschrift
 * recorder-text.js    -> was man mit der Mitschrift machen kann (kopieren, umwandeln)
 * recorder-setup.js   -> das Blatt hinter ⚙
 * recorder-discard.js -> die Rückfrage „Aufnahme verwerfen?“
 * recorder-view.js    -> das Aussehen (dazu styles/recorder.css)
 *
 * ANPASSBARE WERTE (stehen in den Teil-Dateien)
 * -----------------------------------
 * levelEveryMs, soundLevel, starveAfterMs -> recorder-session.js (Welle, Mikrofon-Konflikt)
 * defaultMode                             -> recorder-state.js (Modus ohne gemerkte Wahl)
 * namePrefix                              -> recorder-save.js (Name ohne eigene Eingabe)
 */

import { dom } from "../../core/dom.js";
import { storageKeys, writeJson } from "../../core/storage.js";
import { ui } from "../../data/state.js";
import { registerOverlay } from "../../ui/router.js";
import { createPlayer, discardMic, micSupported, openMic } from "./recorder-mic.js";
import { armDiscardGuard, cancelRecorder, initDiscardGuard } from "./recorder-discard.js";
import { defaultName, recordingName, saveRecording } from "./recorder-save.js";
import { beginSession, dropSession, pauseSession, resumeSession, sessionLengthMs, stopSession } from "./recorder-session.js";
import { micPermission, openRecorderSetup } from "./recorder-setup.js";
import { createSpeech, speechAvailable } from "./recorder-speech.js";
import { rec, setState, showProblems } from "./recorder-state.js";
import { convertTranscript, copyTranscript } from "./recorder-text.js";
import { buildRecorder, createWave, showHint, showMicError, showPlaying, showText, showTime } from "./recorder-view.js";

/* Fehler der Spracherkennung, die heißen: nicht erlaubt (alles andere: klappt gerade nicht) */
const speechBlocked = ["not-allowed", "service-not-allowed"];

/* Zählt jeden Start mit; ein überholter Start räumt sein Mikrofon wieder weg */
let startRun = 0;
/* Das Blatt mit den Schritten öffnet sich je Aufnahme nur einmal von selbst */
let setupShown = false;

/* ---------- Mitschrift ---------- */

/* Jede Aufnahme bekommt ihre eigene Mitschrift; sie hört nur zu, solange aufgenommen wird. */
function newSpeech() {
  const me = createSpeech(
    (final, pending) => {
      /* Eine überholte Mitschrift meldet sich nicht mehr */
      if (rec.speech !== me) return;
      showText(rec.layer, final, pending, me.problem());
      showProblems();
      /* Ohne Aufnahme ist die Mitschrift alles — geht sie nicht, ist das der Fehler */
      if (rec.mode === "text" && me.problem() && rec.state !== "error") {
        fail(speechBlocked.includes(me.problem()) ? "blocked" : "speech");
        return;
      }
      /* Nur Mitschrift: „Speichern“ wird frei, sobald das erste Wort da ist, nicht erst nach dem Stoppen */
      if (rec.mode === "text" && (rec.state === "recording" || rec.state === "paused")) setState(rec.state);
    },
    () => rec.state === "recording"
  );
  rec.speech = me;
  showText(rec.layer, me.problem() ? null : "", "", me.problem());
}

/* ---------- Aufnehmen ---------- */

/* Mikrofon oder Mitschrift gehen nicht: Grund zeigen; ist es gesperrt, einmal das Blatt mit den Schritten öffnen. */
function fail(reason) {
  dropSession();
  if (rec.speech) rec.speech.stop();
  showMicError(rec.layer, reason);
  setState("error");
  if (reason === "blocked" && !setupShown) {
    setupShown = true;
    setup();
  }
}

async function start() {
  const run = ++startRun;
  rec.player.stop();
  rec.recorded = null;
  rec.wave.reset();
  showTime(rec.layer, 0);
  newSpeech();
  setState("starting");
  let mic = null;
  if (rec.mode === "audio") {
    if (!micSupported()) {
      fail("failed");
      return;
    }
    /* Steht die Antwort noch aus, fragt der Browser gleich — das soll man wissen */
    if ((await micPermission()) === "prompt" && run === startRun && rec.state === "starting") showHint(rec.layer, "asking");
    try {
      mic = await openMic();
    } catch (error) {
      if (run === startRun) fail(error.reason);
      return;
    }
    /* Inzwischen geschlossen oder neu gestartet: dieses Mikrofon wird nicht mehr gebraucht */
    if (run !== startRun || rec.layer.hidden) {
      discardMic(mic);
      return;
    }
  } else if (rec.speech.problem()) {
    fail("speech");
    return;
  }
  beginSession(mic);
}

/* ---------- Modus, Öffnen, Schließen ---------- */

/* Wofür das Mikrofon arbeitet; die Wahl bleibt gemerkt, die Aufnahme beginnt neu. */
function setMode(next) {
  if (next === rec.mode || (next === "text" && !speechAvailable())) return;
  rec.mode = next;
  writeJson(storageKeys.recorderMode, rec.mode);
  if (rec.layer.hidden) return;
  dropSession();
  rec.speech.stop();
  start();
}

/* Ohne Verlauf schließen (Zurück-Geste): alles verwerfen, Mikrofon frei. */
function hide() {
  if (!rec.layer || rec.layer.hidden) return;
  startRun += 1;
  rec.layer.hidden = true;
  dropSession();
  rec.speech.stop();
  rec.player.stop();
  rec.recorded = null;
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
    speechProblem: rec.speech.problem(),
    micBlocked: rec.state === "error",
    mode: rec.mode,
    textPossible: speechAvailable(),
    onMode: setMode,
    retry: () => {
      if (rec.state === "error") start();
      else rec.speech.retry();
    },
  });
}

const actions = {
  cancel: cancelRecorder,
  stop: stopSession,
  pause: pauseSession,
  resume: resumeSession,
  restart: start,
  play: () => rec.player.toggle(rec.recorded && rec.recorded.blob),
  save: saveRecording,
  setup,
  textOnly: () => setMode("text"),
  copy: () => copyTranscript(rec.speech.text()),
  convert: () => convertTranscript(rec.speech.text(), recordingName()),
};

function mount() {
  if (rec.layer) return;
  rec.layer = buildRecorder();
  dom.device.append(rec.layer);
  rec.wave = createWave(rec.layer);
  rec.player = createPlayer((playing) => showPlaying(rec.layer, playing));
  initDiscardGuard({
    isOpen: () => !rec.layer.hidden,
    lengthMs: sessionLengthMs,
    close,
    pushState: () => history.pushState({ view: "recorder", from: ui.sourceView }, "", "#/aufnahme"),
  });
  rec.layer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rec]");
    if (button && !button.disabled) actions[button.dataset.rec]();
  });
  /* Enter im Namen schließt nur die Tastatur */
  rec.layer.querySelector(".recorder-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.target.blur();
  });
}

function open(push = true) {
  mount();
  const input = rec.layer.querySelector(".recorder-name");
  input.value = "";
  input.placeholder = defaultName();
  /* Ohne Spracherkennung gibt es nur die Aufnahme */
  if (rec.mode === "text" && !speechAvailable()) rec.mode = "audio";
  rec.layer.hidden = false;
  armDiscardGuard();
  if (push) history.pushState({ view: "recorder", from: ui.sourceView }, "", "#/aufnahme");
  start();
}

/** Vom Mikrofon in der Medien-Leiste aufgerufen. */
export function openRecorder() {
  open(true);
}

registerOverlay("recorder", { open, hide, close });
