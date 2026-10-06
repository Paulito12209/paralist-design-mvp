/*
 * Rückgängig und Wiederholen für alles in einer Zeichnung: Striche und die
 * Dinge auf der Fläche (Text, Formen, Bilder, Zettel) liegen in einer
 * gemeinsamen Reihe, damit „Rückgängig“ immer genau den letzten Schritt
 * zurücknimmt — egal, ob gemalt oder verschoben wurde.
 *
 * Ein Schritt ist { ink, undo(), redo() }. Strich-Schritte halten ein Bild
 * der ganzen Fläche und brauchen viel Speicher; darum gilt für sie eine
 * eigene, kleinere Grenze. Ändert sich die Größe der Fläche, passen die
 * gemerkten Bilder nicht mehr und fallen weg (dropInkSteps).
 * Pfad: src/features/drawing/draw-history.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * stepLimit -> wie viele Schritte insgesamt zurückgenommen werden können
 * inkLimit  -> wie viele davon Striche sein dürfen (jeder kostet ein Bild der Fläche)
 */

const stepLimit = 40;
const inkLimit = 8;

let undoSteps = [];
let redoSteps = [];
const listeners = [];

function notify() {
  listeners.forEach((handler) => handler());
}

/** Bei jeder Änderung der Reihe benachrichtigt werden (Knöpfe grau oder nicht). */
export function onHistoryChange(handler) {
  listeners.push(handler);
}

/** Einen neuen Schritt merken; was wiederholt werden konnte, ist danach weg. */
export function record(step) {
  undoSteps.push(step);
  redoSteps = [];
  while (undoSteps.length > stepLimit) undoSteps.shift();
  /* Zu viele Strich-Bilder: den ältesten Strich-Schritt vergessen */
  while (undoSteps.filter((item) => item.ink).length > inkLimit) {
    undoSteps.splice(undoSteps.findIndex((item) => item.ink), 1);
  }
  notify();
}

/** Den letzten Schritt zurücknehmen. */
export function undoStep() {
  const step = undoSteps.pop();
  if (!step) return;
  step.undo();
  redoSteps.push(step);
  notify();
}

/** Den zuletzt zurückgenommenen Schritt wiederholen. */
export function redoStep() {
  const step = redoSteps.pop();
  if (!step) return;
  step.redo();
  undoSteps.push(step);
  notify();
}

export function canUndo() {
  return undoSteps.length > 0;
}

export function canRedo() {
  return redoSteps.length > 0;
}

/** Neue Zeichnung geöffnet: nichts von der vorigen bleibt. */
export function resetHistory() {
  undoSteps = [];
  redoSteps = [];
  notify();
}

/** Die Fläche hat eine neue Größe: Strich-Bilder passen nicht mehr. */
export function dropInkSteps() {
  undoSteps = undoSteps.filter((step) => !step.ink);
  redoSteps = redoSteps.filter((step) => !step.ink);
  notify();
}

/**
 * Den letzten Schritt zurücknehmen und ganz vergessen — für einen Text, der
 * angelegt und leer wieder verlassen wurde: er soll weder bleiben noch beim
 * Wiederholen zurückkommen.
 */
export function discardLastStep() {
  const step = undoSteps.pop();
  if (!step) return;
  step.undo();
  notify();
}
