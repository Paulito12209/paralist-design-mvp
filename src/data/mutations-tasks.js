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
import {
  adoptStatusFields,
  archiveColumn,
  defaultTaskPriority,
  defaultTaskStatus,
  doneTaskStatus,
  isTaskDone,
} from "./config-tasks.js";
import { applyPageHead } from "./design-prefs.js";
import { commit } from "./mutations.js";
import { applyProjectDraft } from "./project-views.js";
import { dropReminder } from "./reminders.js";
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
 * Lesezeichen seine Karte, wenn der Titel ein Link ist). Termin, Projekt und
 * Dokument bekommen ihren Status, Termin und Projekt ihre Dringlichkeit
 * (adoptStatusFields in config-tasks.js). Ruft das
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
  /* Termin, Projekt und Dokument tragen Status (und Dringlichkeit) wie eine Aufgabe */
  adoptStatusFields(entry);
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

/**
 * Ein Projekt direkt in der Liste anlegen — nur mit Titel (Tipp in die freie
 * Fläche unter den Projekten, src/features/overview/project-inline.js).
 * `viewId` ist die gewählte Ansicht: das Projekt bekommt deren Ort bzw. landet
 * in ihrer Auswahl, genau wie über „Projekt hinzufügen“ (applyProjectDraft).
 * `column` ist die Spalte des Boards, in der getippt wurde ({ field, value }),
 * oder null in der Liste: das Projekt bekommt deren Status bzw. Dringlichkeit.
 */
export function createProjectInline(title, viewId, column = null) {
  const entry = {
    id: state.nextEntryId++,
    type: "projekt",
    title,
    body: "",
    places: [],
    links: [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
  };
  ui.projectDraftView = viewId;
  applyEntryDefaults(entry);
  if (column?.field === "status") applyTaskStatus(entry, column.value);
  else if (column?.field === "priority") entry.priority = column.value;
  state.entries.push(entry);
  awardXp("created", "projekt", title);
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
  /* Punkte gibt es nur fürs Abhaken einer Aufgabe — ein vergangener Termin
     oder ein abgeschlossenes Projekt zählt dort nicht (xpKinds.done). */
  if (entry.type !== "aufgabe") return;
  if (wasDone || !isTaskDone(entry) || entry.doneAwarded) return;
  entry.doneAwarded = true;
  awardXp("done", "aufgabe", entry.title);
}

/**
 * Status setzen, ohne zu speichern — für Sammel-Änderungen mehrerer Aufgaben
 * (src/data/mutations-bulk.js), die erst am Ende einmal speichern.
 * Gibt zurück, ob sich etwas geändert hat.
 */
export function applyTaskStatus(entry, status) {
  if (entry.status === status) return false;
  const wasDone = isTaskDone(entry);
  entry.status = status;
  noteDone(entry, wasDone);
  /* Erledigt braucht keine Erinnerung mehr — auch nicht nach dem Wieder-Öffnen */
  if (!wasDone && isTaskDone(entry)) dropReminder(entry);
  /* Wieder geöffnet heißt: sie gehört nicht mehr ins Archiv. Nur bei der
     Aufgabe — ein archiviertes Projekt bleibt, wo es ist. */
  if (entry.type === "aufgabe" && entry.archived && !isTaskDone(entry)) entry.archived = false;
  return true;
}

/** Status setzen — bei Aufgabe, Termin, Projekt und Dokument. */
export function setTaskStatus(entry, status) {
  if (applyTaskStatus(entry, status)) commit();
}

/** Runder Haken-Knopf: erledigt setzen oder wieder auf den Vorgabe-Status zurück. */
export function toggleTaskDone(entry) {
  setTaskStatus(entry, isTaskDone(entry) ? defaultTaskStatus : doneTaskStatus);
}

/** Dringlichkeit setzen — bei Aufgabe, Termin und Projekt. */
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

/**
 * Mehrere gewählte Aufgaben auf einmal ablegen (Stapel im Board): alle
 * bekommen den Wert der Zielspalte und stehen in der gegebenen Reihenfolge
 * zwischen `before` und `after` — gleichmäßig verteilt, damit sich danach
 * noch etwas dazwischenschieben lässt. Speichert einmal am Ende.
 */
export function moveTasks(entries, field, value, before, after) {
  entries.forEach((entry) => placeTask(entry, field, value));
  const top = before ? taskOrder(before) : null;
  const bottom = after ? taskOrder(after) : null;
  const count = entries.length;
  entries.forEach((entry, index) => {
    const step = index + 1;
    if (top !== null && bottom !== null) entry.order = top + ((bottom - top) * step) / (count + 1);
    else if (top !== null) entry.order = top + orderGap * step;
    else if (bottom !== null) entry.order = bottom - orderGap * (count + 1 - step);
    else entry.order = Date.now() + step;
  });
  saveState();
}
