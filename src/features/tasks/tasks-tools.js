/*
 * Die Bedienelemente der Aufgaben-Seite. Rechts neben dem Titel steht der
 * runde Umschalter Liste ↔ Board; im Board fährt links daneben die Pille
 * „Gruppieren“ heraus, die als kleines Menü fragt, wonach die Spalten gebildet
 * werden (Dringlichkeit oder Status). Die getroffene Wahl steht in
 * state.prefs.tasks und überlebt das Neuladen.
 * Pfad: src/features/tasks/tasks-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pillLeaveMs    -> wie lange die Pille „Gruppieren“ zurück in den Umschalter
 *                   fährt, bevor die Liste erscheint (muss zu --task-pill-anim
 *                   in styles/tokens.css passen)
 *
 * Welche Einträge das Menü anbietet, steht in src/data/config.js
 * (taskGroupings).
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { taskGroupings } from "../../data/config.js";
import { saveState, state } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";

const pillLeaveMs = 240;

/* Wahr genau einmal nach dem Wechsel zum Board: dann fährt die Pille heraus.
   Bei jedem weiteren Neuzeichnen (Abhaken, Ziehen) bleibt sie einfach stehen. */
let pillEnters = false;

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
}
