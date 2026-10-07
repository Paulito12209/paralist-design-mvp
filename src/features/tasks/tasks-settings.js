/*
 * Der Inhalt der Karte „Ansicht“ auf der Aufgaben-Seite: die
 * Einstellungen der gewählten Ansicht. Kopf, Lage und Aus- und Einklappen
 * der Karte stehen in src/ui/view-panel.js — hier nur die Zeilen:
 *
 * - Layout: Liste | Board
 * - Sortieren: Zeile mit der Wahl, ein Tipp öffnet das Blatt
 * - Filtern: rechts „Keine“ oder die Zahl der gefilterten Abschnitte; darunter
 *   je Abschnitt ein Chip — der Ort mit Namen, Status und Dringlichkeit mit
 *   der Zahl ihrer Haken, bei „ist nicht“ mit „nicht | 1“. Ein Tipp auf die
 *   Zeile öffnet das Blatt „Filtern“ (src/features/tasks/tasks-filter.js),
 *   ein Tipp auf einen Chip gleich dessen Unterseite.
 *   „Alle“ lässt sich nicht filtern: die Zeile sagt „Nicht möglich“, der ⓘ daneben
 *   erklärt, dass man dafür eine eigene Ansicht anlegt, und führt in Einstellungen › Tabs
 * - Gruppieren: Schalter; an, dann darunter „Abschnitte nach“ Status | Dringlichkeit.
 *   Im Board gibt es keinen Schalter — ein Board hat immer Spalten —, dort
 *   steht nur „Spalten nach“
 * - Erledigte zeigen: Schalter mit ⓘ davor; das Blatt dahinter erklärt, dass
 *   Erledigtes bei „aus“ sofort im Archiv liegt (src/data/task-hide-done.js)
 * Pfad: src/features/tasks/tasks-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabels    -> Beschriftungen der Zeilen („groupBy“ je Layout: Liste hat Abschnitte, Board Spalten)
 * noFilter     -> was rechts in der Zeile „Filtern“ steht, solange nichts gefiltert ist
 * notPossible  -> was sie bei „Alle“ sagt, das sich nicht filtern lässt
 * filterInfoTitle / filterInfoTexts -> das Blatt hinter dem ⓘ an „Filtern“: warum „Alle“ nicht filtert
 * settingsLabel -> die Zeile im Blatt, die in Einstellungen › Tabs springt
 * deskFiltered -> Aufschrift des Filter-Knopfs am Desktop, wenn etwas gefiltert ist
 * archivePill  -> welche Pille das Archiv beim Tipp auf „Archiv (n)“ zeigt
 * doneInfoTitle / doneInfoTexts -> das Blatt hinter dem ⓘ an „Erledigte zeigen“
 *
 * Was in der Filter-Zeile steht und was das Blatt „Filtern“ anbietet, steht
 * in src/features/tasks/tasks-filter.js.
 *
 * Aussehen: styles/tasks-settings.css (Schalter, Segmente) und
 * styles/entry-details.css (Karte, Zeilen).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { archivedForView } from "../../data/archive-context.js";
import { panelSegment as segment, panelToggle as toggle } from "../../ui/panel-rows.js";
import { tabsRowMarkup } from "../../ui/tabs-visibility.js";
import { isTaskDone, taskGroupings, taskSorts } from "../../data/config-tasks.js";
import { visibleTasks } from "../../data/queries.js";
import { updateTaskView } from "../../data/task-views.js";
import { filterChipsMarkup as chipsMarkup } from "../../ui/filter-chips.js";
import { handleListHeadClick, listHeadMarkup } from "../../ui/list-head.js";
import { openSheet } from "../../ui/sheet.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";
import { openTabSettings } from "../../ui/settings-link.js";
import { openViewPanel } from "../../ui/view-panel.js";
import { filterChips, openTaskFilter } from "./tasks-filter.js";

const rowLabels = {
  layout: "Layout",
  sort: "Sortieren",
  place: "Filtern",
  group: "Gruppieren",
  groupBy: { list: "Abschnitte nach", board: "Spalten nach" },
  done: "Erledigte zeigen",
  doneInfo: "Was bedeutet „Erledigte zeigen“?",
  filterInfo: "Warum lässt sich „Alle“ nicht filtern?",
};
const doneInfoTitle = "Erledigte zeigen";
const doneInfoTexts = [
  "An (Standard): Abgehakte Aufgaben bleiben in dieser Ansicht stehen, mit grünem Haken und durchgestrichen. Ab Mitternacht liegen sie im Archiv.",
  "Aus: Abgehakte Aufgaben verschwinden in dieser Ansicht sofort und liegen direkt hinter „Archiv (n)“ — dort siehst du sie weiterhin als erledigt.",
  "Jede Ansicht hat ihre eigene Einstellung: In der einen kannst du Erledigtes sehen, in der anderen nicht.",
];
const noFilter = "Keine";
const notPossible = "Nicht möglich";
const filterInfoTitle = "Warum nicht filtern?";
const filterInfoTexts = [
  "„Alle“ ist dein Gesamtüberblick: Hier stehen immer alle Aufgaben. Deshalb gibt es hier keine Filter.",
  "Möchtest du eine Auswahl, zum Beispiel nur offene oder dringende Aufgaben, lege eine eigene Ansicht an: Tippe auf „Neue Ansicht“. Sie beginnt als Kopie von „Alle“, und dort filterst und sortierst du, wie du es brauchst. „Alle“ bleibt unverändert.",
  "Ob neue Ansichten vor „Alle“ oder ganz rechts erscheinen, stellst du in den Einstellungen ein.",
];
const settingsLabel = "Einstellungen › Tabs";
const archivePill = "aufgabe";
const deskFiltered = "Gefiltert";

const layouts = [
  { id: "list", label: "Liste", icon: "list" },
  { id: "board", label: "Kanban", icon: "board" },
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
      ${
        view.fixed
          ? ""
          : `<button class="tasks-desk-filter" type="button" data-settings="filter" title="${escapeHtml(rowLabels.place)}">
        ${icon("sliders")}<span>${escapeHtml(deskFilterLabel(view))}</span>
      </button>`
      }
    </span>`;
}

/* Am Desktop: „Filtern“ oder „Gefiltert“ */
function deskFilterLabel(view) {
  return filterChips(view).length ? deskFiltered : rowLabels.place;
}

/* Die Zeile „Filtern“; bei „Alle“ gesperrt, mit ⓘ, das erklärt, warum (wie bei den Projekten) */
function filterRowMarkup(view, chips) {
  if (!view.fixed) {
    return `
        <button class="details-row is-editable" type="button" data-settings="filter">
          <span class="details-row-label">${rowLabels.place}</span><span class="details-row-value">${chips.length || noFilter}</span>
        </button>`;
  }
  return `
        <div class="details-row tasks-filter-row is-locked">
          <button class="tasks-filter-btn" type="button" data-settings="filter" disabled>
            <span class="details-row-label">${rowLabels.place}</span><span class="details-row-value">${notPossible}</span>
          </button>
          <button class="tasks-info" type="button" data-settings="filter-info" aria-label="${escapeHtml(rowLabels.filterInfo)}">${icon("info")}</button>
        </div>`;
}

/** Die Zeilen der Karte für die gewählte Ansicht. */
export function taskSettingsMarkup(view) {
  const board = view.layout === "board";
  /* Das Board ist immer gruppiert (src/data/board-columns.js, boardTaskColumns) — der Schalter gilt nur der Liste */
  const grouped = board || view.group !== "none";
  const groupItems = taskGroupings.map((item) => ({ id: item.id, label: item.label }));
  const groupBy = view.group !== "none" ? view.group : taskGroupings[0].id;
  const groupByLabel = board ? rowLabels.groupBy.board : rowLabels.groupBy.list;
  const chips = filterChips(view);
  return `
      <div class="details-list tasks-settings">
        ${tabsRowMarkup()}
        <div class="details-row">
          <span class="details-row-label">${rowLabels.layout}</span>${segment(layouts, view.layout, "layout")}
        </div>
        <button class="details-row is-editable" type="button" data-settings="sort">
          <span class="details-row-label">${rowLabels.sort}</span><span class="details-row-value">${escapeHtml(sortValue(view))}</span>
        </button>
        ${filterRowMarkup(view, chips)}
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
          <span class="details-row-label">${rowLabels.done}</span>
          <button class="tasks-info is-inline" type="button" data-settings="done-info" aria-label="${escapeHtml(rowLabels.doneInfo)}">${icon("info")}</button>
          ${toggle("done", !view.hideDone, rowLabels.done)}
        </div>
      </div>
  `;
}

/* Die aktiven Aufgaben der Ansicht: was Liste oder Board zeigen, ohne die Spalte „Archiviert“. */
function activeTaskCount(view) {
  return visibleTasks(view).filter((entry) => !entry.archived && !(view.showArchived && view.hideDone && isTaskDone(entry))).length;
}

/** Die Werkzeugzeile über der Liste (nur in der Android-Fassung zu sehen). */
export function taskHeadMarkup(view) {
  return listHeadMarkup({
    archive: { pill: archivePill, count: archivedForView("tasks").length, entries: activeTaskCount(view) },
    filter: !view.fixed,
    filtering: filterChips(view).length > 0,
  });
}

/** Klicks auf Sortieren, Filtern und Ansicht in der Werkzeugzeile; „Archiv (n)“ erledigt src/ui/list-clicks.js. */
export function handleTaskHeadClick(event, view) {
  return handleListHeadClick(event, { sort: () => openTaskSort(view), filter: () => openTaskFilter(), view: openViewPanel });
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
  if (!button || button.disabled) return;
  const { settings, value } = button.dataset;
  if (settings === "layout") updateTaskView({ layout: value });
  else if (settings === "sort") openTaskSort(view);
  else if (settings === "filter") openTaskFilter(value);
  else if (settings === "group-toggle") updateTaskView({ group: view.group === "none" ? taskGroupings[0].id : "none" });
  else if (settings === "group") updateTaskView({ group: value });
  else if (settings === "filter-info") {
    openSheet(filterInfoTitle, [
      ...filterInfoTexts.map((label) => ({ note: true, label })),
      { label: settingsLabel, icon: "sliders", split: true, onSelect: openTabSettings },
    ]);
  }
  else if (settings === "done-info") openSheet(doneInfoTitle, doneInfoTexts.map((label) => ({ note: true, label })));
  else if (settings === "done") updateTaskView({ hideDone: !view.hideDone });
}
