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
 * platforms[*].options  -> die wählbaren Fassungen: Name und Icon der Zeile
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";

export const platforms = [
  {
    id: "mobile",
    title: "Mobil",
    fallback: "erster-test",
    options: [
      { id: "erster-test", label: "Erster Test", icon: "pencil" },
      { id: "android", label: "Android", icon: "smartphone" },
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
