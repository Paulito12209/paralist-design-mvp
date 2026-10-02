/*
 * Alles, was Daten wirklich ändert: anlegen, löschen, markieren, verschieben.
 * Jede Funktion speichert selbst und meldet die Änderung — danach zeichnen sich
 * alle sichtbaren Listen neu.
 * Pfad: src/data/mutations.js
 *
 * Was eine Aufgabe ändert (Status, Dringlichkeit, Ziehen im Board) und die
 * Vorgaben eines frisch angelegten Eintrags stehen in src/data/mutations-tasks.js.
 *
 * Keine anpassbaren visuellen Werte.
 */

import { pruneBlobs } from "../core/blobs.js";
import { emit, events } from "../core/bus.js";
import { nextId, sameId } from "../core/ids.js";
import { workspaceDefaultName } from "./config.js";
import { isTaskDone } from "./config-tasks.js";
import { applyPageHead } from "./design-prefs.js";
import { canLink, connectEntries, disconnectEntries, dropLinksTo, isLinked } from "./links.js";
import { dropPlaceFromViews, dropProjectFromViews } from "./project-views.js";
import { hasPlace, isContainer, tabWorkspaces } from "./queries.js";
import { entryRef, isEntryRef, refId, workspaceRef } from "./refs.js";
import { archiveFinishedTasks } from "./task-archive.js";
import { awardXp } from "./xp.js";
import { saveState, state, ui } from "./state.js";
import { pruneThumbs } from "./thumbs.js";

/** Nach jeder Änderung: speichern, Vorschaubilder aufräumen, Listen auffrischen. */
export function commit({ prunedEntries = false } = {}) {
  saveState();
  if (prunedEntries) {
    pruneThumbs(state.entries);
    /* Die abgelegten Dateien gehören zu den Einträgen: fällt einer weg, ist
       seine Datei sonst für immer Ballast in der Browser-Datenbank. */
    pruneBlobs(state.entries.map((entry) => entry.id));
  }
  emit(events.dataChanged);
}

/**
 * Ein Ablageort verschwindet: er wird aus allen Einträgen gestrichen, und wer
 * dadurch heimatlos würde, bekommt die Orte in `targets` (leer = Eingang).
 * Was noch woanders liegt, bleibt einfach dort. Auch src/data/convert.js
 * braucht das, wenn aus einem Projekt etwas anderes wird.
 */
export function liftChildren(ref, targets = []) {
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
 * Neuen Arbeitsbereich im gerade gewählten Tab anlegen. Ohne `name` beginnt er
 * ohne Namen im Umbenennen-Feld; wer nichts tippt, bekommt den Vorgabenamen.
 * @param name fertiger Name, etwa aus dem Blatt „Neu“ — dann kein Namensfeld.
 */
export function addWorkspace(name = "") {
  const id = nextId(state.workspaces);
  const workspace = {
    id,
    name: "",
    placeholder: nextWorkspacePlaceholder(),
    tab: state.activeTabId,
    favorite: false,
    cover: false,
    body: "",
    /* für „Zuletzt erstellt“ auf der Bühne der Übersicht */
    createdAt: Date.now(),
    /* Punkte gibt es erst, wenn der Name steht */
    awarded: false,
  };
  /* Cover, wenn neue Seiten damit beginnen sollen (Einstellungen › Design) */
  applyPageHead(workspace);
  state.workspaces.push(workspace);
  /* Mit Namen (aus dem Blatt „Neu“) steht er gleich fertig da, ohne Namensfeld */
  if (name) {
    nameWorkspace(workspace, name);
    return workspace;
  }
  ui.editingWorkspaceId = id;
  saveState();
  emit(events.dataChanged);
  return workspace;
}

/**
 * Merkt, dass der Inhalt eines Eintrags gerade bearbeitet wurde (Titel, Text,
 * Zeichnung) — für „Zuletzt bearbeitet“ in den Details. Speichert nicht
 * selbst: wer tippt, speichert ohnehin gleich mit scheduleSave().
 */
export function markEdited(entry) {
  entry.editedAt = Date.now();
}

/** Den Farbverlauf oben auf der Seite eines Eintrags oder Arbeitsbereichs ein- oder ausschalten. */
export function setCover(target, on) {
  target.cover = Boolean(on);
  saveState();
  emit(events.dataChanged);
}

/** Einem Eintrag ein eigenes Icon geben; ein leerer Name nimmt es weg. */
export function setEntryIcon(entry, name) {
  entry.icon = String(name || "");
  saveState();
  emit(events.dataChanged);
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
  /* Eine erledigte Aufgabe käme sonst beim nächsten Aufräumen sofort zurück
     ins Archiv: sie gilt als heute erledigt und bleibt bis Mitternacht. */
  if (item.type === "aufgabe" && isTaskDone(item)) item.doneAt = Date.now();
  commit();
}

/** Erledigte Aufgaben von gestern und früher ins Archiv legen (src/data/task-archive.js). */
export function sweepFinishedTasks() {
  if (archiveFinishedTasks(state.entries)) commit();
}

/** Arbeitsbereich löschen; was nur hier lag, wandert in den Eingang. */
export function deleteWorkspace(id) {
  state.workspaces = state.workspaces.filter((workspace) => !sameId(workspace.id, id));
  liftChildren(workspaceRef(id));
  dropPlaceFromViews(workspaceRef(id));
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

/** Tab löschen; seine Arbeitsbereiche verschwinden, deren Einträge wandern in den Eingang. */
export function deleteTab(id) {
  if (state.tabs.length < 2) return;
  state.workspaces
    .filter((workspace) => sameId(workspace.tab, id))
    .forEach((workspace) => {
      liftChildren(workspaceRef(workspace.id));
      dropPlaceFromViews(workspaceRef(workspace.id));
    });
  state.workspaces = state.workspaces.filter((workspace) => !sameId(workspace.tab, id));
  state.tabs = state.tabs.filter((tab) => !sameId(tab.id, id));
  if (sameId(state.activeTabId, id)) state.activeTabId = state.tabs[0].id;
  commit();
}

/** Einen Arbeitsbereich mitsamt seinen Einträgen unter einen anderen Tab legen. */
export function moveWorkspaceToTab(workspace, tabId) {
  if (sameId(workspace.tab, tabId)) return;
  workspace.tab = tabId;
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
  /* Eine Verknüpfung steht auf beiden Seiten: ohne diese Zeile bliebe beim
     Partner ein Verweis auf etwas, das es nicht mehr gibt. */
  dropLinksTo(entry.id);
  /* Auch die handverlesenen Listen der Projekt-Ansichten zeigen sonst ins Leere. */
  dropProjectFromViews(entry.id);
  state.entries = state.entries.filter((item) => !sameId(item.id, id));
  commit({ prunedEntries: true });
}

/**
 * Einen Ablageort leeren. Was NUR hier liegt, wird gelöscht; was auch woanders
 * liegt, wird hier nur ausgehängt und bleibt dort erhalten. Inhalte eines
 * gelöschten Projekts rücken in diesen Ort und bleiben.
 * Im Eingang (`ref` null) bleiben Medien verschont: die stehen dort gar
 * nicht in der Liste (siehe inboxEntries in queries.js), „Alle löschen” darf
 * sie deshalb auch nicht mitnehmen.
 */
export function deleteEntriesOf(ref) {
  const here = state.entries.filter((entry) => hasPlace(entry, ref) && (ref !== null || entry.type !== "medien"));
  const doomed = here.filter((entry) => (entry.places || []).length <= 1);
  here.forEach((entry) => {
    if (!doomed.includes(entry)) entry.places = entry.places.filter((place) => place !== ref);
  });
  doomed.forEach((entry) => {
    if (isContainer(entry)) liftChildren(entryRef(entry.id), ref ? [ref] : []);
  });
  doomed.forEach((entry) => {
    dropLinksTo(entry.id);
    dropProjectFromViews(entry.id);
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

/**
 * Zwei Einträge verbinden oder die Verbindung wieder lösen. Sie gilt immer in
 * beide Richtungen — siehe src/data/links.js.
 */
export function toggleLink(entry, other) {
  if (!canLink(entry) || !canLink(other)) return;
  if (isLinked(entry, other)) disconnectEntries(entry, other);
  else connectEntries(entry, other);
  commit();
}

/** Alle Orte wegnehmen: der Eintrag liegt dann im Eingang. */
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
