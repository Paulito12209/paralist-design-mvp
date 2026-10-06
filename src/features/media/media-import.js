/*
 * Dateien auf der Medien-Seite hinzufügen: aus jeder Datei wird ein
 * Medien-Eintrag im Eingang, Bilder und Videos bekommen eine Vorschau.
 * Die Leiste unten öffnet direkt die Dateiauswahl (Ordner), die Kamera für
 * Video oder Foto und für Audio die eigene Aufnahme (src/features/media/recorder.js).
 * Pfad: src/features/media/media-import.js
 *
 * Keine anpassbaren visuellen Werte: aus den Dateien Einträge machen steht in
 * src/data/media-add.js, die Größe der Vorschaubilder in src/data/files.js.
 */

import { el } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { addMediaFiles } from "../../data/media-add.js";

/* Das Anlegen selbst steht in der Datenschicht, weil auch die Zeichnung es braucht */
export { addMediaFiles };

/** Die drei Quellen mit unsichtbarem Dateifeld in index.html; Audio nimmt die App selbst auf. */
export const mediaSources = ["photo", "video", "import"];

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
