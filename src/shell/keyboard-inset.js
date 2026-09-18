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

/** Die Höhe der Tastatur als CSS-Variable bereitstellen. */
export function initKeyboardInset() {
  /* visualViewport: die einzige Quelle für die wirklich sichtbare Höhe am Handy */
  const viewport = window.visualViewport;
  if (!viewport) return;

  const apply = () => {
    const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
  };

  viewport.addEventListener("resize", apply);
  viewport.addEventListener("scroll", apply);
  apply();
}
