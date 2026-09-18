/*
 * Die Listenansicht der Aufgaben-Seite. Die Zeilen sind dieselben wie in allen
 * übrigen Listen der App (dieselben Klassen aus styles/rows.css, dieselben
 * Wisch-Knöpfe, Antippen öffnet den Editor); dazu kommen nur der Haken-Knopf
 * links und unter dem Titel das Label mit dem Ablageort samt Chips.
 * Pfad: src/features/tasks/tasks-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyNote -> Text, solange keine Aufgabe zu den Filtern passt
 *
 * Aussehen und Abstände stehen in styles/rows.css und styles/tasks.css.
 */

import { swipeAction, swipeRow } from "../../ui/rows.js";
import { isTaskDone } from "../../data/config.js";
import { visibleTasks } from "../../data/queries.js";
import { icon } from "../../core/html.js";
import { taskCheck, taskDateChip, taskPlaceLabel, taskStatusChip, taskTitle } from "./tasks-parts.js";

const emptyNote = "Keine Aufgabe passt zu dieser Auswahl.";

/** Eine Zeile: Haken-Knopf, Titel mit Ort und Chips, Pfeil — dahinter die Wisch-Knöpfe. */
function taskRow(entry) {
  const done = isTaskDone(entry);
  return swipeRow(
    `data-entry="${entry.id}"`,
    [
      swipeAction("favorite", "Favorit", entry.favorite ? "star" : "star-outline", "favorite"),
      swipeAction("archive", "Archivieren", "archive"),
      swipeAction("link", "Verknüpfen", "link"),
    ],
    [swipeAction("delete", "Löschen", "trash")],
    `
      ${taskCheck(entry)}
      <button class="workspace-row entry-row task-row" type="button" data-open-entry="${entry.id}">
        <span class="task-main">
          <span class="task-title${done ? " is-done" : ""}">${taskTitle(entry)}</span>
          <span class="task-meta">
            ${taskPlaceLabel(entry)}${taskStatusChip(entry)}${taskDateChip(entry)}
          </span>
        </span>
        ${icon("chevron", "chevron")}
      </button>
    `
  );
}

/** Die ganze Liste als HTML; leer, wenn die Filter nichts übrig lassen. */
export function taskListMarkup(prefs) {
  const list = visibleTasks(prefs);
  if (!list.length) return `<p class="empty-note">${emptyNote}</p>`;
  return `<div class="workspace-list task-rows">${list.map(taskRow).join("")}</div>`;
}
