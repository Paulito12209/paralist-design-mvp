/*
 * Die Bedienelemente der Aufgaben-Seite. Rechts neben dem Titel steht der
 * runde Umschalter Liste ↔ Board; im Board fährt links daneben die Pille
 * „Gruppieren“ heraus, die als kleines Menü fragt, wonach die Spalten gebildet
 * werden (Dringlichkeit oder Status). Darunter liegen die Pillen Filtern und
 * Sortieren, die das Auswahl-Blatt öffnen. Die getroffene Wahl steht in
 * state.prefs.tasks und überlebt das Neuladen.
 * Pfad: src/features/tasks/tasks-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * allPlacesLabel -> Beschriftung für „keine Einschränkung auf einen Ort“
 * hideDoneLabel  -> Beschriftung des Schalters für erledigte Aufgaben
 * pillLeaveMs    -> wie lange die Pille „Gruppieren“ zurück in den Umschalter
 *                   fährt, bevor die Liste erscheint (muss zu --task-pill-anim
 *                   in styles/tokens.css passen)
 *
 * Welche Einträge die Menüs anbieten, steht in src/data/config.js
 * (taskGroupings, taskSorts, taskStatuses).
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { taskGroupings, taskSorts, taskStatuses } from "../../data/config.js";
import { placeOptionsFor } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { openSheet } from "../../ui/sheet.js";

const allPlacesLabel = "Alle Orte";
const hideDoneLabel = "Erledigte ausblenden";
const pillLeaveMs = 240;

/* Wahr genau einmal nach dem Wechsel zum Board: dann fährt die Pille heraus.
   Bei jedem weiteren Neuzeichnen (Abhaken, Ziehen) bleibt sie einfach stehen. */
let pillEnters = false;

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

/* Eine Pille der Zeile unter dem Titel. */
function pill(action, iconName, label, count = 0) {
  return `
    <button class="tab-pill task-pill" type="button" data-tasks-tool="${action}" aria-label="${label}">
      ${icon(iconName, "tab-pill-icon")}${label}${count ? `<span class="media-count">${count}</span>` : ""}
    </button>
  `;
}

/** Was rechts neben dem Titel steht: im Board die Pille „Gruppieren“, immer der runde Umschalter. */
export function taskToolsMarkup() {
  const tasks = prefs();
  const board = tasks.view === "board";
  const group = taskGroupings.find((item) => item.id === tasks.group) || taskGroupings[0];
  const entering = pillEnters;
  pillEnters = false;
  /* Gruppieren ordnet die Spalten des Boards — in der Liste gibt es keine. */
  const groupPill = board
    ? `
      <button class="tab-pill task-group-pill${entering ? " is-entering" : ""}" type="button"
        data-tasks-tool="group" aria-label="Gruppieren nach ${group.label}">
        ${icon(group.icon, "tab-pill-icon")}${group.label}${icon("chevron", "task-group-chevron")}
      </button>
    `
    : "";
  return `
    ${groupPill}
    <button class="task-view-btn" type="button" data-tasks-tool="view"
      aria-label="${board ? "Zur Liste wechseln" : "Zum Board wechseln"}">
      ${icon(board ? "list" : "board", "task-view-icon")}
    </button>
  `;
}

/** Die Pillen Filtern und Sortieren unter dem Titel. */
export function taskPillsMarkup() {
  const sort = taskSorts.find((item) => item.id === prefs().sort) || taskSorts[0];
  return `
    ${pill("filter", "sliders", "Filtern", activeFilterCount())}
    ${pill("sort", "stairs", sort.label)}
  `;
}

/* Menü „Gruppieren“ direkt an der Pille: wonach die Spalten gebildet werden. */
function openGroupMenu(anchor, redraw) {
  openCtxMenu(
    anchor,
    taskGroupings.map((item) => ({
      label: item.label,
      icon: item.icon,
      active: item.id === prefs().group,
      onSelect: () => choose({ group: item.id }, redraw),
    }))
  );
}

/* Liste ↔ Board wechseln. Zum Board hin fährt die Pille beim Zeichnen heraus;
   zurück zur Liste fährt sie erst in den Umschalter, dann wird gezeichnet. */
function switchView(redraw) {
  if (prefs().view !== "board") {
    pillEnters = true;
    choose({ view: "board" }, redraw);
    return;
  }
  const pillEl = dom.tasksTools.querySelector(".task-group-pill");
  if (!pillEl || pillEl.classList.contains("is-leaving")) return;
  pillEl.classList.add("is-leaving");
  setTimeout(() => choose({ view: "list" }, redraw), pillLeaveMs);
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
 * Klicks auf die Bedienelemente annehmen — ein Empfänger je Behälter, nicht je Knopf.
 * @param redraw zeichnet die Seite neu, sobald sich eine Wahl geändert hat.
 */
export function handleToolClick(event, redraw) {
  const button = event.target.closest("[data-tasks-tool]");
  if (!button) return;
  const action = button.dataset.tasksTool;
  if (action === "view") switchView(redraw);
  else if (action === "group") openGroupMenu(button, redraw);
  else if (action === "sort") openSortSheet(redraw);
  else if (action === "filter") openFilterSheet(redraw);
}
