/*
 * Die Aufgaben-Seite hinter dem dritten Reiter. Der Titel steht allein,
 * darunter die Pillen der Ansichten (tasks-views.js), darunter je nach
 * Ansicht die Liste oder das Kanban-Board. Über allem, aber unter der
 * Navigation, liegt die Karte „Ansicht“ (src/ui/view-panel.js) mit
 * den Einstellungen (tasks-settings.js). Diese Datei hält nur alles
 * zusammen: gezeichnet wird in tasks-list.js und tasks-board.js, das Ziehen
 * steht in tasks-drag.js, das Anlegen durch Tippen in die Fläche in
 * tasks-inline.js, der Auswahlmodus in tasks-select.js (dann steht an der
 * Stelle der Pillen die Zählzeile). Am Desktop wandert die Karte in die rechte Spalte
 * (tasks-rail.js), rechts neben den Pillen stehen Liste | Board und Filter.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/tasks/tasks.js
 *
 * Keine anpassbaren Werte in dieser Datei. Maße stehen in styles/tasks.css,
 * styles/tasks-board.css und styles/tasks-settings.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { activeTaskView } from "../../data/task-views.js";
import { openEntry } from "../../ui/router.js";
import { createViewPanel } from "../../ui/view-panel.js";
import { isViewActive } from "../../ui/views.js";
import { taskBoardMarkup } from "./tasks-board.js";
import { consumeDragClick, initTaskDrag } from "./tasks-drag.js";
import { initTaskInline } from "./tasks-inline.js";
import { taskListMarkup } from "./tasks-list.js";
import { isSelecting } from "./tasks-pick.js";
import { afterSelectRender, handleSelectClick, initTaskSelect } from "./tasks-select.js";
import { selectRowMarkup } from "./tasks-select-bar.js";
import { deskToolsMarkup, handleSettingsClick, taskSettingsMarkup } from "./tasks-settings.js";
import { afterViewsRender, handleViewsClick, initTaskViews, taskViewsMarkup } from "./tasks-views.js";

/** Die ganze Seite neu zeichnen. */
export function renderTasks() {
  const view = activeTaskView();
  const board = view.layout === "board";
  /* Beim Neuzeichnen soll das Board dort stehen bleiben, wo man es hingeschoben hat. */
  const scrolled = dom.tasksBody.querySelector(".board");
  const left = scrolled ? scrolled.scrollLeft : 0;

  /* Rechts neben den Pillen: Liste | Board und Filter — nur am Desktop zu sehen (styles/tasks-desk.css). */
  /* Im Auswahlmodus steht an der Stelle der Pillen die Zählzeile */
  dom.tasksTools.innerHTML = isSelecting() ? selectRowMarkup() : taskViewsMarkup(deskToolsMarkup(view));
  afterViewsRender();
  dom.tasksBody.innerHTML = board ? taskBoardMarkup(view) : taskListMarkup(view);
  panel.setContent(taskSettingsMarkup(view));
  afterSelectRender();

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
  /* Im Auswahlmodus (und beim Cmd-Klick) wählt ein Tipp — sonst nichts */
  if (handleSelectClick(event)) return;
  /* In der Liste öffnet src/ui/list-clicks.js den Eintrag; im Board hier.
     Der Haken vor dem Titel hakt nur ab (list-clicks.js) und der Griff
     zieht — beide liegen in der Zeile, öffnen sie aber nicht. */
  if (event.target.closest("[data-task-done], [data-grip]")) return;
  const row = event.target.closest("[data-board-row]");
  if (row) openEntry(row.dataset.boardRow);
}

/* Die Karte „Ansicht“; angelegt in init(). */
let panel = null;

/* Beim Laden des Moduls anmelden: die Seite frischt sich auf, solange sie offen ist. */
function init() {
  panel = createViewPanel({
    title: "Ansicht",
    className: "tasks-panel",
    onClick: (event) => handleSettingsClick(event, activeTaskView()),
  });
  dom.tasksTools.addEventListener("click", (event) => {
    if (event.target.closest("[data-settings]")) handleSettingsClick(event, activeTaskView());
    else handleViewsClick(event);
  });
  dom.tasksBody.addEventListener("click", onBodyClick);
  initTaskDrag(renderTasks);
  initTaskInline();
  initTaskViews();
  initTaskSelect(renderTasks);

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
