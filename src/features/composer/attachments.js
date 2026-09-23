/*
 * Anhänge des Eingabefelds. Dateien werden nur vorbereitet und als Kacheln
 * gezeigt; erst beim Anlegen entstehen daraus echte Medien-Einträge — als
 * Anhang eines neuen Eintrags oder, beim Typ „Medium“, ganz für sich.
 * Pfad: src/features/composer/attachments.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * fileSources -> die Wege hinter dem Plus-Knopf: Name, Icon und Reihenfolge
 *
 * Kachelgröße und Kreuz stehen in styles/composer-attachments.css
 * (Klassen .composer-attachment, .attach-img).
 */

import { putBlob } from "../../core/blobs.js";
import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { load } from "../../core/lazy.js";
import { connectEntries } from "../../data/links.js";
import { state } from "../../data/state.js";
import { saveThumbs, setThumb } from "../../data/thumbs.js";
import { logXp } from "../../data/xp.js";
import { attachmentThumb } from "../../ui/media-cell.js";
import { openSheet } from "../../ui/sheet.js";
import { composer } from "./composer-state.js";

/* Die Dateiquellen hinter dem Plus-Knopf; jede hat ein verstecktes
   Dateifeld `composer-file-<id>` in index.html. */
const fileSources = [
  { id: "photo", label: "Foto aufnehmen", icon: "camera" },
  { id: "video", label: "Video aufnehmen", icon: "video" },
  { id: "audio", label: "Audio hinzufügen", icon: "mic" },
  { id: "import", label: "Importieren", icon: "import" },
];

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
async function addComposerFiles(fileList, source, onChange) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const { describeFile } = await load("files");

  for (const file of files) {
    const described = await describeFile(file, source);
    /* Die Datei selbst reist bis zum Anlegen mit — nur die Vorschau zu
       behalten hieße, das Foto später nie in voller Größe zu sehen. */
    composer.files.push({ id: composer.nextFileId++, ...described, file });
    renderComposerAttachments(onChange);
  }
}

/** Einen vorbereiteten Anhang wieder wegnehmen. */
function dropComposerFile(id, onChange) {
  composer.files = composer.files.filter((item) => String(item.id) !== String(id));
  renderComposerAttachments(onChange);
}

/**
 * Aus jeder vorbereiteten Datei einen Medien-Eintrag machen.
 * @param places der Ablageort, den jedes Medium bekommt.
 * @param titleOf (Datei, Nummer) → Titel des Mediums.
 * @returns die angelegten Medien-Einträge.
 */
function mediaFromFiles(places, titleOf) {
  const created = composer.files.map((item, index) => {
    const media = {
      id: state.nextEntryId++,
      type: "medien",
      title: titleOf(item, index),
      body: "",
      places: [...places],
      links: [],
      archived: false,
      favorite: false,
      createdAt: Date.now(),
      media: { kind: item.kind, name: item.name, size: item.size, mime: item.mime, duration: item.duration },
    };
    if (item.thumb) setThumb(media.id, item.thumb);
    /* Wie beim Hinzufügen auf der Medien-Seite (media-import.js): die ganze
       Datei kommt in die Browser-Datenbank, damit die Dateiansicht sie zeigt
       und abspielt. Ohne Warten — eine spätere Leseanfrage reiht sich dahinter. */
    if (item.file) putBlob(media.id, item.file);
    state.entries.push(media);
    logXp("created", "medien", media.title);
    return media;
  });
  saveThumbs();
  return created;
}

/**
 * Jeder Anhang wird beim Anlegen ein eigener Medien-Eintrag und mit dem neuen
 * Eintrag verknüpft — in beide Richtungen: das Foto steht beim Eintrag unter
 * „Verknüpfte Einträge“, und der Eintrag steht beim Foto. Den Ablageort
 * bekommt das Medium gleich mit, damit es dort liegt, wo auch der Eintrag liegt.
 * @returns die angelegten Medien-Einträge.
 */
export function attachFilesTo(entry) {
  if (!composer.files.length) return [];
  const created = mediaFromFiles(entry.places || [], (item) => item.title);
  created.forEach((media) => connectEntries(entry, media));
  return created;
}

/**
 * Typ „Medium“: die Dateien selbst sind die Einträge, es gibt keinen Eintrag
 * drumherum. Sie liegen am gewählten Ort und werden mit der Seite verknüpft,
 * von der aus sie kommen. Getippter Text wird der Titel — bei mehreren
 * Dateien mit Nummer dahinter, damit man sie auseinanderhält.
 * @param typed der Text aus dem Feld, leer für die Dateinamen.
 * @param places der Ablageort.
 * @param source der Eintrag, von dessen Seite aus angelegt wird, oder null.
 * @returns die angelegten Medien-Einträge.
 */
export function createMediaEntries(typed, places, source) {
  const several = composer.files.length > 1;
  const titleOf = (item, index) => {
    if (!typed) return item.title;
    return several ? `${typed} ${index + 1}` : typed;
  };
  const created = mediaFromFiles(places, titleOf);
  if (source) created.forEach((media) => connectEntries(media, source));
  return created;
}

/**
 * Plus-Knopf, Dateifelder und Kreuze auf den Kacheln anmelden.
 * @param onChange nach jeder hinzugekommenen oder entfernten Datei — das
 *   Eingabefeld zeichnet dann nach, was an den Anhängen hängt (Typ,
 *   Platzhalter, Anlegen-Knopf).
 */
export function initComposerAttachments(onChange) {
  dom.composerAttach.addEventListener("click", () => {
    openSheet(
      "Medien hinzufügen",
      fileSources.map((source) => ({
        label: source.label,
        icon: source.icon,
        onSelect: () => el(`composer-file-${source.id}`).click(),
      }))
    );
  });

  fileSources.forEach((source) => {
    const input = el(`composer-file-${source.id}`);
    input.addEventListener("change", () => {
      addComposerFiles(input.files, source.id, onChange);
      input.value = "";
    });
  });

  dom.composerAttachments.addEventListener("click", (event) => {
    const button = event.target.closest("[data-drop-attachment]");
    if (button) dropComposerFile(button.dataset.dropAttachment, onChange);
  });
}
