/*
 * Die Karten der Medien-Seite in der rechten Spalte am Desktop: „Speicher“
 * zeigt je Art (Bilder, Videos, Audio, Dokumente), wie viel Platz sie belegt,
 * als Balken; darunter die zuletzt hinzugefügten Medien. Die Details einer
 * markierten Datei kommen, sobald die Seite am Desktop markieren kann
 * (Schritt 6 des Desktop-Plans). Geladen über registerRailCards in src/main.js.
 * Pfad: src/features/media/media-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * newestLimit -> wie viele Medien „Zuletzt hinzugefügt“ zeigt
 * byteUnits   -> Einheiten der Größenangabe, je Stufe 1024-mal größer
 *
 * Aussehen in styles/desk-rail-views.css, die Arten in src/data/config.js (mediaKinds).
 */

import { formatNumber, shortOpenTime } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { mediaKinds } from "../../data/config.js";
import { mediaEntries, mediaKindOf } from "../../data/queries.js";
import { cardHead, railTitle } from "../../ui/rail-parts.js";
import { openEntryOrFile } from "../../ui/router.js";

const newestLimit = 4;
const byteUnits = ["B", "KB", "MB", "GB"];
const byteStep = 1024;

/* Menschenlesbare Größe: „820 KB“, „4,2 MB“. */
function formatBytes(bytes) {
  let value = bytes;
  let unit = 0;
  while (value >= byteStep && unit < byteUnits.length - 1) {
    value /= byteStep;
    unit += 1;
  }
  const rounded = value < 10 && unit > 0 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded.toLocaleString("de-DE")} ${byteUnits[unit]}`;
}

/** Karte „Speicher“: je Art Anzahl, Größe und Anteil am Ganzen. */
function storageCard() {
  const media = mediaEntries();
  const total = media.reduce((sum, entry) => sum + (entry.media?.size || 0), 0);
  const rows = mediaKinds
    .map((kind) => {
      const own = media.filter((entry) => mediaKindOf(entry) === kind.id);
      const bytes = own.reduce((sum, entry) => sum + (entry.media?.size || 0), 0);
      /* Ohne bekannte Größen (Beispielmedien) zählt die Anzahl. */
      const share = total ? bytes / total : media.length ? own.length / media.length : 0;
      const amount = bytes ? formatBytes(bytes) : formatNumber(own.length);
      /* --share: Länge des Balkens, gelesen von styles/desk-rail-views.css */
      return `
        <li class="rail-bar-row" aria-label="${escapeHtml(kind.label)}: ${formatNumber(own.length)}, ${amount}">
          <span class="rail-bar-label">${escapeHtml(kind.label)}</span>
          <span class="rail-bar" style="--share:${Math.round(share * 100)}%"></span>
          <span class="rail-bar-num">${amount}</span>
        </li>`;
    })
    .join("");
  const end = `<span class="rail-muted rail-head-end">${total ? formatBytes(total) : `${formatNumber(media.length)} Dateien`}</span>`;
  const body = media.length ? `<ul class="rail-bars">${rows}</ul>` : `<p class="rail-empty">Noch keine Medien.</p>`;
  return cardHead("Speicher", end) + body;
}

/* Eine Zeile unter „Zuletzt hinzugefügt“: Icon der Art, Titel, wann. */
function newestRow(entry) {
  const kind = mediaKinds.find((item) => item.id === mediaKindOf(entry));
  return `
    <li>
      <button class="rail-day-row" type="button" data-rail="media-open" data-id="${escapeHtml(entry.id)}">
        ${icon(kind ? kind.icon : "photos")}
        <span class="rail-day-title">${railTitle(entry)}</span>
        <span class="rail-day-time">${escapeHtml(shortOpenTime(entry.createdAt || Date.now()))}</span>
      </button>
    </li>`;
}

/** Karte „Zuletzt hinzugefügt“ — leer (und damit ausgeblendet) ohne Medien. */
function newestCard() {
  const newest = mediaEntries().slice(0, newestLimit);
  if (!newest.length) return "";
  return `${cardHead("Zuletzt hinzugefügt")}<ul class="rail-day-list">${newest.map(newestRow).join("")}</ul>`;
}

/** Die Plätze der Spalte auf der Medien-Seite (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [
  { name: "storage", className: "rail-card", render: storageCard },
  { name: "newest", className: "rail-card", render: newestCard },
];

/** Ein Medium geht wie in der Liste als Datei auf, nicht als Seite. */
export const railActions = {
  "media-open": (button) => openEntryOrFile(button.dataset.id),
};
