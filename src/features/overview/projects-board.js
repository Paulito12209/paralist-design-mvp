/*
 * Das Kanban-Board der Projekte: dieselben Projekte wie in der Liste, nur
 * als waagerecht scrollende Spalten nach Status oder Dringlichkeit (Wahl in
 * der Karte „Ansicht“, src/features/overview/project-settings.js). Gezeichnet
 * wird wie im Board der Aufgaben (styles/tasks-board.css): blasse Kopfzeile je
 * Spalte, darunter schlichte Zeilen — vorn das Icon des Projekts, dann Titel
 * mit Nebenzeile (Fälligkeit und die jeweils andere Angabe), rechts der
 * Griffstreifen. Am Griff zieht man ein Projekt in eine andere Spalte: es
 * bekommt deren Status bzw. Dringlichkeit (src/data/project-board.js). Ein Tipp
 * auf die Zeile öffnet das Projekt. Ziehen und Mitrollen steckt in
 * src/ui/board-drag.js und ist mit dem Board der Aufgaben geteilt.
 * Neue Projekte entstehen in der iOS-Fassung über „Projekt hinzufügen“ unter dem
 * Board. In der Android-Fassung steht stattdessen in jeder Spalte ohne Projekt
 * die blasse Zeile „Projekt hinzufügen“; ein Tipp öffnet dort die Eingabezeile
 * (src/features/overview/project-inline.js), das Projekt bekommt den Status bzw.
 * die Dringlichkeit der Spalte. Liegt ein Projekt darin, ist die Zeile weg.
 * Pfad: src/features/overview/projects-board.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyNote     -> Text in einer Spalte, in der nichts liegt (iOS)
 * addLabel      -> Beschriftung der blassen Zeile in einer leeren Spalte (Android)
 * untitled      -> wie ein Projekt ohne Titel heißt
 * defaultIcon   -> Icon eines Projekts, das keins gewählt hat
 *
 * Breite, Fugen, Griff und Rundungen stehen in styles/tasks-board.css, das
 * kleine Icon vor dem Titel in styles/projects-board.css.
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { dayKey } from "../../core/dates.js";
import { shortDay } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { isTaskDone, taskPriorityOf, taskStatusOf } from "../../data/config-tasks.js";
import { dropProjectCard, projectColumns } from "../../data/project-board.js";
import { findEntry } from "../../data/queries.js";
import { consumeDragClick, initBoardDrag } from "../../ui/board-drag.js";
import { isMobileOs } from "../../ui/platform.js";
import { openEntry } from "../../ui/router.js";

const emptyNote = "Nichts hier";
const addLabel = "Projekt hinzufügen";
const untitled = "Ohne Titel";
const defaultIcon = "rocket";

/* Die Nebenzeile: Fälligkeit, dahinter die Angabe, die die Spalte nicht schon sagt. */
function metaMarkup(project, field) {
  const parts = [];
  if (project.date) {
    const overdue = !isTaskDone(project) && project.date < dayKey(new Date());
    parts.push(`<span class="task-due${overdue ? " is-overdue" : ""}">${escapeHtml(shortDay(project.date))}</span>`);
  }
  if (field === "status") {
    const priority = taskPriorityOf(project.priority);
    parts.push(`<span class="task-prio" style="--chip-color:${priority.color}">${escapeHtml(priority.label)}</span>`);
  } else {
    parts.push(`<span class="task-prio">${escapeHtml(taskStatusOf(project.status).label)}</span>`);
  }
  return `<span class="task-meta">${parts.join('<span class="task-meta-dot" aria-hidden="true">·</span>')}</span>`;
}

/* Eine Zeile: Icon, Titel mit Nebenzeile, ganz rechts der Griffstreifen. */
function boardRow(project, field) {
  const done = isTaskDone(project);
  return `
    <div class="board-row" data-board-row="${project.id}">
      ${icon(project.icon || defaultIcon, "board-row-icon")}
      <div class="board-row-main">
        <p class="board-row-title task-title${done ? " is-done" : ""}">${escapeHtml(project.title || untitled)}</p>
        ${metaMarkup(project, field)}
      </div>
      <span class="board-grip" data-grip="${project.id}" role="button" tabindex="0" aria-label="Projekt verschieben"></span>
    </div>`;
}

/* Der Inhalt einer Spalte ohne Projekt: Android die blasse Zeile zum Anlegen
   (trägt „board-empty“, damit sie beim Ziehen und Schreiben verschwindet wie der Hinweis). */
function emptyColumn() {
  if (!isMobileOs("android")) return `<p class="board-empty">${emptyNote}</p>`;
  return `
    <button class="board-add board-empty" type="button" data-board-add>
      ${icon("rocket-plus", "board-add-icon")}<span class="board-add-label">${addLabel}</span>
    </button>`;
}

/* Eine Spalte mit Kopfzeile und Zeilen; data-drop und data-field liest das Ziehen. */
function boardColumn(column, field) {
  const rows = column.items.map((project) => boardRow(project, field)).join("");
  return `
    <div class="board-col" data-column="${column.id}" style="--col-color:${column.color}">
      <div class="board-head">
        ${icon(column.icon, "board-head-icon")}
        <span class="board-head-name">${column.label}</span>
        <span class="board-count">${column.items.length}</span>
      </div>
      <div class="board-rows" data-drop="${column.id}" data-field="${field}">
        ${rows || emptyColumn()}
      </div>
    </div>`;
}

/** Das ganze Board der Ansicht als HTML. data-edge-swipe: am Rand wechselt Wischen die Ansicht. */
export function projectBoardMarkup(view) {
  const { field, columns } = projectColumns(view);
  return `<div class="board project-board" data-edge-swipe>${columns.map((column) => boardColumn(column, field)).join("")}</div>`;
}

/**
 * Tipp auf eine Zeile öffnet das Projekt — außer dem Klick, der direkt auf
 * einen Zug folgt, und dem auf den Griff. Gibt true zurück, wenn er hier erledigt ist.
 */
export function handleProjectBoardClick(event) {
  if (consumeDragClick()) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  if (event.target.closest("[data-grip]")) return false;
  const row = event.target.closest("[data-board-row]");
  if (!row) return false;
  openEntry(row.dataset.boardRow);
  return true;
}

/* Den Zug speichern: das gezogene Projekt in die Zielspalte, die Reihenfolge des Boards merken. */
function dropProject({ card, box }) {
  const project = findEntry(card.dataset.boardRow);
  if (!project) return;
  const board = box.closest(".board");
  const shown = Array.from(board.querySelectorAll(".board-row")).map((row) => row.dataset.boardRow);
  dropProjectCard(project, box.dataset.field, box.dataset.drop, shown);
}

/** Das Ziehen anmelden — auf der Übersicht und der Seite Projekte. */
export function initProjectBoard() {
  initBoardDrag({
    hosts: [dom.projectList, dom.pageBody],
    redraw: () => emit(events.dataChanged),
    drop: dropProject,
  });
}
