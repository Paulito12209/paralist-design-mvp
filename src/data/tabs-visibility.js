/*
 * Ob die Reiter über den Listen zu sehen sind — für jede Seite einzeln:
 * Übersicht (Abschnitt „Projekte“), Seite Projekte, Aufgaben und die übrigen
 * Sammlungen. Reiner Zustand ohne Zugriff auf die Seite: src/ui/tabs-visibility.js
 * liest ihn, legt den Schalter in das Blatt „Ansicht“ und setzt die Merkmale
 * an <html>. Die Wahl wirkt in beiden Android-Fassungen; die Vorgaben unterscheiden sich.
 * Pfad: src/data/tabs-visibility.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tabsDefaults -> ob die Reiter einer Seite ohne gespeicherte Wahl zu sehen sind
 *                 (true = sichtbar). „Android“: überall an. „Android (Experiment)“:
 *                 nur auf der Übersicht aus, sonst an
 */

import { readText, storageKeys, writeText } from "../core/storage.js";
import { chosenLook } from "./platform-versions.js";

/** Die Seiten, für die der Schalter einzeln gilt. */
export const tabsScopes = ["home", "projects", "tasks", "pages"];

const tabsDefaults = {
  android: { home: true, projects: true, tasks: true, pages: true },
  experiment: { home: false, projects: true, tasks: true, pages: true },
};

/* Je Seite ein eigener Speicherplatz. */
const storageKey = (scope) => `${storageKeys.tabsVisible}-${scope}`;

/** Sind die Reiter dieser Seite an? Ohne gespeicherte Wahl: der Vorgabewert. */
export function tabsOn(scope) {
  const saved = readText(storageKey(scope));
  if (saved === "on") return true;
  if (saved === "off") return false;
  /* Die Fassung wird bei jedem Aufruf gelesen: wer sie wechselt, behält seine Wahl, nur die Vorgabe ändert sich */
  const defaults = tabsDefaults[chosenLook("mobile").variant] || tabsDefaults.android;
  return defaults[scope] ?? true;
}

/** Die Wahl für diese Seite merken. */
export function setTabsOn(scope, on) {
  writeText(storageKey(scope), on ? "on" : "off");
}
