/*
 * Die Spalten rechts in der Aufgaben-Liste am Desktop: ein Klick auf eine
 * Angabe bearbeitet genau sie, ohne die Seite der Aufgabe zu öffnen. Es gibt
 * dafür keine eigene Auswahl — jede Angabe nutzt, was die App schon hat:
 *
 * - Datum: die Auswahl für Tag und Uhrzeit wie in der Karte „Details“
 *   (openDateField, src/ui/date-field.js), aufgeklappt an der Spalte,
 * - Dringlichkeit: das kleine Menü direkt daneben (openPriorityMenu,
 *   src/ui/task-status.js),
 * - Verknüpfung: der Ort-Wähler „Ablegen in“ (openPlacePicker,
 *   src/ui/pickers.js) — dieselbe Regel wie bei mehreren gewählten Aufgaben
 *   (placeEntries, src/data/mutations-bulk.js).
 * Pfad: src/features/tasks/tasks-col-edit.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * placeTitle -> Überschrift des Ort-Wählers
 *
 * Aussehen der Spalten steht in styles/tasks-desk.css.
 */

import { placeEntries } from "../../data/mutations-bulk.js";
import { findEntry } from "../../data/queries.js";
import { openDateField } from "../../ui/date-field.js";
import { openPlacePicker } from "../../ui/pickers.js";
import { openPriorityMenu } from "../../ui/task-status.js";
import { mainPlace } from "./tasks-parts.js";

const placeTitle = "Ablegen in";

/** Klick auf eine Spalte: die passende Auswahl öffnen. Gibt `true` zurück, wenn es eine Spalte war. */
export function handleColumnClick(event) {
  const button = event.target.closest("[data-task-edit]");
  if (!button) return false;
  const entry = findEntry(button.dataset.taskId);
  if (!entry) return true;
  const field = button.dataset.taskEdit;
  if (field === "date") openDateField(entry, button);
  else if (field === "priority") openPriorityMenu(entry, button);
  else if (field === "place") openPlacePicker(placeTitle, mainPlace(entry), (ref) => placeEntries([entry], ref));
  return true;
}
