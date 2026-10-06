/*
 * Die Tastenkürzel mit zwei Tasten am Desktop: Umschalt und Befehlstaste
 * öffnen die vier Seiten (⇧⌘Ü, ⇧⌘K, ⇧⌘A, ⇧⌘M) und klappen das
 * Seitenfenster auf (⇧⌘O); Ctrl und Ziffer öffnen die Sammlungen (⌃1 bis ⌃7).
 * Außerhalb des Macs gilt Strg statt ⌘ und Alt statt Ctrl — Strg und Ziffer
 * wechselt dort schon den Browser-Tab. src/shell/desk.js fragt hier zuerst,
 * bevor die übrigen Kürzel greifen.
 * Pfad: src/shell/desk-combos.js
 *
 * Keine anpassbaren visuellen Werte: welche Taste was öffnet, steht in
 * src/ui/desk-links.js (pageLinks, collectionLinks, sideLink).
 */

import { collectionLinks, isMac, pageLinks, sideLink } from "../ui/desk-links.js";

/*
 * Passt die gedrückte Taste zum Buchstaben? Zuerst das Zeichen — so stimmt es
 * auf jeder Tastaturbelegung; nur wenn die Taste kein einzelnes Zeichen
 * liefert, zählt ihre Lage (`code`).
 */
function matches(event, link) {
  const key = event.key.length === 1 ? event.key.toUpperCase() : "";
  return key ? key === link.letter : event.code === link.code;
}

/* Ctrl am Mac, Alt sonst — jeweils ohne weitere Zusatztaste. */
function isPlaceChord(event) {
  if (event.shiftKey || event.metaKey) return false;
  return isMac ? event.ctrlKey && !event.altKey : event.altKey && !event.ctrlKey;
}

/**
 * Eine Taste mit Zusatztasten prüfen und ausführen.
 * @param actions { openPage(tab), openCollection(id), toggleSide() } aus src/shell/desk.js
 * @returns true, wenn die Taste hier etwas getan hat.
 */
export function onComboKey(event, actions) {
  const command = event.metaKey || event.ctrlKey;
  if (event.shiftKey && command && !event.altKey) {
    const page = pageLinks.find((link) => matches(event, link));
    if (page) actions.openPage(page.tab);
    else if (matches(event, sideLink)) actions.toggleSide();
    else return false;
    return true;
  }
  if (!isPlaceChord(event)) return false;
  /* Die Lage der Ziffer: mit Alt liefert ein Mac sonst Sonderzeichen statt „1“ */
  const digit = /^Digit(\d)$/.exec(event.code)?.[1];
  const link = digit ? collectionLinks.find((item) => item.num === digit) : null;
  if (!link) return false;
  actions.openCollection(link.id);
  return true;
}
