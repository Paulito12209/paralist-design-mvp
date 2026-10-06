/*
 * Mit den Dingen auf der Fläche umgehen: auswählen, verschieben, am Griff
 * größer und kleiner ziehen, Text und Zettel beschreiben, Formen aufziehen,
 * Text und Zettel per Klick setzen und Bilder per Ziehen aus dem Dateisystem
 * ablegen. Malwerkzeuge gehen nicht hierher — die Leinwand liegt dann obenauf
 * und nimmt den Zeiger selbst (drawing.js).
 *
 * Während des Ziehens bewegt sich nur das eine Element über transform;
 * gespeichert wird erst beim Loslassen, als ein Schritt für Rückgängig.
 * Pfad: src/features/drawing/draw-select.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * dragThreshold -> ab so vielen Pixeln Bewegung ist ein Klick ein Ziehen
 * minSize       -> kleinste Breite und Höhe eines Dings beim Größerziehen (Pixel)
 */

import { emit, events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { noteOfItem, setNoteText } from "../../data/draw-items.js";
import { shapeOf } from "../../data/draw-shapes.js";
import { scheduleSave } from "../../data/state.js";
import { discardLastStep } from "./draw-history.js";
import { insertNote, insertShape, insertText } from "./draw-insert.js";
import { initItemBar } from "./draw-item-bar.js";
import { editingItem, itemNode, layerNode, padScale, renderLayer, renderSelection, setEditing } from "./draw-layer.js";
import { itemById, updateItem } from "./draw-model.js";
import { draw, drawChanged, isInkTool } from "./draw-state.js";

const dragThreshold = 3;
const minSize = 16;

/* Laufendes Ziehen: Verschieben, Größe ändern oder eine Form aufziehen */
let gesture = null;
/* Gerade angelegter Text: bleibt er leer, verschwindet er spurlos */
let freshTextId = null;

function padPoint(event) {
  const rect = dom.drawPad.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function overlayPart(selector) {
  return dom.drawPad.querySelector(selector);
}

/** Text oder Zettel zum Schreiben öffnen. */
export function startEditing(id) {
  const item = itemById(id);
  const node = itemNode(id);
  if (!item || !node || (item.kind !== "text" && item.kind !== "note")) return;
  /* Ein Zettel ohne Notiz dahinter hätte keinen Ort, an dem der Text landet */
  if (item.kind === "note" && !noteOfItem(item)) return;
  draw.selected = id;
  setEditing(id);
  /* contenteditable: das Ding selbst wird zum Textfeld, ohne Kasten darüber */
  node.contentEditable = "plaintext-only";
  node.spellcheck = false;
  node.focus();
  /* Den ganzen Text markieren — einmal tippen ersetzt ihn, Pfeiltaste setzt den Cursor */
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  renderSelection();
}

/** Schreiben beenden und übernehmen. */
export function finishEditing() {
  const id = editingItem();
  if (id == null) return;
  const node = itemNode(id);
  const item = itemById(id);
  setEditing(null);
  if (node) {
    node.contentEditable = "false";
    node.dataset.content = "";
  }
  if (!item || !node) return;
  const text = node.innerText.replace(/\n$/, "");
  if (item.kind === "note") {
    /* Die Notiz ist ein eigener Eintrag: Liste der Verknüpfungen und Titel überall auffrischen */
    emit(events.dataChanged);
    renderLayer();
    return;
  }
  if (!text.trim()) {
    if (freshTextId === id) discardLastStep();
    else updateItem(id, { text: "" });
    freshTextId = null;
    if (itemById(id)) renderLayer();
    return;
  }
  freshTextId = null;
  updateItem(id, { text });
  renderLayer();
}

/* Zettel: jeder Tastendruck landet sofort in der Notiz, gespeichert wird gebündelt */
function onLayerInput(event) {
  const node = event.target.closest(".draw-item");
  const item = node ? itemById(Number(node.dataset.itemId)) : null;
  if (item && item.kind === "note") {
    const note = noteOfItem(item);
    if (note) {
      setNoteText(note, node.innerText);
      scheduleSave();
    }
  }
  renderSelection();
}

function beginGesture(event, fields) {
  try {
    dom.drawPad.setPointerCapture(event.pointerId);
  } catch (error) {
    /* ohne Capture endet das Ziehen am Rand der Fläche */
  }
  gesture = { start: padPoint(event), moved: false, ...fields };
}

function onPointerDown(event) {
  if (isInkTool() || (event.pointerType === "mouse" && event.button !== 0)) return;
  if (event.target.closest(".draw-item-bar")) return;
  const node = event.target.closest(".draw-item");
  const id = node ? Number(node.dataset.itemId) : null;
  /* In den Text klicken, der gerade beschrieben wird: der Cursor soll dorthin */
  if (id != null && id === editingItem()) return;
  finishEditing();
  const point = padPoint(event);

  if (event.target.closest("[data-draw-handle]") && draw.selected != null) {
    const selected = itemNode(draw.selected);
    const item = itemById(draw.selected);
    if (!selected || !item) return;
    event.preventDefault();
    beginGesture(event, { type: "resize", id: item.id, item, width: selected.offsetWidth, height: selected.offsetHeight });
    return;
  }
  if (draw.tool === "text") {
    event.preventDefault();
    const existing = id != null ? itemById(id) : null;
    if (existing && existing.kind === "text") {
      startEditing(id);
      return;
    }
    const item = insertText(point);
    freshTextId = item ? item.id : null;
    if (item) startEditing(item.id);
    return;
  }
  if (draw.tool === "note") {
    event.preventDefault();
    const item = insertNote(point);
    if (item) startEditing(item.id);
    return;
  }
  if (draw.tool === "shape") {
    event.preventDefault();
    beginGesture(event, { type: "shape" });
    return;
  }
  if (id == null) {
    if (draw.selected != null) {
      draw.selected = null;
      drawChanged();
    }
    return;
  }
  event.preventDefault();
  const wasSelected = draw.selected === id;
  draw.selected = id;
  if (!wasSelected) drawChanged();
  beginGesture(event, { type: "move", id, wasSelected, node });
}

function onPointerMove(event) {
  if (!gesture) return;
  const point = padPoint(event);
  const dx = point.x - gesture.start.x;
  const dy = point.y - gesture.start.y;
  if (!gesture.moved && Math.hypot(dx, dy) < dragThreshold) return;
  gesture.moved = true;
  gesture.dx = dx;
  gesture.dy = dy;
  dom.drawPad.classList.add("is-arranging");

  if (gesture.type === "move") {
    gesture.node.style.transform = `translate(${dx}px, ${dy}px)`;
    const frame = overlayPart(".draw-frame");
    frame.style.transform = `translate(${gesture.node.offsetLeft + dx}px, ${gesture.node.offsetTop + dy}px)`;
  } else if (gesture.type === "resize") {
    previewResize(event);
  } else if (gesture.type === "shape") {
    const box = overlayPart(".draw-shape-ghost") || makeGhost();
    const left = Math.min(point.x, gesture.start.x);
    const top = Math.min(point.y, gesture.start.y);
    box.style.transform = `translate(${left}px, ${top}px)`;
    box.style.width = `${Math.abs(dx)}px`;
    box.style.height = `${Math.abs(dy)}px`;
  }
}

/* Rahmen, der beim Aufziehen einer Form zeigt, wie groß sie wird */
function makeGhost() {
  const ghost = document.createElement("div");
  ghost.className = "draw-shape-ghost";
  overlayPart(".draw-overlay").append(ghost);
  return ghost;
}

/* Neue Maße beim Ziehen am Griff: Bilder und manche Formen behalten ihr Seitenverhältnis */
function resizedBox(event, current = gesture) {
  const { item, width, height, dx = 0, dy = 0 } = current;
  let w = Math.max(minSize, width + dx);
  let h = Math.max(minSize, height + dy);
  const keep = item.kind === "image" || item.kind === "text" || (item.kind === "shape" && (shapeOf(item.shape).keepRatio || event.shiftKey));
  if (keep) h = (w * height) / width;
  return { w, h };
}

function previewResize(event) {
  const node = itemNode(gesture.id);
  const { w, h } = resizedBox(event);
  if (gesture.item.kind === "text") {
    node.style.fontSize = `${(gesture.item.size * padScale() * w) / gesture.width}px`;
  } else {
    node.style.width = `${w}px`;
    node.style.height = `${h}px`;
  }
  const frame = overlayPart(".draw-frame");
  frame.style.width = `${node.offsetWidth}px`;
  frame.style.height = `${node.offsetHeight}px`;
}

function onPointerUp(event) {
  if (!gesture) return;
  const done = gesture;
  gesture = null;
  dom.drawPad.classList.remove("is-arranging");
  const scale = padScale();

  if (done.type === "move") {
    done.node.style.transform = "";
    if (done.moved) {
      const item = itemById(done.id);
      if (item) updateItem(done.id, { x: Math.round(item.x + done.dx / scale), y: Math.round(item.y + done.dy / scale) });
    } else if (done.wasSelected) {
      /* Zweiter Klick auf ein schon gewähltes Ding: schreiben */
      startEditing(done.id);
    }
    renderSelection();
    return;
  }
  if (done.type === "resize") {
    if (!done.moved) return;
    const { w, h } = resizedBox(event, done);
    if (done.item.kind === "text") updateItem(done.id, { size: Math.round((done.item.size * w) / done.width) });
    else updateItem(done.id, { w: Math.round(w / scale), h: Math.round(h / scale) });
    return;
  }
  /* Form: aufgezogen in ihrem Rahmen, nur geklickt in Grundgröße an der Stelle */
  const ghost = overlayPart(".draw-shape-ghost");
  if (ghost) ghost.remove();
  const point = padPoint(event);
  const big = done.moved && Math.abs(done.dx) > minSize && Math.abs(done.dy) > minSize;
  const box = big
    ? {
        x: Math.round(Math.min(point.x, done.start.x) / scale),
        y: Math.round(Math.min(point.y, done.start.y) / scale),
        w: Math.round(Math.abs(done.dx) / scale),
        h: Math.round(Math.abs(done.dy) / scale),
      }
    : null;
  insertShape(box, big ? null : done.start);
}

/* Bilder aus dem Dateisystem auf die Fläche ziehen */
function onDrop(event) {
  const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  event.preventDefault();
  const point = padPoint(event);
  import("./draw-attach.js").then((module) => module.insertImageFiles(files, point));
}

/** Zeiger, Doppelklick und Ablegen auf der Fläche anmelden. */
export function initSelect() {
  const pad = dom.drawPad;
  pad.addEventListener("pointerdown", onPointerDown);
  pad.addEventListener("pointermove", onPointerMove);
  pad.addEventListener("pointerup", onPointerUp);
  pad.addEventListener("pointercancel", onPointerUp);
  layerNode().addEventListener("input", onLayerInput);
  layerNode().addEventListener("dblclick", (event) => {
    const node = event.target.closest(".draw-item");
    if (node && !isInkTool()) startEditing(Number(node.dataset.itemId));
  });
  /* Ein Klick neben das Feld (z.B. in die Leiste) beendet das Schreiben */
  layerNode().addEventListener("focusout", (event) => {
    if (editingItem() != null && !pad.contains(event.relatedTarget)) finishEditing();
  });
  pad.addEventListener("dragover", (event) => {
    if (Array.from(event.dataTransfer?.types || []).includes("Files")) event.preventDefault();
  });
  pad.addEventListener("drop", onDrop);
  initItemBar(overlayPart(".draw-item-bar"), { edit: startEditing });

  /* Eine Notiz wurde woanders geändert oder gelöscht: die Zettel zeigen den neuen Stand */
  on(events.dataChanged, () => {
    if (draw.entryId != null && !pad.hidden && editingItem() == null) renderLayer();
  });
}
