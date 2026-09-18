/*
 * Welche der sieben Ansichten sichtbar ist. Alle Ansichten stehen fest in
 * index.html; hier wird nur umgeschaltet und gemeldet, dass sich etwas
 * ändert — die Bereiche zeichnen sich dann selbst.
 * Pfad: src/ui/views.js
 *
 * Keine anpassbaren visuellen Werte: das Aussehen der Ansichten steht in
 * styles/base.css (Klasse .view).
 */

import { emit, events } from "../core/bus.js";
import { el, qa } from "../core/dom.js";
import { findEntry } from "../data/queries.js";
import { ui } from "../data/state.js";

/** Die Namen der Ansichten und ihre Abschnitte in index.html. */
export const viewNames = ["home", "page", "entry", "search", "calendar", "media", "settings"];

let activeView = "home";

function sectionOf(name) {
  return el(`view-${name}`);
}

/** Name der gerade sichtbaren Ansicht. */
export function currentView() {
  return activeView;
}

/** Ist diese Ansicht gerade sichtbar? Bereiche zeichnen nur dann neu. */
export function isViewActive(name) {
  return activeView === name;
}

/** Die Markierung in der unteren Navigationsleiste setzen. Leerer Name markiert nichts. */
export function setActiveTab(tab) {
  qa(".tab-btn").forEach((button) => {
    const on = button.dataset.tab === tab;
    button.classList.toggle("is-active", on);
    if (on) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

/**
 * Ansicht umschalten. Vorher schließen sich Eingabefeld und Kontextmenü,
 * danach baut der zuständige Bereich seinen Inhalt auf.
 */
export function showView(name) {
  if (!viewNames.includes(name)) return;
  emit(events.viewWillChange, name);

  viewNames.forEach((item) => {
    const section = sectionOf(item);
    if (!section) return;
    section.hidden = item !== name;
    section.classList.toggle("is-active", item === name);
  });
  activeView = name;

  /* Medien- und Zeichenansicht brauchen eigene Knopfleisten unten:
     die beiden Klassen schalten sie in styles/media.css und styles/drawing.css frei. */
  const entry = name === "entry" ? findEntry(ui.currentEntryId) : null;
  document.body.classList.toggle("is-media", name === "media");
  document.body.classList.toggle("is-drawing", Boolean(entry && entry.type === "zeichnung"));

  emit(events.viewOpened, name);
}
