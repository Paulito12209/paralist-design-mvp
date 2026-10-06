/*
 * Die Ebene unter den Strichen: Text, Formen, Bilder und Notizzettel einer
 * Zeichnung. Sie liegt UNTER der Leinwand, damit man mit dem Stift auf
 * Bildern und Formen anmerken kann. Dazu kommt darüber eine dünne Ebene nur
 * für den Rahmen des ausgewählten Dings, seinen Griff und seine kleine Leiste.
 *
 * Gezeichnet wird nach Nummer: vorhandene Elemente werden nur angepasst,
 * nicht neu gebaut — sonst verlöre ein Text beim Tippen den Cursor.
 * Pfad: src/features/drawing/draw-layer.js
 *
 * Keine anpassbaren visuellen Werte: Grundgrößen (auch die Schrift der
 * Zettel) stehen in src/data/draw-items.js, das Aussehen der Dinge, des
 * Rahmens und des Griffs in styles/drawing-items.css.
 */

import { getBlob } from "../../core/blobs.js";
import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { itemDefaults, noteOfItem, noteText, refWidth } from "../../data/draw-items.js";
import { shapeOf } from "../../data/draw-shapes.js";
import { thumbOf } from "../../data/thumbs.js";
import { renderItemBar } from "./draw-item-bar.js";
import { currentItems } from "./draw-model.js";
import { draw, onDrawChange } from "./draw-state.js";

let layer = null;
let overlay = null;
let frame = null;
let bar = null;
/* Nummer des Dings, dessen Text gerade bearbeitet wird — sein Inhalt bleibt beim Neuzeichnen stehen */
let editingId = null;
/* Bild-Adressen je Medium: erst das kleine Vorschaubild, dann die echte Datei */
const imageUrls = new Map();

/** Maßstab: wie viele Pixel ein Tausendstel der Breite gerade ist. */
export function padScale() {
  return dom.drawPad.clientWidth / refWidth;
}

/** Die Ebene mit den Dingen (für Klicks und Messungen in draw-select.js). */
export function layerNode() {
  return layer;
}

/** Das Element eines Dings. */
export function itemNode(id) {
  return layer ? layer.querySelector(`[data-item-id="${id}"]`) : null;
}

export function setEditing(id) {
  editingId = id;
}

export function editingItem() {
  return editingId;
}

/* Die echte Datei holen; bis dahin steht das Vorschaubild da. */
function imageUrl(mediaId) {
  if (!imageUrls.has(mediaId)) {
    imageUrls.set(mediaId, thumbOf(mediaId) || "");
    getBlob(mediaId).then((blob) => {
      if (!blob) return;
      /* createObjectURL: zeigt die Datei aus der Browser-Datenbank, ohne sie umzuwandeln */
      imageUrls.set(mediaId, URL.createObjectURL(blob));
      renderLayer();
    });
  }
  return imageUrls.get(mediaId);
}

/* SVG einer Form; vector-effect hält die Linie gleich stark, egal wie die Form gedehnt ist. */
function shapeMarkup(item, scale) {
  const shape = shapeOf(item.shape);
  const ratio = shape.keepRatio ? "xMidYMid meet" : "none";
  const fill = item.fill ? item.color : "none";
  const width = Math.max(1, (item.stroke || 4) * scale);
  return `<svg class="draw-shape-svg" viewBox="0 0 100 100" preserveAspectRatio="${ratio}" aria-hidden="true"><path d="${shape.path}" fill="${fill}" fill-rule="evenodd" stroke="${item.color}" stroke-width="${width.toFixed(2)}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/* Inhalt eines Dings; `null` heißt: so lassen, wie es ist */
function contentOf(item, scale) {
  if (item.kind === "text") return escapeHtml(item.text || "");
  if (item.kind === "shape") return shapeMarkup(item, scale);
  if (item.kind === "image") {
    const url = imageUrl(item.mediaId);
    return url
      ? `<img src="${escapeHtml(url)}" alt="" draggable="false" decoding="async">`
      : `<span class="draw-image-missing">${icon("image")}</span>`;
  }
  const note = noteOfItem(item);
  return note ? escapeHtml(noteText(note)) : "";
}

/* Lage, Größe und Farben eines Dings auf das Element übertragen */
function placeNode(node, item, scale) {
  node.className = `draw-item is-${item.kind}${item.id === draw.selected ? " is-selected" : ""}`;
  node.style.left = `${item.x * scale}px`;
  node.style.top = `${item.y * scale}px`;
  node.style.width = item.kind === "text" ? "" : `${item.w * scale}px`;
  node.style.height = item.kind === "text" ? "" : `${item.h * scale}px`;
  if (item.kind === "text") {
    node.style.fontSize = `${item.size * scale}px`;
    node.style.color = item.color;
    /* Lange Zeilen brechen am rechten Rand der Fläche um, statt hinauszulaufen */
    node.style.maxWidth = `${Math.max(40, (refWidth - item.x) * scale)}px`;
  }
  if (item.kind === "note") {
    node.style.fontSize = `${itemDefaults.note.font * scale}px`;
    node.style.setProperty("--draw-note-bg", item.color);
    /* Wurde die Notiz woanders gelöscht, bleibt der Zettel leer stehen und sagt es */
    node.dataset.placeholder = noteOfItem(item) ? "Notiz schreiben …" : "Notiz gelöscht";
  }
}

/** Alle Dinge der offenen Zeichnung zeichnen und die Auswahl dazu. */
export function renderLayer() {
  if (!layer || dom.drawPad.hidden) return;
  const scale = padScale();
  if (!scale) return;
  const items = currentItems();
  const alive = new Set();

  items.forEach((item, index) => {
    const key = String(item.id);
    alive.add(key);
    let node = itemNode(key);
    if (!node) {
      node = document.createElement("div");
      node.dataset.itemId = key;
    }
    /* Nur umhängen, wenn die Reihenfolge nicht stimmt — Umhängen nähme einem Text den Cursor */
    if (layer.children[index] !== node) layer.insertBefore(node, layer.children[index] || null);
    placeNode(node, item, scale);
    if (item.id === editingId) return;
    const content = contentOf(item, scale);
    if (node.dataset.content !== content) {
      node.dataset.content = content;
      node.innerHTML = content;
    }
  });
  Array.from(layer.children).forEach((node) => {
    if (!alive.has(node.dataset.itemId)) node.remove();
  });
  renderSelection();
}

/** Rahmen, Griff und kleine Leiste um das ausgewählte Ding. */
export function renderSelection() {
  const node = draw.selected == null ? null : itemNode(draw.selected);
  const item = node ? currentItems().find((candidate) => candidate.id === draw.selected) : null;
  frame.hidden = !item;
  bar.hidden = !item;
  if (!item) return;
  frame.style.transform = `translate(${node.offsetLeft}px, ${node.offsetTop}px)`;
  frame.style.width = `${node.offsetWidth}px`;
  frame.style.height = `${node.offsetHeight}px`;
  frame.classList.toggle("is-editing", item.id === editingId);
  renderItemBar(bar, item, node);
}

/** Ebenen anlegen: die Dinge unter, Rahmen und Leiste über der Leinwand. */
export function initLayer() {
  layer = document.createElement("div");
  layer.className = "draw-layer";
  dom.drawPad.prepend(layer);

  overlay = document.createElement("div");
  overlay.className = "draw-overlay";
  overlay.innerHTML = `
    <div class="draw-frame" hidden><span class="draw-handle" data-draw-handle aria-hidden="true"></span></div>
    <div class="draw-item-bar" role="toolbar" aria-label="Auswahl" hidden></div>`;
  dom.drawPad.append(overlay);
  frame = overlay.querySelector(".draw-frame");
  bar = overlay.querySelector(".draw-item-bar");

  onDrawChange(renderLayer);
}
