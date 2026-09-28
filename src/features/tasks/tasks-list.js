/*
 * Die Listenansicht der Aufgaben-Seite: dieselben Abschnitte untereinander,
 * die das Board nebeneinander als Spalten zeigt (Jetzt, Als Nächstes, Später,
 * Irgendwann — oder Offen, In Arbeit, Erledigt). Jeder Abschnitt hat eine
 * dünne Überschrift mit Icon in seiner Farbe und der Anzahl, darunter die
 * Zeilen wie in allen übrigen Listen der App: Haken-Knopf links, Titel, stille
 * Nebenzeile, Pfeil; dahinter dieselben Wisch-Knöpfe.
 *
 * Leere Abschnitte bleiben weg — bis auf den ersten: der steht immer da, denn
 * ein leeres „Jetzt“ ist selbst eine Nachricht („nichts brennt“) und die
 * Stelle, an der man tippt, um die erste Aufgabe zu schreiben. Solange es gar
 * keine Aufgabe gibt, liegt unter ihm eine blasse Geister-Zeile, die das
 * Tippen ein einziges Mal erklärt (src/features/tasks/tasks-inline.js).
 * Pfad: src/features/tasks/tasks-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ghostLabel -> Text der Geister-Zeile, solange es keine Aufgabe gibt
 *
 * Aussehen und Abstände stehen in styles/rows.css und styles/tasks.css.
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config.js";
import { taskColumns } from "../../data/queries.js";
import { entryActions, swipeRow } from "../../ui/rows.js";
import { taskCheck } from "../../ui/task-status.js";
import { taskMeta, taskTitle } from "./tasks-parts.js";

const ghostLabel = "Neue Aufgabe";

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

/* Ein Abschnitt: Überschrift mit Icon, Name und Anzahl, darunter die Zeilen.
   data-section und data-field sagen dem Inline-Anlegen, wohin eine neue
   Aufgabe gehört, wenn unter diesen Abschnitt getippt wird. */
function sectionMarkup(column, field, ghost) {
  const rows = column.items.map((entry) => taskRow(entry, field)).join("");
  return `
    <section class="task-section" data-section="${column.id}" data-field="${field}" style="--col-color:${column.color}">
      <h2 class="task-section-head">
        ${icon(column.icon, "task-section-icon")}
        <span class="task-section-name">${column.label}</span>
        <span class="task-section-count">${column.items.length || ""}</span>
      </h2>
      <div class="workspace-list task-rows">${rows}${ghost ? ghostRow() : ""}</div>
    </section>
  `;
}

/** Die ganze Liste als HTML: die Abschnitte der Gliederung untereinander. */
export function taskListMarkup(prefs) {
  const { field, columns } = taskColumns(prefs);
  const empty = columns.every((column) => !column.items.length);
  return `<div class="task-sections">${columns
    .filter((column, index) => index === 0 || column.items.length)
    .map((column, index) => sectionMarkup(column, field, empty && index === 0))
    .join("")}</div>`;
}
