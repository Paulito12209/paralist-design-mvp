/*
 * Alles, was Daten wirklich ändert: anlegen, löschen, markieren, verschieben.
 * Jede Funktion speichert selbst und meldet die Änderung — danach zeichnen sich
 * alle sichtbaren Listen neu.
 * Pfad: src/data/mutations.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { emit, events } from "../core/bus.js";
import { nextId, sameId, sameParent } from "../core/ids.js";
import { workspaceDefaultName } from "./config.js";
import { isContainer, tabWorkspaces } from "./queries.js";
import { entryRef, isEntryRef, refId, workspaceRef } from "./refs.js";
import { awardXp } from "./xp.js";
import { saveState, state, ui } from "./state.js";
import { pruneThumbs } from "./thumbs.js";

/* Nach jeder Änderung: speichern, Vorschaubilder aufräumen, Listen auffrischen. */
function commit({ prunedEntries = false } = {}) {
  saveState();
  if (prunedEntries) pruneThumbs(state.entries);
  emit(events.dataChanged);
}

/* Was in einem gelöschten Ablageort lag, rückt eine Ebene hoch. */
function liftChildren(ref, target) {
  state.entries.forEach((entry) => {
    if (sameParent(entry.parent, ref)) entry.parent = target;
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

/** Arbeitsbereich löschen; seine Einträge wandern in die Inbox. */
export function deleteWorkspace(id) {
  state.workspaces = state.workspaces.filter((workspace) => !sameId(workspace.id, id));
  liftChildren(workspaceRef(id), null);
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
    .forEach((workspace) => liftChildren(workspaceRef(workspace.id), null));
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

/** Einen Eintrag endgültig löschen. Was in einem Projekt lag, rückt in dessen Ablageort. */
export function deleteEntry(id) {
  const entry = state.entries.find((item) => sameId(item.id, id));
  if (!entry) return;
  if (isContainer(entry)) liftChildren(entryRef(entry.id), entry.parent);
  state.entries = state.entries.filter((item) => !sameId(item.id, id));
  commit({ prunedEntries: true });
}

/** Alle Einträge eines Ablageorts löschen; Inhalte gelöschter Projekte rücken hoch. */
export function deleteEntriesOf(ref) {
  const doomed = state.entries.filter((entry) => sameParent(entry.parent, ref));
  doomed.forEach((entry) => {
    if (isContainer(entry)) liftChildren(entryRef(entry.id), ref);
  });
  const doomedIds = new Set(doomed.map((entry) => entry.id));
  state.entries = state.entries.filter((entry) => !doomedIds.has(entry.id));
  commit({ prunedEntries: true });
}

/**
 * Einen Eintrag in einen anderen Ablageort verschieben.
 * Ein Projekt darf nicht in ein Projekt, und nichts in sich selbst.
 */
export function moveEntry(entry, ref) {
  if (isEntryRef(ref) && (isContainer(entry) || sameId(refId(ref), entry.id))) return;
  entry.parent = ref;
  commit();
}

/** Tab wechseln. */
export function selectTab(id) {
  state.activeTabId = Number(id);
  saveState();
  emit(events.dataChanged);
}
