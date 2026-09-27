/*
 * Cover und Icon oben auf der Seite eines Eintrags — wie in Notion, beides
 * wählt man im Menü oben rechts (src/ui/entry-menu.js). Das Cover selbst ist
 * der gemeinsame Baustein aller Detailseiten (src/ui/page-cover.js); hier
 * kommen nur die Farbe der Kategorie und das Icon dazu. Das Icon steht groß
 * über dem Titel, ein Tipp darauf öffnet den Icon-Wähler.
 * Pfad: src/features/entry/entry-cover.js
 *
 * Keine anpassbaren visuellen Werte: Verlauf und Größe des Icons stehen in
 * styles/page-cover.css.
 */

import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { setEntryIcon } from "../../data/mutations.js";
import { entryColor, findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { registerCover, renderCover } from "../../ui/page-cover.js";
import { openIconPicker } from "../../ui/pickers.js";

/** Cover und Icon passend zum Eintrag zeigen oder verbergen. */
export function renderEntryCover(entry) {
  /* Erst das Icon: es schiebt Titel und Pillen nach unten, das Cover misst danach. */
  const name = entry.icon || "";
  dom.entryIcon.hidden = !name;
  dom.entryIcon.innerHTML = name ? icon(name) : "";
  renderCover(el("view-entry"), { on: Boolean(entry.cover), color: entryColor(entry) });
}

/** Cover anmelden und den Tipp auf das Icon: er öffnet denselben Wähler wie das Menü. */
export function initEntryCover() {
  registerCover(el("view-entry"), {
    title: dom.entryTitle,
    row: () => dom.entryPills.parentElement,
  });

  dom.entryIcon.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    openIconPicker(entry.icon, (name) => setEntryIcon(entry, name));
  });
}
