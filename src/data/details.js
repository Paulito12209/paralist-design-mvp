/*
 * Der Typname eines Eintrags in der Einzahl — für die Zeile „Typ“ im Blatt
 * „Details“ (src/data/entry-facts.js) und überall, wo ein Eintrag nach
 * seiner Art benannt wird.
 * Pfad: src/data/details.js
 *
 * Keine anpassbaren Werte: die Typnamen in der Einzahl („Projekt“, „Medium“)
 * stehen in src/data/config.js (typeSingulars).
 */

import { typeSingular } from "./config.js";

/** Der Typname eines Eintrags in der Einzahl, z.B. „Notiz“, „Projekt“ oder „Medium“. */
export function entryTypeName(entry) {
  return typeSingular(entry.type);
}
