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
      /* Die Versuche, gesammelt in einer Fassung (styles/android-segmented.css, styles/android-view-btn.css) */
      {
        id: "android-experiment",
        label: "Android (Experiment)",
        icon: "smartphone",
        os: "android",
        variant: "experiment",
        differences: [
          { area: "Ansicht", text: "Das Symbol „Ansicht“ steht nicht mehr in der Reiterzeile oder der Kopfzeile einer Sammlung; das Blatt öffnet das Symbol in der Werkzeugzeile unter den Reitern (der Kalender hat keine solche Zeile: dort steht es rechts neben seinen Reitern, im Stundenraster neben „KW“)." },
          { area: "Reiter", text: "Die Reiter (Projekte, Aufgaben, Medien, Arbeitsbereiche, Kalender …) liegen wie in der iOS-Fassung in einer grauen Kapsel, der gewählte hell darauf — statt reinem Text mit Linie darunter." },
          { area: "Neu anlegen", text: "Im Eingabe-Blatt steht statt „Speichern“ ein Mikrofon neben einem runden Pfeil-Knopf: grau, solange nichts getippt oder angehängt ist, danach gefärbt." },
          { area: "Einstellungen", text: "Die Einstellungsseite folgt den Google-Einstellungen: runder Zurück-Knopf, der Seitenname groß darunter, Bild und Name als schlichte Zeile, die Zeilen ohne Icons und Pfeile in Gruppen mit stark gerundeten Außenecken." },
          { area: "Übersicht", text: "Sichtbare Abstände: Suchleiste → Überschrift 32, Überschrift → Kacheln 24, Kacheln → „Projekte“ 32, „Projekte“ → Reiter 16 Pixel." },
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
