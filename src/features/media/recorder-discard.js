/*
 * Rückfrage, bevor eine Aufnahme verloren geht: „Abbrechen“, der Pfeil oben
 * und die Zurück-Geste (auch Browser-Zurück) fragen erst „Aufnahme
 * verwerfen?“, sobald die Aufnahme länger als ein paar Sekunden ist. Ein
 * kurzer Fehlstart geht ohne Frage weg. Die Aufnahme läuft während der Frage
 * weiter.
 * Pfad: src/features/media/recorder-discard.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * askFromMs -> ab welcher Länge der Aufnahme gefragt wird (in Millisekunden)
 * words     -> Frage, Satz darunter und Beschriftung der roten Aktion
 *
 * Aussehen: src/ui/confirm-sheet.js (das Auswahl-Blatt mit zwei Knöpfen).
 */

import { formatClock } from "../../core/format.js";
import { openConfirmSheet } from "../../ui/confirm-sheet.js";
import { addPopGuard } from "../../ui/router-restore.js";

/* Drei Sekunden: kürzer ist meist ein Fehlstart, den man ohne Frage loswerden will */
const askFromMs = 3000;

const words = {
  title: "Aufnahme verwerfen?",
  text: (clock) => `Die Aufnahme (${clock}) und ihre Mitschrift gehen verloren.`,
  confirm: "Verwerfen",
};

/* Vom Rekorder hereingegeben: { isOpen, lengthMs, close, pushState } */
let hooks = null;
/* Der nächste Schritt zurück im Verlauf ist gewollt (Verwerfen bestätigt oder Speichern) */
let passNext = false;

function worthAsking() {
  return hooks.lengthMs() >= askFromMs;
}

function ask(onDiscard) {
  openConfirmSheet({
    title: words.title,
    text: words.text(formatClock(hooks.lengthMs() / 1000)),
    confirmLabel: words.confirm,
    onConfirm: onDiscard,
  });
}

/** Ohne Frage schließen (Speichern, bestätigtes Verwerfen). */
export function leaveRecorder() {
  passNext = true;
  hooks.close();
}

/** „Abbrechen“ und Pfeil oben: bei einer längeren Aufnahme erst fragen. */
export function cancelRecorder() {
  if (!worthAsking()) {
    leaveRecorder();
    return;
  }
  ask(leaveRecorder);
}

/** Beim Öffnen: ein liegengebliebener Freifahrschein gilt nicht für die neue Aufnahme. */
export function armDiscardGuard() {
  passNext = false;
}

/**
 * Einmal beim ersten Öffnen: die Zurück-Geste abfangen. Der Verlauf ist dann
 * schon einen Schritt zurück — er wird wieder vorgelegt, damit das Overlay
 * offen und die Geste beim zweiten Mal wieder zuständig bleibt.
 */
export function initDiscardGuard(next) {
  hooks = next;
  addPopGuard((event) => {
    if (passNext) {
      passNext = false;
      return false;
    }
    if (!hooks.isOpen() || event.state?.view === "recorder" || !worthAsking()) return false;
    hooks.pushState();
    ask(leaveRecorder);
    return true;
  });
}
