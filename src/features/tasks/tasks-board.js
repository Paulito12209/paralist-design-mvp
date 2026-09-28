/*
 * Das Kanban-Board der Aufgaben-Seite: dieselben Abschnitte wie in der Liste,
 * nur nebeneinander als waagerecht scrollende Spalten. Je Spalte eine blasse
 * Kopfzeile mit Icon, Name und Anzahl, darunter die Aufgaben als schlichte
 * Zeilen mit Trennlinie — wie in allen übrigen Listen, keine Karten. Am
 * rechten Rand jeder Zeile sitzt der Griffstreifen mit sechs Punkten, an dem
 * man sie in eine andere Spalte zieht. Eine neue Aufgabe entsteht, indem man
 * in die freie Fläche unter den Zeilen einer Spalte tippt
 * (src/features/tasks/tasks-inline.js) — deshalb gibt es keinen Knopf dafür.
 * Pfad: src/features/tasks/tasks-board.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyNote -> Text in einer Spalte, in der nichts liegt
 *
 * Breite, Fugen, Griff und Rundungen stehen in styles/tasks-board.css
 * (--board-col-width, --board-gap, --board-grip-width, --board-card-radius).
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config.js";
import { taskColumns } from "../../data/queries.js";
import { taskCheck } from "../../ui/task-status.js";
import { taskMeta, taskTitle } from "./tasks-parts.js";

const emptyNote = "Nichts hier";

/** Eine Zeile: Titel mit Nebenzeile, rechts der Haken, ganz rechts der Griffstreifen. */
function boardRow(entry, field) {
  const done = isTaskDone(entry);
  return `
    <div class="board-row" data-board-row="${entry.id}">
      <div class="board-row-main">
        <p class="board-row-title task-title${done ? " is-done" : ""}">${taskTitle(entry)}</p>
        ${taskMeta(entry, field)}
      </div>
      ${taskCheck(entry)}
      <span class="board-grip" data-grip="${entry.id}" role="button" tabindex="0" aria-label="Aufgabe verschieben"></span>
    </div>
  `;
}

/** Eine Spalte mit Kopfzeile und Zeilen. data-section/data-field lesen Ziehen und Inline-Anlegen. */
function boardColumn(column, field) {
  const rows = column.items.map((entry) => boardRow(entry, field)).join("");
  return `
    <div class="board-col" data-column="${column.id}" data-section="${column.id}" data-field="${field}" style="--col-color:${column.color}">
      <div class="board-head">
        ${icon(column.icon, "board-head-icon")}
        <span class="board-head-name">${column.label}</span>
        <span class="board-count">${column.items.length}</span>
      </div>
      <div class="board-rows" data-drop="${column.id}" data-field="${field}">
        ${rows || `<p class="board-empty">${emptyNote}</p>`}
      </div>
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
