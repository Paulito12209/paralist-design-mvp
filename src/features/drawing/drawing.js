/*
 * Die Zeichenfläche eines Eintrags vom Typ Zeichnung. Wird erst beim ersten
 * Öffnen einer Zeichnung nachgeladen.
 * Diese Datei malt die Striche (Leinwand); Text, Formen, Bilder und Zettel
 * darunter zeichnet draw-layer.js, die Werkzeugleiste am Desktop
 * draw-desk-bar.js, Rückgängig/Wiederholen führt draw-history.js.
 * Pfad: src/features/drawing/drawing.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxPixelRatio -> Pixel je CSS-Pixel (mehr als 2 kostet nur Speicher)
 * saveDelay     -> wie lange nach dem letzten Strich gespeichert wird (Millisekunden)
 *
 * Werkzeuge und Farben stehen in drawing-tools.js, das Aussehen in styles/drawing.css.
 */

import { dom } from "../../core/dom.js";
import { markEdited } from "../../data/mutations.js";
import { findEntry } from "../../data/queries.js";
import { scheduleSave } from "../../data/state.js";
import { saveThumbs, setThumb, thumbOf } from "../../data/thumbs.js";
import { initDeskBar, startTool } from "./draw-desk-bar.js";
import { dropInkSteps, record, redoStep, resetHistory, undoStep } from "./draw-history.js";
import { initDrawKeys } from "./draw-keys.js";
import { initLayer, renderLayer } from "./draw-layer.js";
import { changeItems, chooseColor, setAfterItemsChange } from "./draw-model.js";
import { initSelect } from "./draw-select.js";
import { draw, drawChanged, isInkTool, onDrawChange, setTool } from "./draw-state.js";
import { extendStroke, paintStroke } from "./draw-paint.js";
import { colorsMarkup, tools } from "./drawing-tools.js";

const maxPixelRatio = 2;
const saveDelay = 400;

/* canvas 2d: die einzige Möglichkeit, freihändige Striche zu malen.
   willReadFrequently: jeder Strich liest die Fläche aus und schreibt sie zurück
   (für Rückgängig und den gleichmäßigen Marker). Ohne diesen Hinweis hält der
   Browser das Bild auf der Grafikkarte und muss es dafür jedes Mal herüberholen. */
const canvas = dom.drawCanvas;
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

/* Laufender Strich: Punkte, Werkzeug und das Bild davor */
let stroke = null;
let dirty = false;
let saveTimer = null;
/* Angeforderter Bildaufbau für den Marker (0 = keiner offen) */
let frame = 0;
/* Das zuletzt geladene Bild der Striche — es kann höher sein als die Fläche gerade */
let base = null;
/* Solange das Bild noch lädt, ist die Fläche leer und darf nicht gespeichert werden */
let loading = false;

/*
 * Das Bild zum Speichern. Ist die Fläche niedriger als die Zeichnung
 * (kleineres Fenster, Leiste links), bleibt der verdeckte untere Teil aus dem
 * geladenen Bild erhalten, statt beim Speichern abgeschnitten zu werden.
 */
function inkData() {
  const baseHeight = base && base.id === draw.entryId ? Math.round((base.img.height * canvas.width) / base.img.width) : 0;
  if (baseHeight <= canvas.height) return canvas.toDataURL("image/png");
  /* canvas: nur zum Rechnen, kommt nie in die Seite */
  const full = document.createElement("canvas");
  full.width = canvas.width;
  full.height = baseHeight;
  const fullCtx = full.getContext("2d");
  fullCtx.drawImage(base.img, 0, 0, canvas.width, baseHeight);
  fullCtx.clearRect(0, 0, canvas.width, canvas.height);
  fullCtx.drawImage(canvas, 0, 0);
  return full.toDataURL("image/png");
}

/** Zeichnung speichern. Sie liegt wie ein Vorschaubild unter der Eintrags-ID, nur als PNG. */
export function saveDrawing() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const entryId = draw.entryId;
  if (!entryId || !dirty) return;
  if (loading) {
    saveTimer = setTimeout(saveDrawing, saveDelay);
    return;
  }
  dirty = false;
  setThumb(entryId, inkData());
  saveThumbs();
  /* Ein Strich ist eine Bearbeitung — für „Zuletzt bearbeitet“ in den Details */
  const entry = findEntry(entryId);
  if (entry) {
    markEdited(entry);
    scheduleSave();
  }
}

/* Speichern kurz nach dem letzten Strich, nicht bei jeder Bewegung. */
function scheduleSaveDrawing() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDrawing, saveDelay);
}

function loadDrawing(id) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  base = null;
  const data = thumbOf(id);
  loading = Boolean(data);
  if (!data) return;
  const img = new Image();
  img.onerror = () => {
    loading = false;
  };
  img.onload = () => {
    /* Zwischenzeitlich eine andere Zeichnung geöffnet: dieses Bild gehört nicht mehr hierher */
    if (draw.entryId !== id) return;
    loading = false;
    base = { id, img };
    /* Gespeichert wurde in Gerätepixeln: auf die heutige Breite skalieren, damit nichts verzerrt */
    const scale = canvas.width / img.width;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
    ctx.restore();
  };
  img.src = data;
}

/** Fläche auf den sichtbaren Platz bringen; das Bild wird vorher gesichert und danach neu geladen. */
function fitCanvas() {
  const width = Math.round(dom.drawPad.clientWidth);
  const height = Math.round(dom.drawPad.clientHeight);
  if (!width || !height) return;
  if (canvas.style.width === `${width}px` && canvas.style.height === `${height}px`) return;

  saveDrawing();
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  /* Größe ändern leert den Kontext: Maßstab und runde Linienenden neu setzen */
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  /* Alte Schnappschüsse passen nicht mehr zur neuen Größe */
  dropInkSteps();
  if (draw.entryId) loadDrawing(draw.entryId);
  renderLayer();
}

/** Die Werkzeugleiste auffrischen (Handy; die Desktop-Leiste hört selbst auf Änderungen). */
function renderTools() {
  dom.drawTools.querySelectorAll("[data-draw-tool]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.drawTool === draw.tool);
  });
  dom.drawColors.innerHTML = colorsMarkup(draw.color);
  /* Malwerkzeug: die Leinwand nimmt den Zeiger. Sonst gehen Klicks an die Dinge darunter. */
  dom.drawPad.classList.toggle("is-ink", isInkTool());
  dom.drawPad.dataset.tool = draw.tool;
}

/** Eine Zeichnung öffnen. */
export function openDrawing(entry) {
  /* Eine noch offene Zeichnung zuerst sichern */
  saveDrawing();
  draw.entryId = entry.id;
  startTool();
  stroke = null;
  resetHistory();
  drawChanged();
  canvas.style.width = "";
  canvas.style.height = "";
  fitCanvas();
  renderLayer();
}

/* Die Lage der Fläche wird einmal beim Aufsetzen gemessen (rect), nicht bei
   jeder Bewegung — Messen zwingt den Browser sonst hundertfach pro Sekunde
   zum Neurechnen des Layouts. Während eines Strichs verschiebt sich nichts. */
function pointOf(event, rect) {
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function snapshot() {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/*
 * Ein Strich-Schritt für Rückgängig: er hält immer nur EIN Bild — vor dem
 * Zurücknehmen das alte, danach das, was beim Wiederholen zurückkommt.
 */
function recordInk(before) {
  let image = before;
  const swap = () => {
    const now = snapshot();
    ctx.putImageData(image, 0, 0);
    image = now;
    scheduleSaveDrawing();
  };
  record({ ink: true, undo: swap, redo: swap });
}

/* Beim Marker sammeln sich die Bewegungen bis zum nächsten Bildaufbau. */
function requestPaint() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (stroke) paintStroke(ctx, stroke);
  });
}

/* Strich zu Ende: einen noch offenen Bildaufbau sofort nachholen. */
function finishStroke() {
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
    paintStroke(ctx, stroke);
  }
  recordInk(stroke.before);
  stroke = null;
  scheduleSaveDrawing();
}

/** Letzten Schritt zurücknehmen — Strich oder Ding auf der Fläche. */
export function undoDrawing() {
  undoStep();
}

/** Zurückgenommenen Schritt wiederholen. */
export function redoDrawing() {
  redoStep();
}

/** Die ganze Fläche leeren: Striche und alle Dinge darauf, als ein Schritt. */
export function clearDrawing() {
  const before = snapshot();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  recordInk(before);
  changeItems((items) => items.splice(0, items.length));
  scheduleSaveDrawing();
}

function onPointerDown(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (!isInkTool()) return;
  event.preventDefault();
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (error) {
    /* ohne Capture folgt der Strich nur, solange der Finger auf der Fläche bleibt */
  }
  const rect = canvas.getBoundingClientRect();
  const tool = draw.tool;
  stroke = { tool, color: draw.color, width: draw.widths[tool], rect, points: [pointOf(event, rect)], before: snapshot() };
  paintStroke(ctx, stroke);
}

function onPointerMove(event) {
  if (!stroke) return;
  const from = stroke.points.length;
  /* getCoalescedEvents: liefert auch die Zwischenpunkte, die der Browser sonst zusammenfasst */
  const moves = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
  (moves.length ? moves : [event]).forEach((move) => stroke.points.push(pointOf(move, stroke.rect)));
  if (tools[stroke.tool].alpha < 1) requestPaint();
  else extendStroke(ctx, stroke, from);
}

/* Klicks der Leiste am Handy; die Desktop-Leiste nutzt dieselben Kennzeichen
   (data-draw-tool, data-draw-color, data-draw-undo) und hat dazu eigene. */
function onToolsClick(event) {
  const toolButton = event.target.closest("[data-draw-tool]");
  if (toolButton) {
    setTool(toolButton.dataset.drawTool);
    return;
  }
  const colorButton = event.target.closest("[data-draw-color]");
  if (colorButton) {
    chooseColor(colorButton.dataset.drawColor);
    return;
  }
  if (event.target.closest("[data-draw-undo]")) undoDrawing();
  else if (event.target.closest("[data-draw-redo]")) redoDrawing();
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  ["pointerup", "pointercancel"].forEach((name) => {
    canvas.addEventListener(name, () => {
      if (stroke) finishStroke();
    });
  });

  dom.drawTools.addEventListener("click", onToolsClick);
  onDrawChange(renderTools);
  /* Gibt es noch kein Bild der Striche, entsteht es mit dem ersten Ding auf
     der Fläche — der Export braucht seine Größe (src/ui/drawing-compose.js). */
  setAfterItemsChange(() => {
    if (!thumbOf(draw.entryId)) scheduleSaveDrawing();
  });

  initLayer();
  initSelect();
  initDeskBar();
  initDrawKeys({ undo: undoDrawing, redo: redoDrawing });

  /* Tastatur oder Drehung ändern den Platz: die Fläche folgt, das Bild bleibt. */
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (!dom.drawPad.hidden && draw.entryId) fitCanvas();
    }).observe(dom.drawPad);
  }

  /* Beim Verlassen der Seite nichts verlieren. */
  window.addEventListener("pagehide", saveDrawing);
}

init();
