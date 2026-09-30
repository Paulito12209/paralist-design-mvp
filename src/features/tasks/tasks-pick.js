/*
 * Die Auswahl der Aufgaben-Seite: eine Auswahl aus src/ui/selection.js über
 * dem Inhalt der Seite, Schlüssel ist die Nummer der Aufgabe. Liste, Board,
 * Ziehen und die Leisten fragen hier, ob der Modus an ist und was gewählt
 * ist; wann er an- und ausgeht, steht in src/features/tasks/tasks-select.js.
 * Pfad: src/features/tasks/tasks-pick.js
 *
 * Keine anpassbaren Werte in dieser Datei. Größe und Farbe der Kreise stehen
 * in styles/tasks-select.css (--pick-size, --select-color).
 */

import { dom } from "../../core/dom.js";
import { findEntry } from "../../data/queries.js";
import { createSelection } from "../../ui/selection.js";

/** Die Auswahl selbst — tasks-select.js meldet ihre Zuhörer an. */
export const taskSelection = createSelection({ host: () => dom.tasksBody, view: "tasks" });

/** Ist der Auswahlmodus gerade an? */
export const isSelecting = () => taskSelection.isOn();

/** Ist diese Aufgabe gewählt? */
export const isPicked = (id) => taskSelection.isPicked(id);

/** Wie viele gewählt sind. */
export const pickedCount = () => taskSelection.count();

/** Die gewählten Aufgaben; was es inzwischen nicht mehr gibt, fällt weg. */
export function pickedEntries() {
  return taskSelection.keys().map(findEntry).filter(Boolean);
}

/** Der Kreis vor einer Zeile — nur im Auswahlmodus, sonst nichts. */
export const pickMark = (id) => taskSelection.mark(id);

/** Der Kreis im Kopf eines Abschnitts oder einer Spalte. */
export const groupPickMark = (ids) => taskSelection.groupMark(ids);
