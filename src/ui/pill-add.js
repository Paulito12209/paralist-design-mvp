/*
 * Das kleine Plus am Ende einer Reiterzeile (Ansichten von Aufgaben und
 * Projekten, Tabs der Arbeitsbereiche). In der Android- und iOS-Fassung steht
 * bei den Ansichten „Neue Ansicht“ daneben, damit man ohne Ausprobieren sieht,
 * was es tut; am Desktop und in „Erster Test“ bleibt es beim Plus
 * (styles/overview.css blendet die Beschriftung dort aus).
 *
 * Aufgebaut ist es aus drei Geschwistern statt einem Knopf: Plus, unsichtbare
 * Marke, Beschriftung. Nur so kann das Plus allein am rechten Rand einrasten
 * (position: sticky), während die Beschriftung mit den Reitern wegscrollt —
 * styles/android-tab-snap.css. Die Marke sitzt genau hinter dem Plus; an ihr
 * erkennt src/ui/pill-snap.js, ob das Plus gerade festgehalten wird.
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

/**
 * Plus, Marke und (optional) Beschriftung. `dataAttr` sagt list-clicks, was ein
 * Tipp tut; er steht auch an der Beschriftung, damit ein Tipp darauf dasselbe auslöst.
 * Ohne `text` bleibt es beim Plus (Tabs der Arbeitsbereiche).
 */
export function addPill(dataAttr, label, text = "") {
  const caption = text
    ? `<span class="tab-pill-add-text" ${dataAttr} aria-hidden="true">${text}</span>`
    : "";
  return `
    <button class="tab-pill-add" type="button" ${dataAttr} aria-label="${label}">${icon("plus")}</button>
    <span class="tab-pill-add-edge" aria-hidden="true"></span>${caption}`;
}

/** Der Knopf „Neue Ansicht“; `dataAttr` sagt list-clicks, welche Seite eine Ansicht bekommt. */
export function addViewPill(dataAttr) {
  return addPill(dataAttr, addViewLabel, addViewText);
}
