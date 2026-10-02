/*
 * Der Inhalt der Karte „Ansicht“ unter den Projekten — auf der Übersicht und
 * der Seite Projekte gleich. Kopf, Lage und Auf- und Zuklappen kommen aus
 * src/ui/view-panel.js (wie „Ansicht“ der Aufgaben-Seite);
 * hier stehen nur die Zeilen der gewählten Ansicht:
 *
 * - Layout: Liste | Board (wie bei den Aufgaben); im Board dahinter „Spalten
 *   nach“ Status | Dringlichkeit. Auch „Alle“ merkt sich das
 * - Sortieren: Zeile mit der Wahl („Zuletzt geöffnet · Neueste zuerst“), ein
 *   Tipp öffnet das Blatt „Sortieren“ (src/ui/sort-sheet.js)
 * - Filtern: das Blatt „Filtern“ (src/features/overview/project-filter.js) —
 *   Status, Dringlichkeit und „Verknüpft mit“; darunter ein Chip je
 *   gefiltertem Abschnitt
 * - Nur Favoriten: Schalter
 * - Projekte wählen: Blatt mit Häkchen über alle Projekte (die handverlesene Liste)
 *
 * Solange Projekte handverlesen sind, ruhen Filtern und Favoriten — die Zeile
 * sagt „Handverlesen, 3 Projekte“. „Alle“ kann nur sortieren; die
 * Filter-Zeile sagt dort „Nicht möglich“, der ⓘ daneben erklärt, warum und wie
 * man eine eigene Ansicht baut, und führt in Einstellungen › Tabs.
 * Pfad: src/features/overview/project-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabels             -> Beschriftungen der Zeilen
 * layouts                -> die beiden Knöpfe der Zeile „Layout“ (Beschriftung und Symbol)
 * noFilter               -> was die Filter-Zeile einer eigenen Ansicht sagt, solange nichts gefiltert ist
 * noPick                 -> was die Zeile „Projekte wählen“ sagt, solange nichts gewählt ist
 * notPossible            -> was sie bei „Alle“ sagt, das sich nicht filtern lässt
 * handpicked(n)          -> was die Filter-Zeile bei handverlesenen Projekten sagt
 * pickTitle              -> Überschrift des Blatts „Projekte wählen“ (das Blatt „Sortieren“ hat keinen Titel)
 * clearPickLabel         -> letzte Zeile im Blatt „Projekte wählen“
 * infoTitle / infoTexts  -> das Blatt hinter dem ⓘ: die Absätze, warum „Alle“ nicht filterbar ist
 * settingsLabel          -> die Zeile im Blatt, die in Einstellungen › Tabs springt
 *
 * Aussehen: styles/tasks-settings.css (Schalter, gesperrte Zeile, ⓘ) und
 * styles/entry-details.css (Karte, Zeilen). Das Blatt „Sortieren“ öffnet in der
 * Android-Fassung auch die Werkzeugzeile über den Projekten, ebenso das Blatt
 * „Filtern“ (src/features/overview/project-card.js).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { projectSorts } from "../../data/config.js";
import { taskGroupings } from "../../data/config-tasks.js";
import {
  activeProjectView,
  sortProjects,
  toggleProjectInView,
  updateProjectView,
} from "../../data/project-views.js";
import { projectEntries } from "../../data/queries.js";
import { filterChipsMarkup } from "../../ui/filter-chips.js";
import { panelSegment, panelToggle } from "../../ui/panel-rows.js";
import { openTabSettings } from "../../ui/settings-link.js";
import { openSheet } from "../../ui/sheet.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";
import { openProjectFilterSheet, projectFilterChips } from "./project-filter.js";

const rowLabels = {
  layout: "Layout",
  groupBy: "Spalten nach",
  sort: "Sortieren",
  place: "Filtern",
  favorites: "Nur Favoriten",
  pick: "Projekte wählen",
  info: "Warum lässt sich „Alle“ nicht filtern?",
};
const layouts = [
  { id: "list", label: "Liste", icon: "list" },
  { id: "board", label: "Board", icon: "board" },
];
const noFilter = "Hinzufügen";
const noPick = "Auswählen";
const notPossible = "Nicht möglich";
const handpicked = (n) => `Handverlesen, ${n} ${n === 1 ? "Projekt" : "Projekte"}`;
const pickTitle = "Projekte wählen";
const clearPickLabel = "Auswahl aufheben";
const infoTitle = "Warum nicht filtern?";
const infoTexts = [
  "„Alle“ ist dein Gesamtüberblick: Hier stehen immer alle Projekte, mit einem Tipp erreichbar. Deshalb gibt es hier keine Filter.",
  "Archivierte Projekte zeigt „Alle“ nicht. Sie liegen hinter „Archiv (n)“ oben links über der Liste, dort siehst du auch, wie viele es sind. Das zählt nicht als Filter.",
  "Möchtest du eine Auswahl, lege eine eigene Ansicht an: Tippe auf „Neue Ansicht“. Sie beginnt als Kopie von „Alle“, und dort filterst und sortierst du, wie du es brauchst. „Alle“ bleibt unverändert.",
  "Ob neue Ansichten vor „Alle“ oder ganz rechts erscheinen, stellst du in den Einstellungen ein.",
];
const settingsLabel = "Einstellungen › Tabs";

/* Was in der Filter-Zeile steht: die Zahl der gefilterten Abschnitte */
function filterValue(view) {
  if (view.fixed) return notPossible;
  if (view.ids.length) return handpicked(view.ids.length);
  return projectFilterChips(view).length || noFilter;
}

/* Die Zeile „Layout“ und, im Board, darunter „Spalten nach“. */
function layoutRows(view) {
  const groups = taskGroupings.map((item) => ({ id: item.id, label: item.label }));
  const groupRow =
    view.layout === "board"
      ? `<div class="details-row tasks-group-row"><span class="details-row-label">${rowLabels.groupBy}</span>${panelSegment(groups, view.group, "group")}</div>`
      : "";
  return `
    <div class="details-row">
      <span class="details-row-label">${rowLabels.layout}</span>${panelSegment(layouts, view.layout, "layout")}
    </div>${groupRow}`;
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
      <button class="tasks-filter-btn" type="button" data-settings="filter"${locked ? " disabled" : ""}>
        <span class="details-row-label">${rowLabels.place}</span><span class="details-row-value">${escapeHtml(String(filterValue(view)))}</span>
      </button>
      ${view.fixed ? `<button class="tasks-info" type="button" data-settings="info" aria-label="${escapeHtml(rowLabels.info)}">${icon("info")}</button>` : ""}
    </div>`;
  if (view.fixed) return `<div class="details-list tasks-settings">${layoutRows(view)}${sortRow}${placeRow}</div>`;
  const pickCount = view.ids.length;
  return `
    <div class="details-list tasks-settings">
      ${layoutRows(view)}
      ${sortRow}
      ${placeRow}
      ${locked ? "" : filterChipsMarkup(projectFilterChips(view))}
      <div class="details-row${locked ? " is-muted" : ""}">
        <span class="details-row-label">${rowLabels.favorites}</span>${panelToggle("favorites", view.favoritesOnly, rowLabels.favorites, locked)}
      </div>
      <button class="details-row is-editable" type="button" data-settings="pick">
        <span class="details-row-label">${rowLabels.pick}</span><span class="details-row-value">${pickCount || noPick}</span>
      </button>
    </div>`;
}

/** Blatt „Sortieren“: wonach, darunter die Richtung. */
export function openProjectSort(view) {
  openSortSheet({
    options: projectSorts,
    sort: view.sort,
    asc: view.sortAsc,
    onChange: (sort, sortAsc) => updateProjectView({ sort, sortAsc }),
  });
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

/**
 * Das Filtern aus der Werkzeugzeile: dasselbe Blatt wie die Zeile „Filtern“ der Karte.
 * Bei handverlesenen Projekten ruhen die Filter — dann ist die Auswahl der Filter.
 * @param page Unterseite, die ein Chip der Karte gleich öffnen soll — sonst weggelassen
 */
export function openProjectFilter(view, page) {
  if (view.ids.length) openPickSheet();
  else openProjectFilterSheet(page);
}

/** Klicks in der Karte; `view` ist die gewählte Ansicht. */
export function handleProjectSettingsClick(event, view) {
  const button = event.target.closest("[data-settings]");
  if (!button || button.disabled) return;
  const setting = button.dataset.settings;
  if (setting === "layout") updateProjectView({ layout: button.dataset.value });
  else if (setting === "group") updateProjectView({ group: button.dataset.value });
  else if (setting === "sort") openProjectSort(view);
  else if (setting === "filter") openProjectFilter(view, button.dataset.value);
  else if (setting === "info") {
    openSheet(infoTitle, [
      ...infoTexts.map((label) => ({ note: true, label })),
      { label: settingsLabel, icon: "sliders", split: true, onSelect: openTabSettings },
    ]);
  }
  else if (setting === "favorites") updateProjectView({ favoritesOnly: !view.favoritesOnly });
  else if (setting === "pick") openPickSheet();
}
