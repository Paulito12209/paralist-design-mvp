/*
 * Aus Dateien Medien-Einträge machen: jede Datei wird ein Eintrag im
 * Eingang, Bilder und Videos bekommen eine Vorschau, die Datei selbst kommt
 * in die Browser-Datenbank. Gebraucht von der Medien-Seite
 * (src/features/media/media-import.js), der Aufnahme und von „Anhang“ in
 * einer Zeichnung (src/features/drawing/draw-attach.js) — darum hier in der
 * Datenschicht und nicht in einem der Bereiche.
 * Pfad: src/data/media-add.js
 *
 * Keine anpassbaren visuellen Werte: die Größe der Vorschaubilder steht in
 * src/data/files.js (thumbSize), die Ablage der Dateien in src/core/blobs.js.
 */

import { putBlob } from "../core/blobs.js";
import { emit, events } from "../core/bus.js";
import { load } from "../core/lazy.js";
import { saveState, state } from "./state.js";
import { saveThumbs, setThumb } from "./thumbs.js";
import { logXp } from "./xp.js";

/**
 * Jede Datei wird ein Medien-Eintrag im Eingang. Gibt die neuen Einträge zurück.
 * @param source "photo", "video", "audio" oder "import" — woher die Datei kommt.
 * @param extra optional: `body` (Text zum Eintrag) und
 *   `duration` in Sekunden, wenn die Datei ihre Länge selbst nicht verrät.
 */
export async function addMediaFiles(fileList, source, extra = {}) {
  const files = Array.from(fileList || []);
  if (!files.length) return [];
  const { describeFile } = await load("files");
  const added = [];

  for (const file of files) {
    const described = await describeFile(file, source);
    const entry = {
      id: state.nextEntryId++,
      type: "medien",
      title: described.title,
      body: extra.body || "",
      places: [],
      links: [],
      archived: false,
      favorite: false,
      createdAt: Date.now(),
      media: {
        kind: described.kind,
        name: described.name,
        size: described.size,
        mime: described.mime,
        duration: described.duration || extra.duration || 0,
      },
    };
    if (described.thumb) setThumb(entry.id, described.thumb);
    /* Die Datei selbst kommt in die Browser-Datenbank — nur so lässt sie sich
       später in der Dateiansicht wirklich zeigen und abspielen. */
    await putBlob(entry.id, file);
    state.entries.push(entry);
    added.push(entry);
    logXp("created", "medien", entry.title);
  }

  saveThumbs();
  saveState();
  emit(events.xpChanged);
  emit(events.dataChanged);
  return added;
}
