/*
 * Die Zeichenfläche eines Eintrags vom Typ Zeichnung. Wird erst beim ersten
 * Öffnen einer Zeichnung nachgeladen.
 * Pfad: src/features/drawing/drawing.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxPixelRatio -> Pixel je CSS-Pixel (mehr als 2 kostet nur Speicher)
 * undoLimit     -> wie viele Schritte „Rückgängig“ merkt
 * saveDelay     -> wie lange nach dem letzten Strich gespeichert wird (Millisekunden)
 *
 * Werkzeuge und Farben stehen in drawing-tools.js, das Aussehen in styles/drawing.css.
 */

import { dom } from "../../core/dom.js";
import { saveThumbs, setThumb, thumbOf } from "../../data/thumbs.js";
import { colors, colorsMarkup, tools } from "./drawing-tools.js";

const maxPixelRatio = 2;
const undoLimit = 8;
const saveDelay = 400;

/* canvas 2d: die einzige Möglichkeit, freihändige Striche zu malen.
   willReadFrequently: jeder Strich liest die Fläche aus und schreibt sie zurück
   (für Rückgängig und den gleichmäßigen Marker). Ohne diesen Hinweis hält der
   Browser das Bild auf der Grafikkarte und muss es dafür jedes Mal herüberholen. */
const canvas = dom.drawCanvas;
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

let tool = "pen";
let color = colors[0];
let entryId = null;
/* Laufender Strich: Punkte, Werkzeug und das Bild davor */
let stroke = null;
/* Bilder vor den letzten Strichen */
let undoStack = [];
let dirty = false;
let saveTimer = null;

/** Zeichnung speichern. Sie liegt wie ein Vorschaubild unter der Eintrags-ID, nur als PNG. */
export function saveDrawing() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!entryId || !dirty) return;
  dirty = false;
  setThumb(entryId, canvas.toDataURL("image/png"));
  saveThumbs();
}

/* Speichern kurz nach dem letzten Strich, nicht bei jeder Bewegung. */
function scheduleSaveDrawing() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDrawing, saveDelay);
}

function loadDrawing(id) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const data = thumbOf(id);
  if (!data) return;
  const img = new Image();
  img.onload = () => {
    /* Zwischenzeitlich eine andere Zeichnung geöffnet: dieses Bild gehört nicht mehr hierher */
    if (entryId !== id) return;
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
  undoStack = [];
  if (entryId) loadDrawing(entryId);
}

/** Die Werkzeugleiste auffrischen. */
function renderTools() {
  dom.drawTools.querySelectorAll("[data-draw-tool]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.drawTool === tool);
  });
  dom.drawColors.innerHTML = colorsMarkup(color);
}

/** Eine Zeichnung öffnen. */
export function openDrawing(entry) {
  /* Eine noch offene Zeichnung zuerst sichern */
  saveDrawing();
  entryId = entry.id;
  stroke = null;
  undoStack = [];
  renderTools();
  canvas.style.width = "";
  canvas.style.height = "";
  fitCanvas();
}

function pointOf(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function pushUndo() {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (undoStack.length > undoLimit) undoStack.shift();
}

/*
 * Der ganze Strich wird bei jeder Bewegung neu auf das Bild davor gemalt: so
 * bleibt der durchscheinende Marker gleichmäßig, statt an jedem Zwischenpunkt
 * dunkler zu werden.
 */
function paintStroke(current) {
  const settings = tools[current.tool];
  ctx.putImageData(current.before, 0, 0);
  ctx.save();
  /* destination-out: der Radierer nimmt Farbe weg, statt Weiß aufzutragen */
  ctx.globalCompositeOperation = settings.erase ? "destination-out" : "source-over";
  ctx.globalAlpha = settings.alpha;
  ctx.strokeStyle = current.color;
  ctx.lineWidth = settings.width;
  ctx.beginPath();
  current.points.forEach((point, index) =>
    index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)
  );
  /* Tipp ohne Bewegung: ein Punkt */
  if (current.points.length === 1) ctx.lineTo(current.points[0].x + 0.01, current.points[0].y);
  ctx.stroke();
  ctx.restore();
}

/** Letzten Strich zurücknehmen. */
export function undoDrawing() {
  const before = undoStack.pop();
  if (!before) return;
  ctx.putImageData(before, 0, 0);
  scheduleSaveDrawing();
}

/** Die ganze Fläche leeren. */
export function clearDrawing() {
  pushUndo();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scheduleSaveDrawing();
}

function onPointerDown(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (error) {
    /* ohne Capture folgt der Strich nur, solange der Finger auf der Fläche bleibt */
  }
  pushUndo();
  stroke = { tool, color, points: [pointOf(event)], before: undoStack[undoStack.length - 1] };
  paintStroke(stroke);
}

function onPointerMove(event) {
  if (!stroke) return;
  /* getCoalescedEvents: liefert auch die Zwischenpunkte, die der Browser sonst zusammenfasst */
  const moves = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
  (moves.length ? moves : [event]).forEach((move) => stroke.points.push(pointOf(move)));
  paintStroke(stroke);
}

function onToolsClick(event) {
  const toolButton = event.target.closest("[data-draw-tool]");
  if (toolButton) {
    tool = toolButton.dataset.drawTool;
    renderTools();
    return;
  }
  const colorButton = event.target.closest("[data-draw-color]");
  if (colorButton) {
    color = colorButton.dataset.drawColor;
    /* Eine Farbe wählen heißt wieder malen */
    if (tool === "eraser") tool = "pen";
    renderTools();
    return;
  }
  if (event.target.closest("[data-draw-undo]")) undoDrawing();
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  ["pointerup", "pointercancel"].forEach((name) => {
    canvas.addEventListener(name, () => {
      if (!stroke) return;
      stroke = null;
      scheduleSaveDrawing();
    });
  });

  dom.drawTools.addEventListener("click", onToolsClick);

  /* Tastatur oder Drehung ändern den Platz: die Fläche folgt, das Bild bleibt. */
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (!dom.drawPad.hidden && entryId) fitCanvas();
    }).observe(dom.drawPad);
  }

  /* Beim Verlassen der Seite nichts verlieren. */
  window.addEventListener("pagehide", saveDrawing);
}

init();
