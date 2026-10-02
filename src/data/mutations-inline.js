/*
 * Einen Eintrag direkt in einer Liste anlegen — nur mit Titel, ohne
 * Eingabefeld. Gebraucht vom Tipp unter den letzten Eintrag einer Liste
 * (src/ui/inline-add.js): im Eingang entsteht so eine Notiz, unter
 * „Zeichnungen“ eine Zeichnung, im Kalender ein Eintrag an dem Tag, den man
 * ansieht. Aufgaben und Projekte haben ihre eigenen Wege in
 * src/data/mutations-tasks.js (Gruppe, Spalte, Ansicht).
 * Pfad: src/data/mutations-inline.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { connectEntries } from "./links.js";
import { commit } from "./mutations.js";
import { applyEntryDefaults } from "./mutations-tasks.js";
import { findEntry } from "./queries.js";
import { state, ui } from "./state.js";
import { awardXp } from "./xp.js";

/**
 * Den Eintrag anlegen, speichern und melden.
 * @param title   der getippte Titel
 * @param type    Typ, den die Liste vorschlägt ("notiz", "zeichnung" …)
 * @param place   Ablageort (Arbeitsbereich oder Projekt) oder null für den Eingang
 * @param link    Eintrag, mit dem der neue verknüpft wird (Seite eines Eintrags), sonst null
 * @param fields  weitere Felder, z.B. { date, time } im Kalender
 */
export function createEntryInline({ title, type, place = null, link = null, fields = {} }) {
  const entry = {
    id: state.nextEntryId++,
    type,
    title,
    body: "",
    places: place ? [place] : [],
    links: [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
    ...fields,
  };
  /* Reste eines abgebrochenen „Projekt hinzufügen“ oder einer Board-Spalte
     gehören nicht zu dieser Zeile — sonst landete der Eintrag woanders. */
  ui.projectDraftView = null;
  ui.taskDraftColumn = null;
  applyEntryDefaults(entry);
  state.entries.push(entry);
  const source = link != null ? findEntry(link) : null;
  if (source) connectEntries(entry, source);
  awardXp("created", type, title);
  commit();
  return entry;
}
