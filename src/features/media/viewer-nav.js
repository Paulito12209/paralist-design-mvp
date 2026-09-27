/*
 * Blättern in der Dateiansicht: zur vorigen und nächsten Datei — über zwei
 * dezente Pfeile am Rand, waagerechtes Wischen oder die Pfeiltasten.
 * Die Reihenfolge ist dieselbe wie im Medien-Raster mit der gewählten
 * Filter-Pille: nach links wischen zeigt die ältere, nach rechts die neuere.
 * Pfad: src/features/media/viewer-nav.js
 *
 * Keine anpassbaren visuellen Werte: Größe und Deckkraft der Pfeile stehen in
 * styles/tokens-pages.css (--viewer-nav-size, --viewer-nav-opacity), die
 * Wisch-Grenzen in src/ui/pill-swipe.js.
 */

import { icon } from "../../core/html.js";
import { mediaEntries, mediaKindOf } from "../../data/queries.js";
import { state } from "../../data/state.js";

/** Die Medien in der Reihenfolge des Rasters — wie media.js sie für die aktive Pille zeigt. */
export function siblingIds() {
  const filter = state.prefs.media.filter;
  const all = mediaEntries();
  const list = filter === "recent" ? all : all.filter((entry) => mediaKindOf(entry) === filter);
  return list.map((entry) => String(entry.id));
}

/** Die ID der Datei `step` Plätze weiter (−1 = davor), oder null am Anfang bzw. Ende. */
export function neighborId(id, step) {
  const ids = siblingIds();
  const index = ids.indexOf(String(id));
  if (index < 0) return null;
  return ids[index + step] ?? null;
}

/** Die beiden Pfeile, links und rechts über der Datei. */
export function navMarkup() {
  return `
    <button class="viewer-nav viewer-nav-prev" type="button" data-viewer="prev" aria-label="Vorige Datei">${icon("chevron")}</button>
    <button class="viewer-nav viewer-nav-next" type="button" data-viewer="next" aria-label="Nächste Datei">${icon("chevron")}</button>`;
}

/** Pfeile ausblenden, wo es nicht weitergeht. */
export function updateNav(root, id) {
  root.querySelector(".viewer-nav-prev").hidden = neighborId(id, -1) === null;
  root.querySelector(".viewer-nav-next").hidden = neighborId(id, 1) === null;
}
