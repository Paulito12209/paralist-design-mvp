/*
 * Tasten-Schilder („N“, „G I“, „⌘K“, „1“, „Enter“) als HTML. Liegt in
 * src/ui/, weil Seitenleiste, Reiterzeile, Such-Palette und Profil sie nutzen.
 * Pfad: src/ui/key-caps.js
 *
 * Keine anpassbaren visuellen Werte: Schrift, Rahmen und Farben der Schilder
 * stehen in styles/desk-kbd.css.
 */

import { escapeHtml } from "../core/html.js";

/**
 * Ein Tasten-Schild.
 * @param text       was auf der Taste steht („N“, „G I“, „⌘K“, „Enter“)
 * @param extraClass weitere Klassen mit führendem Leerzeichen, z.B. " desk-kbd-inverse"
 * @param spoken     true, wenn Vorlesehilfen die Taste hören sollen (Liste der
 *   Kurzbefehle); sonst ist das Schild stumm — der Knopf sagt es schon über
 *   aria-keyshortcuts.
 */
export function keyCap(text, extraClass = "", spoken = false) {
  const voice = spoken ? "" : ' aria-hidden="true"';
  return `<kbd class="desk-kbd${extraClass}"${voice}>${escapeHtml(text)}</kbd>`;
}
