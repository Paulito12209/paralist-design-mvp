/*
 * Die Bedienzeile über den Aufgaben: der Umschalter Liste ↔ Board und die drei
 * Pillen Gruppieren, Filtern und Sortieren. Jede Pille öffnet dasselbe
 * Auswahl-Blatt wie überall sonst; die getroffene Wahl steht in
 * state.prefs.tasks und überlebt das Neuladen.
 * Pfad: src/features/tasks/tasks-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * allPlacesLabel -> Beschriftung für „keine Einschränkung auf einen Ort“
 * hideDoneLabel  -> Beschriftung des Schalters für erledigte Aufgaben
 *
 * Welche Einträge die Blätter anbieten, steht in src/data/config.js
 * (taskGroupings, taskSorts, taskStatuses).
 */

import { icon } from "../../core/html.js";
import { taskGroupings, taskSorts, taskStatuses } from "../../data/config.js";
import { placeOptionsFor } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { openSheet } from "../../ui/sheet.js";

const allPlacesLabel = "Alle Orte";
const hideDoneLabel = "Erledigte ausblenden";

/* Die Vorgabe „alle“ steht in beiden Filtern für „nicht einschränken“. */
const anyValue = "alle";

/** Die gespeicherte Auswahl der Seite. */
function prefs() {
  return state.prefs.tasks;
}

/* Eine Wahl übernehmen, speichern und die Seite neu zeichnen lassen. */
function choose(changes, redraw) {
  Object.assign(prefs(), changes);
  saveState();
  redraw();
}

/** Wie viele Filter gerade etwas wegnehmen — die Zahl an der Filter-Pille. */
function activeFilterCount() {
  const tasks = prefs();
  return (
    (tasks.hideDone ? 1 : 0) + (tasks.status === anyValue ? 0 : 1) + (tasks.place === anyValue ? 0 : 1)
  );
}

/** Name des gewählten Ortes für das Filter-Blatt. */
function placeLabel() {
  const current = prefs().place;
  if (current === anyValue) return allPlacesLabel;
  const option = placeOptionsFor().find((item) => (item.ref === null ? "inbox" : item.ref) === current);
  return option ? option.label : allPlacesLabel;
}

/* Eine Pille der Bedienzeile. */
function pill(action, iconName, label, count = 0) {
  return `
    <button class="tab-pill task-pill" type="button" data-tasks-tool="${action}" aria-label="${label}">
      ${icon(iconName, "tab-pill-icon")}${label}${count ? `<span class="media-count">${count}</span>` : ""}
    </button>
  `;
}

/** Die ganze Bedienzeile als HTML. */
export function taskToolsMarkup() {
  const tasks = prefs();
  const board = tasks.view === "board";
  const group = taskGroupings.find((item) => item.id === tasks.group) || taskGroupings[0];
  const sort = taskSorts.find((item) => item.id === tasks.sort) || taskSorts[0];
  /* Gruppieren ordnet die Spalten des Boards — in der Liste gibt es keine. */
  const groupPill = board ? pill("group", group.icon, group.label) : "";
  return `
    <button class="tab-pill task-view-btn" type="button" data-tasks-tool="view"
      aria-label="${board ? "Zur Liste wechseln" : "Zum Board wechseln"}">
      ${icon(board ? "list" : "board", "tab-pill-icon")}
    </button>
    <div class="tab-pills task-pills">
      ${groupPill}
      ${pill("filter", "sliders", "Filtern", activeFilterCount())}
      ${pill("sort", "stairs", sort.label)}
    </div>
  `;
}

/* Blatt „Gruppieren“: wonach die Spalten des Boards gebildet werden. */
function openGroupSheet(redraw) {
  openSheet(
    "Gruppieren",
    taskGroupings.map((item) => ({
      label: item.label,
      icon: item.icon,
      active: item.id === prefs().group,
      onSelect: () => choose({ group: item.id }, redraw),
    }))
  );
}

/* Blatt „Sortieren“. */
function openSortSheet(redraw) {
  openSheet(
    "Sortieren",
    taskSorts.map((item) => ({
      label: item.label,
      icon: item.icon,
      active: item.id === prefs().sort,
      onSelect: () => choose({ sort: item.id }, redraw),
    }))
  );
}

/* Blatt „Ort“: Alle Orte, Inbox, jeder Arbeitsbereich und jedes Projekt. */
function openPlaceSheet(redraw) {
  const options = [
    { ref: anyValue, label: allPlacesLabel, icon: "layers" },
    ...placeOptionsFor().map((item) => ({ ...item, ref: item.ref === null ? "inbox" : item.ref })),
  ];
  openSheet(
    "Ort",
    options.map((option) => ({
      label: option.label,
      icon: option.icon,
      active: option.ref === prefs().place,
      onSelect: () => choose({ place: option.ref }, redraw),
    }))
  );
}

/* Blatt „Filtern“: Schalter für Erledigte, Status und der Weg zum Ort. */
function openFilterSheet(redraw) {
  const tasks = prefs();
  const statusOptions = [{ id: anyValue, label: "Alle Status", icon: "layers" }, ...taskStatuses];
  openSheet("Filtern", [
    {
      label: hideDoneLabel,
      icon: "check-circle",
      active: tasks.hideDone,
      onSelect: () => choose({ hideDone: !tasks.hideDone }, redraw),
    },
    ...statusOptions.map((status, index) => ({
      label: status.label,
      icon: status.icon,
      active: status.id === tasks.status,
      split: index === 0,
      onSelect: () => choose({ status: status.id }, redraw),
    })),
    {
      label: placeLabel(),
      icon: "folder",
      split: true,
      onSelect: () => openPlaceSheet(redraw),
    },
  ]);
}

/**
 * Klicks in der Bedienzeile annehmen. Ein Empfänger für die ganze Zeile.
 * @param redraw zeichnet die Seite neu, sobald sich eine Wahl geändert hat.
 */
export function handleToolClick(event, redraw) {
  const button = event.target.closest("[data-tasks-tool]");
  if (!button) return;
  const action = button.dataset.tasksTool;
  if (action === "view") {
    choose({ view: prefs().view === "board" ? "list" : "board" }, redraw);
    return;
  }
  if (action === "group") openGroupSheet(redraw);
  else if (action === "sort") openSortSheet(redraw);
  else if (action === "filter") openFilterSheet(redraw);
}
