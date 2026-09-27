/*
 * Eine Zeichnung als Bild: kopieren (Kopier-Knopf neben den Pillen, Menü)
 * und exportieren als PNG oder JPEG (Menü „Exportieren“). Kopiert wird
 * immer als PNG — das nimmt jede App und jeder Chat beim Einfügen an.
 *
 * Die Striche liegen gespeichert als Bild unter der Eintrags-ID
 * (src/data/thumbs.js). Ist die Zeichnung gerade offen, wird sie vorher
 * gesichert, damit auch der letzte Strich dabei ist.
 * Pfad: src/ui/drawing-export.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * exportFormats -> welche Formate „Exportieren“ anbietet, mit Name, Hinweis und Dateiendung
 * fallbackName  -> Dateiname, wenn die Zeichnung keinen Titel hat
 */

import { copyImage } from "../core/clipboard.js";
import { downloadBlob, flattenImage } from "../core/image-export.js";
import { loadedModule } from "../core/lazy.js";
import { thumbOf } from "../data/thumbs.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";

const exportFormats = [
  { label: "Als PNG", note: "Scharfe Striche, verlustfrei", type: "image/png", ext: "png" },
  { label: "Als JPEG", note: "Kleinere Datei, für Fotos-Apps", type: "image/jpeg", ext: "jpg" },
];
const fallbackName = "Zeichnung";

/* Das gespeicherte Bild der Zeichnung — eine offene Zeichnung vorher sichern.
   Ohne Warten: beim Kopieren muss alles noch im selben Tipp passieren. */
function drawingData(entry) {
  const drawing = loadedModule("drawing");
  if (drawing) drawing.saveDrawing();
  return thumbOf(entry.id) || null;
}

/* Dateiname aus dem Titel; Zeichen, die Dateisysteme nicht mögen, fallen weg */
function fileName(entry, ext) {
  const base = (entry.title || "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || fallbackName;
  return `${base}.${ext}`;
}

/** Die Zeichnung als Bild in die Zwischenablage legen und melden. Liefert true bei Erfolg. */
export async function copyDrawing(entry) {
  const data = drawingData(entry);
  if (!data) {
    showToast({ icon: "info", title: "Noch nichts gezeichnet", accent: "var(--muted)" });
    return false;
  }
  if (!(await copyImage(flattenImage(data, "image/png")))) {
    /* Manche Umgebungen verbieten Bilder in der Zwischenablage ganz (etwa
       eingebettete Vorschau-Browser). Dann bleibt die Datei als Weg. */
    showToast({
      icon: "info",
      title: "Bild kopieren nicht möglich",
      accent: "var(--danger)",
      action: { label: "Exportieren", onSelect: () => openDrawingExport(entry) },
    });
    return false;
  }
  showToast({ icon: "copy", title: "Bild kopiert" });
  return true;
}

/* In einem Format herunterladen */
async function exportAs(entry, format) {
  const data = drawingData(entry);
  if (!data) {
    showToast({ icon: "info", title: "Noch nichts gezeichnet", accent: "var(--muted)" });
    return;
  }
  try {
    downloadBlob(await flattenImage(data, format.type), fileName(entry, format.ext));
    showToast({ icon: "check-circle", title: `${format.label} exportiert` });
  } catch {
    showToast({ icon: "info", title: "Exportieren nicht möglich", accent: "var(--danger)" });
  }
}

/** Das Blatt „Exportieren“: PNG oder JPEG wählen. */
export function openDrawingExport(entry) {
  openSheet("Zeichnung exportieren", [
    ...exportFormats.flatMap((format, index) => [
      { label: format.label, icon: "image", split: index > 0, onSelect: () => exportAs(entry, format) },
      { note: true, label: format.note },
    ]),
  ]);
}
