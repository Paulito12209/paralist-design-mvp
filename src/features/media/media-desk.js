/*
 * Die Medien-Seite am Desktop (ab 1024px): rechts neben den Pillen der Arten
 * das Segment Raster | Liste und ein Regler für die Kachelgröße; dazu die
 * Listenansicht — je Datei eine Zeile mit Vorschau, Titel, Art, Datum und
 * Größe, nach Monaten gruppiert wie das Raster. Die vier runden Knöpfe unten
 * (Importieren, Aufnehmen, Video, Foto) bleiben, wie sie sind. Am Handy gibt
 * es nichts davon.
 * Pfad: src/features/media/media-desk.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * layouts      -> Beschriftung und Icons des Segments
 * tileRange    -> kleinste und größte Kachelbreite des Reglers und seine Schritte (Pixel)
 * defaultTile  -> Kachelbreite, solange nichts gewählt ist
 *
 * Aussehen in styles/media-desk.css; die Kachelbreite wirkt über
 * --views-media-tile (styles/desk-views.css).
 */

import { dom, el } from "../../core/dom.js";
import { dayMonth, formatBytes, formatClock } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { mediaKinds } from "../../data/config.js";
import { mediaKindOf, placesLabel } from "../../data/queries.js";
import { saveState, scheduleSave, state } from "../../data/state.js";
import { isDesk } from "../../ui/desk-mode.js";
import { entryGlyph } from "../../ui/rows.js";

const layouts = [
  { id: "grid", label: "Raster", icon: "grid" },
  { id: "list", label: "Liste", icon: "list" },
];
const tileRange = { min: 110, max: 260, step: 10 };
const defaultTile = 150;

let tools = null;

/** Liste statt Raster? Nur am Desktop, und nur wenn gewählt. */
export function isMediaList() {
  return isDesk() && state.prefs.media.deskLayout === "list";
}

/* Die Kachelbreite auf die Seite legen; das Raster richtet seine Spalten danach. */
function applyTile() {
  el("view-media").style.setProperty("--views-media-tile", `${state.prefs.media.tileSize || defaultTile}px`);
}

/** Werkzeuge rechts neu setzen: gewähltes Segment, Stand des Reglers. */
export function renderMediaTools() {
  if (!tools) return;
  const current = state.prefs.media.deskLayout || "grid";
  const segment = layouts
    .map(
      (item) =>
        `<button class="tasks-seg-btn${item.id === current ? " is-on" : ""}" type="button" data-media-layout="${item.id}" aria-label="${item.label}" title="${item.label}" aria-pressed="${item.id === current}">${icon(item.icon)}</button>`
    )
    .join("");
  /* input type=range: der Regler für die Kachelgröße — im Listenmodus ohne Wirkung, darum gesperrt */
  tools.innerHTML = `
    <span class="tasks-seg">${segment}</span>
    <label class="media-size" title="Kachelgröße">
      ${icon("photos")}
      <input type="range" min="${tileRange.min}" max="${tileRange.max}" step="${tileRange.step}"
        value="${state.prefs.media.tileSize || defaultTile}" aria-label="Kachelgröße"${current === "list" ? " disabled" : ""} />
    </label>`;
  applyTile();
}

/**
 * Werkzeuge einmal neben den Pillen einhängen.
 * @param redraw zeichnet die Seite neu (nach dem Wechsel Raster | Liste).
 */
export function mountMediaTools(redraw) {
  tools = document.createElement("div");
  tools.className = "media-tools";
  dom.mediaFilters.after(tools);
  tools.addEventListener("click", (event) => {
    const button = event.target.closest("[data-media-layout]");
    if (!button) return;
    state.prefs.media.deskLayout = button.dataset.mediaLayout;
    saveState();
    redraw();
  });
  /* Beim Ziehen nur die Breite nachführen — kein Neuzeichnen, gespeichert wird in Ruhe. */
  tools.addEventListener("input", (event) => {
    state.prefs.media.tileSize = Number(event.target.value);
    applyTile();
    scheduleSave();
  });
  renderMediaTools();
}

/* Eine Zeile der Liste; `data-open-entry` öffnet wie eine Kachel die Datei. */
function mediaRow(entry) {
  const media = entry.media || {};
  const kind = mediaKinds.find((item) => item.id === mediaKindOf(entry));
  const title = escapeHtml(entry.title || media.name || "Ohne Titel");
  const length = media.duration ? formatClock(media.duration) : "";
  return `
    <button class="media-row" type="button" data-open-entry="${entry.id}">
      <span class="media-row-glyph">${entryGlyph(entry)}</span>
      <span class="media-row-title">${title}</span>
      <span class="media-row-cell">${escapeHtml(kind ? kind.label : "")}${length ? ` · ${length}` : ""}</span>
      <span class="media-row-cell">${escapeHtml(placesLabel(entry) || "")}</span>
      <span class="media-row-cell">${entry.createdAt ? escapeHtml(dayMonth(entry.createdAt)) : ""}</span>
      <span class="media-row-cell media-row-size">${media.size ? formatBytes(media.size) : ""}</span>
    </button>`;
}

/** Eine Monatsgruppe als Liste. */
export function mediaListMarkup(items) {
  return `<div class="media-list">${items.map(mediaRow).join("")}</div>`;
}
