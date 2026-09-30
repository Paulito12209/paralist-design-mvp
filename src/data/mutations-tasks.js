/*
 * Was eine Aufgabe ändert: Status, Dringlichkeit, Ziehen im Board, Anlegen
 * direkt in der Liste — und die Vorgaben, die jeder frisch angelegte Eintrag
 * bekommt. Wie bei src/data/mutations.js speichert jede Funktion selbst und
 * meldet die Änderung.
 * Pfad: src/data/mutations-tasks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * orderGap -> Abstand der Sortiernummern, wenn eine Aufgabe im Board an den
 *             Anfang oder das Ende einer Spalte gezogen wird
 *
 * Keine anpassbaren visuellen Werte.
 */

import { BOOKMARK_TYPE, fillBookmarkEntry } from "./bookmarks.js";
import { typeIcon } from "./config.js";
import { archiveColumn, defaultTaskPriority, defaultTaskStatus, doneTaskStatus, isTaskDone } from "./config-tasks.js";
import { applyPageHead } from "./design-prefs.js";
import { commit } from "./mutations.js";
import { applyProjectDraft } from "./project-views.js";
import { taskOrder } from "./queries.js";
import { saveState, state, ui } from "./state.js";
import { noteDoneTime } from "./task-archive.js";
import { archiveEntry, awardXp } from "./xp.js";

/*
 * Abstand zwischen zwei Sortiernummern, wenn eine Aufgabe an den Anfang oder
 * das Ende einer Spalte gezogen wird. Groß genug, dass sich danach noch oft
 * etwas dazwischenschieben lässt.
 */
const orderGap = 1000;

/**
 * Einem frisch angelegten Eintrag seine Aufgaben-Felder geben (und einem
 * Lesezeichen seine Karte, wenn der Titel ein Link ist). Ruft das
 * Eingabefeld auf, sobald der Eintrag in der Liste steht. Eine neue Aufgabe
 * startet auf `defaultTaskStatus` und `defaultTaskPriority` (siehe config.js)
 * und stellt sich mit ihrer Sortiernummer ans Ende. Jeder neue Eintrag
 * beginnt mit Cover oder dem Icon seines Typs — je nach Einstellungen › Design.
 */
export function applyEntryDefaults(entry) {
  applyPageHead(entry, typeIcon(entry.type));
  /* Ein Link als Titel eines Lesezeichens wird gleich zur Karte im Inhalt */
  if (entry.type === BOOKMARK_TYPE) fillBookmarkEntry(entry);
  /* Ein Projekt aus „Projekt hinzufügen“ gehört in die Ansicht, aus der es kam */
  applyProjectDraft(entry);
  if (entry.type !== "aufgabe") return;
  entry.status = defaultTaskStatus;
  entry.priority = defaultTaskPriority;
  entry.order = entry.createdAt || Date.now();
  /* Kam die Aufgabe über den Knopf am Ende einer Board-Spalte, gehört sie dorthin. */
  const target = ui.taskDraftColumn;
  ui.taskDraftColumn = null;
  if (target && (target.field === "status" || target.field === "priority")) entry[target.field] = target.value;
}

/**
 * Eine Aufgabe direkt in der Liste anlegen — nur mit Titel, ohne Eingabefeld.
 * `column` ist die Gruppe, in die getippt wurde ({ field, value }), oder null
 * in der ungruppierten Liste; die Aufgabe landet mit deren Dringlichkeit bzw.
 * Status am Ende — hinter der letzten Aufgabe, die dort schon liegt.
 * Bringt dieselben Punkte wie das Anlegen über das Eingabefeld.
 */
export function createTaskInline(title, column) {
  const entry = {
    id: state.nextEntryId++,
    type: "aufgabe",
    title,
    body: "",
    places: [],
    links: [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  };
  applyEntryDefaults(entry);
  if (column && (column.field === "status" || column.field === "priority")) entry[column.field] = column.value;
  const siblings = state.entries.filter(
    (item) => item.type === "aufgabe" && !item.archived && (!column || item[column.field] === column.value)
  );
  const last = siblings.reduce((max, item) => Math.max(max, taskOrder(item)), -Infinity);
  if (last !== -Infinity) entry.order = last + orderGap;
  state.entries.push(entry);
  awardXp("created", "aufgabe", title);
  commit();
  return entry;
}

/*
 * Wechselt eine Aufgabe auf „erledigt“, wird das wie beim Archivieren im
 * XP-Protokoll vermerkt (xpKinds.done). `doneAwarded` merkt sich, dass es die
 * Punkte schon gab — sonst brächte Ab- und wieder Anhaken beliebig viele.
 */
function noteDone(entry, wasDone) {
  noteDoneTime(entry, wasDone);
  if (wasDone || !isTaskDone(entry) || entry.doneAwarded) return;
  entry.doneAwarded = true;
  awardXp("done", "aufgabe", entry.title);
}

/** Status einer Aufgabe setzen. */
export function setTaskStatus(entry, status) {
  if (entry.status === status) return;
  const wasDone = isTaskDone(entry);
  entry.status = status;
  noteDone(entry, wasDone);
  /* Wieder geöffnet heißt: sie gehört nicht mehr ins Archiv */
  if (entry.archived && !isTaskDone(entry)) entry.archived = false;
  commit();
}

/** Runder Haken-Knopf: erledigt setzen oder wieder auf den Vorgabe-Status zurück. */
export function toggleTaskDone(entry) {
  setTaskStatus(entry, isTaskDone(entry) ? defaultTaskStatus : doneTaskStatus);
}

/** Priorität einer Aufgabe setzen. */
export function setTaskPriority(entry, priority) {
  if (entry.priority === priority) return;
  entry.priority = priority;
  commit();
}

/*
 * Die Spalte „Archiviert“ ist kein Wert eines Feldes: Hineinziehen
 * archiviert, Herausziehen holt zurück und setzt den Wert der Zielspalte.
 * Zurückgeholtes Erledigtes gilt als heute erledigt — sonst räumte das
 * nächste Aufräumen es gleich wieder ins Archiv.
 */
function placeTask(entry, field, value) {
  if (value === archiveColumn.id) {
    if (!entry.archived) archiveEntry(entry);
    return;
  }
  const wasDone = isTaskDone(entry);
  const restored = entry.archived;
  entry.archived = false;
  entry[field] = value;
  noteDone(entry, wasDone);
  if (restored && isTaskDone(entry)) entry.doneAt = Date.now();
}

/**
 * Eine gezogene Aufgabe ablegen: sie bekommt den Wert der Zielspalte und eine
 * Sortiernummer zwischen ihren neuen Nachbarn. `before` und `after` sind die
 * Aufgaben darüber und darunter — fehlt eine, wird der Abstand angehängt.
 */
export function moveTask(entry, field, value, before, after) {
  placeTask(entry, field, value);
  const top = before ? taskOrder(before) : null;
  const bottom = after ? taskOrder(after) : null;
  if (top !== null && bottom !== null) entry.order = (top + bottom) / 2;
  else if (top !== null) entry.order = top + orderGap;
  else if (bottom !== null) entry.order = bottom - orderGap;
  else entry.order = entry.createdAt || Date.now();
  saveState();
}
