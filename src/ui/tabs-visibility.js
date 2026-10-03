/*
 * Der Schalter „Tabs anzeigen“ im Blatt „Ansicht“ (beide Android-Fassungen):
 * ist er aus, bleibt über der Liste nur die Werkzeugzeile — Archiv,
 * Sortieren, Filtern, Ansicht. Das Blatt über das Symbol „Ansicht“ holt die
 * Reiter wieder zurück. Der Schalter gilt für die Seite, auf der das Blatt
 * offen ist — Übersicht, Seite Projekte, Aufgaben oder die übrigen Sammlungen —
 * und merkt sich seine Wahl je Seite einzeln (src/data/tabs-visibility.js).
 * Ihren Klick behandelt view-panel.js für alle Blätter gemeinsam. Gezeichnet ist
 * die Zeile in jeder Fassung, sichtbar nur in den Android-Fassungen (styles/android-tabs-off.css);
 * dort verstecken die Merkmale data-tabs-home, -projects, -tasks und -pages
 * an <html> die Reiterzeilen der jeweiligen Seite.
 * Beim Laden der Datei werden die Merkmale einmal gesetzt, damit schon das
 * erste Bild stimmt.
 * Pfad: src/ui/tabs-visibility.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * rowLabel -> Beschriftung der Zeile im Blatt „Ansicht“
 * (Ob die Reiter einer Seite ohne eigene Wahl zu sehen sind: src/data/tabs-visibility.js)
 */

import { emit, events } from "../core/bus.js";
import { setTabsOn, tabsOn, tabsScopes } from "../data/tabs-visibility.js";
import { ui } from "../data/state.js";
import { panelToggle } from "./panel-rows.js";
import { isViewActive } from "./views.js";

const rowLabel = "Tabs anzeigen";

/** Zu welcher Seite gehört der Schalter, der gerade zu sehen ist? */
export function tabsScope() {
  if (isViewActive("tasks")) return "tasks";
  if (isViewActive("page")) return ui.currentPage?.kind === "projects" ? "projects" : "pages";
  return "home";
}

/** Sind die Reiter der gerade offenen Seite an? */
export function tabsOnHere() {
  return tabsOn(tabsScope());
}

/**
 * Die Merkmale an <html>, an denen sich die Stile festhalten — eines je Seite.
 * Auch nach einem Wechsel der Fassung aufgerufen, weil sich dabei die Vorgaben ändern.
 */
export function applyTabs() {
  tabsScopes.forEach((scope) => {
    document.documentElement.dataset[`tabs${scope[0].toUpperCase()}${scope.slice(1)}`] = tabsOn(scope) ? "on" : "off";
  });
}
applyTabs();

/** Die Zeile mit dem Schalter, oben im Blatt „Ansicht“. */
export function tabsRowMarkup() {
  return `<div class="details-row tabs-switch-row"><span class="details-row-label">${rowLabel}</span>${panelToggle("tabs", tabsOnHere(), rowLabel)}</div>`;
}

/**
 * Klick auf den Schalter: für die offene Seite umlegen, Merkmal setzen, Listen
 * und Blätter neu zeichnen lassen. Gibt true zurück, wenn der Klick der Schalter war.
 */
export function handleTabsClick(event) {
  if (!event.target.closest('[data-settings="tabs"]')) return false;
  const scope = tabsScope();
  setTabsOn(scope, !tabsOn(scope));
  applyTabs();
  emit(events.tabsVisibilityChanged, { scope, on: tabsOn(scope) });
  emit(events.dataChanged);
  return true;
}
