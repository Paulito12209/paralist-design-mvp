/*
 * Das Kanban-Board der Aufgaben-Seite: waagerecht scrollende Spalten, je Spalte
 * eine farbige Kopfzeile mit Icon, Name und Anzahl, darunter die Aufgaben als
 * schlichte Zeilen mit Trennlinie — wie in allen übrigen Listen, keine Karten —
 * und am Ende der gestrichelte Knopf zum Anlegen. Am rechten Rand jeder Zeile
 * sitzt der Griffstreifen mit sechs Punkten, an dem man sie in eine andere
 * Spalte zieht. Wonach die Spalten gruppieren, sagt die Pille neben dem Titel
 * (Dringlichkeit oder Status).
 * Pfad: src/features/tasks/tasks-board.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * addLabel   -> Beschriftung des Knopfes am Ende einer Spalte
 * emptyNote  -> Text in einer Spalte, in der nichts liegt
 *
 * Breite, Fugen, Griff und Rundungen stehen in styles/tasks-board.css
 * (--board-col-width, --board-gap, --board-grip-width, --board-card-radius).
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config.js";
import { taskColumns } from "../../data/queries.js";
import { taskCheck, taskDateChip, taskPriorityChip, taskStatusChip, taskTitle } from "./tasks-parts.js";

const addLabel = "Aufgabe hinzufügen";
const emptyNote = "Nichts hier";

/**
 * Eine Zeile: Titel mit Chips, rechts der Haken, ganz rechts der Griffstreifen.
 * Was die Spalte schon sagt, wiederholt der Chip nicht: in Status-Spalten
 * steht die Dringlichkeit, in Dringlichkeits-Spalten der Status.
 */
function boardRow(entry, field) {
  const done = isTaskDone(entry);
  const chip = field === "status" ? taskPriorityChip(entry) : taskStatusChip(entry);
  return `
    <div class="board-row" data-board-row="${entry.id}">
      <div class="board-row-main">
        <p class="board-row-title task-title${done ? " is-done" : ""}">${taskTitle(entry)}</p>
        <div class="task-meta">${taskDateChip(entry)}${chip}</div>
      </div>
      ${taskCheck(entry)}
      <span class="board-grip" data-grip="${entry.id}" role="button" tabindex="0" aria-label="Aufgabe verschieben"></span>
    </div>
  `;
}

/** Eine Spalte mit Kopfzeile, Zeilen und dem Knopf zum Anlegen. */
function boardColumn(column, field) {
  const rows = column.items.map((entry) => boardRow(entry, field)).join("");
  return `
    <div class="board-col" data-column="${column.id}" style="--col-color:${column.color}">
      <div class="board-head">
        ${icon(column.icon, "board-head-icon")}
        <span class="board-head-name">${column.label}</span>
        <span class="board-count">${column.items.length}</span>
      </div>
      <div class="board-rows" data-drop="${column.id}" data-field="${field}">
        ${rows || `<p class="board-empty">${emptyNote}</p>`}
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
