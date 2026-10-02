/*
 * Einstellungen › Tabs: wo eine neue Ansicht in der Pillenzeile erscheint —
 * vor der festen Ansicht „Alle“ oder ganz rechts am Ende. Gilt für Projekte
 * und Aufgaben. Reiner Zustand ohne Zugriff auf die Seite; geändert wird es
 * auf der Unterseite (tabsCard in src/features/profile/app-settings.js).
 * Der Knopf „Neue Ansicht“ steht davon unberührt immer hinter der letzten Pille.
 * Pfad: src/data/view-place.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * startValue -> gemerkter Wert für „vor Alle“; jeder andere Wert (Vorgabe) heißt „am Ende“
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";

const startValue = "start";

/** Kommen neue Ansichten vor „Alle“? Vorgabe: nein, ans Ende. */
export function newViewAtStart() {
  return readJson(storageKeys.newViewPlace, "") === startValue;
}

/** Die Wahl merken. */
export function setNewViewAtStart(atStart) {
  writeJson(storageKeys.newViewPlace, atStart ? startValue : "end");
}

/** Die feste Ansicht „Alle“ einer Liste — im Zweifel die erste. */
export function fixedViewOf(views) {
  return views.find((view) => view.fixed) || views[0];
}

/** Der Platz, an dem eine neue Ansicht eingereiht wird: vor „Alle“ oder am Ende. */
export function newViewIndex(views) {
  return newViewAtStart() ? views.indexOf(fixedViewOf(views)) : views.length;
}
