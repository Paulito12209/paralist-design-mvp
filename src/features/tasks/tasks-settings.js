/*
 * Der Inhalt der Karte „Ansicht“ auf der Aufgaben-Seite: die
 * Einstellungen der gewählten Ansicht. Kopf, Lage und Aus- und Einklappen
 * der Karte stehen in src/ui/view-panel.js — hier nur die Zeilen:
 *
 * - Layout: Liste | Board
 * - Sortieren: Zeile mit der Wahl, ein Tipp öffnet das Blatt
 * - Filtern: rechts „Keine“; ist etwas gefiltert, bleibt rechts nichts
 *   stehen und die gewählten Werte stehen darunter als Chips. Ein Tipp auf Zeile oder
 *   Chips öffnet das Blatt „Filtern“ (src/features/tasks/tasks-filter.js).
 *   Auch „Alle“ lässt sich filtern, nur nicht nach Ort
 * - Gruppieren: Schalter; an, dann darunter „Abschnitte nach“ Status | Dringlichkeit.
 *   Im Board gibt es keinen Schalter — ein Board hat immer Spalten —, dort
 *   steht nur „Spalten nach“
 * - Erledigte zeigen: Schalter
 * Pfad: src/features/tasks/tasks-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabels    -> Beschriftungen der Zeilen („groupBy“ je Layout: Liste hat Abschnitte, Board Spalten)
 * noFilter     -> was rechts in der Zeile „Filtern“ steht, solange nichts gefiltert ist
 * deskFiltered -> Aufschrift des Filter-Knopfs am Desktop, wenn etwas gefiltert ist
 *
 * Was in der Filter-Zeile steht und was das Blatt „Filtern“ anbietet, steht
 * in src/features/tasks/tasks-filter.js.
 *
 * Aussehen: styles/tasks-settings.css (Schalter, Segmente) und
 * styles/entry-details.css (Karte, Zeilen).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { panelSegment as segment, panelToggle as toggle } from "../../ui/panel-rows.js";
import { taskGroupings, taskSorts } from "../../data/config-tasks.js";
import { updateTaskView } from "../../data/task-views.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";
import { filterChips, openTaskFilter } from "./tasks-filter.js";

const rowLabels = {
  layout: "Layout",
  sort: "Sortieren",
  place: "Filtern",
  group: "Gruppieren",
  groupBy: { list: "Abschnitte nach", board: "Spalten nach" },
  done: "Erledigte zeigen",
};
const noFilter = "Keine";
const deskFiltered = "Gefiltert";

/* Die Chips unter der Zeile „Filtern“ — in der Farbe ihres Status bzw. ihrer Dringlichkeit */
function chipsMarkup(chips) {
  if (!chips.length) return "";
  const chip = (item) =>
    `<span class="tasks-filter-chip"${item.color ? ` style="--chip-color:${item.color}"` : ""}>${icon(item.icon)}<span>${escapeHtml(item.label)}</span></span>`;
  return `<button class="tasks-filter-chips" type="button" data-settings="filter" aria-label="${escapeHtml(rowLabels.place)}">${chips.map(chip).join("")}</button>`;
}
const layouts = [
  { id: "list", label: "Liste", icon: "list" },
  { id: "board", label: "Board", icon: "board" },
];

/* Was in der Sortier-Zeile steht: „Erstellt · Älteste zuerst“. */
function sortValue(view) {
  return sortSummary(taskSorts, view.sort, view.sortAsc);
}

/**
 * Rechts in der Werkzeugzeile am Desktop: Segment Liste | Board und der
 * Filter — dieselben Schalter wie in der Karte, also dieselben Klicks.
 */
export function deskToolsMarkup(view) {
  return `
    <span class="tasks-desk-tools">
      ${segment(layouts, view.layout, "layout")}
      <button class="tasks-desk-filter" type="button" data-settings="filter" title="${escapeHtml(rowLabels.place)}">
        ${icon("sliders")}<span>${escapeHtml(deskFilterLabel(view))}</span>
      </button>
    </span>`;
}

/* Am Desktop: „Filtern“ oder „Gefiltert“ */
function deskFilterLabel(view) {
  return filterChips(view).length ? deskFiltered : rowLabels.place;
}

/** Die Zeilen der Karte für die gewählte Ansicht. */
export function taskSettingsMarkup(view) {
  const board = view.layout === "board";
  /* Das Board ist immer gruppiert (src/data/queries.js, taskColumns) — der Schalter gilt nur der Liste */
  const grouped = board || view.group !== "none";
  const groupItems = taskGroupings.map((item) => ({ id: item.id, label: item.label }));
  const groupBy = view.group !== "none" ? view.group : taskGroupings[0].id;
  const groupByLabel = board ? rowLabels.groupBy.board : rowLabels.groupBy.list;
  const chips = filterChips(view);
  return `
      <div class="details-list tasks-settings">
        <div class="details-row">
          <span class="details-row-label">${rowLabels.layout}</span>${segment(layouts, view.layout, "layout")}
        </div>
        <button class="details-row is-editable" type="button" data-settings="sort">
          <span class="details-row-label">${rowLabels.sort}</span><span class="details-row-value">${escapeHtml(sortValue(view))}</span>
        </button>
        <button class="details-row is-editable" type="button" data-settings="filter">
          <span class="details-row-label">${rowLabels.place}</span><span class="details-row-value">${chips.length ? "" : noFilter}</span>
        </button>
        ${chipsMarkup(chips)}
        ${
          board
            ? ""
            : `<div class="details-row"><span class="details-row-label">${rowLabels.group}</span>${toggle("group-toggle", grouped, rowLabels.group)}</div>`
        }
        ${
          grouped
            ? `<div class="details-row tasks-group-row"><span class="details-row-label">${groupByLabel}</span>${segment(groupItems, groupBy, "group")}</div>`
            : ""
        }
        <div class="details-row">
          <span class="details-row-label">${rowLabels.done}</span>${toggle("done", !view.hideDone, rowLabels.done)}
        </div>
      </div>
  `;
}

/* Blatt „Sortieren“: wonach, darunter die Richtung (src/ui/sort-sheet.js). */
function openTaskSort(view) {
  openSortSheet({
    options: taskSorts,
    sort: view.sort,
    asc: view.sortAsc,
    onChange: (sort, sortAsc) => updateTaskView({ sort, sortAsc }),
  });
}

/** Klicks in der Karte. `view` ist die gewählte Ansicht. */
export function handleSettingsClick(event, view) {
  const button = event.target.closest("[data-settings]");
  if (!button) return;
  const { settings, value } = button.dataset;
  if (settings === "layout") updateTaskView({ layout: value });
  else if (settings === "sort") openTaskSort(view);
  else if (settings === "filter") openTaskFilter();
  else if (settings === "group-toggle") updateTaskView({ group: view.group === "none" ? taskGroupings[0].id : "none" });
  else if (settings === "group") updateTaskView({ group: value });
  else if (settings === "done") updateTaskView({ hideDone: !view.hideDone });
}
