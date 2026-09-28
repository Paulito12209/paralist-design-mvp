/*
 * Die Zeile unter dem Titel der Aufgaben-Seite — gebaut wie die Pillenzeile
 * auf der Seite eines Eintrags (src/ui/page-tools.js): links eine Pille,
 * rechts runde Knöpfe.
 *
 * - Die Pille sagt, wessen Aufgaben man sieht: „Alle“ oder ein Ort
 *   (Arbeitsbereich, Projekt, Notiz). Ein Tipp öffnet das Blatt zum Wählen.
 * - Sortieren: Erstellt, Fällig, Titel — und die Richtung.
 * - Der Umschalter Liste | Board, zwei Knöpfe, der gewählte ist gefüllt.
 * - Einstellungen: gruppieren (nicht, nach Dringlichkeit, nach Status) und
 *   Erledigte zeigen.
 * - Plus: das Eingabefeld unten geht als Aufgabe auf.
 * Die Wahl steht in state.prefs.tasks und überlebt das Neuladen.
 * Pfad: src/features/tasks/tasks-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * allLabel      -> Name der Pille, solange nicht nach Ort gefiltert wird
 * inboxLabel    -> Name des Eingangs im Blatt und in der Pille
 * placeTitle    -> Überschrift des Blatts zum Wählen des Orts
 * noGroupLabel  -> Menüpunkt, der die Gruppierung ausschaltet
 * doneLabel     -> Menüpunkt, der Erledigte ein- und ausblendet
 * dirLabels     -> Menüpunkt für die Sortierrichtung
 *
 * Was sich sortieren und gruppieren lässt, steht in src/data/config.js
 * (taskSorts, taskGroupings). Aussehen: styles/tasks.css und styles/entry.css.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { taskGroupings, taskSorts } from "../../data/config.js";
import { parentName, taskPlaces } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { pillsRowMarkup } from "../../ui/page-tools.js";
import { openSheet } from "../../ui/sheet.js";

const allLabel = "Alle";
const inboxLabel = "Eingang";
const placeTitle = "Aufgaben von";
const noGroupLabel = "Nicht gruppieren";
const doneLabel = "Erledigte zeigen";
const dirLabels = { asc: "Aufsteigend", desc: "Absteigend" };

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

/* Wie die Pille heißt: „Alle“, „Eingang“ oder der Name des Orts. */
function placeLabel() {
  const { place } = prefs();
  if (place === "alle") return allLabel;
  if (place === "inbox") return inboxLabel;
  return parentName(place);
}

/* Ein runder Knopf rechts — dieselbe Klasse wie neben den Pillen eines Eintrags. */
function tool(name, label, tool, extra = "") {
  return `<button class="page-tool${extra}" type="button" data-tasks-tool="${tool}" aria-label="${label}" title="${label}">${icon(name)}</button>`;
}

/** Die ganze Zeile: Pille mit dem Ort, rechts Sortieren, Liste | Board, Einstellungen, Plus. */
export function taskToolsMarkup() {
  const { view } = prefs();
  const pill = `
    <div class="tab-pills page-pills">
      <button class="tab-pill is-active task-place-pill" type="button" data-tasks-tool="place"
        aria-label="Aufgaben von: ${escapeHtml(placeLabel())}. Ort wählen">
        <span class="tab-pill-label">${escapeHtml(placeLabel())}</span>${icon("chevron", "task-place-chevron")}
      </button>
    </div>
  `;
  const tools =
    tool("sort", "Sortieren", "sort") +
    `<span class="task-view-seg">` +
    tool("list", "Als Liste", "view:list", view === "list" ? " is-on" : "") +
    tool("board", "Als Board", "view:board", view === "board" ? " is-on" : "") +
    `</span>` +
    tool("sliders", "Einstellungen", "options") +
    tool("plus", "Aufgabe hinzufügen", "add");
  return pillsRowMarkup(pill, tools);
}

/* Blatt „Aufgaben von“: Alle, Eingang, dann jeder Ort, an dem Aufgaben liegen. */
function openPlaceSheet(redraw) {
  const current = prefs().place;
  const option = (ref, label, iconName) => ({
    label,
    icon: iconName,
    active: current === ref,
    onSelect: () => choose({ place: ref }, redraw),
  });
  openSheet(placeTitle, [
    option("alle", allLabel, "layers"),
    option("inbox", inboxLabel, "inbox"),
    ...taskPlaces().map((place) => option(place.ref, place.label, place.icon)),
  ]);
}

/* Menü „Sortieren“: wonach, und darunter die Richtung. */
function openSortMenu(anchor, redraw) {
  const current = prefs();
  openCtxMenu(anchor, [
    ...taskSorts.map((item) => ({
      label: item.label,
      icon: item.icon,
      active: current.sort === item.id,
      onSelect: () => choose({ sort: item.id }, redraw),
    })),
    {
      label: current.sortAsc ? dirLabels.asc : dirLabels.desc,
      icon: current.sortAsc ? "arrow-up" : "arrow-down",
      onSelect: () => choose({ sortAsc: !current.sortAsc }, redraw),
    },
  ]);
}

/* Menü „Einstellungen“: Gruppierung und Erledigte. Im Board gibt es kein
   „nicht gruppieren“ — Spalten brauchen eine Gruppe. */
function openOptionsMenu(anchor, redraw) {
  const current = prefs();
  const board = current.view === "board";
  const groups = taskGroupings.map((item) => ({
    label: `Nach ${item.label}`,
    icon: item.icon,
    active: current.group === item.id || (board && current.group === "none" && item.id === taskGroupings[0].id),
    onSelect: () => choose({ group: item.id }, redraw),
  }));
  const none = { label: noGroupLabel, icon: "list", active: current.group === "none", onSelect: () => choose({ group: "none" }, redraw) };
  const done = {
    label: doneLabel,
    icon: "check-circle",
    active: !current.hideDone,
    onSelect: () => choose({ hideDone: !current.hideDone }, redraw),
  };
  openCtxMenu(anchor, [...(board ? [] : [none]), ...groups, done]);
}

/**
 * Klicks in der Zeile annehmen — ein Empfänger je Zeile, nicht je Knopf.
 * @param redraw zeichnet die Seite neu, sobald sich eine Wahl geändert hat.
 */
export function handleToolClick(event, redraw) {
  const button = event.target.closest("[data-tasks-tool]");
  if (!button) return;
  const action = button.dataset.tasksTool;
  if (action === "place") openPlaceSheet(redraw);
  else if (action === "sort") openSortMenu(button, redraw);
  else if (action === "options") openOptionsMenu(button, redraw);
  else if (action === "add") emit(events.createRequested, "aufgabe");
  else if (action.startsWith("view:")) choose({ view: action.slice(5) }, redraw);
}
