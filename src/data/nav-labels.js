/*
 * Ob unter den Icons der unteren Navigation zusätzlich die Namen stehen.
 * Reiner Zustand ohne Zugriff auf die Seite: die Navigationsleiste
 * (src/shell/nav-bar.js) liest ihn beim Start, das Einstellungs-Blatt
 * (src/features/profile/nav-labels.js) ändert ihn über die Toggle-Zeile.
 * Pfad: src/data/nav-labels.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { readText, storageKeys, writeText } from "../core/storage.js";

/** Ob die Namen zusätzlich zu den Icons zu sehen sind (Voreinstellung: aus). */
export function navLabelsOn() {
  return readText(storageKeys.navLabels) === "1";
}

/** Die Wahl merken. */
export function setNavLabelsOn(value) {
  writeText(storageKeys.navLabels, value ? "1" : "");
}
