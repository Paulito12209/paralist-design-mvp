/*
 * Die Karte „Details“ am Ende des Reiters „Inhalt“ einer Eintragsseite —
 * bei jeder Kategorie. Aufgebaut wie der Kopf eines Profils: oben „Details“
 * und rechts das Ketten-Symbol „Verknüpfen“ (src/ui/link-sheet.js), darunter
 * drei Kennzahlen nebeneinander (bei einer Aufgabe Datum | Status |
 * Dringlichkeit — ein Tipp auf Status oder Dringlichkeit öffnet das Blatt
 * dazu), nach einer Trennlinie die übrigen Angaben in Abschnitten. Was dort
 * steht, stellt src/data/entry-facts.js zusammen.
 *
 * Die Karte gehört zur Seite, nicht zur Navigation: sie scrollt mit dem Text
 * und liegt unter der Navigation. Wie weit sie beim Öffnen hervorschaut,
 * regelt entry-fold.js. Ein Tipp auf „Details“ holt die ganze Karte in den Blick.
 * Pfad: src/features/entry/entry-details.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * detailsLabel  -> Überschrift der Karte
 * linkLabel     -> Name des Ketten-Symbols für Vorlesehilfen und Tooltip
 * REVEAL_GAP_PX -> so viel Luft bleibt nach dem Hochholen zwischen Kopfzeile und Karte
 *
 * Aussehen in styles/entry-details.css.
 */

import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { entryFacts } from "../../data/entry-facts.js";
import { findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { openTaskSheet } from "../../ui/task-status.js";

const detailsLabel = "Details";
const linkLabel = "Verknüpfen";
const REVEAL_GAP_PX = 12;

/* Die Karte und ihre beiden Flächen, die sich je Eintrag neu füllen */
let card = null;
let statsBox = null;
let listBox = null;

/** Die Karte — entry-fold.js misst an ihr, wie weit sie hervorschaut. */
export function detailsCard() {
  return card;
}

/* Eine Kennzahl: ein Knopf, wenn ein Tipp etwas öffnet, sonst reiner Text */
function statMarkup(stat) {
  const color = stat.color ? ` style="--stat-color:${stat.color}"` : "";
  const inner = `<span class="details-stat-value"${color}>${escapeHtml(stat.value)}</span><span class="details-stat-label">${escapeHtml(stat.label)}</span>`;
  return stat.field
    ? `<button class="details-stat" type="button" data-details-field="${stat.field}" aria-label="${escapeHtml(`${stat.label}: ${stat.value}. Ändern`)}">${inner}</button>`
    : `<div class="details-stat">${inner}</div>`;
}

function groupMarkup(group) {
  const rows = group.rows
    .map((row) => `<div class="details-row"><span class="details-row-label">${escapeHtml(row.label)}</span><span class="details-row-value">${escapeHtml(row.value)}</span></div>`)
    .join("");
  return `<p class="details-heading">${escapeHtml(group.heading)}</p>${rows}`;
}

/** Kennzahlen und Abschnitte für den offenen Eintrag neu schreiben. */
export function renderEntryDetails(entry) {
  if (!card || !entry) return;
  const facts = entryFacts(entry);
  statsBox.innerHTML = facts.stats.map(statMarkup).join("");
  listBox.innerHTML = facts.groups.map(groupMarkup).join("");
}

/* Wer Bewegung abgeschaltet hat, springt sofort statt zu gleiten. */
function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/* Die Karte so weit hochholen, dass sie direkt unter der Kopfzeile beginnt —
   kürzer geht es am Seitenende nicht, dann steht sie so weit oben wie möglich. */
function revealCard() {
  const head = el("entry-head").getBoundingClientRect().bottom;
  const shift = card.getBoundingClientRect().top - head - REVEAL_GAP_PX;
  dom.content.scrollTo({ top: dom.content.scrollTop + shift, behavior: scrollBehavior() });
}

/** Karte ans Ende des Reiters „Inhalt“ hängen und ihre Tipps anmelden. */
export function initEntryDetails() {
  card = document.createElement("section");
  card.className = "details-card";
  card.setAttribute("aria-label", detailsLabel);
  card.innerHTML = `
    <div class="details-head">
      <button class="details-title" type="button">${detailsLabel}</button>
      <button class="details-link" type="button" aria-label="${linkLabel}" title="${linkLabel}">${icon("link")}</button>
    </div>
    <div class="details-stats"></div>
    <div class="details-list"></div>`;
  statsBox = card.querySelector(".details-stats");
  listBox = card.querySelector(".details-list");
  dom.entryPanelNotes.append(card);

  card.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    if (event.target.closest(".details-title")) {
      /* Frisch rechnen: die Zeit auf der Seite ist seit dem Öffnen gewachsen */
      renderEntryDetails(entry);
      revealCard();
      return;
    }
    if (event.target.closest(".details-link")) {
      openLinkSheet(entry);
      return;
    }
    const stat = event.target.closest("[data-details-field]");
    if (stat) openTaskSheet(entry, stat.dataset.detailsField);
  });
}
