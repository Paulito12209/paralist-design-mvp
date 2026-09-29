/*
 * Die Karten der Medien-Seite in der rechten Spalte am Desktop: „Speicher“
 * zeigt je Art (Bilder, Videos, Audio, Dokumente), wie viel Platz sie belegt,
 * als Balken; darunter die zuletzt hinzugefügten Medien. Darüber stehen die
 * Details der markierten Datei — markiert ist die Kachel oder Zeile unter der
 * Maus oder mit dem Tastatur-Fokus: Vorschau, Art, Größe, Dauer, Datum,
 * Ablageort und „Öffnen“. Geladen über registerRailCards in src/main.js.
 * Pfad: src/features/media/media-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * newestLimit -> wie viele Medien „Zuletzt hinzugefügt“ zeigt
 *
 * Aussehen in styles/desk-rail-views.css, die Arten in src/data/config.js (mediaKinds).
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { dayMonth, formatBytes, formatClock, formatNumber, shortOpenTime } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { mediaKinds } from "../../data/config.js";
import { findEntry, mediaEntries, mediaKindOf, placesLabel } from "../../data/queries.js";
import { thumbOf } from "../../data/thumbs.js";
import { cardHead, railTitle } from "../../ui/rail-parts.js";
import { openEntryOrFile } from "../../ui/router.js";

const newestLimit = 4;

/* Die markierte Datei (ihre Nummer) oder null. */
let marked = null;

/* Zwei Spalten „Angabe | Wert“; leere Werte fallen weg. */
function facts(pairs) {
  return `<div class="rail-facts">${pairs
    .filter(([, value]) => value)
    .map(([label, value]) => `<span class="rail-muted">${label}</span><span>${escapeHtml(value)}</span>`)
    .join("")}</div>`;
}

/** Karte „Details“ der markierten Datei — leer (und ausgeblendet), solange keine markiert ist. */
function detailsCard() {
  const entry = marked && findEntry(marked);
  if (!entry || entry.type !== "medien") return "";
  const media = entry.media || {};
  const kind = mediaKinds.find((item) => item.id === mediaKindOf(entry));
  const thumb = thumbOf(entry.id);
  /* Vorschau: das Bild selbst, sonst das Icon der Art auf ruhiger Fläche */
  const preview = thumb
    ? `<img class="rail-media-thumb" src="${thumb}" alt="" loading="lazy" decoding="async" />`
    : `<span class="rail-media-thumb">${icon(kind ? kind.icon : "photos")}</span>`;
  const open = `<button class="rail-pill rail-head-end" type="button" data-rail="media-open" data-id="${escapeHtml(entry.id)}">Öffnen${icon("arrow-right")}</button>`;
  return `
    ${cardHead("Details", open)}
    ${preview}
    <h3 class="rail-preview-title">${railTitle(entry)}</h3>
    ${facts([
      ["Art", kind ? kind.label : ""],
      ["Größe", media.size ? formatBytes(media.size) : ""],
      ["Dauer", media.duration ? formatClock(media.duration) : ""],
      ["Datum", entry.createdAt ? dayMonth(entry.createdAt) : ""],
      ["Ablageort", placesLabel(entry)],
    ])}`;
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
  { name: "details", className: "rail-card", render: detailsCard },
  { name: "storage", className: "rail-card", render: storageCard },
  { name: "newest", className: "rail-card", render: newestCard },
];

/** Ein Medium geht wie in der Liste als Datei auf, nicht als Seite. */
export const railActions = {
  "media-open": (button) => openEntryOrFile(button.dataset.id),
};

/* Kachel oder Zeile markieren: getönt auf der Seite und rechts als Details. */
function onPointer(event) {
  const item = event.target.closest?.("[data-open-entry]");
  if (!item || item.dataset.openEntry === marked) return;
  dom.mediaBody.querySelector(".is-marked")?.classList.remove("is-marked");
  item.classList.add("is-marked");
  marked = item.dataset.openEntry;
  emit(events.contextChanged);
}

/* Einmal beim Laden: Maus und Tastatur-Fokus markieren Medien. */
dom.mediaBody.addEventListener("pointerover", onPointer);
dom.mediaBody.addEventListener("focusin", onPointer);
