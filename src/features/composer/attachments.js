/*
 * Anhänge des Eingabefelds. Dateien werden nur vorbereitet und als Kacheln
 * gezeigt; erst beim Anlegen entstehen daraus echte Medien-Einträge.
 * Pfad: src/features/composer/attachments.js
 *
 * Keine anpassbaren visuellen Werte: Kachelgröße und Kreuz stehen in
 * styles/composer.css (Klassen .composer-attachment, .attach-img).
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { load } from "../../core/lazy.js";
import { state } from "../../data/state.js";
import { saveThumbs, setThumb } from "../../data/thumbs.js";
import { logXp } from "../../data/xp.js";
import { attachmentThumb } from "../../ui/media-cell.js";
import { composer } from "./composer-state.js";

/** Die Kachelreihe über den Pillen neu zeichnen. */
export function renderComposerAttachments(onChange) {
  dom.composerAttachments.hidden = !composer.files.length;
  dom.composerAttachments.innerHTML = composer.files
    .map(
      (item) => `
        <div class="composer-attachment">
          ${attachmentThumb(item)}
          <button class="composer-attachment-remove" type="button" data-drop-attachment="${item.id}" aria-label="${escapeHtml(item.title)} entfernen">
            ${icon("close")}
          </button>
        </div>
      `
    )
    .join("");
  if (onChange) onChange();
}

/**
 * Ausgewählte Dateien vorbereiten. Die Beschreibung (Art, Titel, Dauer,
 * Vorschau) kommt aus src/data/files.js und wird erst hier nachgeladen.
 */
export async function addComposerFiles(fileList, source, onChange) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const { describeFile } = await load("files");

  for (const file of files) {
    const described = await describeFile(file, source);
    composer.files.push({ id: composer.nextFileId++, ...described });
    renderComposerAttachments(onChange);
  }
}

/** Einen vorbereiteten Anhang wieder wegnehmen. */
export function dropComposerFile(id, onChange) {
  composer.files = composer.files.filter((item) => String(item.id) !== String(id));
  renderComposerAttachments(onChange);
}

/**
 * Jeder Anhang wird beim Anlegen ein Medien-Eintrag; der neue Eintrag merkt
 * sich deren Nummern in `attachments`.
 */
export function attachFilesTo(entry) {
  if (!composer.files.length) return;

  entry.attachments = composer.files.map((item) => {
    const media = {
      id: state.nextEntryId++,
      type: "medien",
      title: item.title,
      body: "",
      places: [...(entry.places || [])],
      archived: false,
      favorite: false,
      createdAt: Date.now(),
      media: { kind: item.kind, name: item.name, size: item.size, mime: item.mime, duration: item.duration },
    };
    if (item.thumb) setThumb(media.id, item.thumb);
    state.entries.push(media);
    logXp("created", "medien", media.title);
    return media.id;
  });

  saveThumbs();
}
