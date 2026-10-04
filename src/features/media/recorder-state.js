/*
 * Der Zustand der Audio-Aufnahme, den mehrere Dateien brauchen: das Overlay,
 * wie weit die Aufnahme ist, die laufende Sitzung und die fertige Aufnahme.
 * Ändert sich daran etwas, frischt setState() die Knöpfe und den Punkt am
 * Mikrofon-Knopf oben rechts auf.
 * Pfad: src/features/media/recorder-state.js
 *
 * Keine anpassbaren visuellen Werte: Texte und Knöpfe stehen in
 * src/features/media/recorder-view.js, Farben und Maße in styles/recorder.css.
 *
 * Wer die Zustände wechselt: recorder.js (Starten, Fehler, Schließen),
 * recorder-session.js (Pause, Weiter, Stoppen) und recorder-save.js (Speichern).
 */

import { showSetupAlert, showState } from "./recorder-view.js";

export const rec = {
  /* Das Overlay (recorder-view.js), entsteht beim ersten Öffnen */
  layer: null,
  /* Die Welle im Overlay */
  wave: null,
  /* "starting", "recording", "paused", "stopped" oder "error" */
  state: "starting",
  /* Die laufende Sitzung: Mikrofon, Zeit und Welle */
  session: null,
  /* Die fertige Aufnahme nach „Stoppen“: { blob, duration } */
  recorded: null,
  /* Spielt die fertige Aufnahme ab (recorder-mic.js) */
  player: null,
};

function canPlay() {
  return Boolean(rec.recorded);
}

function canSave() {
  if (rec.state === "starting" || rec.state === "error") return false;
  return rec.state === "stopped" ? canPlay() : true;
}

/** Neuer Zustand: Knöpfe und Hinweis unter der Zeit passend zeigen. */
export function setState(next) {
  rec.state = next;
  showState(rec.layer, rec.state, { canSave: canSave(), canPlay: canPlay() });
  showProblems();
}

/** Punkt am Mikrofon-Knopf oben, solange das Mikrofon nicht aufgeht. */
export function showProblems() {
  showSetupAlert(rec.layer, rec.state === "error");
}
