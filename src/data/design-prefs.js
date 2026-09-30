/*
 * Die Wahlen unter Einstellungen › Design. Reiner Zustand ohne Zugriff auf
 * die Seite: die Hülle (src/shell/nav-bar.js) liest den Verlauf beim Start,
 * die Datenschicht fragt beim Anlegen nach dem Kopf neuer Seiten, geändert
 * wird beides auf der Unterseite (src/features/profile/app-settings.js).
 * Pfad: src/data/design-prefs.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * defaultPageHead -> womit neue Seiten beginnen, solange nichts gewählt ist:
 *                    "icon" (großes Icon über dem Titel) oder "cover" (Farbverlauf)
 */

import { readText, storageKeys, writeText } from "../core/storage.js";

const defaultPageHead = "icon";
const pageHeads = ["cover", "icon"];

/** Ob hinter Leiste und Eingabefeld der helle Verlauf liegt (Voreinstellung: aus). */
export function navGlowOn() {
  return readText(storageKeys.navGlow) === "1";
}

/** Die Wahl merken. */
export function setNavGlowOn(value) {
  writeText(storageKeys.navGlow, value ? "1" : "");
}

/** Womit neue Seiten beginnen: "cover" oder "icon". */
export function pageHeadChoice() {
  const saved = readText(storageKeys.pageHead);
  return pageHeads.includes(saved) ? saved : defaultPageHead;
}

/** Die Wahl merken; die Vorgabe selbst wird nicht gespeichert. */
export function setPageHeadChoice(value) {
  writeText(storageKeys.pageHead, pageHeads.includes(value) && value !== defaultPageHead ? value : "");
}

/**
 * Einer neuen Seite (Eintrag oder Arbeitsbereich) ihren Kopf geben: Cover an
 * oder das Icon `iconName` über dem Titel. Ohne `iconName` (Arbeitsbereiche
 * zeigen kein großes Icon) bleibt es bei „ohne Cover“.
 */
export function applyPageHead(target, iconName = "") {
  if (pageHeadChoice() === "cover") {
    target.cover = true;
    return;
  }
  if (iconName && !target.icon) target.icon = iconName;
}
