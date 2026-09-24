/*
 * Bildschirmtastatur. Handy-Browser schieben die Seite nicht hoch, sondern
 * verkleinern nur den sichtbaren Bereich. Ohne diese Zeilen läge die untere
 * Leiste beim Tippen hinter der Tastatur. Außerdem wird gemeldet, wann die
 * Tastatur auf- und zugeht (events.keyboardOpened / keyboardClosed, ui.keyboardOpen).
 * Pfad: src/shell/keyboard-inset.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --keyboard-inset (styles/tokens.css) -> wird hier gesetzt und in
 *   styles/navigation.css und styles/composer.css verwendet
 * KEYBOARD_MIN_PX -> ab so viel verdeckter Höhe gilt die Tastatur als offen;
 *   weniger ist nur eine Vorschlagsleiste (Tastatur am Kabel) oder ein Rundungsrest
 */

import { emit, events } from "../core/bus.js";
import { ui } from "../data/state.js";

const KEYBOARD_MIN_PX = 80;

/** Die Höhe der Tastatur als CSS-Variable bereitstellen und melden, ob sie offen ist. */
export function initKeyboardInset() {
  /* visualViewport: die einzige Quelle für die wirklich sichtbare Höhe am Handy */
  const viewport = window.visualViewport;
  if (!viewport) return;

  const apply = () => {
    const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);

    /* Offen oder zu nicht an `inset` ablesen: schreibt man weit unten, schiebt
       der Browser die Seite hoch, bis ihr unterer Rand über der Tastatur steht —
       dann ist `inset` 0, obwohl die Tastatur noch da ist. Die verdeckte Höhe
       selbst bleibt dabei gleich; `scale` rechnet ein Heranzoomen heraus. */
    const open = window.innerHeight - viewport.height * viewport.scale > KEYBOARD_MIN_PX;
    if (open === ui.keyboardOpen) return;
    ui.keyboardOpen = open;
    /* Wird die Tastatur weggewischt statt mit einem Tipp geschlossen, bleibt
       das Feld oft noch fokussiert: events.keyboardClosed meldet trotzdem,
       dass sie weg ist, damit src/shell/search-bar.js und src/shell/writing.js
       den Cursor aus dem Feld nehmen. */
    emit(open ? events.keyboardOpened : events.keyboardClosed);
  };

  viewport.addEventListener("resize", apply);
  viewport.addEventListener("scroll", apply);
  apply();
}
