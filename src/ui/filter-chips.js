/*
 * Die Chips unter der Zeile „Filter“ in einer Karte „Ansicht“ — einer je
 * gefiltertem Abschnitt. Ein Chip trägt Icon und Namen („Typ“) oder die
 * Wahl („Letzte 7 Tage“), bei Mehrfachwahl dazu die Zahl der Haken, bei
 * „ist nicht“ als „nicht | 1“. Jeder Chip trägt data-settings="filter" und in
 * data-value die Unterseite, die ein Tipp im Filter-Blatt öffnet.
 * Genutzt von der Aufgaben-Seite und den Sammlungen.
 * Pfad: src/ui/filter-chips.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * notLabel -> Wort im Zähler eines Chips, wenn der Abschnitt „ist nicht“ filtert
 *
 * Aussehen: styles/tasks-settings.css (.tasks-filter-chip, .tasks-filter-count).
 */

import { escapeHtml, icon } from "../core/html.js";

const notLabel = "nicht";

/* Der Zähler in einem Chip: „2“ oder „nicht | 1“ mit Strich dazwischen */
function countMarkup(chip) {
  if (chip.count === undefined) return "";
  const not = chip.not ? `${escapeHtml(notLabel)}<span class="tasks-filter-sep"></span>` : "";
  return `<span class="tasks-filter-count">${not}${chip.count}</span>`;
}

/**
 * Die Chips als HTML; leer ohne Chips.
 * @param chips [{ page, label, icon, count?, not? }]
 */
export function filterChipsMarkup(chips) {
  if (!chips.length) return "";
  const chip = (item) =>
    `<button class="tasks-filter-chip" type="button" data-settings="filter" data-value="${escapeHtml(item.page)}">${icon(item.icon)}<span>${escapeHtml(item.label)}</span>${countMarkup(item)}</button>`;
  return `<div class="tasks-filter-chips">${chips.map(chip).join("")}</div>`;
}
