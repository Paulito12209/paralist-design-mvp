/*
 * Reihenfolge und Sichtbarkeit der Spalten eines Boards (Aufgaben und
 * Projekte), je Ansicht gemerkt. Eingestellt wird im Blatt „Spalten“, das
 * sich beim Halten eines Spaltenkopfs öffnet (src/ui/columns-sheet.js).
 *
 * Eine Ansicht trägt dazu `boardColumns`, je Gliederung ein eigener Stand:
 *   { status:   { order: ["inArbeit", "offen", …], hidden: ["erledigt"] },
 *     priority: { order: […], hidden: […] } }
 * Fehlt ein Stand, gilt die Reihenfolge aus src/data/config-tasks.js, und
 * alles ist zu sehen — außer „Archiviert“ bei den Aufgaben: die Spalte ist
 * kein Status, sondern der Ort für Archiviertes, und steht anfangs
 * ausgeblendet (es sei denn, der Filter holt Archiviertes ohnehin her).
 * Pfad: src/data/board-columns.js
 *
 * Keine anpassbaren visuellen Werte. Welche Spalten es gibt, steht in
 * src/data/config-tasks.js (taskGroupings, archiveColumn).
 */

import { archiveColumn, taskGroupings } from "./config-tasks.js";
import { taskGroups } from "./queries.js";

const fields = taskGroupings.map((item) => item.field);

/* Die Gliederung zu einem Feld („status“ oder „priority“). */
const groupingOf = (field) => taskGroupings.find((item) => item.field === field) || taskGroupings[0];

/**
 * Alle Spalten, die es zu einem Feld geben kann, in der Grundreihenfolge.
 * `withArchive`: bei den Aufgaben kommt nach Status „Archiviert“ dazu.
 */
export function allBoardColumns(field, withArchive) {
  const columns = groupingOf(field).columns;
  return withArchive && field === "status" ? [...columns, archiveColumn] : columns;
}

/* Nur bekannte, einmalige Ids behalten. */
function knownIds(value, ids) {
  return Array.isArray(value) ? [...new Set(value)].filter((id) => ids.includes(id)) : [];
}

/** Beim Laden: unbekannte Felder und Ids fallen weg, ein fehlender Stand bleibt fehlend. */
export function cleanBoardColumns(value, withArchive) {
  if (!value || typeof value !== "object") return {};
  const clean = {};
  fields.forEach((field) => {
    const saved = value[field];
    if (!saved || typeof saved !== "object") return;
    const ids = allBoardColumns(field, withArchive).map((column) => column.id);
    clean[field] = { order: knownIds(saved.order, ids), hidden: knownIds(saved.hidden, ids) };
  });
  return clean;
}

/**
 * Der gültige Stand einer Ansicht für ein Feld: `order` nennt immer alle
 * Spalten (neue hängen hinten an), `hidden` die ausgeblendeten.
 */
export function columnLayout(view, field, withArchive) {
  const ids = allBoardColumns(field, withArchive).map((column) => column.id);
  const saved = view.boardColumns?.[field];
  const order = [...knownIds(saved?.order, ids), ...ids.filter((id) => !(saved?.order || []).includes(id))];
  if (saved) return { order, hidden: knownIds(saved.hidden, ids) };
  const archiveHidden = withArchive && field === "status" && !view.showArchived;
  return { order, hidden: archiveHidden ? [archiveColumn.id] : [] };
}

/** Die Spalten des Boards in der gemerkten Reihenfolge, ohne die ausgeblendeten. */
export function arrangeColumns(columns, layout) {
  return layout.order
    .map((id) => columns.find((column) => column.id === id))
    .filter((column) => column && !layout.hidden.includes(column.id));
}

/** Die Änderung für updateTaskView / updateProjectView: nur das eine Feld bekommt den neuen Stand. */
export function layoutChange(view, field, layout) {
  return { boardColumns: { ...view.boardColumns, [field]: { order: [...layout.order], hidden: [...layout.hidden] } } };
}

/**
 * Die Spalten des Aufgaben-Boards: wie taskGroups (src/data/queries.js) — ein
 * Board braucht immer Spalten, ungruppiert also nach der ersten Gliederung —,
 * dazu Reihenfolge und Sichtbarkeit der Ansicht. Ist „Archiviert“ zu sehen,
 * kommen die archivierten Aufgaben mit aufs Board.
 */
export function boardTaskColumns(prefs) {
  const grouping = taskGroupings.find((item) => item.id === prefs.group) || taskGroupings[0];
  const layout = columnLayout(prefs, grouping.field, true);
  const showArchived = grouping.field === "status" ? !layout.hidden.includes(archiveColumn.id) : prefs.showArchived;
  const { field, columns } = taskGroups({ ...prefs, group: grouping.id, showArchived });
  return { field, columns: arrangeColumns(columns, layout) };
}

/** Das Feld, nach dem das Aufgaben-Board einer Ansicht gerade Spalten bildet. */
export function taskBoardField(prefs) {
  return (taskGroupings.find((item) => item.id === prefs.group) || taskGroupings[0]).field;
}
