/*
 * Die Leiste direkt über der Navigation auf der Seite eines Eintrags — bei
 * jeder Kategorie (Notiz, Aufgabe, Termin, Projekt, Dokument, Zeichnung,
 * Medium). Links steht „Details“: ein Tipp öffnet das Blatt mit den Angaben
 * (src/ui/details.js), das darum nicht mehr im Menü oben rechts steht. Rechts
 * das Ketten-Symbol „Verknüpfen“: ein Tipp öffnet das Blatt mit den Pillen
 * „Zuletzt“, „Ablageort“ und den Kategorien (src/ui/link-sheet.js). Die
 * Leiste ist wie das Cover in der Farbe der Kategorie gefärbt.
 *
 * Sie legt sich selbst in die untere Leiste (footer.bottom-bar) vor den
 * runden Container der Navigation — wie das Cover in src/ui/page-cover.js;
 * index.html bleibt so unverändert. Zu sehen ist sie nur, solange die
 * Eintragsseite offen ist (body.is-entry, gesetzt in src/ui/views.js).
 * Pfad: src/features/entry/entry-strip.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * detailsLabel -> das Wort links in der Leiste
 * linkLabel    -> Name des Ketten-Symbols für Vorlesehilfen und Tooltip
 *
 * Aussehen und Maße stehen in styles/entry-strip.css.
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { entryDetails } from "../../data/details.js";
import { entryColor, findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { openDetails } from "../../ui/details.js";
import { openLinkSheet } from "../../ui/link-sheet.js";

const detailsLabel = "Details";
const linkLabel = "Verknüpfen";

/* Die Leiste selbst, angelegt in initEntryStrip. */
let strip = null;

/** Die Leiste in die Farbe der Kategorie des offenen Eintrags färben. */
export function renderEntryStrip(entry) {
  if (strip) strip.style.setProperty("--strip-accent", entryColor(entry));
}

/** Leiste anlegen und ihre zwei Tipps anmelden. */
export function initEntryStrip() {
  strip = document.createElement("div");
  strip.className = "entry-strip";
  strip.innerHTML = `
    <button class="entry-strip-details" type="button">${detailsLabel}</button>
    <button class="entry-strip-link" type="button" aria-label="${linkLabel}" title="${linkLabel}">${icon("link")}</button>`;
  dom.bottomBar.insertBefore(strip, dom.navShell);

  strip.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    if (event.target.closest(".entry-strip-details")) {
      openDetails(entry.title || "Ohne Titel", entryDetails(entry));
    } else if (event.target.closest(".entry-strip-link")) {
      openLinkSheet(entry);
    }
  });
}
