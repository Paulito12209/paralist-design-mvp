/*
 * Ob beim Öffnen der Suche sofort die Tastatur aufgeht. Vorgabe: aus — die
 * Suche zeigt dann erst „Zuletzt geöffnet“, der schnellste Weg zurück zu dem,
 * woran man zuletzt gearbeitet hat; die Tastatur holt die Pille „Suchen“.
 * Reiner Zustand ohne Zugriff auf die Seite: gelesen wird er vom Suchfeld
 * (src/shell/search-bar.js), von der Zieh-Geste (src/ui/pull-search.js) und
 * vom Suchknopf der Seiten (src/features/overview/page.js), geändert auf der
 * Unterseite App-Einstellungen (src/features/profile/app-settings.js).
 * Pfad: src/data/search-keyboard.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { readText, storageKeys, writeText } from "../core/storage.js";

/** Ob die Tastatur beim Öffnen der Suche sofort aufgeht (Voreinstellung: aus). */
export function searchKeyboardOn() {
  return readText(storageKeys.searchKeyboard) === "1";
}

/** Die Wahl merken. */
export function setSearchKeyboardOn(value) {
  writeText(storageKeys.searchKeyboard, value ? "1" : "");
}
