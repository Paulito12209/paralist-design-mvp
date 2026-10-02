/*
 * Ein Hinweis, der sich in den Platzhalter des Eingabefelds tippt: nach einer
 * Pause erscheint er Buchstabe für Buchstabe von links nach rechts, bleibt
 * kurz stehen und macht dann wieder dem eigentlichen Platzhalter Platz
 * („Neues Medium“). Das wiederholt sich, solange das Feld leer bleibt und
 * der Hinweis gilt. Genutzt im Blatt der Android-Fassung, wenn eine Datei
 * dranhängt: „Mit Text wird es ein Dokument …“.
 * Pfad: src/features/composer/composer-hint.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * HINT_DELAY_MS -> wie lange der normale Platzhalter steht, bevor der Hinweis kommt (6 Sekunden)
 * HINT_CHAR_MS  -> Abstand zwischen zwei getippten Buchstaben (kleiner = schneller)
 * HINT_HOLD_MS  -> wie lange der fertige Hinweis stehen bleibt
 */

import { dom } from "../../core/dom.js";

const HINT_DELAY_MS = 6000;
const HINT_CHAR_MS = 45;
const HINT_HOLD_MS = 2500;

let timer = null;
let hint = "";
/* Der eigentliche Platzhalter, zu dem der Hinweis zurückkehrt */
let base = "";

function wait(ms, next) {
  clearTimeout(timer);
  timer = setTimeout(next, ms);
}

/* Buchstabe für Buchstabe; ein getipptes Zeichen blendet den Platzhalter
   ohnehin aus, dann wird nur still weitergezählt. */
function typeFrom(count) {
  dom.composerInput.placeholder = hint.slice(0, count);
  if (count < hint.length) wait(HINT_CHAR_MS, () => typeFrom(count + 1));
  else wait(HINT_HOLD_MS, restart);
}

function restart() {
  dom.composerInput.placeholder = base;
  wait(HINT_DELAY_MS, () => typeFrom(1));
}

/**
 * Den Hinweis einplanen. Der Platzhalter, der gerade im Feld steht, bleibt
 * der Grundtext. Läuft derselbe Hinweis schon, bleibt sein Takt erhalten.
 */
export function startPlaceholderHint(text) {
  if (timer && hint === text) return;
  hint = text;
  base = dom.composerInput.placeholder;
  restart();
}

/** Hinweis abbrechen; der Platzhalter bleibt, wie ihn das Feld zuletzt gesetzt hat. */
export function stopPlaceholderHint() {
  clearTimeout(timer);
  timer = null;
}
