/*
 * Die Aufgaben-Seite hinter dem dritten Reiter. Neben dem Titel der Umschalter,
 * darunter die Pillen und je nach Wahl die Liste oder das Kanban-Board. Diese
 * Datei hält nur alles zusammen: gezeichnet wird in tasks-list.js und
 * tasks-board.js, die Bedienelemente stehen in tasks-tools.js, das Ziehen in
 * tasks-drag.js.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/tasks/tasks.js
 *
 * Keine anpassbaren visuellen Werte: Texte und Vorgaben stehen in den
 * Nachbardateien, Maße in styles/tasks.css und styles/tasks-board.css.
 */

import { emit, events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { toggleTaskDone } from "../../data/mutations.js";
import { findEntry } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { openEntry } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";
import { taskBoardMarkup } from "./tasks-board.js";
import { consumeDragClick, initTaskDrag } from "./tasks-drag.js";
import { taskListMarkup } from "./tasks-list.js";
import { handleToolClick, taskToolsMarkup } from "./tasks-tools.js";

/** Die ganze Seite neu zeichnen. */
export function renderTasks() {
  const prefs = state.prefs.tasks;
  const board = prefs.view === "board";
  /* Beim Neuzeichnen soll das Board dort stehen bleiben, wo man es hingeschoben hat. */
  const scrolled = dom.tasksBody.querySelector(".board");
  const left = scrolled ? scrolled.scrollLeft : 0;

  dom.tasksTools.innerHTML = taskToolsMarkup();
  dom.tasksBody.innerHTML = board ? taskBoardMarkup(prefs) : taskListMarkup(prefs);
  dom.tasksBody.classList.toggle("is-board", board);

  const next = board ? dom.tasksBody.querySelector(".board") : null;
  if (next) next.scrollLeft = left;
}

/* Klicks im Inhalt: Haken-Knopf, Knopf am Spaltenende, Zeile im Board öffnen. */
function onBodyClick(event) {
  /* Nach dem Ablegen einer Zeile kommt noch ein Klick — der öffnet nichts. */
  if (consumeDragClick()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const check = event.target.closest("[data-task-done]");
  if (check) {
    const entry = findEntry(check.dataset.taskDone);
    if (entry) toggleTaskDone(entry);
    return;
  }

  const add = event.target.closest("[data-add-task]");
  if (add) {
    /* Das Eingabefeld gehört einem anderen Bereich: es wird über eine
       Nachricht gebeten, nicht importiert. Wohin die neue Aufgabe soll,
       liegt so lange im flüchtigen Zustand. */
    ui.taskDraftColumn = { field: add.dataset.field, value: add.dataset.addTask };
    emit(events.taskRequested);
    return;
  }

  /* In der Liste öffnet src/ui/list-clicks.js den Eintrag; im Board hier. */
  const row = event.target.closest("[data-board-row]");
  if (row) openEntry(row.dataset.boardRow);
}

/* Beim Laden des Moduls anmelden: die Seite frischt sich auf, solange sie offen ist. */
function init() {
  const onToolClick = (event) => handleToolClick(event, renderTasks);
  dom.tasksTools.addEventListener("click", onToolClick);
  dom.tasksBody.addEventListener("click", onBodyClick);
  initTaskDrag(renderTasks);

  on(events.dataChanged, () => {
    if (isViewActive("tasks")) renderTasks();
  });
  on(events.viewOpened, (name) => {
    if (name === "tasks") renderTasks();
  });

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("tasks")) renderTasks();
}

init();
