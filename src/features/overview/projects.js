/*
 * Die Projekte — auf der Übersicht unter den Karten und auf der Seite
 * Projekte (#/projekte). Beide Stellen zeichnen mit denselben Funktionen in
 * ihren eigenen Behälter: oben die Pillen der Ansichten
 * (src/features/overview/project-views.js), darunter die Projekte der
 * gewählten Ansicht als schlichte Zeilen, die Zeile „Projekt hinzufügen“ und
 * „Zum Archiv“ mit der Pille Projekte. Die Zeile steht in der iOS-Fassung immer
 * unter der Liste, in der Android-Fassung nur, solange die Ansicht kein Projekt
 * zeigt. Steht die Ansicht auf „Board“, liegen die
 * Projekte stattdessen in Spalten nach Status oder Dringlichkeit
 * (src/features/overview/projects-board.js). Ein Tipp in die freie Fläche unter der
 * Liste legt ein Projekt direkt an (src/features/overview/project-inline.js). Über der Navigation hängt die Karte
 * „Ansicht“ mit Sortieren und Filtern (src/features/overview/project-settings.js).
 * In der Android-Fassung steht über der Liste eine Werkzeugzeile („Archiv (n)“,
 * Sortieren, Filtern — src/features/overview/project-card.js); die Pille
 * „Zum Archiv“ ist dort ausgeblendet (styles/android-archive.css), ins Archiv
 * führen „Archiv (n)“ und die Karte „Archiv“ der Übersicht. Die Karte
 * „Ansicht“ kommt dort als Blatt von unten.
 * Am Desktop zeigt die Übersicht keine Projekte — dort stehen sie in der Seitenleiste.
 * Pfad: src/features/overview/projects.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyProjects -> was die Seite Projekte zeigt, solange es noch gar kein Projekt gibt
 *                  (die Übersicht zeigt dann nur die Zeile „Projekt hinzufügen“)
 * emptyViewText -> der Satz, wenn eine Ansicht nichts findet
 * addRowLabel   -> Beschriftung der Zeile unter der Liste
 * archiveLabel  -> Beschriftung der Pille zum Archiv
 *
 * Aussehen: Zeilen in styles/rows.css, Pillenzeile und Archiv-Pille in
 * styles/overview.css, der Platzhalter in styles/empty-state.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { activeProjectView, projectOrderScope, visibleProjects } from "../../data/project-views.js";
import { archivedEntries, projectEntries } from "../../data/queries.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { collectionEmptyState } from "../../ui/empty-state.js";
import { isMobileOs } from "../../ui/platform.js";
import { entryRow } from "../../ui/rows.js";
import { createViewPanel } from "../../ui/view-panel.js";
import { isViewActive } from "../../ui/views.js";
import { handleProjectSettingsClick, projectSettingsMarkup } from "./project-settings.js";
import { handleProjectBoardClick, initProjectBoard, projectBoardMarkup } from "./projects-board.js";
import { handleProjectCardClick, projectCardHead } from "./project-card.js";
import { initProjectInline } from "./project-inline.js";
import { afterProjectViewsRender, initProjectViews, isProjectsPageOpen, projectViewsMarkup } from "./project-views.js";

/* Noch kein einziges Projekt: Emblem, Satz und die Pille zum Anlegen. Die
   Pille trägt data-project-add, damit das Projekt in der gewählten Ansicht landet. */
const emptyProjects = {
  icon: "rocket",
  accent: "var(--prio-jetzt)",
  title: "Noch keine Projekte",
  text: "Ein Projekt ist eine Reihe von Aufgaben, die auf ein Ziel hinführt — mit einem Termin, bis zu dem es erledigt sein soll.",
  action: { label: "Projekt anlegen" },
  data: 'data-project-add="1"',
};
const emptyViewText = "In dieser Ansicht liegt kein Projekt.";
const addRowLabel = "Projekt hinzufügen";
const archiveLabel = "Zum Archiv";
const panelTitle = "Ansicht";

/* Die Karte „Ansicht“ über der Navigation; angelegt in initProjects(). */
let panel = null;

/*
 * Die Karte gehört zur Übersicht am Handy und zur Seite Projekte. Die Klasse
 * is-projects am body schaltet sie sichtbar (styles/tasks-settings.css) und
 * füllt die Karte mit der gewählten Ansicht.
 */
function syncPanel() {
  if (!panel) return;
  const shown = (isViewActive("home") && !isDesk()) || isProjectsPageOpen();
  document.body.classList.toggle("is-projects", shown);
  if (shown) panel.setContent(projectSettingsMarkup(activeProjectView()));
}

/* Die Pille „Zum Archiv“ — nur, wenn dort Projekte liegen; sie öffnet deren Pille. */
function archiveMarkup() {
  if (!archivedEntries().some((entry) => entry.type === "projekt")) return "";
  return `
    <div class="archive-link-row">
      <button class="archive-link" type="button" data-open-archive="projekt">
        ${icon("archive")}<span>${archiveLabel}</span>
      </button>
    </div>`;
}

/* Liste, Zeile „Projekt hinzufügen“ und Archiv-Pille der gewählten Ansicht.
   Gibt es noch gar kein Projekt, zeigt nur die Seite Projekte (`onPage`) den
   großen Platzhalter mit seiner Pille — die Zeile darunter sagte dasselbe
   noch einmal. Auf der Übersicht wäre er zu wuchtig: dort steht allein die
   Zeile „Projekt hinzufügen“, wie bei den Arbeitsbereichen.
   Android: die Zeile steht nur, solange die Ansicht kein Projekt zeigt, und
   dann ohne Satz darüber — danach legen „Neu“ und ein Tipp in die freie Fläche
   (project-inline.js) Projekte an. Im Board gehört sie in die leeren Spalten
   (projects-board.js), darunter steht nichts. Der leere Listen-Behälter bleibt
   in der Liste stehen, damit der Tipp in die freie Fläche eine Liste findet.
   Auch über dem großen Platzhalter stehen Werkzeugzeile und der leere Behälter:
   ein Tipp auf den Platzhalter öffnet die erste Zeile, der Platzhalter weicht
   ihr dann (styles/empty-state.css). */
function listMarkup(onPage) {
  const view = activeProjectView();
  const projects = visibleProjects(view);
  const none = !projectEntries().length;
  const android = isMobileOs("android");
  const scope = projectOrderScope(view.id);
  if (none && onPage) {
    return `${projectCardHead(view)}<div class="workspace-list" data-reorder="${scope}"></div>${collectionEmptyState(emptyProjects)}${archiveMarkup()}`;
  }
  /* Der Satz „kein Projekt in dieser Ansicht“ nur, wenn es woanders welche gibt */
  const lead = projects.length || none || android ? "" : `<p class="project-empty-note">${emptyViewText}</p>`;
  const rows = projects.map((project) => entryRow(project)).join("");
  const showAdd = !android || !projects.length;
  const addRow = showAdd
    ? `
    <button class="workspace-row workspace-add" type="button" data-project-add="1">
      ${icon("rocket-plus")}<span>${addRowLabel}</span>
    </button>`
    : "";
  /* Board: die Spalten statt der Zeilen; „Projekt hinzufügen“ steht darunter als einzelne Zeile (iOS) */
  if (view.layout === "board") {
    const tail = android ? "" : `<div class="workspace-list">${addRow}</div>`;
    return `${projectCardHead(view)}${lead}${projectBoardMarkup(view)}${tail}${archiveMarkup()}`;
  }
  /* data-reorder: gedrückt Halten verschiebt eine Zeile (Android, src/ui/row-reorder.js) — je Ansicht eine eigene Reihenfolge */
  return `${projectCardHead(view)}${lead}<div class="workspace-list" data-reorder="${scope}">${rows}${addRow}</div>${archiveMarkup()}`;
}

/* Neu zeichnen, ohne dass die Pillenleiste oder das Board an den Anfang zurückspringen. */
function withPillScroll(container, draw) {
  const scrolled = container.querySelector(".tab-pills")?.scrollLeft || 0;
  const boardScrolled = container.querySelector(".project-board")?.scrollLeft || 0;
  draw();
  const pills = container.querySelector(".tab-pills");
  if (pills) pills.scrollLeft = scrolled;
  const board = container.querySelector(".project-board");
  if (board) board.scrollLeft = boardScrolled;
}

/** Die Projekte auf der Übersicht zeichnen — am Desktop bleibt die Stelle leer. */
export function renderProjectSection() {
  /* Auch beim Start: die Startseite kommt ohne „geöffnet“-Meldung. */
  syncPanel();
  if (isDesk()) {
    dom.projectViews.innerHTML = "";
    dom.projectList.innerHTML = "";
    return;
  }
  withPillScroll(dom.projectViews, () => {
    dom.projectViews.innerHTML = projectViewsMarkup();
  });
  dom.projectList.innerHTML = listMarkup(false);
  afterProjectViewsRender();
}

/** Die Seite Projekte zeichnen: dieselbe Pillenzeile und Liste wie auf der Übersicht. */
export function renderProjectsPage() {
  withPillScroll(dom.pageBody, () => {
    dom.pageBody.innerHTML = `<div class="project-views">${projectViewsMarkup()}</div>${listMarkup(true)}`;
  });
  afterProjectViewsRender();
}

/* Sortieren, Filtern und Ansicht in der Werkzeugzeile der Android-Fassung; eine Zeile im Board. */
function onCardClick(event) {
  if (handleProjectBoardClick(event)) return;
  handleProjectCardClick(event, activeProjectView());
}

/* Der Seiteninhalt gehört allen Seiten: nur auf der Seite Projekte zählen die Symbole der Projekte,
   sonst öffnete ein Tipp in Eingang & Co. zusätzlich das Blatt der Projekte. */
function onPageCardClick(event) {
  if (isProjectsPageOpen()) onCardClick(event);
}

/** Anmelden: die Übersicht frischt ihre Projekte auf, solange sie offen ist. */
export function initProjects() {
  initProjectViews();
  initProjectInline();
  initProjectBoard();
  dom.projectList.addEventListener("click", onCardClick);
  dom.pageBody.addEventListener("click", onPageCardClick);
  panel = createViewPanel({
    title: panelTitle,
    className: "project-panel",
    onClick: (event) => handleProjectSettingsClick(event, activeProjectView()),
  });
  on(events.dataChanged, () => {
    if (isViewActive("home")) renderProjectSection();
    syncPanel();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderProjectSection();
    syncPanel();
  });
  onDeskChange(() => {
    if (isViewActive("home")) renderProjectSection();
    syncPanel();
  });
}
