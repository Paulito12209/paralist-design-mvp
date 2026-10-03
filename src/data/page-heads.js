/*
 * Welche Sammlung ihren großen Kopf (Icon, Titel, Beschreibung) zeigt. Von Haus
 * aus zeigen ihn alle; wer ihn ausschaltet, steht als `false` unter
 * state.prefs.pageHeads. Gewählt wird im Menü oben rechts der Sammlung und
 * unter Einstellungen › App › Design.
 * Pfad: src/data/page-heads.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * headAreas -> die Sammlungen auf der Einstellungs-Seite, von oben nach unten:
 *              Name der Zeile (Icon und Farbe kommen aus collectionHeads in
 *              src/data/collections.js)
 */

import { collectionHeads } from "./collections.js";
import { saveState, state } from "./state.js";

export const headAreas = [
  { id: "inbox", label: "Eingang" },
  { id: "favorites", label: "Favoriten" },
  { id: "projects", label: "Projekte" },
  { id: "workspaces", label: "Arbeitsbereiche" },
  { id: "resources", label: "Ressourcen" },
  { id: "bookmarks", label: "Lesezeichen" },
  { id: "archive", label: "Archiv" },
].map((area) => ({ ...area, icon: collectionHeads[area.id].icon }));

/** Zeigt diese Sammlung ihren großen Kopf? Ohne ausdrückliches „aus“ ja. */
export function headOn(key) {
  return Boolean(key && collectionHeads[key] && state.prefs.pageHeads[key] !== false);
}

/** Den Kopf einer Sammlung ein- oder ausschalten und merken. */
export function setHeadOn(key, on) {
  if (!collectionHeads[key]) return;
  if (on) delete state.prefs.pageHeads[key];
  else state.prefs.pageHeads[key] = false;
  saveState();
}
