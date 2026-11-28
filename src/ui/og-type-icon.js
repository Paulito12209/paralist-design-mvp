/*
 * Das Symbol eines Typs in der „OG Version“: wie in Organi7er ist ein Projekt
 * dort eine Zielscheibe, nicht die Rakete der übrigen Fassungen. Alle anderen
 * Typen behalten ihr gewohntes Symbol. Eigene Symbole, die man einem Eintrag
 * gegeben hat, gehen immer vor.
 * Pfad: src/ui/og-type-icon.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ogIcons -> welcher Typ in der OG Version ein anderes Symbol bekommt (Name aus assets/icons/sprite*.svg)
 */

import { typeIcon } from "../data/config.js";

const ogIcons = { projekt: "target" };

/** Symbol eines Typs für die OG Version. */
export function ogTypeIcon(type) {
  return ogIcons[type] || typeIcon(type);
}

/** Symbol eines Eintrags für die OG Version: sein eigenes, sonst das seines Typs. */
export function ogEntryIcon(entry) {
  return entry.icon || ogTypeIcon(entry.type);
}
