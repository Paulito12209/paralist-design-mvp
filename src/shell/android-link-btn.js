/*
 * Fassung „Android (Experiment 2: Details)“: der runde Knopf „Verknüpfen“
 * links über der Leiste, gegenüber dem Plus-Knopf — dort, wo auf den
 * Sammlungen der Archiv-Knopf steht. Er ersetzt das Ketten-Symbol im Kopf der
 * Karte „Details“ und öffnet dasselbe Blatt (src/ui/link-sheet.js). Zu sehen
 * ist er nur auf der Seite eines Eintrags; das entscheidet allein
 * styles/android-details-top.css.
 * Pfad: src/shell/android-link-btn.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * buttonLabel -> Vorlesetext und Hinweis des Knopfs
 *
 * Größe, Lage und Farben in styles/android-details-top.css.
 */

import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { findEntry } from "../data/queries.js";
import { ui } from "../data/state.js";
import { openLinkSheet } from "../ui/link-sheet.js";

const buttonLabel = "Verknüpfen";

/** Knopf einhängen. Er hängt an der Leiste, damit er beim Wegscrollen mit ihr nach unten rückt. */
export function initAndroidLinkBtn() {
  const button = document.createElement("button");
  button.className = "m3-link-btn";
  button.type = "button";
  button.setAttribute("aria-label", buttonLabel);
  button.title = buttonLabel;
  button.innerHTML = icon("link");
  button.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (entry) openLinkSheet(entry);
  });
  dom.navShell.append(button);
}
