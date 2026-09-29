/*
 * Der Inhalt der Karte „Ansicht konfigurieren“ auf der Aufgaben-Seite: die
 * Einstellungen der gewählten Ansicht. Kopf, Lage und Aus- und Einklappen
 * der Karte stehen in tasks-panel.js — hier nur die Zeilen:
 *
 * - Layout: Liste | Board
 * - Sortieren: Zeile mit der Wahl, ein Tipp öffnet das Blatt
 * - Filtern: Zeile mit dem Ort, ein Tipp öffnet das Blatt „Aufgaben von“ —
 *   bei „Alle“ gesperrt, der ⓘ daneben erklärt, wie man eine eigene Ansicht baut
 * - Gruppieren: Schalter; an, dann darunter „Spalten nach“ Dringlichkeit | Status
 * - Erledigte zeigen: Schalter
 * Pfad: src/features/tasks/tasks-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabels    -> Beschriftungen der Zeilen
 * allPlaces    -> was in der Filter-Zeile steht, solange kein Ort gewählt ist
 * infoTitle / infoText -> das Blatt hinter dem ⓘ
 * placeTitle / sortTitle -> Überschriften der beiden Blätter
 *
 * Aussehen: styles/tasks-settings.css (Schalter, Segmente) und
 * styles/entry-details.css (Karte, Zeilen).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { taskGroupings, taskSorts } from "../../data/config.js";
import { parentName, taskPlaces } from "../../data/queries.js";
import { updateTaskView } from "../../data/task-views.js";
import { openSheet } from "../../ui/sheet.js";

const rowLabels = {
  layout: "Layout",
  sort: "Sortieren",
  place: "Filtern",
  group: "Gruppieren",
  groupBy: "Spalten nach",
  done: "Erledigte zeigen",
  info: "Warum lässt sich „Alle“ nicht filtern?",
};
const allPlaces = "Alle Orte";
const inboxLabel = "Eingang";
const placeTitle = "Aufgaben von";
const sortTitle = "Sortieren";
const infoTitle = "Eigene Ansicht";
const infoText =
  "„Alle“ zeigt immer jede Aufgabe. Tippe auf das kleine Plus neben den Pillen: die neue Ansicht beginnt als Kopie von „Alle“ und lässt sich filtern, sortieren und gruppieren, wie du willst.";
const layouts = [
  { id: "list", label: "Liste", icon: "list" },
  { id: "board", label: "Board", icon: "board" },
];

/* Ein Segment aus zwei, drei Knöpfen; der gewählte ist gefüllt. */
function segment(items, current, setting) {
  return `<span class="tasks-seg">${items
    .map(
      (item) => `
        <button class="tasks-seg-btn${item.id === current ? " is-on" : ""}" type="button"
          data-settings="${setting}" data-value="${item.id}" aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}"
          aria-pressed="${item.id === current}">${item.icon ? icon(item.icon) : escapeHtml(item.label)}</button>`
    )
    .join("")}</span>`;
}

/* Ein Schalter, an oder aus. */
function toggle(setting, on, label) {
  return `<button class="tasks-switch${on ? " is-on" : ""}" type="button" role="switch" aria-checked="${on}"
    data-settings="${setting}" aria-label="${escapeHtml(label)}"><span class="tasks-switch-knob"></span></button>`;
}

/* Was in der Sortier-Zeile steht: „Erstellt ↑“. */
function sortValue(view) {
  const sort = taskSorts.find((item) => item.id === view.sort) || taskSorts[0];
  return `${sort.label} ${view.sortAsc ? "↑" : "↓"}`;
}

/* Was in der Filter-Zeile steht. */
function placeValue(view) {
  if (view.place === "alle") return allPlaces;
  if (view.place === "inbox") return inboxLabel;
  return parentName(view.place);
}

/**
 * Rechts in der Werkzeugzeile am Desktop: Segment Liste | Board und der
 * Filter nach Ort — dieselben Schalter wie in der Karte, also dieselben Klicks.
 */
export function deskToolsMarkup(view) {
  return `
    <span class="tasks-desk-tools">
      ${segment(layouts, view.layout, "layout")}
      <button class="tasks-desk-filter" type="button" data-settings="place"${view.fixed ? " disabled" : ""} title="${escapeHtml(rowLabels.place)}">
        ${icon("sliders")}<span>${escapeHtml(placeValue(view))}</span>
      </button>
    </span>`;
}

/** Die Zeilen der Karte für die gewählte Ansicht. */
export function taskSettingsMarkup(view) {
  const grouped = view.group !== "none";
  const groupItems = taskGroupings.map((item) => ({ id: item.id, label: item.label }));
  const groupBy = grouped ? view.group : taskGroupings[0].id;
  return `
      <div class="details-list tasks-settings">
        <div class="details-row">
          <span class="details-row-label">${rowLabels.layout}</span>${segment(layouts, view.layout, "layout")}
        </div>
        <button class="details-row is-editable" type="button" data-settings="sort">
          <span class="details-row-label">${rowLabels.sort}</span><span class="details-row-value">${escapeHtml(sortValue(view))}</span>
        </button>
        <div class="details-row tasks-filter-row${view.fixed ? " is-locked" : ""}">
          <button class="tasks-filter-btn" type="button" data-settings="place"${view.fixed ? " disabled" : ""}>
            <span class="details-row-label">${rowLabels.place}</span><span class="details-row-value">${escapeHtml(placeValue(view))}</span>
          </button>
          ${view.fixed ? `<button class="tasks-info" type="button" data-settings="info" aria-label="${escapeHtml(rowLabels.info)}">${icon("info")}</button>` : ""}
        </div>
        <div class="details-row">
          <span class="details-row-label">${rowLabels.group}</span>${toggle("group-toggle", grouped, rowLabels.group)}
        </div>
        ${
          grouped
            ? `<div class="details-row tasks-group-row"><span class="details-row-label">${rowLabels.groupBy}</span>${segment(groupItems, groupBy, "group")}</div>`
            : ""
        }
        <div class="details-row">
          <span class="details-row-label">${rowLabels.done}</span>${toggle("done", !view.hideDone, rowLabels.done)}
        </div>
      </div>
  `;
}

/* Blatt „Sortieren“: wonach, darunter die Richtung. Bleibt offen, bis man es zuzieht. */
function openSortSheet(view) {
  const options = taskSorts.map((item) => ({
    label: item.label,
    icon: item.icon,
    active: view.sort === item.id,
    onSelect: () => updateTaskView({ sort: item.id }),
  }));
  options.push({
    label: view.sortAsc ? "Aufsteigend" : "Absteigend",
    icon: view.sortAsc ? "arrow-up" : "arrow-down",
    onSelect: () => updateTaskView({ sortAsc: !view.sortAsc }),
  });
  openSheet(sortTitle, options);
}

/* Blatt „Aufgaben von“: alle Orte, an denen Aufgaben liegen oder verknüpft sind. */
function openPlaceSheet(view) {
  const option = (ref, label, iconName) => ({
    label,
    icon: iconName,
    active: view.place === ref,
    onSelect: () => updateTaskView({ place: ref }),
  });
  openSheet(placeTitle, [
    option("alle", allPlaces, "layers"),
    option("inbox", inboxLabel, "inbox"),
    ...taskPlaces().map((place) => option(place.ref, place.label, place.icon)),
  ]);
}

/** Klicks in der Karte. `view` ist die gewählte Ansicht. */
export function handleSettingsClick(event, view) {
  const button = event.target.closest("[data-settings]");
  if (!button) return;
  const { settings, value } = button.dataset;
  if (settings === "layout") updateTaskView({ layout: value });
  else if (settings === "sort") openSortSheet(view);
  else if (settings === "place") openPlaceSheet(view);
  else if (settings === "info") openSheet(infoTitle, [{ lead: true, label: infoText }]);
  else if (settings === "group-toggle") updateTaskView({ group: view.group === "none" ? taskGroupings[0].id : "none" });
  else if (settings === "group") updateTaskView({ group: value });
  else if (settings === "done") updateTaskView({ hideDone: !view.hideDone });
}
