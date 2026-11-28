/*
 * Das Markup der Karten im Dashboard der „OG Version“: große Karten für „Im Blick“
 * (HomeLargeCardContent in Organi7er) und mittlere Kacheln für „Zuletzt …“
 * (HomeTileContent). Klicks, Stern und „…“ übernimmt der gemeinsame Klick-Empfänger
 * der Listen (src/ui/list-clicks.js) über data-open-entry, data-fav-toggle und
 * data-row-more — hier steht nur, wie eine Karte aussieht.
 * Pfad: src/features/overview/home-og-cards.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ringDots   -> Punkte im Kranz um jeden Zähler (20 wie in der App)
 * ringRadius -> Halbmesser dieses Kranzes im 24er-Feld des Rings
 * Maße, Farben und Schrift der Karten: styles/og-dash.css und styles/tokens-og-home.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { clockOf, contentCounts, parentOf, stampLabel } from "../../data/home-dash.js";
import { dotNumber, dotSymbol, dotText } from "../../ui/dot-matrix.js";

const ringDots = 20;
const ringRadius = 11;

/* Welche Zähler-Symbole zu welcher Art gehören, entspricht dem Kategorie-Symbol der Pille. */
function ringMarkup(kind, count) {
  let dots = "";
  for (let index = 0; index < ringDots; index += 1) {
    const angle = (index / ringDots) * Math.PI * 2;
    dots += `<circle cx="${(12 + ringRadius * Math.cos(angle)).toFixed(2)}" cy="${(12 + ringRadius * Math.sin(angle)).toFixed(2)}" r="0.65"/>`;
  }
  return `
    <span class="og-count" aria-label="${escapeHtml(kind.label)}: ${count}">
      <span class="og-count-node"><svg viewBox="0 0 24 24" aria-hidden="true">${dots}</svg>${icon(kind.icon)}</span>
      ${dotNumber(count, 12)}
    </span>`;
}

/* Die Kette der Zähler oben rechts: senkrecht, durch feine Linien verbunden */
function countsMarkup(page) {
  const counts = contentCounts(page);
  if (!counts.length) return "";
  return `<span class="og-counts">${counts.map((item) => ringMarkup(item.kind, item.count)).join("")}</span>`;
}

const pillMarkup = (kind) => `<span class="og-pill">${icon(kind.icon)}<span>${kind.label}</span></span>`;

/* Der Stern und die drei Punkte; die Klassen data-fav-toggle und data-row-more fängt list-clicks.js ab */
function actionsMarkup(page) {
  const star = page.favorite ? "star" : "star-outline";
  return `
    <span class="og-actions">
      <span class="og-star${page.favorite ? " is-favorite" : ""}" data-fav-toggle role="button" tabindex="0" aria-label="${page.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten"}">${icon(star)}</span>
      <span class="og-dots" data-row-more role="button" tabindex="0" aria-label="Mehr">${icon("dots")}</span>
    </span>`;
}

const openAttr = (page) => (page.isWorkspace ? `data-open-workspace="${page.id}"` : `data-open-entry="${page.id}"`);

/* Die Zeit-Pille am Fuß einer großen Karte: Symbol und Uhrzeit in Punktschrift */
function timePill(symbolHtml, timeHtml) {
  return timeHtml ? `<span class="og-time">${symbolHtml}${timeHtml}</span>` : "";
}

/**
 * Eine große Karte. `mode` ist "pinned" (Uhrzeit des letzten Öffnens mit Auge)
 * oder "dated" (Uhrzeit des Termins mit Uhr).
 */
export function largeCardMarkup(page, mode) {
  const parent = parentOf(page);
  let time = "";
  if (mode === "dated") {
    time = timePill(icon("clock"), page.time ? dotNumber(page.time, 12) : `<span class="og-dm-word">ganztägig</span>`);
  } else if (page.openedAt) {
    time = timePill(dotSymbol("eye", 12), dotNumber(clockOf(page.openedAt), 12));
  }
  return `
    <div class="og-card og-card-lg og-art" ${openAttr(page)} style="--og-c:${page.kind.color}" role="button" tabindex="0" aria-label="${escapeHtml(page.title || "Ohne Titel")}, ${page.kind.label}">
      <div class="og-top">${pillMarkup(page.kind)}${mode === "pinned" ? countsMarkup(page) : ""}</div>
      <div class="og-bottom">
        ${parent ? `<span class="og-parent">${icon(parent.icon)}<span>${escapeHtml(parent.name)}</span></span>` : ""}
        <span class="og-title">${escapeHtml(page.title || "Ohne Titel")}</span>
        <div class="og-foot">${time}${actionsMarkup(page)}</div>
      </div>
    </div>`;
}

/** Eine mittlere Kachel der Reihen „Zuletzt …“; `symbol` ist das Rastersymbol vor dem Zeitstempel. */
export function tileMarkup(page, symbol) {
  return `
    <div class="og-card og-tile og-art" ${openAttr(page)} style="--og-c:${page.kind.color}" role="button" tabindex="0" aria-label="${escapeHtml(page.title || "Ohne Titel")}, ${page.kind.label}">
      <div class="og-top">${pillMarkup(page.kind)}</div>
      <div class="og-bottom">
        <span class="og-title">${escapeHtml(page.title || "Ohne Titel")}</span>
        <div class="og-foot og-foot-small">
          <span class="og-stamp">${dotSymbol(symbol, 10)}${dotText(stampLabel(page.stampAt), 10)}</span>
          <span class="og-star${page.favorite ? " is-favorite" : ""}" data-fav-toggle role="button" tabindex="0" aria-label="${page.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten"}">${icon(page.favorite ? "star" : "star-outline")}</span>
        </div>
      </div>
    </div>`;
}
