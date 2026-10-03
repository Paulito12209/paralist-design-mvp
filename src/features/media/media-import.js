/*
 * Dateien auf der Medien-Seite hinzufügen: aus jeder Datei wird ein
 * Medien-Eintrag im Eingang, Bilder und Videos bekommen eine Vorschau.
 * Die Leiste unten öffnet direkt die Dateiauswahl (Ordner), die Kamera für
 * Video oder Foto und für Audio die eigene Aufnahme (src/features/media/recorder.js).
 * Pfad: src/features/media/media-import.js
 *
 * Keine anpassbaren visuellen Werte: die Größe der Vorschaubilder steht in
 * src/data/files.js (thumbSize), die Ablage der Dateien in src/core/blobs.js.
 */

import { putBlob } from "../../core/blobs.js";
import { emit, events } from "../../core/bus.js";
import { el } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { saveState, state } from "../../data/state.js";
import { saveThumbs, setThumb } from "../../data/thumbs.js";
import { logXp } from "../../data/xp.js";

/** Die drei Quellen mit unsichtbarem Dateifeld in index.html; Audio nimmt die App selbst auf. */
export const mediaSources = ["photo", "video", "import"];

/**
 * Jede Datei wird ein Medien-Eintrag im Eingang.
 * @param extra optional: `body` (z.B. die Mitschrift einer Aufnahme) und
 *   `duration` in Sekunden, wenn die Datei ihre Länge selbst nicht verrät.
 */
export async function addMediaFiles(fileList, source, extra = {}) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const { describeFile } = await load("files");

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
    logXp("created", "medien", entry.title);
  }

  saveThumbs();
  saveState();
  emit(events.xpChanged);
  emit(events.dataChanged);
}

/**
 * Klicks auf [data-media-pick] in einem Bereich an die Dateifelder weiterreichen.
 * Gebraucht für die Leiste über der Navigation und für die Pille im
 * Platzhalter, solange die Medien-Seite noch leer ist.
 */
export function bindMediaPicks(scope) {
  scope.addEventListener("click", (event) => {
    const button = event.target.closest("[data-media-pick]");
    if (!button) return;
    /* Nur ein echter Klick auf ein input[type=file] öffnet Kamera oder Dateiauswahl. */
    el(`media-file-${button.dataset.mediaPick}`).click();
  });
}

/** Die Leiste über der Navigation und die Dateifelder anmelden. */
export function initMediaImport(mediaActions) {
  bindMediaPicks(mediaActions);
  /* Audio: kein Dateifeld, sondern gleich die Aufnahme als Overlay */
  mediaActions.addEventListener("click", (event) => {
    if (event.target.closest("[data-media-record]")) load("recorder").then((module) => module.openRecorder());
  });

  mediaSources.forEach((source) => {
    const input = el(`media-file-${source}`);
    input.addEventListener("change", () => {
      addMediaFiles(input.files, source);
      input.value = "";
    });
  });
}
