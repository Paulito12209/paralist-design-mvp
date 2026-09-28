/*
 * Die Aufgaben-Seite hinter dem dritten Reiter. Der Titel steht allein,
 * darunter die Pillen der Ansichten (tasks-views.js), darunter je nach
 * Ansicht die Liste oder das Kanban-Board. Über allem, aber unter der
 * Navigation, liegt die Karte „Ansicht konfigurieren“ (tasks-panel.js) mit
 * den Einstellungen (tasks-settings.js). Diese Datei hält nur alles
 * zusammen: gezeichnet wird in tasks-list.js und tasks-board.js, das Ziehen
 * steht in tasks-drag.js, das Anlegen durch Tippen in die Fläche in
 * tasks-inline.js. Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/tasks/tasks.js
 *
 * Keine anpassbaren Werte in dieser Datei. Maße stehen in styles/tasks.css,
 * styles/tasks-board.css und styles/tasks-settings.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { activeTaskView } from "../../data/task-views.js";
import { openEntry } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";
import { taskBoardMarkup } from "./tasks-board.js";
import { consumeDragClick, initTaskDrag } from "./tasks-drag.js";
import { initTaskInline } from "./tasks-inline.js";
import { taskListMarkup } from "./tasks-list.js";
import { initTaskPanel, setTaskPanelContent } from "./tasks-panel.js";
import { handleSettingsClick, taskSettingsMarkup } from "./tasks-settings.js";
import { afterViewsRender, handleViewsClick, initTaskViews, taskViewsMarkup } from "./tasks-views.js";

/** Die ganze Seite neu zeichnen. */
export function renderTasks() {
  const view = activeTaskView();
  const board = view.layout === "board";
  /* Beim Neuzeichnen soll das Board dort stehen bleiben, wo man es hingeschoben hat. */
  const scrolled = dom.tasksBody.querySelector(".board");
  const left = scrolled ? scrolled.scrollLeft : 0;

  dom.tasksTools.innerHTML = taskViewsMarkup();
  afterViewsRender();
  dom.tasksBody.innerHTML = board ? taskBoardMarkup(view) : taskListMarkup(view);
  setTaskPanelContent(taskSettingsMarkup(view));

  const next = board ? dom.tasksBody.querySelector(".board") : null;
  if (next) next.scrollLeft = left;
}

/* Klicks im Inhalt: Zeile im Board öffnen. Den Haken-Knopf fängt
   src/ui/list-clicks.js — er gilt in jeder Liste gleich. */
function onBodyClick(event) {
  /* Nach dem Ablegen einer Zeile kommt noch ein Klick — der öffnet nichts. */
  if (consumeDragClick()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  /* In der Liste öffnet src/ui/list-clicks.js den Eintrag; im Board hier. */
  const row = event.target.closest("[data-board-row]");
  if (row) openEntry(row.dataset.boardRow);
}

/* Beim Laden des Moduls anmelden: die Seite frischt sich auf, solange sie offen ist. */
function init() {
  initTaskPanel((event) => handleSettingsClick(event, activeTaskView()));
  dom.tasksTools.addEventListener("click", handleViewsClick);
  dom.tasksBody.addEventListener("click", onBodyClick);
  initTaskDrag(renderTasks);
  initTaskInline();
  initTaskViews();

  on(events.dataChanged, () => {
    if (isViewActive("tasks")) renderTasks();
  });
  on(events.viewOpened, (name) => {
    if (name === "tasks") renderTasks();
  });
  /* Zweites Antippen von „Aufgaben“ unten, die Seite steht schon oben: das
     Board rollt zurück zur ersten Spalte. Liste oder Board bleibt, wie gewählt. */
  on(events.tabReselected, (tab) => {
    if (tab === "tasks") dom.tasksBody.querySelector(".board")?.scrollTo({ left: 0, behavior: "smooth" });
  });

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("tasks")) renderTasks();
}

init();
