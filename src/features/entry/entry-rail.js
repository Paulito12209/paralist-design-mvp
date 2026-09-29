/*
 * Die Karten der Eintragsseite in der rechten Spalte am Desktop (ab 1280px):
 * „Details“ — dieselben Kennzahlen und Abschnitte wie die Karte am Textende
 * (entry-details.js), dazu das Ketten-Symbol „Verknüpfen“ —, darunter die
 * verknüpften Einträge (bei einem Projekt: was darin liegt) und „Gestaltung“
 * mit Cover und Icon. Solange die Spalte da ist, entfällt die Karte am
 * Textende, und der Text in der Mitte bleibt allein und wird nicht gekürzt
 * (styles/entry-desk.css, entry-fold.js). Geladen über registerRailCards in
 * src/main.js.
 * Pfad: src/features/entry/entry-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * linkLimit -> wie viele verknüpfte Einträge die Karte zeigt; alle stehen unter
 *              der Pille „Verknüpfte Einträge“
 *
 * Aussehen in styles/entry-desk.css, Karten und Pillen in styles/desk-rail.css.
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { typeIcon } from "../../data/config.js";
import { linkedEntries } from "../../data/links.js";
import { setCover, setEntryIcon } from "../../data/mutations.js";
import { entriesOf, findEntry, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { ui } from "../../data/state.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { openIconPicker } from "../../ui/pickers.js";
import { cardHead, railTitle } from "../../ui/rail-parts.js";
import { detailsBodyMarkup, handleDetailsClick } from "./entry-details.js";

const linkLimit = 6;

function currentEntry() {
  return findEntry(ui.currentEntryId);
}

/** Karte „Details“: Kennzahlen und Abschnitte, rechts oben „Verknüpfen“. */
function detailsCard() {
  const entry = currentEntry();
  if (!entry) return "";
  const link = `<button class="rail-round-btn rail-head-end" type="button" data-rail="entry-link" aria-label="Verknüpfen" title="Verknüpfen">${icon("link")}</button>`;
  return cardHead("Details", link) + `<div class="rail-entry-details">${detailsBodyMarkup(entry)}</div>`;
}

/* Ein Projekt zeigt, was darin liegt; jeder andere Eintrag, womit er verknüpft ist. */
function relatedOf(entry) {
  return isContainer(entry) ? entriesOf(entryRef(entry.id)) : linkedEntries(entry);
}

/** Karte „Verknüpfte Einträge“ (bei einem Projekt „Inhalt“); leer, wenn es nichts gibt. */
function linksCard() {
  const entry = currentEntry();
  if (!entry) return "";
  const related = relatedOf(entry);
  const title = isContainer(entry) ? "Im Projekt" : "Verknüpfte Einträge";
  if (!related.length) {
    return `${cardHead(title)}<p class="rail-empty">Noch nichts verknüpft.</p><button class="rail-pill" type="button" data-rail="entry-link">${icon("link")}Verknüpfen</button>`;
  }
  const rows = related
    .slice(0, linkLimit)
    .map(
      (other) => `
      <li>
        <button class="rail-day-row" type="button" data-rail="entry" data-id="${escapeHtml(other.id)}">
          ${icon(typeIcon(other.type))}<span class="rail-day-title">${railTitle(other)}</span>
        </button>
      </li>`
    )
    .join("");
  const all = `<button class="rail-pill rail-head-end" type="button" data-rail="entry-links">Alle ${related.length}</button>`;
  return `${cardHead(title, all)}<ul class="rail-day-list">${rows}</ul>`;
}

/** Karte „Gestaltung“: Cover ein- und ausschalten, Icon wählen. */
function designCard() {
  const entry = currentEntry();
  if (!entry) return "";
  return `
    ${cardHead("Gestaltung")}
    <div class="rail-entry-design">
      <button class="rail-pill${entry.cover ? " is-on" : ""}" type="button" data-rail="entry-cover" aria-pressed="${Boolean(entry.cover)}">${icon("image")}Cover</button>
      <button class="rail-pill" type="button" data-rail="entry-icon">${entry.icon ? icon(entry.icon) : icon("smile")}Icon</button>
    </div>`;
}

/** Die Plätze der Spalte auf der Eintragsseite (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [
  { name: "details", className: "rail-card", render: detailsCard },
  { name: "links", className: "rail-card", render: linksCard },
  { name: "design", className: "rail-card", render: designCard },
];

/** Was die eigenen Knöpfe tun — dieselben Wege wie Menü, Karte und Pillen auf der Seite. */
export const railActions = {
  "entry-link": () => {
    const entry = currentEntry();
    if (entry) openLinkSheet(entry);
  },
  /* Derselbe Weg wie ein Klick auf die Pille: sie zeichnet Seite und Knöpfe passend neu */
  "entry-links": () => dom.entryPills.querySelector('[data-entry-pill="links"]')?.click(),
  "entry-cover": () => {
    const entry = currentEntry();
    if (entry) setCover(entry, !entry.cover);
  },
  "entry-icon": () => {
    const entry = currentEntry();
    if (entry) openIconPicker(entry.icon, (name) => setEntryIcon(entry, name));
  },
};

/** Tipps auf Status, Dringlichkeit und die Link-Zeile in „Details“ — wie in der Karte am Textende. */
export function railClick(event) {
  const entry = currentEntry();
  if (!entry || !event.target.closest(".rail-entry-details")) return false;
  /* Nach dem Ändern des Links zeichnet die Spalte sich über dataChanged selbst neu. */
  return handleDetailsClick(event, entry, () => {});
}
