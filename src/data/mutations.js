/*
 * Alles, was Daten wirklich ändert: anlegen, löschen, markieren, verschieben.
 * Jede Funktion speichert selbst und meldet die Änderung — danach zeichnen sich
 * alle sichtbaren Listen neu.
 * Pfad: src/data/mutations.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * orderGap -> Abstand der Sortiernummern, wenn eine Aufgabe im Board an den
 *             Anfang oder das Ende einer Spalte gezogen wird
 *
 * Keine anpassbaren visuellen Werte.
 */

import { pruneBlobs } from "../core/blobs.js";
import { emit, events } from "../core/bus.js";
import { nextId, sameId } from "../core/ids.js";
import {
  defaultTaskPriority,
  defaultTaskStatus,
  doneTaskStatus,
  isTaskDone,
  workspaceDefaultName,
} from "./config.js";
import { hasPlace, isContainer, tabWorkspaces, taskOrder } from "./queries.js";
import { entryRef, isEntryRef, refId, workspaceRef } from "./refs.js";
import { awardXp } from "./xp.js";
import { saveState, state, ui } from "./state.js";
import { pruneThumbs } from "./thumbs.js";

/* Nach jeder Änderung: speichern, Vorschaubilder aufräumen, Listen auffrischen. */
function commit({ prunedEntries = false } = {}) {
  saveState();
  if (prunedEntries) {
    pruneThumbs(state.entries);
    /* Die abgelegten Dateien gehören zu den Einträgen: fällt einer weg, ist
       seine Datei sonst für immer Ballast in der Browser-Datenbank. */
    pruneBlobs(state.entries.map((entry) => entry.id));
  }
  emit(events.dataChanged);
}

/*
 * Ein Ablageort verschwindet: er wird aus allen Einträgen gestrichen, und wer
 * dadurch heimatlos würde, bekommt die Orte in `targets` (leer = Inbox).
 * Was noch woanders liegt, bleibt einfach dort.
 */
function liftChildren(ref, targets = []) {
  state.entries.forEach((entry) => {
    if (!hasPlace(entry, ref)) return;
    entry.places = entry.places.filter((place) => place !== ref);
    if (!entry.places.length) entry.places = [...targets];
  });
}

/*
 * Vorgabename für den nächsten Arbeitsbereich im gewählten Tab:
 * „Arbeitsbereich“, dann „Arbeitsbereich 2“, „Arbeitsbereich 3“ …
 */
function nextWorkspacePlaceholder() {
  const taken = tabWorkspaces().filter((workspace) =>
    (workspace.name || workspace.placeholder || "").startsWith(workspaceDefaultName)
  ).length;
  return taken ? `${workspaceDefaultName} ${taken + 1}` : workspaceDefaultName;
}

/**
 * Neuen Arbeitsbereich im gerade gewählten Tab anlegen. Er beginnt ohne Namen
 * im Umbenennen-Feld; wer nichts tippt, bekommt den Vorgabenamen.
 */
export function addWorkspace() {
  const id = nextId(state.workspaces);
  const workspace = {
    id,
    name: "",
    placeholder: nextWorkspacePlaceholder(),
    tab: state.activeTabId,
    favorite: false,
    body: "",
    /* Punkte gibt es erst, wenn der Name steht */
    awarded: false,
  };
  state.workspaces.push(workspace);
  ui.editingWorkspaceId = id;
  saveState();
  emit(events.dataChanged);
  return workspace;
}

/** Den Namen eines Arbeitsbereichs übernehmen; leer heißt Vorgabename. */
export function nameWorkspace(workspace, typed) {
  workspace.name = String(typed || "").trim() || workspace.placeholder || workspaceDefaultName;
  delete workspace.placeholder;
  if (!workspace.awarded) {
    workspace.awarded = true;
    awardXp("created", "arbeitsbereich", workspace.name);
  }
  commit();
}

/**
 * Arbeitsbereich ins Archiv legen. Er verschwindet aus der Liste, seine
 * Einträge bleiben aber dort, wo sie liegen — anders als beim Löschen.
 */
export function archiveWorkspace(id) {
  const workspace = state.workspaces.find((item) => sameId(item.id, id));
  if (!workspace) return;
  workspace.archived = true;
  commit();
}

/** Aus dem Archiv zurückholen: Arbeitsbereich oder Eintrag steht wieder in seiner Liste. */
export function restoreFromArchive(item) {
  item.archived = false;
  commit();
}

/** Arbeitsbereich löschen; was nur hier lag, wandert in die Inbox. */
export function deleteWorkspace(id) {
  state.workspaces = state.workspaces.filter((workspace) => !sameId(workspace.id, id));
  liftChildren(workspaceRef(id));
  commit();
}

/** Neuen Tab anlegen und gleich zum Umbenennen öffnen. */
export function addTab() {
  const id = nextId(state.tabs);
  /* `awarded` fehlt noch: die Punkte gibt es erst, wenn der Name steht. */
  state.tabs.push({ id, name: "", placeholder: `Tab ${state.tabs.length + 1}` });
  state.activeTabId = id;
  ui.editingTabId = id;
  emit(events.dataChanged);
}

/** Tab löschen; seine Arbeitsbereiche verschwinden, deren Einträge wandern in die Inbox. */
export function deleteTab(id) {
  if (state.tabs.length < 2) return;
  state.workspaces
    .filter((workspace) => sameId(workspace.tab, id))
    .forEach((workspace) => liftChildren(workspaceRef(workspace.id)));
  state.workspaces = state.workspaces.filter((workspace) => !sameId(workspace.tab, id));
  state.tabs = state.tabs.filter((tab) => !sameId(tab.id, id));
  if (sameId(state.activeTabId, id)) state.activeTabId = state.tabs[0].id;
  commit();
}

/** Einen Eintrag oder Arbeitsbereich als Favorit markieren oder die Markierung wegnehmen. */
export function toggleFavorite(item) {
  item.favorite = !item.favorite;
  commit();
}

/** Alle Favoriten-Markierungen entfernen. */
export function clearFavorites() {
  state.workspaces.forEach((workspace) => {
    workspace.favorite = false;
  });
  state.entries.forEach((entry) => {
    entry.favorite = false;
  });
  commit();
}

/** Einen Eintrag endgültig löschen. Was in einem Projekt lag, übernimmt dessen Orte. */
export function deleteEntry(id) {
  const entry = state.entries.find((item) => sameId(item.id, id));
  if (!entry) return;
  if (isContainer(entry)) liftChildren(entryRef(entry.id), entry.places);
  state.entries = state.entries.filter((item) => !sameId(item.id, id));
  commit({ prunedEntries: true });
}

/**
 * Einen Ablageort leeren. Was NUR hier liegt, wird gelöscht; was auch woanders
 * liegt, wird hier nur ausgehängt und bleibt dort erhalten. Inhalte eines
 * gelöschten Projekts rücken in diesen Ort und bleiben.
 */
export function deleteEntriesOf(ref) {
  const here = state.entries.filter((entry) => hasPlace(entry, ref));
  const doomed = here.filter((entry) => (entry.places || []).length <= 1);
  here.forEach((entry) => {
    if (!doomed.includes(entry)) entry.places = entry.places.filter((place) => place !== ref);
  });
  doomed.forEach((entry) => {
    if (isContainer(entry)) liftChildren(entryRef(entry.id), ref ? [ref] : []);
  });
  const doomedIds = new Set(doomed.map((entry) => entry.id));
  state.entries = state.entries.filter((entry) => !doomedIds.has(entry.id));
  commit({ prunedEntries: true });
}

/** Darf der Eintrag an diesem Ort liegen? Kein Projekt in einem Projekt, nichts in sich selbst. */
function allowedPlace(entry, ref) {
  if (!isEntryRef(ref)) return true;
  return !isContainer(entry) && !sameId(refId(ref), entry.id);
}

/** Einen Ort hinzufügen oder wieder wegnehmen. */
export function togglePlace(entry, ref) {
  if (!allowedPlace(entry, ref)) return;
  const places = entry.places || [];
  entry.places = places.includes(ref) ? places.filter((place) => place !== ref) : [...places, ref];
  commit();
}

/** Alle Orte wegnehmen: der Eintrag liegt dann in der Inbox. */
export function clearPlaces(entry) {
  entry.places = [];
  commit();
}

/** Tab wechseln. */
export function selectTab(id) {
  state.activeTabId = Number(id);
  saveState();
  emit(events.dataChanged);
}

/* ---------- Aufgaben ---------- */

/*
 * Abstand zwischen zwei Sortiernummern, wenn eine Aufgabe an den Anfang oder
 * das Ende einer Spalte gezogen wird. Groß genug, dass sich danach noch oft
 * etwas dazwischenschieben lässt.
 */
const orderGap = 1000;

/**
 * Einem frisch angelegten Eintrag seine Aufgaben-Felder geben. Ruft das
 * Eingabefeld auf, sobald der Eintrag in der Liste steht. Eine neue Aufgabe
 * startet auf `defaultTaskStatus` und `defaultTaskPriority` (siehe config.js)
 * und stellt sich mit ihrer Sortiernummer nach oben.
 */
export function applyEntryDefaults(entry) {
  if (entry.type !== "aufgabe") return;
  entry.status = defaultTaskStatus;
  entry.priority = defaultTaskPriority;
  entry.order = -(entry.createdAt || Date.now());
  /* Kam die Aufgabe über den Knopf am Ende einer Board-Spalte, gehört sie dorthin. */
  const target = ui.taskDraftColumn;
  ui.taskDraftColumn = null;
  if (target && (target.field === "status" || target.field === "priority")) entry[target.field] = target.value;
}

/*
 * Wechselt eine Aufgabe auf „erledigt“, wird das wie beim Archivieren im
 * XP-Protokoll vermerkt (xpKinds.done). `doneAwarded` merkt sich, dass es die
 * Punkte schon gab — sonst brächte Ab- und wieder Anhaken beliebig viele.
 */
function noteDone(entry, wasDone) {
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

/**
 * Eine gezogene Aufgabe ablegen: sie bekommt den Wert der Zielspalte und eine
 * Sortiernummer zwischen ihren neuen Nachbarn. `before` und `after` sind die
 * Aufgaben darüber und darunter — fehlt eine, wird der Abstand angehängt.
 */
export function moveTask(entry, field, value, before, after) {
  const wasDone = isTaskDone(entry);
  entry[field] = value;
  noteDone(entry, wasDone);
  const top = before ? taskOrder(before) : null;
  const bottom = after ? taskOrder(after) : null;
  if (top !== null && bottom !== null) entry.order = (top + bottom) / 2;
  else if (top !== null) entry.order = top + orderGap;
  else if (bottom !== null) entry.order = bottom - orderGap;
  else entry.order = -(entry.createdAt || Date.now());
  saveState();
}
