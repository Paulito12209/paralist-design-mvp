/*
 * Audio direkt aufnehmen: das Mikrofon rechts in der Medien-Leiste öffnet ein
 * Overlay und nimmt sofort auf — ohne Umweg über eine Rekorder-App oder die
 * Dateiauswahl. Während der Aufnahme laufen Zeit und Welle mittig mit. Unten
 * lässt sich pausieren, stoppen (danach anhören oder neu aufnehmen) und
 * speichern; „Abbrechen“, der Pfeil oben und die Zurück-Geste verwerfen die
 * Aufnahme — ab ein paar Sekunden erst nach einer Rückfrage
 * (recorder-discard.js). Gespeichert wird sie wie jede andere Datei als
 * Medien-Eintrag im Eingang (src/features/media/media-import.js).
 *
 * Fragt der Browser nach dem Mikrofon, steht das unter der Zeit; ist es
 * gesperrt, öffnet sich einmal das Blatt mit den Schritten zum Erlauben.
 * In der späteren Android-App tritt der MediaRecorder des Geräts an diese
 * Stelle — Ablauf und Knöpfe bleiben dieselben.
 * Wird erst beim ersten Tipp aufs Mikrofon nachgeladen.
 * Pfad: src/features/media/recorder.js
 *
 * Diese Datei hält den Ablauf zusammen: Starten (mit Erlaubnis und Fehlern),
 * Öffnen, Schließen und welcher Knopf was auslöst. Die Teile:
 * recorder-state.js   -> der gemeinsame Zustand und das Auffrischen der Knöpfe
 * recorder-session.js -> die laufende Aufnahme: Zeit, Welle, Pause, Stoppen
 * recorder-save.js    -> Name und Speichern
 * recorder-mic.js     -> das Mikrofon selbst
 * recorder-setup.js   -> das Blatt hinter dem Mikrofon-Symbol oben (Schritte zum Erlauben)
 * recorder-discard.js -> die Rückfrage „Aufnahme verwerfen?“
 * recorder-view.js    -> das Aussehen (dazu styles/recorder.css)
 *
 * ANPASSBARE WERTE IN DEN TEIL-DATEIEN
 * -----------------------------------
 * levelEveryMs -> recorder-session.js (wie oft die Welle einen Strich bekommt)
 * namePrefix   -> recorder-save.js (Name ohne eigene Eingabe)
 * askFromMs    -> recorder-discard.js (ab wann „Aufnahme verwerfen?“ fragt)
 */

import { dom } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { registerOverlay } from "../../ui/router.js";
import { createPlayer, discardMic, micSupported, openMic } from "./recorder-mic.js";
import { armDiscardGuard, cancelRecorder, initDiscardGuard } from "./recorder-discard.js";
import { defaultName, saveRecording } from "./recorder-save.js";
import { beginSession, dropSession, pauseSession, resumeSession, sessionLengthMs, stopSession } from "./recorder-session.js";
import { micPermission, openRecorderSetup } from "./recorder-setup.js";
import { rec, setState } from "./recorder-state.js";
import { buildRecorder, createWave, showHint, showMicError, showPlaying, showTime } from "./recorder-view.js";

/* Zählt jeden Start mit; ein überholter Start räumt sein Mikrofon wieder weg */
let startRun = 0;
/* Das Blatt mit den Schritten öffnet sich je Aufnahme nur einmal von selbst */
let setupShown = false;

/* ---------- Aufnehmen ---------- */

/* Das Mikrofon geht nicht: Grund zeigen; ist es gesperrt, einmal das Blatt mit den Schritten öffnen. */
function fail(reason) {
  dropSession();
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
  setState("starting");
  if (!micSupported()) {
    fail("failed");
    return;
  }
  /* Steht die Antwort noch aus, fragt der Browser gleich — das soll man wissen */
  if ((await micPermission()) === "prompt" && run === startRun && rec.state === "starting") showHint(rec.layer, "asking");
  let mic = null;
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
  beginSession(mic);
}

/* ---------- Öffnen, Schließen ---------- */

/* Ohne Verlauf schließen (Zurück-Geste): alles verwerfen, Mikrofon frei. */
function hide() {
  if (!rec.layer || rec.layer.hidden) return;
  startRun += 1;
  rec.layer.hidden = true;
  dropSession();
  rec.player.stop();
  rec.recorded = null;
  setupShown = false;
}

/* Wie die Zurück-Geste: der Schritt im Verlauf schließt das Overlay. */
function close() {
  if (history.state && history.state.view === "recorder") history.back();
  else hide();
}

/* Mikrofon-Symbol oben: Zustand und Schritte zum Erlauben */
function setup() {
  openRecorderSetup({ micBlocked: rec.state === "error" });
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
