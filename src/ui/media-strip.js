/*
 * Die Medien unter „Verknüpfte Einträge“: je Art eine kleine Überschrift und
 * darunter eine Reihe Kacheln, die sich seitlich schieben lässt. So bleibt ein
 * Eintrag mit vielen Fotos kurz, statt die Seite mit Zeilen vollzuschreiben.
 * Pfad: src/ui/media-strip.js
 *
 * ANPASSBARE WERTE (in src/data/config.js)
 * -----------------------------------
 * mediaKinds -> welche Arten in welcher Reihenfolge untereinander stehen
 *
 * Kachelgröße (80 × 80 px), Fugen und die Schriftgröße der kleinen Überschrift stehen in
 * styles/media.css (--media-strip-width, --media-strip-gap, --media-kind-size).
 */

import { escapeHtml } from "../core/html.js";
import { mediaKinds } from "../data/config.js";
import { mediaKindOf } from "../data/queries.js";
import { mediaCell } from "./media-cell.js";

/* Eine Kachel mit ihrem Namen darunter — anders als auf der Medien-Seite, wo
   die Kacheln dicht an dicht liegen und der Name erst beim Öffnen kommt. */
function stripItem(entry) {
  const media = entry.media || {};
  const title = escapeHtml(entry.title || media.name || "Ohne Titel");
  return `
    <div class="media-strip-item">
      ${mediaCell(entry, false)}
      <span class="media-strip-name">${title}</span>
    </div>
  `;
}

/** Alle Medien einer Liste, nach Art untereinander. Leere Arten fallen weg. */
export function mediaStripsMarkup(list) {
  return mediaKinds
    .map((kind) => {
      const items = list.filter((entry) => mediaKindOf(entry) === kind.id);
      if (!items.length) return "";
      return `
        <div class="media-kind">
          <h3 class="media-kind-title">${kind.label}</h3>
          <div class="media-strip">${items.map(stripItem).join("")}</div>
        </div>
      `;
    })
    .join("");
}
