/*
 * Bildschirmtastatur. Handy-Browser schieben die Seite nicht hoch, sondern
 * verkleinern nur den sichtbaren Bereich. Ohne diese Zeilen läge die untere
 * Leiste beim Tippen hinter der Tastatur.
 * Pfad: src/shell/keyboard-inset.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --keyboard-inset (styles/tokens.css) -> wird hier gesetzt und in
 *   styles/navigation.css und styles/composer.css verwendet
 */

import { emit, events } from "../core/bus.js";

/** Die Höhe der Tastatur als CSS-Variable bereitstellen. */
export function initKeyboardInset() {
  /* visualViewport: die einzige Quelle für die wirklich sichtbare Höhe am Handy */
  const viewport = window.visualViewport;
  if (!viewport) return;

  const apply = () => {
    const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
    /* Wird die Tastatur weggewischt statt mit einem Tipp geschlossen, bleibt
       das Feld oft noch fokussiert: events.keyboardClosed meldet trotzdem,
       dass sie weg ist, damit src/shell/search-bar.js den Cursor nachzieht. */
    if (inset === 0) emit(events.keyboardClosed);
  };

  viewport.addEventListener("resize", apply);
  viewport.addEventListener("scroll", apply);
  apply();
}
