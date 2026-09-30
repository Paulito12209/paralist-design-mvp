/*
 * Der Stand der Auswahl auf der Aufgaben-Seite: ist der Auswahlmodus an,
 * welche Aufgaben sind gewählt — und die Kreise, die Liste und Board dann
 * vor jede Zeile und in jeden Abschnittskopf stellen. Nur Zustand und
 * Markup; wann der Modus an- und ausgeht und was ein Tipp tut, steht in
 * src/features/tasks/tasks-select.js, die Leiste unten in
 * src/features/tasks/tasks-select-bar.js.
 * Pfad: src/features/tasks/tasks-pick.js
 *
 * Keine anpassbaren Werte in dieser Datei. Größe und Farbe der Kreise stehen
 * in styles/tasks-select.css (--pick-size, --select-color).
 */

import { icon } from "../../core/html.js";
import { findEntry } from "../../data/queries.js";

/* Die gewählten Aufgaben als Nummern-Text — so passen sie zu data-Attributen. */
const picked = new Set();
let active = false;

/** Ist der Auswahlmodus gerade an? */
export function isSelecting() {
  return active;
}

/** Den Modus an- oder ausschalten; aus leert die Auswahl. */
export function setSelecting(on) {
  active = Boolean(on);
  if (!active) picked.clear();
}

/** Ist diese Aufgabe gewählt? */
export function isPicked(id) {
  return picked.has(String(id));
}

/** Eine Aufgabe wählen (`on`) oder abwählen. */
export function setPicked(id, on) {
  if (on) picked.add(String(id));
  else picked.delete(String(id));
}

/** Wie viele gewählt sind. */
export function pickedCount() {
  return picked.size;
}

/** Die gewählten Nummern. */
export function pickedIds() {
  return [...picked];
}

/** Die gewählten Aufgaben; was es inzwischen nicht mehr gibt, fällt weg. */
export function pickedEntries() {
  return pickedIds().map(findEntry).filter(Boolean);
}

/** Nur die behalten, die noch zu sehen sind (`visible`: Nummern der gezeichneten Zeilen). */
export function keepPicked(visible) {
  const shown = new Set(visible.map(String));
  pickedIds().forEach((id) => {
    if (!shown.has(id)) picked.delete(id);
  });
}

/** Der Kreis vor einer Zeile — nur im Auswahlmodus, sonst nichts. */
export function pickMark(id) {
  if (!active) return "";
  return `<span class="task-pick${isPicked(id) ? " is-on" : ""}" data-pick="${id}" aria-hidden="true">${icon("check", "task-pick-icon")}</span>`;
}

/**
 * Der Kreis im Kopf eines Abschnitts oder einer Spalte: leer, halb (ein Teil
 * gewählt) oder voll (alle). Ein Tipp darauf wählt den ganzen Abschnitt.
 */
export function groupPickMark(ids) {
  if (!active || !ids.length) return "";
  const count = ids.filter(isPicked).length;
  const state = count === ids.length ? " is-on" : count ? " is-part" : "";
  return `<span class="task-pick task-pick-group${state}" data-pick-group role="button" aria-label="Ganzen Abschnitt wählen">${icon("check", "task-pick-icon")}</span>`;
}
