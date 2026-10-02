/*
 * Tipp unter die letzte Zeile von „Verknüpfte Einträge“ (Android,
 * src/ui/inline-add.js): in einem Projekt entsteht eine Aufgabe darin, bei
 * jedem anderen Eintrag eine Notiz, die mit ihm verknüpft ist — dieselbe
 * Regel wie beim Eingabefeld (src/features/composer/composer-defaults.js).
 * Solange noch nichts darunter steht, zeigt die Seite ihren Platzhalter.
 * Pfad: src/features/entry/entry-inline.js
 *
 * Keine anpassbaren visuellen Werte: der Typ einer Notiz kommt aus
 * `proposedType` in src/data/config.js.
 */

import { dom } from "../../core/dom.js";
import { proposedType } from "../../data/config.js";
import { createEntryInline } from "../../data/mutations-inline.js";
import { findEntry, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { ui } from "../../data/state.js";
import { addInlineList, openEntryRow, reopenIn } from "../../ui/inline-add.js";
import { isViewActive } from "../../ui/views.js";

const inlineList = {
  area() {
    if (!isViewActive("entry") || ui.entryPill !== "links") return null;
    return dom.entryLinks.querySelector(":scope > .group") ? dom.entryLinks : null;
  },
  open(area) {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    const container = isContainer(entry);
    const type = container ? "aufgabe" : proposedType;
    openEntryRow(area, {
      type,
      onCommit: (title) =>
        createEntryInline(
          container ? { title, type, place: entryRef(entry.id) } : { title, type, link: entry.id }
        ),
      reopen: () => reopenIn(inlineList),
    });
  },
};

/** Die Liste anmelden. */
export function initEntryInline() {
  addInlineList(inlineList);
}
