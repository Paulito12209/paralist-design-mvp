/*
 * Android-Fassung: das Ketten-Symbol „Verknüpfen“
 * oben in der Kopfzeile der Eintragsseite, links neben dem Drei-Punkte-Menü.
 * Es ersetzt das Symbol im Kopf der Karte „Details“ und öffnet dasselbe
 * Blatt (src/ui/link-sheet.js). Den Knopf gibt es immer im Dokument; zu sehen
 * ist er nur in dieser Fassung — das entscheidet allein
 * styles/android-entry.css.
 * Pfad: src/shell/android-link-btn.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * buttonLabel -> Vorlesetext und Hinweis des Knopfs
 *
 * Größe wie alle Knöpfe der Kopfzeile (--head-btn-size, Klasse .head-btn in
 * styles/entry.css), Sichtbarkeit in styles/android-entry.css.
 */

import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { findEntry } from "../data/queries.js";
import { ui } from "../data/state.js";
import { openLinkSheet } from "../ui/link-sheet.js";

const buttonLabel = "Verknüpfen";

/** Knopf links vor das Menü der Kopfzeile hängen. */
export function initAndroidLinkBtn() {
  const button = document.createElement("button");
  button.className = "head-btn entry-link-btn";
  button.type = "button";
  button.setAttribute("aria-label", buttonLabel);
  button.title = buttonLabel;
  button.innerHTML = icon("link");
  button.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (entry) openLinkSheet(entry);
  });
  dom.entryMenu.before(button);
}
