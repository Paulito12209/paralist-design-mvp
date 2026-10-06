/*
 * Die drei Export-Stufen als fertige Dateien:
 *   Text        -> Markdown aller Text-Einträge (src/data/transfer-markdown.js)
 *   Paralist    -> eine JSON-Datei mit Zustand, Einstellungen, Vorschaubildern
 *                  und Zeichnungen (src/data/transfer-snapshot.js), ohne Mediendateien
 *   Vollständig -> ein ZIP mit derselben JSON-Datei, der Lesefassung als
 *                  export.md, den Zeichnungen und Vorschaubildern als Bilder
 *                  und allen Mediendateien aus der Browser-Datenbank
 * Vor jedem Export wird gespeichert, was noch wartet (flushSave) — sonst
 * fehlte der zuletzt getippte Buchstabe. Das ZIP meldet seinen Fortschritt
 * (onProgress) und lässt sich abbrechen (signal); die Mediendateien gehen als
 * Blob unverändert hinein, damit ein Handy sie nicht in den Arbeitsspeicher
 * kopieren muss (src/core/zip.js).
 * Pfad: src/data/transfer-export.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * fileStem   -> Anfang der Dateinamen („paralist-2026-10-06.zip“)
 * zipFolders -> Ordnernamen der Bilder im ZIP; src/data/transfer-import.js liest
 *               dieselben (der Ordner „medien“ steht in src/data/transfer-snapshot.js)
 */

import { getBlob } from "../core/blobs.js";
import { dayKey } from "../core/dates.js";
import { writeZip } from "../core/zip.js";
import { flushSave } from "./state.js";
import { stateToMarkdown, textEntryCount } from "./transfer-markdown.js";
import { buildSnapshot, fileExtension } from "./transfer-snapshot.js";

const fileStem = "paralist";
const zipFolders = { drawings: "zeichnungen", thumbs: "vorschau" };

/** Dateiname mit heutigem Datum: „paralist-2026-10-06.zip“. */
export function exportFileName(ext) {
  return `${fileStem}-${dayKey(new Date())}.${ext}`;
}

/* Eine Data-URL in Bytes und Endung zerlegen; null, wenn sie nicht passt */
function dataUrlBytes(dataUrl) {
  const match = /^data:(image\/[a-z]+);base64,(.*)$/s.exec(String(dataUrl || ""));
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, ext: fileExtension({ mime: match[1] }) };
}

/** Stufe Text: der Markdown-Text und wie viele Einträge darin stehen. */
export function markdownExport() {
  flushSave();
  const snapshot = buildSnapshot({ withThumbs: false });
  return { text: stateToMarkdown(snapshot.state), count: textEntryCount(snapshot.state) };
}

/** Stufe Paralist-Datei: die JSON-Datei als Blob. */
export function jsonExport() {
  flushSave();
  const snapshot = buildSnapshot({ withThumbs: true });
  return new Blob([JSON.stringify(snapshot)], { type: "application/json" });
}

/* Der Seite einen Moment zum Zeichnen lassen, bevor die Rechenarbeit beginnt */
function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Stufe Vollständig: das ZIP als Blob. Mediendateien, die der Browser nicht
 * mehr hat, fehlen darin — der Eintrag bleibt trotzdem in paralist.json.
 * @param onProgress optional, ({ done, total, name }) je Datei im ZIP
 * @param signal optional, AbortSignal zum Abbrechen (wirft AbortError)
 */
export async function zipExport({ onProgress, signal } = {}) {
  flushSave();
  await nextTick();
  /* Einmal lesen: die Vorschaubilder kommen als Dateien daneben, nicht in die JSON */
  const full = buildSnapshot({ withThumbs: true });
  const thumbs = full.thumbs || {};
  const snapshot = { ...full, thumbs: undefined };
  const entries = snapshot.state.entries || [];
  const files = [
    { name: "paralist.json", data: JSON.stringify(snapshot) },
    { name: "export.md", data: stateToMarkdown(snapshot.state) },
  ];

  entries.forEach((entry) => {
    const image = dataUrlBytes(thumbs[entry.id]);
    if (!image) return;
    const folder = entry.type === "zeichnung" ? zipFolders.drawings : zipFolders.thumbs;
    files.push({ name: `${folder}/${entry.id}.${image.ext}`, data: image.bytes });
  });

  for (const media of snapshot.media) {
    if (signal?.aborted) throw new DOMException("Export abgebrochen", "AbortError");
    const blob = await getBlob(media.id);
    if (blob) files.push({ name: media.file, data: blob, store: true });
  }
  return writeZip(files, { onProgress, signal });
}
