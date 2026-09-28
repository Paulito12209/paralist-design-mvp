/*
 * Die Aufgaben-Seite hinter dem dritten Reiter. Der Titel steht allein,
 * darunter die Pillen der Ansichten (tasks-views.js), darunter je nach
 * Ansicht die Liste oder das Kanban-Board, am Seitenende die Karte „Ansicht“
 * mit den Einstellungen (tasks-settings.js). Diese Datei hält nur alles
 * zusammen: gezeichnet wird in tasks-list.js und tasks-board.js, das Ziehen
 * steht in tasks-drag.js, das Anlegen durch Tippen in die Fläche in
 * tasks-inline.js. Wird erst beim ersten Öffnen nachgeladen.
 *
 * Die Karte schaut beim Öffnen mit ihrem Kopf über der Navigation hervor —
 * wie „Details“ auf der Eintragsseite. Dafür bekommt die Fläche der Liste
 * nach jedem Zeichnen eine Mindesthöhe: so viel, dass der Kopf der Karte
 * gerade über der Navigation liegt. Gemessen wird nur beim Zeichnen, nie
 * beim Scrollen.
 * Pfad: src/features/tasks/tasks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * REVEAL_SHARE -> so viel der Karte muss über der Navigation stehen, bevor
 *                 ihre Zeilen einblenden (0.5 = die Hälfte)
 *
 * Maße stehen in styles/tasks.css, styles/tasks-board.css und
 * styles/tasks-settings.css (--details-head-h, --details-gap, --nav-height, --nav-bottom).
 */

import { events, on } from "../../core/bus.js";
import { cssNumber } from "../../core/css-vars.js";
import { dom, el } from "../../core/dom.js";
import { activeTaskView } from "../../data/task-views.js";
import { openEntry } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";
import { taskBoardMarkup } from "./tasks-board.js";
import { consumeDragClick, initTaskDrag } from "./tasks-drag.js";
import { initTaskInline } from "./tasks-inline.js";
import { taskListMarkup } from "./tasks-list.js";
import { handleSettingsClick, taskSettingsMarkup } from "./tasks-settings.js";
import { afterViewsRender, handleViewsClick, initTaskViews, taskViewsMarkup } from "./tasks-views.js";

const REVEAL_SHARE = 0.5;

/* Der Behälter der Karte „Ansicht“ — einmal angelegt, danach nur neu gefüllt. */
let settingsHost = null;

/* Wo die Navigation beginnt, von der Unterkante des Inhalts aus gemessen. */
function navTop() {
  return cssNumber("--nav-height", 76) + cssNumber("--nav-bottom", 10);
}

/* Die Liste so hoch machen, dass der Kopf der Karte gerade über der Navigation steht. */
function fitBody() {
  const room =
    dom.content.clientHeight -
    dom.tasksBody.offsetTop -
    navTop() -
    cssNumber("--details-gap", 28) -
    cssNumber("--details-head-h", 52);
  dom.tasksBody.style.minHeight = `${Math.max(0, room)}px`;
}

/* Die Zeilen der Karte erscheinen erst, wenn die Karte über der Navigation
   auftaucht — vorher läge ihr Inhalt neben der schwebenden Leiste sichtbar
   herum. Beobachtet wird die Karte, nicht das Scrollen. */
function watchReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      const card = settingsHost.firstElementChild;
      if (card) card.classList.toggle("is-revealed", entries[0].intersectionRatio >= REVEAL_SHARE);
    },
    { root: dom.content, rootMargin: `0px 0px -${navTop()}px 0px`, threshold: [0, REVEAL_SHARE, 1] }
  );
  observer.observe(settingsHost);
}

/* Die ganze Karte in den Blick holen — ein Tipp auf ihren Kopf. Von Hand
   gerechnet statt scrollIntoView: das kennt den Abstand zur Navigation nicht. */
function revealSettings() {
  const bottom = settingsHost.offsetTop + settingsHost.offsetHeight + cssNumber("--tab-space", 116);
  dom.content.scrollTo({ top: Math.max(0, bottom - dom.content.clientHeight), behavior: "smooth" });
}

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
  settingsHost.innerHTML = taskSettingsMarkup(view);
  fitBody();

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
  /* Die Karte hängt hinter der Liste in der Ansicht — sie scrollt mit der Seite. */
  settingsHost = document.createElement("div");
  settingsHost.className = "tasks-settings-host";
  el("view-tasks").append(settingsHost);
  watchReveal();

  dom.tasksTools.addEventListener("click", handleViewsClick);
  dom.tasksBody.addEventListener("click", onBodyClick);
  settingsHost.addEventListener("click", (event) => handleSettingsClick(event, activeTaskView(), revealSettings));
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
