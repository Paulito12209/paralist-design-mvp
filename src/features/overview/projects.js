/*
 * Die Projekte — auf der Übersicht unter den Karten und auf der Seite
 * Projekte (#/projekte). Beide Stellen zeichnen mit denselben Funktionen in
 * ihren eigenen Behälter: oben die Pillen der Ansichten
 * (src/features/overview/project-views.js), darunter die Projekte der
 * gewählten Ansicht als schlichte Zeilen, die Zeile „Projekt hinzufügen“ und
 * „Zum Archiv“ mit der Pille Projekte. Am Desktop zeigt die Übersicht keine
 * Projekte — dort stehen sie in der Seitenleiste.
 * Pfad: src/features/overview/projects.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyProjects -> was die Liste zeigt, solange es noch gar kein Projekt gibt
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
import { activeProjectView, visibleProjects } from "../../data/project-views.js";
import { archivedEntries, projectEntries } from "../../data/queries.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { emptyState } from "../../ui/empty-state.js";
import { entryRow } from "../../ui/rows.js";
import { isViewActive } from "../../ui/views.js";
import { afterProjectViewsRender, initProjectViews, projectViewsMarkup } from "./project-views.js";

/* Noch kein einziges Projekt: Emblem, Satz und die Pille zum Anlegen. Die
   Pille trägt data-project-add, damit das Projekt in der gewählten Ansicht landet. */
const emptyProjects = {
  icon: "rocket",
  accent: "var(--prio-jetzt)",
  title: "Noch keine Projekte",
  text: "Ein Projekt bündelt Aufgaben, Notizen und Termine an einem Ort.",
  action: { label: "Projekt anlegen" },
  data: 'data-project-add="1"',
};
const emptyViewText = "In dieser Ansicht liegt kein Projekt.";
const addRowLabel = "Projekt hinzufügen";
const archiveLabel = "Zum Archiv";

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
   Gibt es noch gar kein Projekt, steht nur der Platzhalter mit seiner Pille da
   — die Zeile darunter sagte dasselbe noch einmal. */
function listMarkup() {
  const projects = visibleProjects(activeProjectView());
  if (!projectEntries().length) return emptyState(emptyProjects) + archiveMarkup();
  const lead = projects.length ? "" : `<p class="project-empty-note">${emptyViewText}</p>`;
  const rows = projects.map((project) => entryRow(project)).join("");
  const addRow = `
    <button class="workspace-row workspace-add" type="button" data-project-add="1">
      ${icon("rocket-plus")}<span>${addRowLabel}</span>
    </button>`;
  return `${lead}<div class="workspace-list">${rows}${addRow}</div>${archiveMarkup()}`;
}

/* Neu zeichnen, ohne dass die Pillenleiste an den Anfang zurückspringt. */
function withPillScroll(container, draw) {
  const scrolled = container.querySelector(".tab-pills")?.scrollLeft || 0;
  draw();
  const pills = container.querySelector(".tab-pills");
  if (pills) pills.scrollLeft = scrolled;
}

/** Die Projekte auf der Übersicht zeichnen — am Desktop bleibt die Stelle leer. */
export function renderProjectSection() {
  if (isDesk()) {
    dom.projectViews.innerHTML = "";
    dom.projectList.innerHTML = "";
    return;
  }
  withPillScroll(dom.projectViews, () => {
    dom.projectViews.innerHTML = projectViewsMarkup();
  });
  dom.projectList.innerHTML = listMarkup();
  afterProjectViewsRender();
}

/** Die Seite Projekte zeichnen: dieselbe Pillenzeile und Liste wie auf der Übersicht. */
export function renderProjectsPage() {
  withPillScroll(dom.pageBody, () => {
    dom.pageBody.innerHTML = `<div class="project-views">${projectViewsMarkup()}</div>${listMarkup()}`;
  });
  afterProjectViewsRender();
}

/** Anmelden: die Übersicht frischt ihre Projekte auf, solange sie offen ist. */
export function initProjects() {
  initProjectViews();
  on(events.dataChanged, () => {
    if (isViewActive("home")) renderProjectSection();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderProjectSection();
  });
  onDeskChange(() => {
    if (isViewActive("home")) renderProjectSection();
  });
}
