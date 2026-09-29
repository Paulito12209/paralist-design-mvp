/*
 * Ob die blauen Tasten-Schilder am Desktop zu sehen sind — getrennt für die
 * Seitenleiste (samt „⌘K“ im Suchfeld) und die Reiterzeile. Reiner Zustand
 * ohne Zugriff auf die Seite: src/shell/desk.js liest ihn und blendet die
 * Schilder aus, Profil › Kurzbefehle (src/features/profile/shortcuts.js)
 * ändert ihn über die zwei Schalter.
 * Pfad: src/data/shortcut-hints.js
 *
 * Keine anpassbaren visuellen Werte. Voreinstellung: beide an.
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";

/** Die beiden Orte mit Schildern, wie sie im Speicher heißen. */
export const hintPlaces = ["nav", "tabs"];

/** Sind die Schilder an diesem Ort („nav“ oder „tabs“) zu sehen? */
export function hintsShown(place) {
  const saved = readJson(storageKeys.deskHints, {}) || {};
  return saved[place] !== false;
}

/** Die Wahl für einen Ort merken. */
export function setHintsShown(place, shown) {
  const saved = readJson(storageKeys.deskHints, {}) || {};
  writeJson(storageKeys.deskHints, { ...saved, [place]: shown });
}
