/*
 * Cover und Icon oben auf der Seite eines Eintrags — wie in Notion, beides
 * wählt man im Menü oben rechts (src/ui/entry-menu.js). Das Cover ist ein
 * Fläche in der Farbe der Kategorie hinter Kopfzeile und Titel, die ab der
 * Oberkante der Pillen ausläuft; das Icon steht groß über dem Titel, ein
 * Tipp darauf öffnet den Icon-Wähler.
 *
 * Wo die Pillen liegen, hängt von Icon und Titellänge ab: die Oberkante wird
 * gemessen und als --entry-cover-solid an styles/entry-cover.css gegeben —
 * beim Zeichnen und immer, wenn der Titel beim Tippen höher oder niedriger wird.
 * Pfad: src/features/entry/entry-cover.js
 *
 * Keine anpassbaren visuellen Werte: Länge und Stärke des Auslaufens sowie
 * die Größe des Icons stehen in styles/entry-cover.css.
 */

import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { setEntryIcon } from "../../data/mutations.js";
import { entryColor, findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { openIconPicker } from "../../ui/pickers.js";

/* Die Oberkante der Pillen-Zeile, gemessen von der Oberkante der Seite
   (offsetTop, weil #view-entry der positionierte Vorfahr ist). */
function measureSolid() {
  const view = el("view-entry");
  if (view.hidden || dom.entryCover.hidden) return;
  view.style.setProperty("--entry-cover-solid", `${dom.entryPills.parentElement.offsetTop}px`);
}

/** Cover und Icon passend zum Eintrag zeigen oder verbergen. */
export function renderEntryCover(entry) {
  const view = el("view-entry");
  const cover = Boolean(entry.cover);
  view.classList.toggle("has-cover", cover);
  dom.entryCover.hidden = !cover;
  /* Die Farbe der Kategorie kommt als Variable mit: der Verlauf und das
     Icon lesen sie in styles/entry-cover.css. */
  view.style.setProperty("--entry-accent", entryColor(entry));

  const name = entry.icon || "";
  dom.entryIcon.hidden = !name;
  dom.entryIcon.innerHTML = name ? icon(name) : "";
  measureSolid();
}

/** Den Tipp auf das Icon anmelden: er öffnet denselben Wähler wie das Menü. */
export function initEntryCover() {
  /* Wächst der Titel beim Tippen um eine Zeile, rutschen die Pillen — die
     Fläche muss mit. ResizeObserver meldet das, ohne bei jedem Tastendruck
     zu messen. */
  new ResizeObserver(measureSolid).observe(dom.entryTitle);

  dom.entryIcon.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    openIconPicker(entry.icon, (name) => setEntryIcon(entry, name));
  });
}
