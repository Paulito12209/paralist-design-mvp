/*
 * Welche Fassung der App gezeigt wird — je eine fürs Handy und eine für den
 * Computer. „Erster Test“ ist der bisherige Entwurf und gehört zu keiner
 * Plattform; daneben stehen Android und iOS bzw. Windows und macOS. Das
 * Projekt ist eine Sammlung von Entwürfen; die Wahl bleibt gespeichert und gilt dauerhaft, bis
 * man sie unter Einstellungen › Mehr › Versionen ändert. Sichtbar wird sie als
 * data-mobile-os und data-desk-os an <html>; Stile für eine Fassung hängen
 * sich daran, z.B. :root[data-mobile-os="android"] .nav-bar { … }.
 * Reiner Zustand ohne Zugriff auf die Seite: angewendet wird die Wahl in
 * index.html (vor dem ersten Bild) und in src/features/profile/versions.js.
 * Pfad: src/data/platform-versions.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * platforms[*].title    -> Überschrift der Gruppe auf der Unterseite
 * platforms[*].fallback -> welche Fassung gilt, solange nichts gewählt ist
 *                          (dieselbe Vorgabe steht im Skript oben in index.html)
 * platforms[*].options  -> die wählbaren Fassungen: Name und Icon der Zeile;
 *                          `os` und `variant` machen aus einer Fassung eine
 *                          Spielart einer anderen (gleiche Stile, dazu
 *                          data-mobile-variant an <html>, ebenso im Skript in index.html)
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";

export const platforms = [
  {
    id: "mobile",
    title: "Mobil",
    /* Wer den Link zum ersten Mal öffnet, sieht die Android-Fassung */
    fallback: "android",
    options: [
      { id: "erster-test", label: "Erster Test", icon: "pencil" },
      { id: "android", label: "Android", icon: "smartphone" },
      /* Versuch: ohne Symbol „Ansicht“ in der Reiterzeile, stattdessen ein runder
         Knopf mittig über der Leiste (styles/android-view-btn.css) */
      { id: "android-ohne-ansicht", label: "Android (Experiment 1: Ansicht)", icon: "smartphone", os: "android", variant: "ansicht-unten" },
      /* Versuch: Reiter mittig mit Kopieren und „Details“ daneben, die Karte
         „Details“ nur hochgeklappt, „Verknüpfen“ als Knopf links über der
         Leiste (styles/android-details-top.css) */
      { id: "android-details-oben", label: "Android (Experiment 2: Details)", icon: "smartphone", os: "android", variant: "details-oben" },
      { id: "ios", label: "iOS", icon: "smartphone" },
    ],
  },
  {
    id: "desk",
    title: "Desktop",
    fallback: "erster-test",
    options: [
      { id: "erster-test", label: "Erster Test", icon: "pencil" },
      { id: "windows", label: "Windows", icon: "laptop" },
      { id: "macos", label: "macOS", icon: "laptop" },
    ],
  },
];

function platformOf(id) {
  return platforms.find((platform) => platform.id === id);
}

/** Die gewählte Fassung einer Gruppe ("mobile" oder "desk"). */
export function chosenVersion(platformId) {
  const platform = platformOf(platformId);
  if (!platform) return "";
  const saved = readJson(storageKeys.versions, {})[platformId];
  return platform.options.some((option) => option.id === saved) ? saved : platform.fallback;
}

/** Was an <html> steht: die Plattform der Fassung und ihre Spielart ("" für keine). */
export function chosenLook(platformId) {
  const id = chosenVersion(platformId);
  const option = platformOf(platformId)?.options.find((item) => item.id === id);
  return { os: option?.os || id, variant: option?.variant || "" };
}

/** Der Name der gewählten Fassung, z.B. „iOS“ — für die Zeile unter „Mehr“. */
export function chosenLabel(platformId) {
  const id = chosenVersion(platformId);
  return platformOf(platformId)?.options.find((option) => option.id === id)?.label || "";
}

/** Eine Fassung wählen und merken. Unbekannte Werte werden still übergangen. */
export function setVersion(platformId, versionId) {
  const platform = platformOf(platformId);
  if (!platform || !platform.options.some((option) => option.id === versionId)) return;
  const saved = readJson(storageKeys.versions, {});
  writeJson(storageKeys.versions, { ...saved, [platformId]: versionId });
}
