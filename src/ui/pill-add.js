/*
 * Das kleine Plus am Ende einer Ansichts-Zeile (Aufgaben, Projekte). In der
 * Android- und iOS-Fassung steht „Neue Ansicht“ daneben, damit man ohne
 * Ausprobieren sieht, was es tut; am Desktop und in „Erster Test“ bleibt es
 * beim Plus (styles/overview.css blendet die Beschriftung dort aus).
 * Pfad: src/ui/pill-add.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * addViewText  -> sichtbare Beschriftung neben dem Plus
 * addViewLabel -> Vorlesetext des Knopfs
 */

import { icon } from "../core/html.js";

const addViewText = "Neue Ansicht";
const addViewLabel = "Ansicht hinzufügen";

/** Der Knopf; `dataAttr` sagt list-clicks, welche Seite eine Ansicht bekommt. */
export function addViewPill(dataAttr) {
  return `
    <button class="tab-pill-add" type="button" ${dataAttr} aria-label="${addViewLabel}">
      ${icon("plus")}<span class="tab-pill-add-text" aria-hidden="true">${addViewText}</span>
    </button>`;
}
