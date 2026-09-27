/*
 * Blättern in der Dateiansicht: zur vorigen und nächsten Datei — über zwei
 * dezente Pfeile am Rand, waagerechtes Wischen oder die Pfeiltasten.
 * Geblättert wird nur durch die Reihe, aus der die Datei geöffnet wurde: auf
 * der Medien-Seite alle Kacheln der gewählten Filter-Pille, unter „Verknüpfte
 * Einträge“ nur die Medien dieses einen Eintrags. Ohne Reihe (z.B. „Ansehen“
 * nach dem Anlegen) gibt es keine Pfeile.
 * Pfad: src/features/media/viewer-nav.js
 *
 * Keine anpassbaren visuellen Werte: Größe und Deckkraft der Pfeile stehen in
 * styles/tokens-pages.css (--viewer-nav-size, --viewer-nav-opacity), die
 * Wisch-Grenzen in src/ui/pill-swipe.js.
 */

import { icon } from "../../core/html.js";
import { findEntry } from "../../data/queries.js";

/** Die noch vorhandenen Dateien der Reihe — gelöschte und archivierte fallen heraus. */
function liveIds(list) {
  return list.map(String).filter((id) => {
    const entry = findEntry(id);
    return entry && !entry.archived;
  });
}

/** Die ID der Datei `step` Plätze weiter in `list` (−1 = davor), oder null am Anfang bzw. Ende. */
export function neighborId(list, id, step) {
  const ids = liveIds(list);
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
export function updateNav(root, list, id) {
  root.querySelector(".viewer-nav-prev").hidden = neighborId(list, id, -1) === null;
  root.querySelector(".viewer-nav-next").hidden = neighborId(list, id, 1) === null;
}
