/*
 * Das eine Bedienelement der Aufgaben-Seite: unter dem Titel steht links eine
 * Pille, die sagt, wie die Seite gerade aussieht („Liste“ oder „Board“). Ein
 * Tipp darauf öffnet das kleine Menü mit allem, was sich einstellen lässt:
 * Liste oder Board, Gliederung nach Dringlichkeit oder Status, Erledigte
 * zeigen. Die Wahl steht in state.prefs.tasks und überlebt das Neuladen.
 * Der Titel selbst bleibt allein in seiner Zeile — wie auf jeder Seite.
 * Pfad: src/features/tasks/tasks-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * viewLabels  -> wie die beiden Ansichten in Pille und Menü heißen
 * doneLabel   -> Beschriftung des Menüpunkts, der Erledigte ein- und ausblendet
 *
 * Welche Gliederungen das Menü anbietet, steht in src/data/config.js
 * (taskGroupings). Aussehen der Pille: styles/tasks.css.
 */

import { icon } from "../../core/html.js";
import { taskGroupings } from "../../data/config.js";
import { saveState, state } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";

const viewLabels = {
  list: { label: "Liste", icon: "list" },
  board: { label: "Board", icon: "board" },
};
const doneLabel = "Erledigte zeigen";

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

/** Die Pille unter dem Titel: Icon und Name der Ansicht, dahinter der Menü-Pfeil. */
export function taskToolsMarkup() {
  const view = viewLabels[prefs().view] || viewLabels.list;
  return `
    <button class="tab-pill task-view-pill" type="button" data-tasks-tool="menu"
      aria-label="Ansicht: ${view.label}. Ansicht und Gliederung ändern">
      ${icon(view.icon, "tab-pill-icon")}${view.label}${icon("chevron", "task-view-chevron")}
    </button>
  `;
}

/*
 * Das Menü an der Pille. Drei Gruppen untereinander: die Ansicht, die
 * Gliederung, der Schalter für Erledigte. Der Haken vorn zeigt in jeder
 * Gruppe die gültige Wahl — ein Menü statt dreier Bedienelemente.
 */
function openToolsMenu(anchor, redraw) {
  const current = prefs();
  const views = Object.entries(viewLabels).map(([id, view]) => ({
    label: view.label,
    icon: view.icon,
    active: current.view === id,
    onSelect: () => choose({ view: id }, redraw),
  }));
  const groups = taskGroupings.map((item) => ({
    label: `Nach ${item.label}`,
    icon: item.icon,
    active: current.group === item.id,
    onSelect: () => choose({ group: item.id }, redraw),
  }));
  const done = {
    label: doneLabel,
    icon: "check-circle",
    active: !current.hideDone,
    onSelect: () => choose({ hideDone: !current.hideDone }, redraw),
  };
  openCtxMenu(anchor, [...views, ...groups, done]);
}

/**
 * Klicks auf die Pille annehmen.
 * @param redraw zeichnet die Seite neu, sobald sich eine Wahl geändert hat.
 */
export function handleToolClick(event, redraw) {
  const button = event.target.closest("[data-tasks-tool]");
  if (button) openToolsMenu(button, redraw);
}
