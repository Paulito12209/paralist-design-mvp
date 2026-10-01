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
 * options[*].differences -> was die Spielart anders macht als ihre Fassung: je
 *                          Bereich ein Satz; das ⓘ hinter dem Namen listet sie
 *                          in einem Blatt auf (src/features/profile/versions.js)
 * formerIds             -> frühere Namen von Fassungen und was heute an ihrer Stelle steht
 *
 * Es gibt genau eine Android-Fassung, die später die App wird, und genau eine
 * experimentelle daneben. Neue Versuche kommen in „Android (Experiment)“ und
 * eine Zeile in deren `differences` — keine weitere Fassung.
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
      /* Die Versuche, gesammelt in einer Fassung (styles/android-view-btn.css,
         styles/android-details-top.css) */
      {
        id: "android-experiment",
        label: "Android (Experiment)",
        icon: "smartphone",
        os: "android",
        variant: "experiment",
        differences: [
          { area: "Ansicht", text: "Das Symbol „Ansicht“ sitzt als runder Knopf mittig über der Leiste — statt rechts in der Reiterzeile, in der Kopfzeile einer Sammlung oder neben „KW“." },
          { area: "Eintrag · Verknüpfen", text: "Das Ketten-Symbol steht oben in der Kopfzeile links neben dem Drei-Punkte-Menü statt im Kopf der Karte „Details“." },
          { area: "Eintrag · Details", text: "Ein Tipp auf den Kopf der Karte öffnet ein Blatt von unten mit denselben Angaben, statt die Karte über den Text zu heben. Das Symbol steht direkt hinter „Details“." },
          { area: "Eintrag · Plus-Knopf", text: "„Neu“ bleibt auf gewohnter Höhe und liegt auf dem Kopf der Karte „Details“, statt darüber gehoben zu werden." },
          { area: "Eintrag · Mehr anzeigen", text: "Textknopf in der Akzentfarbe nach Material 3 — im Dunkeln graublau statt Blau." },
        ],
      },
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

/* Frühere Namen: wer eines der beiden Experimente gewählt hatte, landet in „Android (Experiment)“ */
const formerIds = { "android-ohne-ansicht": "android-experiment", "android-details-oben": "android-experiment" };

function platformOf(id) {
  return platforms.find((platform) => platform.id === id);
}

/** Die gewählte Fassung einer Gruppe ("mobile" oder "desk"). */
export function chosenVersion(platformId) {
  const platform = platformOf(platformId);
  if (!platform) return "";
  const stored = readJson(storageKeys.versions, {})[platformId];
  const saved = formerIds[stored] || stored;
  return platform.options.some((option) => option.id === saved) ? saved : platform.fallback;
}

/** Was an <html> steht: die Plattform der Fassung und ihre Spielart ("" für keine). */
export function chosenLook(platformId) {
  const id = chosenVersion(platformId);
  const option = platformOf(platformId)?.options.find((item) => item.id === id);
  return { os: option?.os || id, variant: option?.variant || "" };
}

/** Eine Fassung mit ihren Angaben (Name, Unterschiede) — oder undefined. */
export function versionOption(platformId, versionId) {
  return platformOf(platformId)?.options.find((option) => option.id === versionId);
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
