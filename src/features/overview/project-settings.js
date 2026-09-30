/*
 * Der Inhalt der Karte „Ansicht“ unter den Projekten — auf der Übersicht und
 * der Seite Projekte gleich. Kopf, Lage und Auf- und Zuklappen kommen aus
 * src/ui/view-panel.js (wie „Ansicht“ der Aufgaben-Seite);
 * hier stehen nur die Zeilen der gewählten Ansicht:
 *
 * - Sortieren: Zeile mit der Wahl („Zuletzt geöffnet · Neueste zuerst“), ein
 *   Tipp öffnet das Blatt „Sortieren“ (src/ui/sort-sheet.js)
 * - Filtern: Blatt „Projekte aus“ — alle Orte, Eingang, jeder Arbeitsbereich
 * - Nur Favoriten: Schalter
 * - Projekte wählen: Blatt mit Häkchen über alle Projekte (die handverlesene Liste)
 *
 * Solange Projekte handverlesen sind, ruhen Filtern und Favoriten — die Zeile
 * sagt „Handverlesen, 3 Projekte“. „Alle“ kann nur sortieren; der ⓘ neben
 * der gesperrten Filter-Zeile erklärt, wie man eine eigene Ansicht baut.
 * Pfad: src/features/overview/project-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabels             -> Beschriftungen der Zeilen
 * allPlaces / inboxLabel -> was in der Filter-Zeile steht
 * handpicked(n)          -> was die Filter-Zeile bei handverlesenen Projekten sagt
 * placeTitle / pickTitle -> Überschriften der Blätter „Projekte aus“ und „Projekte wählen“ (das Blatt „Sortieren“ hat keinen Titel)
 * clearPickLabel         -> letzte Zeile im Blatt „Projekte wählen“
 * infoTitle / infoText   -> das Blatt hinter dem ⓘ
 *
 * Aussehen: styles/tasks-settings.css (Schalter, gesperrte Zeile, ⓘ) und
 * styles/entry-details.css (Karte, Zeilen).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { projectSorts } from "../../data/config.js";
import {
  activeProjectView,
  sortProjects,
  toggleProjectInView,
  updateProjectView,
} from "../../data/project-views.js";
import { parentName, projectEntries, workspaceIcon, workspaceLabel } from "../../data/queries.js";
import { workspaceRef } from "../../data/refs.js";
import { state } from "../../data/state.js";
import { panelToggle } from "../../ui/panel-rows.js";
import { openSheet } from "../../ui/sheet.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";

const rowLabels = {
  sort: "Sortieren",
  place: "Filtern",
  favorites: "Nur Favoriten",
  pick: "Projekte wählen",
  info: "Warum lässt sich „Alle“ nicht filtern?",
};
const allPlaces = "Alle Orte";
const inboxLabel = "Eingang";
const handpicked = (n) => `Handverlesen, ${n} ${n === 1 ? "Projekt" : "Projekte"}`;
const placeTitle = "Projekte aus";
const pickTitle = "Projekte wählen";
const clearPickLabel = "Auswahl aufheben";
const infoTitle = "Eigene Ansicht";
const infoText =
  "„Alle“ zeigt immer jedes Projekt. Tippe auf das kleine Plus neben den Pillen: die neue Ansicht beginnt als Kopie von „Alle“ und lässt sich filtern, sortieren und mit handverlesenen Projekten füllen, wie du willst.";

/* Was in der Filter-Zeile steht. */
function placeValue(view) {
  if (view.ids.length) return handpicked(view.ids.length);
  if (view.place === "alle") return allPlaces;
  if (view.place === "inbox") return inboxLabel;
  return parentName(view.place);
}

/** Die Zeilen der Karte für die gewählte Ansicht. */
export function projectSettingsMarkup(view) {
  const locked = view.fixed || view.ids.length > 0;
  const sortRow = `
    <button class="details-row is-editable" type="button" data-settings="sort">
      <span class="details-row-label">${rowLabels.sort}</span><span class="details-row-value">${escapeHtml(sortSummary(projectSorts, view.sort, view.sortAsc))}</span>
    </button>`;
  const placeRow = `
    <div class="details-row tasks-filter-row${locked ? " is-locked" : ""}">
      <button class="tasks-filter-btn" type="button" data-settings="place"${locked ? " disabled" : ""}>
        <span class="details-row-label">${rowLabels.place}</span><span class="details-row-value">${escapeHtml(placeValue(view))}</span>
      </button>
      ${view.fixed ? `<button class="tasks-info" type="button" data-settings="info" aria-label="${escapeHtml(rowLabels.info)}">${icon("info")}</button>` : ""}
    </div>`;
  if (view.fixed) return `<div class="details-list tasks-settings">${sortRow}${placeRow}</div>`;
  const pickCount = view.ids.length;
  return `
    <div class="details-list tasks-settings">
      ${sortRow}
      ${placeRow}
      <div class="details-row${locked ? " is-muted" : ""}">
        <span class="details-row-label">${rowLabels.favorites}</span>${panelToggle("favorites", view.favoritesOnly, rowLabels.favorites, locked)}
      </div>
      <button class="details-row is-editable" type="button" data-settings="pick">
        <span class="details-row-label">${rowLabels.pick}</span><span class="details-row-value">${pickCount || "Keine"}</span>
      </button>
    </div>`;
}

/* Blatt „Sortieren“: wonach, darunter die Richtung. */
function openProjectSort(view) {
  openSortSheet({
    options: projectSorts,
    sort: view.sort,
    asc: view.sortAsc,
    onChange: (sort, sortAsc) => updateProjectView({ sort, sortAsc }),
  });
}

/* Blatt „Projekte aus“: alle Orte, der Eingang und jeder Arbeitsbereich. */
function openPlaceSheet(view) {
  const option = (ref, label, iconName) => ({
    label,
    icon: iconName,
    active: view.place === ref,
    onSelect: () => updateProjectView({ place: ref }),
  });
  const spaces = state.workspaces.filter((workspace) => !workspace.archived);
  openSheet(placeTitle, [
    option("alle", allPlaces, "layers"),
    option("inbox", inboxLabel, "inbox"),
    ...spaces.map((workspace) => option(workspaceRef(workspace.id), workspaceLabel(workspace), workspaceIcon(workspace))),
  ]);
}

/*
 * Blatt „Projekte wählen“: jedes Projekt mit Häkchen, nach Namen. Es bleibt
 * offen, damit man mehrere nacheinander an- und abwählen kann; jeder Tipp
 * zeichnet es mit dem neuen Stand neu.
 */
function openPickSheet() {
  const view = activeProjectView();
  const projects = sortProjects(projectEntries(), "name", true);
  const options = projects.map((project) => ({
    label: project.title || "Projekt",
    icon: project.icon || "rocket",
    active: view.ids.some((id) => String(id) === String(project.id)),
    stay: true,
    onSelect: () => {
      toggleProjectInView(project.id);
      openPickSheet();
    },
  }));
  if (view.ids.length) {
    options.push({ label: clearPickLabel, icon: "close", split: true, onSelect: () => updateProjectView({ ids: [] }) });
  }
  openSheet(pickTitle, options);
}

/** Klicks in der Karte; `view` ist die gewählte Ansicht. */
export function handleProjectSettingsClick(event, view) {
  const button = event.target.closest("[data-settings]");
  if (!button || button.disabled) return;
  const setting = button.dataset.settings;
  if (setting === "sort") openProjectSort(view);
  else if (setting === "place") openPlaceSheet(view);
  else if (setting === "info") openSheet(infoTitle, [{ lead: true, label: infoText }]);
  else if (setting === "favorites") updateProjectView({ favoritesOnly: !view.favoritesOnly });
  else if (setting === "pick") openPickSheet();
}
