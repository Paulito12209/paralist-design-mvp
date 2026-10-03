/*
 * Die Zeilen der Suche: ein Treffer bzw. geöffnete Seite, ein gemerkter
 * Suchbegriff und die Hervorhebung des Begriffs im Titel. Gebraucht von den
 * Treffern (search.js) und den Reitern ohne Eingabe (search-browse.js).
 * Pfad: src/features/search/search-rows.js
 *
 * Keine anpassbaren visuellen Werte: Maße und Schrift der Zeilen stehen in
 * styles/search.css (.search-row, --search-meta-size).
 */

import { escapeHtml, icon } from "../../core/html.js";

/** Treffer im Titel hervorheben; der Rest bleibt abgesichert. Auch für die Such-Palette. */
export function markHit(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const needle = escapeHtml(query);
  const at = safe.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return safe;
  return `${safe.slice(0, at)}<mark class="search-hit">${safe.slice(at, at + needle.length)}</mark>${safe.slice(at + needle.length)}`;
}

/** Eine Ergebniszeile. Das `data-`Attribut sagt, was sie öffnet. */
export function resultRow(item, meta, query = "") {
  const attr =
    item.kind === "entry"
      ? `data-open-entry="${item.id}"`
      : item.kind === "workspace"
        ? `data-open-workspace="${item.id}"`
        : `data-open-overview="${item.id}"`;
  return `
    <button class="search-row" type="button" ${attr}>
      ${icon(item.icon)}
      <div class="search-copy">
        <p class="search-title">${markHit(item.title, query)}</p>
        <p class="search-meta">${escapeHtml(meta)}</p>
      </div>
      ${icon("chevron", "chevron")}
    </button>
  `;
}

/** Eine Zeile je gemerktem Suchbegriff. */
export function queryRow(query) {
  return `
    <button class="search-row search-row-query" type="button" data-search-query="${escapeHtml(query)}">
      ${icon("search")}
      <div class="search-copy"><p class="search-title">${escapeHtml(query)}</p></div>
    </button>
  `;
}
