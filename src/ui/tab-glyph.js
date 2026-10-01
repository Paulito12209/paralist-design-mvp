/*
 * Das kleine Icon vor dem Namen einer Pille oben in einer Sammlung — oder
 * nichts, wenn die Sammlung unter Einstellungen › Tabs nur Text zeigt
 * (src/data/tab-icons.js).
 * Pfad: src/ui/tab-glyph.js
 *
 * Keine anpassbaren visuellen Werte: Größe und Abstand des Icons stehen in
 * styles/overview.css (.tab-pill-icon).
 */

import { icon } from "../core/html.js";
import { tabIconName } from "../data/tab-icons.js";

/** Markup des Icons; `own` ist das eigene oder vorgegebene Icon der Pille. */
export function tabGlyph(area, own, options) {
  const name = tabIconName(area, own, options);
  return name ? icon(name, "tab-pill-icon") : "";
}
