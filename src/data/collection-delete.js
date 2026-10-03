/*
 * „Alles löschen“ je Sammlung: das rote Menü-Ende oben rechts auf Ressourcen,
 * Projekte, Archiv, Arbeitsbereiche und Lesezeichen. Der Eingang löscht über
 * deleteEntriesOf in src/data/mutations.js, die Favoriten nehmen nur ihre
 * Markierung weg (clearFavorites).
 * Pfad: src/data/collection-delete.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * deleteLabels -> der Text der roten Zeile je Sammlung
 *
 * Was verschwindet: Ressourcen = alle Notizen, Dokumente, Zeichnungen und
 * Medien; Projekte = alle Projekte (ihre Inhalte rücken an den Ort des
 * Projekts); Archiv = alles Archivierte; Arbeitsbereiche = alle Arbeitsbereiche
 * (ihre Einträge rücken in den Eingang); Lesezeichen = nur Einträge vom Typ
 * „Lesezeichen“ — eine Notiz mit Link-Karte bleibt, sie ist kein Lesezeichen.
 */

import { sameId } from "../core/ids.js";
import { BOOKMARK_TYPE } from "./bookmarks.js";
import { commit, liftChildren } from "./mutations.js";
import { dropLinksTo } from "./links.js";
import { dropPlaceFromViews, dropProjectFromViews } from "./project-views.js";
import { archivedEntries, archivedWorkspaces, isContainer, projectEntries, resourceEntries } from "./queries.js";
import { entryRef, workspaceRef } from "./refs.js";
import { state } from "./state.js";

export const deleteLabels = {
  resources: "Alle Ressourcen löschen",
  projects: "Alle Projekte löschen",
  archive: "Alles im Archiv löschen",
  workspaces: "Alle Arbeitsbereiche löschen",
  bookmarks: "Alle Lesezeichen löschen",
};

/* Einträge entfernen; was in einem Projekt lag, übernimmt dessen Orte (wie deleteEntry). */
function removeEntries(doomed) {
  doomed.forEach((entry) => {
    if (isContainer(entry)) liftChildren(entryRef(entry.id), entry.places);
    dropLinksTo(entry.id);
    dropProjectFromViews(entry.id);
  });
  const ids = new Set(doomed.map((entry) => entry.id));
  state.entries = state.entries.filter((entry) => !ids.has(entry.id));
}

/* Arbeitsbereiche entfernen; ihre Einträge fallen in den Eingang zurück. */
function removeWorkspaces(doomed) {
  doomed.forEach((workspace) => {
    liftChildren(workspaceRef(workspace.id));
    dropPlaceFromViews(workspaceRef(workspace.id));
  });
  state.workspaces = state.workspaces.filter((workspace) => !doomed.some((item) => sameId(item.id, workspace.id)));
}

/** Alles löschen, was die Sammlung `kind` zeigt. */
export function deleteCollection(kind) {
  if (kind === "resources") removeEntries(resourceEntries());
  else if (kind === "projects") removeEntries(projectEntries());
  else if (kind === "bookmarks") removeEntries(state.entries.filter((entry) => entry.type === BOOKMARK_TYPE && !entry.archived));
  else if (kind === "workspaces") removeWorkspaces(state.workspaces.filter((workspace) => !workspace.archived));
  else if (kind === "archive") {
    removeEntries(archivedEntries());
    removeWorkspaces(archivedWorkspaces());
  } else return;
  commit({ prunedEntries: true });
}
