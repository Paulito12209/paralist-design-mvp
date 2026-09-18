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
import { awardXp } from "./xp.js";
import { saveState, state, ui } from "./state.js";
import { pruneThumbs } from "./thumbs.js";

/* Nach jeder Änderung: speichern, Vorschaubilder aufräumen, Listen auffrischen. */
function commit({ prunedEntries = false } = {}) {
  saveState();
  if (prunedEntries) pruneThumbs(state.entries);
  emit(events.dataChanged);
}

/** Neuen Arbeitsbereich im gerade gewählten Tab anlegen. */
export function addWorkspace() {
  const id = nextId(state.workspaces);
  const workspace = { id, name: `Platzhalter ${id}`, tab: state.activeTabId, favorite: false };
  state.workspaces.push(workspace);
  awardXp("created", "arbeitsbereich", workspace.name);
  emit(events.dataChanged);
  return workspace;
}

/** Arbeitsbereich löschen; seine Einträge wandern in die Inbox. */
export function deleteWorkspace(id) {
  state.workspaces = state.workspaces.filter((workspace) => !sameId(workspace.id, id));
  state.entries.forEach((entry) => {
    if (sameParent(entry.parent, id)) entry.parent = null;
  });
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
    .forEach((workspace) => {
      state.entries.forEach((entry) => {
        if (sameParent(entry.parent, workspace.id)) entry.parent = null;
      });
    });
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

/** Einen Eintrag endgültig löschen. */
export function deleteEntry(id) {
  state.entries = state.entries.filter((entry) => !sameId(entry.id, id));
  commit({ prunedEntries: true });
}

/** Alle Einträge eines Ablageorts löschen. */
export function deleteEntriesOf(parent) {
  state.entries = state.entries.filter((entry) => !sameParent(entry.parent, parent));
  commit({ prunedEntries: true });
}

/** Einen Eintrag in einen anderen Ablageort verschieben. */
export function moveEntry(entry, parent) {
  entry.parent = parent;
  commit();
}

/** Tab wechseln. */
export function selectTab(id) {
  state.activeTabId = Number(id);
  saveState();
  emit(events.dataChanged);
}
