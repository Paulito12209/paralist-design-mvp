/*
 * Cover und Icon oben auf der Seite eines Eintrags — wie in Notion, beides
 * wählt man im Menü oben rechts (src/ui/entry-menu.js). Das Cover ist ein
 * Farbverlauf in der Farbe der Kategorie, der hinter Kopfzeile und Titel
 * nach oben hin kräftiger wird; das Icon steht groß über dem Titel, ein Tipp
 * darauf öffnet den Icon-Wähler.
 * Pfad: src/features/entry/entry-cover.js
 *
 * Keine anpassbaren visuellen Werte: Höhe und Stärke des Verlaufs sowie die
 * Größe des Icons stehen in styles/entry-cover.css.
 */

import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { setEntryIcon } from "../../data/mutations.js";
import { entryColor, findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { openIconPicker } from "../../ui/pickers.js";

/** Cover und Icon passend zum Eintrag zeigen oder verbergen. */
export function renderEntryCover(entry) {
  const view = el("view-entry");
  const cover = Boolean(entry.cover);
  view.classList.toggle("has-cover", cover);
  dom.entryCover.hidden = !cover;
  /* Die Farbe der Kategorie kommt als Variable mit: der Verlauf und die
     Fläche hinter dem Icon lesen sie in styles/entry-cover.css. */
  view.style.setProperty("--entry-accent", entryColor(entry));

  const name = entry.icon || "";
  dom.entryIcon.hidden = !name;
  dom.entryIcon.innerHTML = name ? icon(name) : "";
}

/** Den Tipp auf das Icon anmelden: er öffnet denselben Wähler wie das Menü. */
export function initEntryCover() {
  dom.entryIcon.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    openIconPicker(entry.icon, (name) => setEntryIcon(entry, name));
  });
}
