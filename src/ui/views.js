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
import { isDesk } from "./desk-mode.js";

/** Die Namen der Ansichten und ihre Abschnitte in index.html. */
export const viewNames = ["home", "page", "entry", "search", "calendar", "tasks", "media"];

let activeView = "home";
/* Die Seite unter der Suche: von dort wurde sie geöffnet, sie bleibt darunter stehen. */
let searchBase = null;

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

  /* Die Suche legt sich über die Seite, von der aus sie geöffnet wurde
     (styles/search-overlay.css): die bleibt sichtbar darunter, samt ihren
     Klassen am body. Kommt die Suche aus dem Verlauf zurück, liegt sie über
     der Seite, die gerade zu sehen war. Am Desktop steht die Suche als
     eigene Seite in der Spalte, dort bleibt nichts darunter. */
  const search = name === "search";
  if (search && activeView !== "search") searchBase = isDesk() ? null : activeView;
  if (!search) searchBase = null;

  viewNames.forEach((item) => {
    const section = sectionOf(item);
    if (!section) return;
    section.hidden = item !== name && item !== searchBase;
    section.classList.toggle("is-active", item === name);
  });
  activeView = name;
  document.body.classList.toggle("is-search", search);
  if (searchBase) {
    emit(events.viewOpened, name);
    return;
  }

  /* Medien- und Zeichenansicht brauchen eigene Knopfleisten unten:
     die beiden Klassen schalten sie in styles/media.css und styles/drawing.css frei.
     is-search (oben gesetzt) schaltet die Knöpfe der Suche frei (styles/search.css), is-tasks und
     is-calendar das Panel „Ansicht“ über der Navigation (styles/tasks-settings.css,
     styles/calendar.css).
     is-subpage blendet die allgemeine Kopfzeile aus (styles/top-bar.css): eine
     Sammlung, ein Arbeitsbereich und ein Eintrag haben ihre eigene Kopfzeile
     mit dem Zurück-Pfeil, und der gehört ganz nach oben. */
  const entry = name === "entry" ? findEntry(ui.currentEntryId) : null;
  document.body.classList.toggle("is-media", name === "media");
  document.body.classList.toggle("is-drawing", Boolean(entry && entry.type === "zeichnung"));
  document.body.classList.toggle("is-tasks", name === "tasks");
  document.body.classList.toggle("is-calendar", name === "calendar");
  document.body.classList.toggle("is-subpage", name === "page" || name === "entry");

  emit(events.viewOpened, name);
}
