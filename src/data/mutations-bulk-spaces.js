/*
 * Sammel-Änderungen für die Sammlungen, die über Aufgaben hinausgehen:
 * Arbeitsbereiche (Favorit, Tab, Archiv, Löschen) und das gemeinsame
 * Verknüpfen mehrerer Einträge mit einem anderen. Wie in
 * src/data/mutations-bulk.js speichert jede Funktion erst am Ende einmal.
 *
 * Der Schnappschuss für „Rückgängig“ merkt sich bei Arbeitsbereichen Favorit,
 * Tab und Archiv; restoreSpaces schreibt sie zurück.
 * Pfad: src/data/mutations-bulk-spaces.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * spaceFields -> welche Felder eines Arbeitsbereichs „Rückgängig“ zurückholt
 *
 * Keine anpassbaren visuellen Werte.
 */

import { sameId } from "../core/ids.js";
import { canLink, connectEntries, disconnectEntries, isLinked } from "./links.js";
import { commit, liftChildren } from "./mutations.js";
import { dropPlaceFromViews } from "./project-views.js";
import { workspaceRef } from "./refs.js";
import { state } from "./state.js";

const spaceFields = ["favorite", "tab", "archived"];

/** Favorit, Tab und Archiv der Arbeitsbereiche merken. */
export function snapshotSpaces(spaces) {
  return spaces.map((space) => ({ id: space.id, fields: Object.fromEntries(spaceFields.map((key) => [key, space[key]])) }));
}

/** „Rückgängig“: die gemerkten Felder zurückschreiben. */
export function restoreSpaces(snapshot) {
  snapshot.forEach(({ id, fields }) => {
    const space = state.workspaces.find((item) => sameId(item.id, id));
    if (space) Object.assign(space, fields);
  });
  commit();
}

/** Alle als Favorit markieren (`on`) oder die Markierung wegnehmen. */
export function setSpacesFavorite(spaces, on) {
  spaces.forEach((space) => {
    space.favorite = Boolean(on);
  });
  commit();
}

/** Alle unter einen anderen Tab legen. */
export function moveSpacesToTab(spaces, tabId) {
  spaces.forEach((space) => {
    space.tab = tabId;
  });
  commit();
}

/** Alle ins Archiv legen (`on`) oder zurückholen. Ihre Einträge bleiben, wo sie sind. */
export function archiveSpaces(spaces, on) {
  spaces.forEach((space) => {
    space.archived = Boolean(on);
  });
  commit();
}

/** Alle endgültig löschen; was nur dort lag, wandert in den Eingang — wie deleteWorkspace. */
export function deleteSpaces(spaces) {
  const ids = new Set(spaces.map((space) => String(space.id)));
  state.workspaces = state.workspaces.filter((space) => !ids.has(String(space.id)));
  spaces.forEach((space) => {
    liftChildren(workspaceRef(space.id));
    dropPlaceFromViews(workspaceRef(space.id));
  });
  commit();
}

/** Sind alle verknüpfbaren gewählten Einträge schon mit `other` verbunden? */
export function allLinkedWith(entries, other) {
  const linkable = entries.filter(canLink);
  return linkable.length > 0 && linkable.every((entry) => isLinked(entry, other));
}

/**
 * Alle gewählten mit `other` verbinden — oder, wenn sie es schon alle sind,
 * alle Verbindungen zu ihm lösen. Die Verbindung gilt immer beidseitig
 * (src/data/links.js).
 */
export function toggleLinkAll(entries, other) {
  const linkable = entries.filter((entry) => canLink(entry) && !sameId(entry.id, other.id));
  const undo = allLinkedWith(linkable, other);
  linkable.forEach((entry) => (undo ? disconnectEntries(entry, other) : connectEntries(entry, other)));
  commit();
}
