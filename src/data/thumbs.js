/*
 * Vorschaubilder je Eintrag: { "12": "data:image/jpeg;base64,…" }.
 * Sie liegen getrennt vom übrigen Zustand, weil sie viel Platz brauchen und
 * sonst bei jedem Speichern mitgeschrieben würden.
 * Zeichnungen liegen unter derselben Nummer, nur als PNG in voller Größe.
 * Pfad: src/data/thumbs.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";

let thumbs = {};

/** Vorschaubild eines Eintrags oder `undefined`. */
export function thumbOf(id) {
  return thumbs[id];
}

/** Vorschaubild setzen. Gespeichert wird erst mit `saveThumbs`. */
export function setThumb(id, dataUrl) {
  thumbs[id] = dataUrl;
}

/** Beim Start einlesen. */
export function loadThumbs() {
  const saved = readJson(storageKeys.media, {});
  thumbs = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
}

/** Schreiben. Ist der Speicher voll, gelten neue Vorschauen nur bis zum Neuladen. */
export function saveThumbs() {
  writeJson(storageKeys.media, thumbs);
}

/**
 * Gelöschte Einträge nehmen ihr Vorschaubild mit.
 * Wird nur nach dem Löschen aufgerufen, nicht bei jedem Speichern:
 * der Vergleich geht über alle Einträge und alle Bilder.
 */
export function pruneThumbs(entries) {
  const alive = new Set(entries.map((entry) => String(entry.id)));
  let changed = false;
  Object.keys(thumbs).forEach((id) => {
    if (alive.has(id)) return;
    delete thumbs[id];
    changed = true;
  });
  if (changed) saveThumbs();
}
