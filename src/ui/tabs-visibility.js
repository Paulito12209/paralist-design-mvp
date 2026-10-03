/*
 * Der Schalter „Reiter anzeigen“ im Blatt „Ansicht“ (Android (Experiment)):
 * ist er aus, bleibt über jeder Liste nur die Werkzeugzeile — Archiv,
 * Sortieren, Filtern, Ansicht. Das Blatt über das Symbol „Ansicht“ holt die
 * Reiter wieder zurück. Die Zeile steht in den Blättern von Projekten,
 * Aufgaben und den übrigen Sammlungen; ihren Klick behandelt view-panel.js
 * für alle gemeinsam. Gezeichnet ist die Zeile in jeder Fassung, sichtbar nur im
 * Experiment (styles/android-tabs-off.css); dort versteckt auch das Merkmal
 * data-tabs="off" an <html> die Reiterzeilen.
 * Beim Laden der Datei wird das Merkmal einmal gesetzt, damit schon das
 * erste Bild stimmt.
 * Pfad: src/ui/tabs-visibility.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabel -> Beschriftung der Zeile im Blatt „Ansicht“
 */

import { emit, events } from "../core/bus.js";
import { setTabsOn, tabsOn } from "../data/tabs-visibility.js";
import { panelToggle } from "./panel-rows.js";

const rowLabel = "Reiter anzeigen";

/* Das Merkmal an <html>, an dem sich die Stile festhalten. */
function applyTabs() {
  document.documentElement.dataset.tabs = tabsOn() ? "on" : "off";
}
applyTabs();

/** Die Zeile mit dem Schalter, oben im Blatt „Ansicht“. */
export function tabsRowMarkup() {
  return `<div class="details-row tabs-switch-row"><span class="details-row-label">${rowLabel}</span>${panelToggle("tabs", tabsOn(), rowLabel)}</div>`;
}

/**
 * Klick auf den Schalter: umlegen, Merkmal setzen, Listen und Blätter neu
 * zeichnen lassen. Gibt true zurück, wenn der Klick der Schalter war.
 */
export function handleTabsClick(event) {
  if (!event.target.closest('[data-settings="tabs"]')) return false;
  setTabsOn(!tabsOn());
  applyTabs();
  emit(events.tabsVisibilityChanged, tabsOn());
  emit(events.dataChanged);
  return true;
}
