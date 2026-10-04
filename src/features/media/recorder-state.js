/*
 * Der Zustand der Audio-Aufnahme, den mehrere Dateien brauchen: das Overlay,
 * wie weit die Aufnahme ist, wofür das Mikrofon arbeitet, die laufende
 * Sitzung, die fertige Aufnahme und ihre Mitschrift. Ändert sich daran etwas,
 * frischt setState() die Knöpfe und den Punkt am Zahnrad auf.
 * Pfad: src/features/media/recorder-state.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * defaultMode -> wie eine Aufnahme ohne gemerkte Wahl läuft ("audio" oder "text")
 *
 * Die gemerkte Wahl liegt im Browser-Speicher (storageKeys.recorderMode) und
 * wird von recorder.js geschrieben — beim Wechsel im ⚙-Blatt und wenn die App
 * nach einem Mikrofon-Konflikt selbst auf „Nur Mitschrift“ wechselt.
 * Wer die Zustände wechselt: recorder.js (Starten, Fehler, Modus, Schließen),
 * recorder-session.js (Pause, Weiter, Stoppen) und recorder-save.js (Speichern).
 */

import { readJson, storageKeys } from "../../core/storage.js";
import { showSetupAlert, showState } from "./recorder-view.js";

const defaultMode = "audio";

/* Die gemerkte Art: "audio", "text" oder null, wenn nie eine gewählt wurde */
const storedMode = readJson(storageKeys.recorderMode, null);

export const rec = {
  /* Das Overlay (recorder-view.js), entsteht beim ersten Öffnen */
  layer: null,
  /* Die Welle im Overlay */
  wave: null,
  /* "starting", "recording", "paused", "stopped" oder "error" */
  state: "starting",
  /* "audio" nimmt auf und schreibt mit, "text" schreibt nur mit (gemerkt im Browser-Speicher) */
  mode: (storedMode || defaultMode) === "text" ? "text" : "audio",
  /* Wurde die Art schon einmal festgelegt (selbst gewählt oder von der App nach
     einem Mikrofon-Konflikt)? Solange nicht, darf die App beim Konflikt selbst
     auf „Nur Mitschrift“ wechseln; danach entscheidet die gemerkte Wahl. */
  modeChosen: storedMode === "audio" || storedMode === "text",
  /* Die laufende Sitzung: Mikrofon (im Modus „text“ keins), Zeit, Welle und wie lange Ton ohne Mitschrift kam */
  session: null,
  /* Die fertige Aufnahme nach „Stoppen“: { blob, duration } */
  recorded: null,
  /* Die Mitschrift dieser Aufnahme (recorder-speech.js), je Start neu */
  speech: null,
  /* Spielt die fertige Aufnahme ab (recorder-mic.js) */
  player: null,
};

function canPlay() {
  return Boolean(rec.recorded);
}

function canSave() {
  if (rec.state === "starting" || rec.state === "error") return false;
  if (rec.mode === "text") return Boolean(rec.speech && rec.speech.text());
  return rec.state === "stopped" ? canPlay() : true;
}

/** Neuer Zustand: Knöpfe und Hinweis unter der Zeit passend zeigen. */
export function setState(next) {
  rec.state = next;
  showState(rec.layer, rec.state, { mode: rec.mode, canSave: canSave(), canPlay: canPlay() });
  showProblems();
}

/** Punkt am Zahnrad, solange das Mikrofon nicht aufgeht oder die Mitschrift nicht läuft. */
export function showProblems() {
  showSetupAlert(rec.layer, rec.state === "error" || Boolean(rec.speech && rec.speech.problem()));
}
