/*
 * Fassung „Android (Experiment 1: Ansicht)“: der runde Knopf „Ansicht“ mittig über der
 * Leiste. Er ersetzt das Symbol rechts in der Reiterzeile (bzw. in der
 * Kopfzeile und neben „KW“) — oben bleibt die Zeile ganz den Reitern. Ein Tipp
 * holt wie das Symbol das Blatt der offenen Seite herauf; das erledigt der
 * gemeinsame Zuhörer in src/ui/view-panel.js über data-view-panel-open.
 * Wann er zu sehen ist, entscheidet allein styles/android-view-btn.css.
 * Pfad: src/shell/android-view-btn.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * buttonLabel -> Vorlesetext und Hinweis des Knopfs
 *
 * Größe, Lage und Farben in styles/android-view-btn.css.
 */

import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";

const buttonLabel = "Ansicht";

/** Knopf einhängen. Er hängt an der Leiste, damit er beim Wegscrollen mit ihr nach unten rückt. */
export function initAndroidViewBtn() {
  const button = document.createElement("button");
  button.className = "m3-view-btn";
  button.type = "button";
  button.dataset.viewPanelOpen = "";
  button.setAttribute("aria-label", buttonLabel);
  button.title = buttonLabel;
  button.innerHTML = icon("panel-open");
  dom.navShell.append(button);
}
