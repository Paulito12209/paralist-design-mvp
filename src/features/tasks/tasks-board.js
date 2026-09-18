/*
 * Das Kanban-Board der Aufgaben-Seite: waagerecht scrollende Spalten, je Spalte
 * eine farbige Kopfzeile mit Icon, Name und Anzahl, darunter die Karten und am
 * Ende der gestrichelte Knopf zum Anlegen. Wonach die Spalten gruppieren, sagt
 * die Bedienzeile (Priorität oder Status).
 * Pfad: src/features/tasks/tasks-board.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * addLabel   -> Beschriftung des Knopfes am Ende einer Spalte
 * emptyNote  -> Text in einer Spalte, in der nichts liegt
 *
 * Breite, Fugen und Rundungen stehen in styles/tasks-board.css
 * (--board-col-width, --board-gap, --board-card-radius).
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config.js";
import { taskColumns } from "../../data/queries.js";
import { taskCheck, taskDateChip, taskStatusChip, taskTitle } from "./tasks-parts.js";

const addLabel = "Aufgabe hinzufügen";
const emptyNote = "Nichts hier";

/** Eine Karte: Titel, darunter die Chips, rechts oben der Haken, rechts unten der Griff. */
function boardCard(entry) {
  const done = isTaskDone(entry);
  return `
    <div class="board-card" data-card="${entry.id}">
      ${taskCheck(entry)}
      <p class="board-card-title task-title${done ? " is-done" : ""}">${taskTitle(entry)}</p>
      <div class="task-meta board-card-meta">${taskDateChip(entry)}${taskStatusChip(entry)}</div>
      <span class="board-grip" data-grip="${entry.id}" role="button" tabindex="0" aria-label="Aufgabe verschieben"></span>
    </div>
  `;
}

/** Eine Spalte mit Kopfzeile, Karten und dem Knopf zum Anlegen. */
function boardColumn(column, field) {
  const cards = column.items.map(boardCard).join("");
  return `
    <div class="board-col" data-column="${column.id}" style="--col-color:${column.color}">
      <div class="board-head">
        ${icon(column.icon, "board-head-icon")}
        <span class="board-head-name">${column.label}</span>
        <span class="board-count">${column.items.length}</span>
      </div>
      <div class="board-cards" data-drop="${column.id}" data-field="${field}">
        ${cards || `<p class="board-empty">${emptyNote}</p>`}
      </div>
      <button class="board-add" type="button" data-add-task="${column.id}" data-field="${field}">
        ${icon("plus", "board-add-icon")}${addLabel}
      </button>
    </div>
  `;
}

/** Das ganze Board als HTML. */
export function taskBoardMarkup(prefs) {
  const { field, columns } = taskColumns(prefs);
  return `<div class="board" id="tasks-board">${columns
    .map((column) => boardColumn(column, field))
    .join("")}</div>`;
}
