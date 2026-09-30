/*
 * Die Listenansicht der Aufgaben-Seite: eine schlichte Liste aller Aufgaben,
 * die der Filter durchlässt — Haken-Knopf links, Titel, stille Nebenzeile,
 * Pfeil; dahinter dieselben Wisch-Knöpfe wie in jeder anderen Liste der App.
 * Wer im Menü gruppiert, bekommt dieselben Gruppen untereinander, die das
 * Board als Spalten zeigt, jede mit dünner Überschrift (Icon in ihrer Farbe,
 * Name, Anzahl); leere Gruppen fehlen dann.
 *
 * Solange es gar keine Aufgabe gibt, liegt eine blasse Geister-Zeile da, die
 * das Anlegen durch Tippen ein einziges Mal erklärt
 * (src/features/tasks/tasks-inline.js).
 * Pfad: src/features/tasks/tasks-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ghostLabel  -> Text der Geister-Zeile, solange es keine Aufgabe gibt
 * emptyFilter -> Text, wenn der Ort-Filter keine Aufgabe übrig lässt
 *
 * Aussehen und Abstände stehen in styles/rows.css und styles/tasks.css, die
 * Spalten am Desktop in styles/tasks-desk.css.
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config-tasks.js";
import { taskEntries, taskGroups } from "../../data/queries.js";
import { entryActions, swipeRow } from "../../ui/rows.js";
import { taskCheck } from "../../ui/task-status.js";
import { taskColumns, taskMeta, taskTitle } from "./tasks-parts.js";

const ghostLabel = "Neue Aufgabe";
const emptyFilter = "Hier liegt keine offene Aufgabe.";

/**
 * Eine Zeile: Haken-Knopf, Titel mit Nebenzeile, Pfeil — dahinter dieselben
 * Wisch-Knöpfe wie in jeder anderen Liste (src/ui/rows.js).
 */
function taskRow(entry, field) {
  const done = isTaskDone(entry);
  const actions = entryActions(entry);
  return swipeRow(
    `data-entry="${entry.id}"`,
    actions.left,
    actions.right,
    `
      ${taskCheck(entry)}
      <button class="workspace-row entry-row task-row" type="button" data-open-entry="${entry.id}">
        <span class="task-main">
          <span class="task-title${done ? " is-done" : ""}">${taskTitle(entry)}</span>
          ${taskMeta(entry, field)}
        </span>
        ${taskColumns(entry)}
        ${icon("chevron", "chevron")}
      </button>
    `
  );
}

/* Die blasse Zeile, die nur ganz am Anfang da ist: ein leerer Ring, ein
   grauer Text. Ein Tipp darauf macht daraus die erste echte Zeile. */
function ghostRow() {
  return `
    <button class="task-ghost" type="button" data-task-ghost>
      <span class="task-check task-ghost-ring" aria-hidden="true"></span>
      <span class="task-ghost-label">${ghostLabel}</span>
    </button>
  `;
}

/* Die Überschrift einer Gruppe — nur, wenn gruppiert wird. */
function headMarkup(column, field) {
  if (!field) return "";
  return `
    <h2 class="task-section-head">
      ${icon(column.icon, "task-section-icon")}
      <span class="task-section-name">${column.label}</span>
      <span class="task-section-count">${column.items.length || ""}</span>
    </h2>
  `;
}

/* Eine Gruppe (oder die ganze Liste): data-section und data-field sagen dem
   Inline-Anlegen, wohin eine neue Aufgabe gehört, wenn hierunter getippt wird. */
function sectionMarkup(column, field, tail) {
  const rows = column.items.map((entry) => taskRow(entry, field)).join("");
  return `
    <section class="task-section" data-section="${column.id}" data-field="${field || ""}" style="--col-color:${column.color}">
      ${headMarkup(column, field)}
      <div class="workspace-list task-rows">${rows}${tail}</div>
    </section>
  `;
}

/** Die ganze Liste als HTML: flach — oder die Gruppen der Gliederung untereinander. */
export function taskListMarkup(prefs) {
  const { field, columns } = taskGroups(prefs);
  const empty = columns.every((column) => !column.items.length);
  /* Ohne eine einzige Aufgabe lädt die Geister-Zeile zum Schreiben ein; hat
     nur der Filter alles ausgesiebt, sagt die Liste das in einem Satz. */
  const tail = empty ? (taskEntries().length ? `<p class="task-empty-note">${emptyFilter}</p>` : ghostRow()) : "";
  return `<div class="task-sections">${columns
    .filter((column, index) => index === 0 || column.items.length)
    .map((column, index) => sectionMarkup(column, field, index === 0 ? tail : ""))
    .join("")}</div>`;
}
