/*
 * Android-Fassung: der Kopf der Projektkarte und die Karte „Archiviert“
 * darunter — gebaut wie die Listen in Google Tasks. Oben in der Karte steht
 * eine Werkzeugzeile: links der Zähler („12 Projekte“, gefiltert „4 von 12“),
 * rechts Sortieren, Filtern und die drei Punkte. Sortieren und Filtern öffnen
 * ihre Blätter direkt (src/features/overview/project-settings.js); die drei
 * Punkte holen das ganze Blatt „Ansicht“ herauf (data-view-panel-open,
 * src/ui/view-panel.js). Bei „Alle“ und bei handverlesenen Projekten ist
 * Filtern gesperrt — der Tipp erklärt dann, warum, bzw. zeigt das Blatt.
 * Unter der Liste liegt die Karte „Archiviert (n)“: ein Tipp klappt die
 * archivierten Projekte auf; Zurückholen und Löschen gehen per Wischen und
 * Menü wie im Archiv. Beides steht in jeder Fassung im Dokument und ist nur in
 * der Android-Fassung zu sehen (styles/android-card.css).
 * Pfad: src/features/overview/project-card.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * countWords    -> Wörter des Zählers („Projekt“, „Projekte“, „von“)
 * toolLabels    -> Vorlesetexte und Hinweise der drei Symbole
 * archivedLabel -> Überschrift der Karte „Archiviert“
 */

import { icon } from "../../core/html.js";
import { sortProjects } from "../../data/project-views.js";
import { archivedEntries, projectEntries } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { archiveActions, entryRow } from "../../ui/rows.js";
import { openViewPanel } from "../../ui/view-panel.js";
import { openPlaceSheet, openProjectInfo, openProjectSort } from "./project-settings.js";

const countWords = { one: "Projekt", many: "Projekte", of: "von" };
const toolLabels = { sort: "Sortieren", filter: "Filtern", more: "Ansicht" };
const archivedLabel = "Archiviert";

/* Was der Zähler sagt: alle Projekte, oder „4 von 12“, sobald die Ansicht aussiebt. */
function countText(shown, total) {
  if (shown < total) return `${shown} ${countWords.of} ${total}`;
  return `${total} ${total === 1 ? countWords.one : countWords.many}`;
}

/* Siebt die Ansicht etwas aus? Dann steht das Filter-Symbol in der Akzentfarbe. */
function isFiltering(view) {
  return view.ids.length > 0 || view.place !== "alle" || Boolean(view.favoritesOnly);
}

function tool(name, iconName, active = false) {
  const open = name === "more" ? " data-view-panel-open" : "";
  return `
    <button class="project-card-tool${active ? " is-active" : ""}" type="button" data-card-tool="${name}"${open}
      aria-label="${toolLabels[name]}" title="${toolLabels[name]}">${icon(iconName)}</button>`;
}

/** Die Werkzeugzeile oben in der Karte für die gewählte Ansicht und ihre sichtbaren Projekte. */
export function projectCardHead(view, projects) {
  return `
    <div class="project-card-head">
      <span class="project-card-count">${countText(projects.length, projectEntries().length)}</span>
      <div class="project-card-tools">
        ${tool("sort", "sort")}${tool("filter", "filter", isFiltering(view))}${tool("more", "dots")}
      </div>
    </div>`;
}

/* Archivierte Projekte, nach Namen — die Karte zeigt sie aufgeklappt. */
function archivedProjects() {
  return sortProjects(
    archivedEntries().filter((entry) => entry.type === "projekt"),
    "name",
    true
  );
}

/** Die Karte „Archiviert (n)“ unter der Liste; ohne archivierte Projekte bleibt sie weg. */
export function archivedProjectsCard() {
  const projects = archivedProjects();
  if (!projects.length) return "";
  const open = ui.projectArchiveOpen;
  const rows = open
    ? `<div class="project-archived-body workspace-list">${projects
        .map((project) => entryRow(project, "", archiveActions("restore", "delete")))
        .join("")}</div>`
    : "";
  return `
    <section class="project-archived${open ? " is-open" : ""}" aria-label="${archivedLabel}">
      <button class="project-archived-head" type="button" data-archived-toggle="1" aria-expanded="${open}">
        <span>${archivedLabel} (${projects.length})</span>${icon("chevron")}
      </button>
      ${rows}
    </section>`;
}

/**
 * Klicks auf die Werkzeuge und den Kopf der Karte „Archiviert“.
 * @returns true, wenn die Liste danach neu gezeichnet werden muss (Auf- oder Zuklappen)
 */
export function handleProjectCardClick(event, view) {
  const toggle = event.target.closest("[data-archived-toggle]");
  if (toggle) {
    ui.projectArchiveOpen = !ui.projectArchiveOpen;
    return true;
  }
  const button = event.target.closest("[data-card-tool]");
  if (!button) return false;
  const name = button.dataset.cardTool;
  if (name === "sort") openProjectSort(view);
  else if (name === "filter") {
    if (view.fixed) openProjectInfo();
    else if (view.ids.length) openViewPanel();
    else openPlaceSheet(view);
  }
  return false;
}
