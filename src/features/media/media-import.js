/*
 * Dateien auf der Medien-Seite hinzufügen: aus jeder Datei wird ein
 * Medien-Eintrag in der Inbox, Bilder und Videos bekommen eine Vorschau.
 * Pfad: src/features/media/media-import.js
 *
 * Keine anpassbaren visuellen Werte: die Größe der Vorschaubilder steht in
 * src/data/files.js (thumbSize).
 */

import { emit, events } from "../../core/bus.js";
import { el } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { saveState, state } from "../../data/state.js";
import { saveThumbs, setThumb } from "../../data/thumbs.js";
import { logXp } from "../../data/xp.js";

/** Die vier Quellen und ihre unsichtbaren Dateifelder in index.html. */
export const mediaSources = ["photo", "video", "audio", "import"];

/** Jede Datei wird ein Medien-Eintrag in der Inbox. */
export async function addMediaFiles(fileList, source) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const { describeFile } = await load("files");

  for (const file of files) {
    const described = await describeFile(file, source);
    const entry = {
      id: state.nextEntryId++,
      type: "medien",
      title: described.title,
      body: "",
      parent: null,
      archived: false,
      favorite: false,
      createdAt: Date.now(),
      media: {
        kind: described.kind,
        name: described.name,
        size: described.size,
        mime: described.mime,
        duration: described.duration,
      },
    };
    if (described.thumb) setThumb(entry.id, described.thumb);
    state.entries.push(entry);
    logXp("created", "medien", entry.title);
  }

  saveThumbs();
  saveState();
  emit(events.xpChanged);
  emit(events.dataChanged);
}

/** Die runden Knöpfe über der Navigation und die Dateifelder anmelden. */
export function initMediaImport(mediaActions) {
  mediaActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-media-pick]");
    if (!button) return;
    /* Nur ein echter Klick auf ein input[type=file] öffnet Kamera oder Dateiauswahl. */
    el(`media-file-${button.dataset.mediaPick}`).click();
  });

  mediaSources.forEach((source) => {
    const input = el(`media-file-${source}`);
    input.addEventListener("change", () => {
      addMediaFiles(input.files, source);
      input.value = "";
    });
  });
}
