/*
 * Die Daten des Boards der Projekte: welche Projekte in welcher Spalte
 * stehen und was passiert, wenn man eine Karte in eine andere Spalte zieht.
 * Das Board setzt auf visibleProjects(view) (src/data/project-views.js) auf —
 * alle Filter und die Sortierung der Ansicht gelten also auch dort. Die
 * Spalten kommen aus taskGroupings (src/data/config-tasks.js): Status oder
 * Dringlichkeit, wie bei den Aufgaben. Ein Projekt mit unbekanntem Wert (alter
 * Stand) steht dort, wo der Wert sonst auch hin„fällt“: bei Status in „Offen“,
 * bei Dringlichkeit in der Vorgabe.
 * Pfad: src/data/project-board.js
 *
 * Keine anpassbaren visuellen Werte. Welche Spalten es gibt, steht in
 * src/data/config-tasks.js (taskStatuses, taskPriorities, taskGroupings).
 */

import { manualId } from "./collection-sorts.js";
import { rowKey, saveManualOrder } from "./manual-order.js";
import { taskGroupings, taskPriorityOf, taskStatusOf } from "./config-tasks.js";
import { applyTaskStatus } from "./mutations-tasks.js";
import { activeProjectView, projectOrderScope, updateProjectView, visibleProjects } from "./project-views.js";

/* Die Gliederung der Ansicht; eine unbekannte Wahl fällt auf die erste zurück. */
function groupingOf(view) {
  return taskGroupings.find((item) => item.id === view.group) || taskGroupings[0];
}

/* Der Wert eines Projekts in dem Feld, nach dem die Spalten gebildet werden. */
function valueOf(project, field) {
  return field === "status" ? taskStatusOf(project.status).id : taskPriorityOf(project.priority).id;
}

/**
 * Die Spalten des Boards: { field, columns: [{ id, label, icon, color, items }] }.
 * `field` sagt, welches Feld ein Projekt beim Ablegen bekommt.
 */
export function projectColumns(view = activeProjectView()) {
  const grouping = groupingOf(view);
  const columns = grouping.columns.map((column) => ({ ...column, items: [] }));
  visibleProjects(view).forEach((project) => {
    const target = columns.find((column) => column.id === valueOf(project, grouping.field));
    (target || columns[0]).items.push(project);
  });
  return { field: grouping.field, columns };
}

/**
 * Eine gezogene Karte ablegen: sie bekommt den Wert der Zielspalte, und die
 * Reihenfolge, wie sie im Board zu sehen ist, wird als „Eigene Reihenfolge“
 * der Ansicht gemerkt — wie beim Verschieben einer Zeile in der Liste. Steht
 * die Ansicht schon auf „Eigene Reihenfolge“, aber umgekehrt, wird rückwärts
 * gemerkt, damit das Board danach so aussieht, wie man es gelassen hat.
 * @param entry  das gezogene Projekt
 * @param field  „status“ oder „priority“
 * @param value  der Wert der Zielspalte
 * @param shownIds die Ids aller Karten im Board von links nach rechts und oben nach unten
 */
export function dropProjectCard(entry, field, value, shownIds) {
  if (field === "status") applyTaskStatus(entry, value);
  else entry.priority = value;
  const view = activeProjectView();
  const keys = shownIds.map((id) => rowKey("e", id));
  const reversed = view.sort === manualId && !view.sortAsc;
  saveManualOrder(projectOrderScope(view.id), reversed ? [...keys].reverse() : keys);
  updateProjectView({ sort: manualId, sortAsc: !reversed }, view.id);
}
