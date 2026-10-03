/*
 * Ob die Reiter über den Listen (Projekte, Aufgaben, Sammlungen) zu sehen sind.
 * Reiner Zustand ohne Zugriff auf die Seite: src/ui/tabs-visibility.js liest
 * ihn, legt den Schalter in das Blatt „Ansicht“ und setzt das Merkmal an <html>.
 * Die Wahl gilt für alle Listen zugleich und wirkt nur in „Android (Experiment)“.
 * Pfad: src/data/tabs-visibility.js
 *
 * Keine anpassbaren visuellen Werte. Vorgabe: Reiter sichtbar.
 */

import { readText, storageKeys, writeText } from "../core/storage.js";

/** Sind die Reiter an? Ohne gespeicherte Wahl: ja. */
export function tabsOn() {
  return readText(storageKeys.tabsHidden) !== "1";
}

/** Die Wahl merken. */
export function setTabsOn(on) {
  writeText(storageKeys.tabsHidden, on ? "" : "1");
}
