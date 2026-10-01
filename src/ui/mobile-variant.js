/*
 * Welche Spielart der Handy-Fassung gerade zu sehen ist (Einstellungen › Mehr
 * › Versionen). Eine Spielart teilt die Stile ihrer Fassung und steht
 * zusätzlich als data-mobile-variant an <html> — gesetzt in index.html vor dem
 * ersten Bild und in src/features/profile/versions.js beim Umschalten:
 * „experiment“ für „Android (Experiment)“. Sie gilt nur unterhalb der Desktop-Breite; darüber zeigt die App
 * immer ihre Desktop-Fassung. Die Stile hängen sich direkt an das Attribut;
 * hier fragen Seiten nach, wenn sie etwas anders zeichnen müssen.
 * Pfad: src/ui/mobile-variant.js
 *
 * Keine anpassbaren visuellen Werte: die Spielarten stehen in
 * src/data/platform-versions.js.
 */

import { isDesk } from "./desk-mode.js";

/** Ist gerade die Spielart `name` (z.B. "experiment") am Handy oder Tablet zu sehen? */
export function isMobileVariant(name) {
  return document.documentElement.dataset.mobileVariant === name && !isDesk();
}
