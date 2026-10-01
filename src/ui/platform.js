/*
 * Welche Fassung gerade zu sehen ist (Einstellungen › Mehr › Versionen). Die
 * Wahl steht als data-mobile-os an <html>; sie gilt nur unterhalb der
 * Desktop-Breite — darüber zeigt die App immer ihre Desktop-Fassung.
 * Pfad: src/ui/platform.js
 *
 * Keine anpassbaren visuellen Werte: die Fassungen stehen in
 * src/data/platform-versions.js.
 */

import { isDesk } from "./desk-mode.js";

/** Ist gerade die Fassung `os` ("android", "ios") am Handy oder Tablet zu sehen? */
export function isMobileOs(os) {
  return document.documentElement.dataset.mobileOs === os && !isDesk();
}
