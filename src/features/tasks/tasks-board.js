/*
 * Das Kanban-Board der Aufgaben-Seite: dieselben Abschnitte wie in der Liste,
 * nur nebeneinander als waagerecht scrollende Spalten. Je Spalte eine blasse
 * Kopfzeile mit Icon, Name und Anzahl, darunter die Aufgaben als schlichte
 * Zeilen mit Trennlinie — wie in allen übrigen Listen, keine Karten. Der
 * Haken steht links vor dem Titel (wie in der Liste), am
 * rechten Rand jeder Zeile allein der Griffstreifen mit sechs Punkten, an dem
 * man sie in eine andere Spalte zieht. Eine neue Aufgabe entsteht, indem man
 * in die freie Fläche unter den Zeilen einer Spalte tippt
 * (src/features/tasks/tasks-inline.js). Nur in der Android-Fassung steht in
 * einer Spalte ohne Aufgabe statt „Nichts hier“ die blasse Zeile „Neue Aufgabe“
 * (Tipp öffnet dort die Eingabezeile); sobald eine Aufgabe darin liegt, ist sie weg.
 * Im Auswahlmodus (src/features/tasks/tasks-select.js) steht vor jeder Zeile
 * ein Kreis und im Kopf jeder Spalte einer für die ganze Spalte; der Griff
 * einer gewählten Zeile zieht dann alle gewählten als Stapel.
 * Pfad: src/features/tasks/tasks-board.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyNote -> Text in einer Spalte, in der nichts liegt (iOS)
 * addLabel  -> Beschriftung der blassen Zeile in einer leeren Spalte (Android)
 *
 * Breite, Fugen, Griff und Rundungen stehen in styles/tasks-board.css
 * (--board-col-width, --board-gap, --board-grip-width, --board-card-radius).
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config-tasks.js";
import { taskColumns } from "../../data/queries.js";
import { isMobileOs } from "../../ui/platform.js";
import { taskCheck } from "../../ui/task-status.js";
import { taskMeta, taskTitle } from "./tasks-parts.js";
import { groupPickMark, isPicked, isSelecting, pickMark } from "./tasks-pick.js";

const emptyNote = "Nichts hier";
const addLabel = "Neue Aufgabe";

/* Der Inhalt einer Spalte ohne Aufgabe. Android: die blasse Zeile zum Anlegen,
   mit leerem Ring in der Farbe der Spalte — nicht in „Archiviert“ (dort entsteht
   nichts Neues) und nicht im Auswahlmodus. Sie trägt „board-empty“, damit sie wie
   der Hinweis verschwindet, sobald gezogen oder geschrieben wird. */
function emptyColumn(column) {
  if (!isMobileOs("android") || column.locked || isSelecting()) return `<p class="board-empty">${emptyNote}</p>`;
  return `
    <button class="board-add board-empty" type="button" data-board-add>
      <span class="task-check task-ghost-ring" aria-hidden="true"></span>
      <span class="board-add-label">${addLabel}</span>
    </button>`;
}

/** Eine Zeile: links der Haken, dann Titel mit Nebenzeile, ganz rechts der Griffstreifen. */
function boardRow(entry, field) {
  const done = isTaskDone(entry);
  return `
    <div class="board-row" data-board-row="${entry.id}" data-pick-row="${entry.id}"${isPicked(entry.id) ? " data-picked" : ""}>
      ${pickMark(entry.id)}
      ${taskCheck(entry)}
      <div class="board-row-main">
        <p class="board-row-title task-title${done ? " is-done" : ""}">${taskTitle(entry)}</p>
        ${taskMeta(entry, field)}
      </div>
      <span class="board-grip" data-grip="${entry.id}" role="button" tabindex="0" aria-label="Aufgabe verschieben"></span>
    </div>
  `;
}

/**
 * Eine Spalte mit Kopfzeile und Zeilen. data-section/data-field lesen Ziehen
 * und Inline-Anlegen; data-no-add sperrt das Anlegen (Spalte „Archiviert“).
 */
function boardColumn(column, field) {
  const rows = column.items.map((entry) => boardRow(entry, field)).join("");
  return `
    <div class="board-col" data-pick-scope data-column="${column.id}" data-section="${column.id}" data-field="${field}"${column.locked ? " data-no-add" : ""} style="--col-color:${column.color}">
      <div class="board-head">
        ${groupPickMark(column.items.map((entry) => entry.id))}
        ${icon(column.icon, "board-head-icon")}
        <span class="board-head-name">${column.label}</span>
        <span class="board-count">${column.items.length}</span>
      </div>
      <div class="board-rows" data-drop="${column.id}" data-field="${field}">
        ${rows || emptyColumn(column)}
      </div>
    </div>
  `;
}

/** Das ganze Board als HTML. */
export function taskBoardMarkup(prefs) {
  const { field, columns } = taskColumns(prefs);
  /* data-edge-swipe: seitlich wischen rollt erst die Spalten; steht das Board
     schon am Rand, wechselt es die Ansicht (src/ui/pill-swipe.js) */
  return `<div class="board" id="tasks-board" data-edge-swipe>${columns
    .map((column) => boardColumn(column, field))
    .join("")}</div>`;
}
