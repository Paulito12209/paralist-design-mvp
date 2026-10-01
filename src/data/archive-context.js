/*
 * Was im Archiv zur offenen Seite gehört. Der Archiv-Knopf der
 * Android-Fassung (src/shell/android-archive.js) erscheint nur, wenn hier
 * etwas liegt: auf der Übersicht nur bei archivierten Projekten, auf den
 * Lesezeichen nur bei archivierten Lesezeichen usw. Wer alles Archivierte
 * sehen will, nimmt die Karte „Archiv“ auf der Übersicht.
 * Pfad: src/data/archive-context.js
 *
 * Keine anpassbaren visuellen Werte. Welche Pille der Knopf im Archiv öffnet,
 * steht in src/shell/android-archive.js (entryPages).
 */

import { holdsBookmark } from "./bookmarks.js";
import { resourceTypes } from "./config.js";
import { archivedEntries, archivedWorkspaces, hasPlace } from "./queries.js";

const ofType = (type) => () => archivedEntries().filter((entry) => entry.type === type);

/* Art der Sammlung (page.kind; der Eingang hat keine) -> ihre archivierten Dinge */
const byKind = {
  inbox: () => archivedEntries().filter((entry) => hasPlace(entry, null) && entry.type !== "medien"),
  favorites: () => [
    ...archivedWorkspaces().filter((workspace) => workspace.favorite),
    ...archivedEntries().filter((entry) => entry.favorite),
  ],
  resources: () => archivedEntries().filter((entry) => resourceTypes.includes(entry.type)),
  bookmarks: () => archivedEntries().filter(holdsBookmark),
  projects: ofType("projekt"),
  workspaces: archivedWorkspaces,
};

/**
 * Die archivierten Dinge, die zur Seite gehören — leer, wenn es keine gibt
 * oder die Seite keinen Archiv-Bezug hat. `view` ist der Name der offenen
 * Ansicht, `page` die offene Unterseite (ui.currentPage).
 */
export function archivedForView(view, page) {
  /* Die Übersicht zeigt unter den Karten nur die Projekte. */
  if (view === "home") return ofType("projekt")();
  if (view === "tasks") return ofType("aufgabe")();
  if (view !== "page" || !page) return [];
  if (page.isWorkspace) return archivedEntries().filter((entry) => hasPlace(entry, page.parent));
  return byKind[page.kind || "inbox"]?.() || [];
}
