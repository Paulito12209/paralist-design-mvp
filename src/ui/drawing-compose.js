/*
 * Eine Zeichnung als EIN Bild: die Dinge auf der Fläche (Text, Formen,
 * Bilder, Notizzettel, src/data/draw-items.js) und darüber die Striche.
 * Gebraucht zum Kopieren und Exportieren (src/ui/drawing-export.js) — auch
 * für Zeichnungen, die gerade nicht offen sind, darum ohne die Seite.
 *
 * Die Maße folgen dem, was auf der Fläche zu sehen ist: Schrift, Abstände und
 * Rundungen zählen wie dort in Teilen der Schriftgröße (em), damit das Bild
 * genauso aussieht wie die Zeichnung.
 * Pfad: src/ui/drawing-compose.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * fallbackWidth -> Bildbreite in Pixeln, wenn es noch kein Bild der Striche gibt
 * fontFamily    -> Schrift für Text und Zettel (dieselbe wie styles/base.css)
 * noteInk       -> Schriftfarbe auf den Zetteln
 * Die übrigen Werte (Zeilenhöhe, Innenabstand, Rundung der Zettel) müssen zu
 * styles/drawing-items.css passen und stehen darum dort im Kopf mit Verweis hierher.
 */

import { getBlob } from "../core/blobs.js";
import { drawItemsOf, itemDefaults, noteOfItem, noteText, refWidth } from "../data/draw-items.js";
import { shapeOf } from "../data/draw-shapes.js";
import { thumbOf } from "../data/thumbs.js";

const fallbackWidth = 2000;
const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const noteInk = "#1c1c1e";
/* Wie in styles/drawing-items.css: Zeilenhöhe Text 1.25, Zettel 1.3, Zettel-Innenabstand 0.75em, Rundung 0.35em */
const textLine = 1.25;
const noteLine = 1.3;
const notePad = 0.75;
const noteRadius = 0.35;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* Die echte Datei eines Mediums, sonst seine Vorschau */
async function mediaImage(mediaId) {
  const blob = await getBlob(mediaId);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    if (img) return img;
  }
  const thumb = thumbOf(mediaId);
  return thumb ? loadImage(thumb) : null;
}

/* Text in Zeilen, die in `width` passen; feste Zeilenumbrüche bleiben */
function wrapLines(ctx, text, width) {
  return String(text)
    .split("\n")
    .flatMap((paragraph) => {
      const words = paragraph.split(" ");
      const lines = [];
      let line = "";
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > width) {
          lines.push(line);
          line = word;
        } else line = next;
      });
      lines.push(line);
      return lines;
    });
}

function drawShape(ctx, item, scale) {
  const shape = shapeOf(item.shape);
  const w = item.w * scale;
  const h = item.h * scale;
  let sx = w / 100;
  let sy = h / 100;
  let ox = item.x * scale;
  let oy = item.y * scale;
  if (shape.keepRatio) {
    sx = sy = Math.min(w, h) / 100;
    ox += (w - sx * 100) / 2;
    oy += (h - sy * 100) / 2;
  }
  /* addPath mit Matrix: die Form wird gedehnt, die Linie aber in Pixeln gezogen — wie vector-effect auf der Fläche */
  const path = new Path2D();
  path.addPath(new Path2D(shape.path), new DOMMatrix([sx, 0, 0, sy, ox, oy]));
  if (item.fill) {
    ctx.fillStyle = item.color;
    ctx.fill(path, "evenodd");
  }
  ctx.strokeStyle = item.color;
  ctx.lineWidth = Math.max(1, (item.stroke || 4) * scale);
  ctx.lineJoin = "round";
  ctx.stroke(path);
}

function drawText(ctx, item, scale) {
  const size = item.size * scale;
  /* 500: dieselbe Strichstärke wie Text auf der Fläche (styles/drawing-items.css) */
  ctx.font = `500 ${size}px ${fontFamily}`;
  ctx.fillStyle = item.color;
  ctx.textBaseline = "top";
  wrapLines(ctx, item.text || "", (refWidth - item.x) * scale).forEach((line, index) => {
    ctx.fillText(line, item.x * scale, item.y * scale + index * size * textLine + (size * (textLine - 1)) / 2);
  });
}

function drawNote(ctx, item, scale) {
  const note = noteOfItem(item);
  const size = itemDefaults.note.font * scale;
  const x = item.x * scale;
  const y = item.y * scale;
  const w = item.w * scale;
  const h = item.h * scale;
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, size * noteRadius);
  ctx.fill();
  if (!note) return;
  ctx.font = `${size}px ${fontFamily}`;
  ctx.fillStyle = noteInk;
  ctx.textBaseline = "top";
  const pad = size * notePad;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  wrapLines(ctx, noteText(note), w - pad * 2).forEach((line, index) => {
    ctx.fillText(line, x + pad, y + pad + index * size * noteLine);
  });
  ctx.restore();
}

/**
 * Das ganze Bild als PNG-Adresse. Ohne Dinge auf der Fläche kommt das Bild der
 * Striche unverändert zurück; ohne beides `null`.
 * @param inkData das gespeicherte Bild der Striche (oder null)
 */
export async function composeDrawing(entry, inkData) {
  const items = drawItemsOf(entry);
  if (!items.length) return inkData || null;
  const ink = inkData ? await loadImage(inkData) : null;
  const width = ink ? ink.naturalWidth : fallbackWidth;
  const scale = width / refWidth;
  const bottom = items.reduce((max, item) => Math.max(max, (item.y + (item.h || item.size * 2 || 0)) * scale), 0);
  /* Dinge unterhalb der Striche (Fläche später höher gewesen) gehören mit aufs Bild */
  const height = Math.max(ink ? ink.naturalHeight : 0, Math.round(bottom + 40 * scale));

  /* canvas: nur zum Rechnen, kommt nie in die Seite */
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  for (const item of items) {
    if (item.kind === "shape") drawShape(ctx, item, scale);
    else if (item.kind === "text") drawText(ctx, item, scale);
    else if (item.kind === "note") drawNote(ctx, item, scale);
    else if (item.kind === "image") {
      const img = await mediaImage(item.mediaId);
      if (img) ctx.drawImage(img, item.x * scale, item.y * scale, item.w * scale, item.h * scale);
    }
  }
  if (ink) ctx.drawImage(ink, 0, 0);
  return canvas.toDataURL("image/png");
}
