/*
 * Neue Dinge in die offene Zeichnung setzen: Text, Notizzettel, Form, Bild.
 * Mit Stelle (Klick auf die Fläche) liegt das Ding dort, sonst mittig.
 * Pfad: src/features/drawing/draw-insert.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxImageHeight -> höchstens so viel der Flächenhöhe nimmt ein neues Bild ein (0–1)
 * imageCascade   -> um wie viele Pixel mehrere auf einmal eingefügte Bilder versetzt liegen
 *
 * Grundgrößen der Dinge stehen in src/data/draw-items.js (itemDefaults, stickyColors).
 */

import { dom } from "../../core/dom.js";
import { createStickyNote, itemDefaults, refWidth, stickyColors } from "../../data/draw-items.js";
import { thumbOf } from "../../data/thumbs.js";
import { padScale } from "./draw-layer.js";
import { addItem, centeredSpot, drawingEntry } from "./draw-model.js";
import { draw, setTool } from "./draw-state.js";

const maxImageHeight = 0.8;
const imageCascade = 24;

/* Höhe der Fläche geteilt durch ihre Breite */
function padRatio() {
  return dom.drawPad.clientHeight / Math.max(1, dom.drawPad.clientWidth);
}

/* Stelle in Pixeln -> Stelle in Tausendsteln der Breite, das Ding mittig darauf */
function spotAt(point, width, height) {
  if (!point) return centeredSpot(width, height, padRatio());
  const scale = padScale();
  return { x: Math.round(point.x / scale - width / 2), y: Math.round(point.y / scale - height / 2) };
}

/** Einen Text an die Stelle setzen; er beginnt leer und wird gleich bearbeitet. */
export function insertText(point) {
  const scale = padScale();
  const size = itemDefaults.text.size;
  /* Die Klickstelle ist der Anfang der ersten Zeile, nicht die Mitte */
  const spot = point ? { x: Math.round(point.x / scale), y: Math.round(point.y / scale - size * 0.6) } : spotAt(null, size * 6, size);
  setTool("select");
  return addItem({ kind: "text", text: "", size, color: draw.color, ...spot });
}

/** Einen Notizzettel setzen — dahinter entsteht eine verknüpfte Notiz. */
export function insertNote(point) {
  const entry = drawingEntry();
  if (!entry) return null;
  const note = createStickyNote(entry);
  const { w, h } = itemDefaults.note;
  setTool("select");
  return addItem({ kind: "note", noteId: note.id, color: stickyColors[0], w, h, ...spotAt(point, w, h) });
}

/** Eine Form mit Rahmen setzen; ohne Rahmen in Grundgröße an die Stelle. */
export function insertShape(box, point) {
  const { w, h, stroke } = itemDefaults.shape;
  const frame = box || { w, h, ...spotAt(point, w, h) };
  setTool("select");
  return addItem({ kind: "shape", shape: draw.shape, fill: draw.fill, color: draw.color, stroke, ...frame });
}

/* Seitenverhältnis eines Bildes aus seiner Vorschau, ohne die große Datei zu laden */
function imageRatio(mediaId) {
  return new Promise((resolve) => {
    const data = thumbOf(mediaId);
    if (!data) {
      resolve(4 / 3);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img.naturalHeight / Math.max(1, img.naturalWidth) || 1);
    img.onerror = () => resolve(4 / 3);
    img.src = data;
  });
}

/**
 * Bilder aus den Medien setzen, nebeneinander versetzt.
 * @param mediaIds Nummern der Medien-Einträge
 * @param point    Stelle des ersten Bildes oder null für die Mitte
 */
export async function insertImages(mediaIds, point = null) {
  let last = null;
  for (const [index, mediaId] of mediaIds.entries()) {
    const ratio = await imageRatio(mediaId);
    let w = itemDefaults.image.w;
    let h = w * ratio;
    const limit = padRatio() * refWidth * maxImageHeight;
    if (h > limit) {
      w = (w * limit) / h;
      h = limit;
    }
    const spot = point ? { x: point.x + index * imageCascade, y: point.y + index * imageCascade } : null;
    last = addItem({ kind: "image", mediaId, w: Math.round(w), h: Math.round(h), ...spotAt(spot, w, h) });
  }
  if (last) setTool("select");
  return last;
}
