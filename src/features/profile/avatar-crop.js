/*
 * Den Ausschnitt fürs Profilbild wählen: das Foto liegt hinter einem runden
 * Fenster, man schiebt es mit einem Finger und zoomt mit zwei Fingern, dem
 * Regler oder dem Mausrad. „Auswählen“ schneidet genau das Runde aus.
 * Das Blatt entsteht erst beim ersten Öffnen, damit index.html schlank bleibt.
 * Pfad: src/features/profile/avatar-crop.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxZoom    -> wie weit man höchstens hineinzoomen kann (4 = vierfach)
 * zoomSteps  -> wie fein der Regler in Schritten auflöst
 * wheelSpeed -> wie stark ein Dreh am Mausrad zoomt
 * outputSize -> Kantenlänge des fertigen Profilbilds in Pixeln
 * quality    -> Bildqualität des fertigen Profilbilds (0 bis 1)
 *
 * Größe des Fensters und Farben: styles/avatar-crop.css (--crop-size, --crop-shade).
 */

import { cssNumber } from "../../core/css-vars.js";
import { dom } from "../../core/dom.js";

const maxZoom = 4;
const zoomSteps = 100;
const wheelSpeed = 0.0015;
const outputSize = 512;
const quality = 0.9;

let backdrop = null;
let frame = null;
let img = null;
let slider = null;
let onDone = null;
let onClose = null;

/* Maße in Pixeln: Fenster, Grundmaßstab (Foto füllt das Fenster gerade), Zoom, Lage des Fotos */
const view = { size: 0, base: 1, zoom: 1, x: 0, y: 0, w: 1, h: 1 };
/* Finger auf dem Fenster: pointerId -> { x, y } */
const pointers = new Map();
let pinch = null;

function scale() {
  return view.base * view.zoom;
}

/* Das Foto darf nie so weit rutschen, dass im Kreis eine leere Ecke entsteht. */
function clamp() {
  const s = scale();
  view.x = Math.min(0, Math.max(view.size - view.w * s, view.x));
  view.y = Math.min(0, Math.max(view.size - view.h * s, view.y));
}

function paint() {
  clamp();
  /* transform statt left/top: das Verschieben läuft flüssig, ohne neues Layout */
  img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${scale()})`;
  slider.value = String(Math.round(((view.zoom - 1) / (maxZoom - 1)) * zoomSteps));
}

/* Zoomen, sodass der Punkt (px, py) im Fenster an seiner Stelle bleibt. */
function zoomAt(zoom, px, py) {
  const before = scale();
  view.zoom = Math.min(maxZoom, Math.max(1, zoom));
  const after = scale();
  view.x = px - ((px - view.x) / before) * after;
  view.y = py - ((py - view.y) / before) * after;
  paint();
}

/* Punkt im Fenster aus Bildschirm-Koordinaten. */
function local(x, y) {
  const box = frame.getBoundingClientRect();
  return { x: x - box.left, y: y - box.top };
}

function midpoint() {
  const [a, b] = [...pointers.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, gap: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
}

function onPointerDown(event) {
  frame.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) pinch = { ...midpoint(), zoom: view.zoom };
}

function onPointerMove(event) {
  const last = pointers.get(event.pointerId);
  if (!last) return;
  if (pointers.size === 1) {
    view.x += event.clientX - last.x;
    view.y += event.clientY - last.y;
    last.x = event.clientX;
    last.y = event.clientY;
    paint();
    return;
  }
  last.x = event.clientX;
  last.y = event.clientY;
  if (!pinch) return;
  const now = midpoint();
  /* Mitte der beiden Finger folgt dem Verschieben, der Abstand bestimmt den Zoom */
  view.x += now.x - pinch.x;
  view.y += now.y - pinch.y;
  const at = local(now.x, now.y);
  zoomAt(pinch.zoom * (now.gap / pinch.gap), at.x, at.y);
  pinch = { ...now, zoom: view.zoom };
}

function onPointerUp(event) {
  pointers.delete(event.pointerId);
  pinch = pointers.size === 2 ? { ...midpoint(), zoom: view.zoom } : null;
}

function onWheel(event) {
  event.preventDefault();
  const at = local(event.clientX, event.clientY);
  zoomAt(view.zoom * Math.exp(-event.deltaY * wheelSpeed), at.x, at.y);
}

function onSlider() {
  const zoom = 1 + (Number(slider.value) / zoomSteps) * (maxZoom - 1);
  zoomAt(zoom, view.size / 2, view.size / 2);
}

/* Fenster vermessen und das Foto an den gemerkten Ausschnitt legen. */
function place(crop) {
  view.size = frame.clientWidth || cssNumber("--crop-size", 280);
  view.w = img.naturalWidth || 1;
  view.h = img.naturalHeight || 1;
  view.base = view.size / Math.min(view.w, view.h);
  view.zoom = crop ? Math.min(maxZoom, Math.max(1, crop.zoom)) : 1;
  const cx = crop ? crop.cx : 0.5;
  const cy = crop ? crop.cy : 0.5;
  view.x = view.size / 2 - cx * view.w * scale();
  view.y = view.size / 2 - cy * view.h * scale();
  paint();
}

/*
 * canvas: schneidet das runde Fenster als Quadrat aus dem ganzen Foto — rund
 * wird es erst bei der Anzeige, so bleibt das Bild überall gleich verwendbar.
 */
function cropResult() {
  const s = scale();
  const side = view.size / s;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  canvas.getContext("2d").drawImage(img, -view.x / s, -view.y / s, side, side, 0, 0, outputSize, outputSize);
  const crop = {
    cx: (view.size / 2 - view.x) / s / view.w,
    cy: (view.size / 2 - view.y) / s / view.h,
    zoom: view.zoom,
  };
  return { photo: canvas.toDataURL("image/jpeg", quality), crop };
}

/* Das Blatt einmalig bauen. Liegt über dem Einstellungs-Blatt wie die große Bildansicht. */
function build() {
  backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop avatar-view avatar-crop";
  backdrop.id = "avatar-crop";
  backdrop.hidden = true;
  /* input type=range: der Regler ist der Weg zum Zoomen ohne zwei Finger */
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
      <header class="modal-head">
        <h2 id="avatar-crop-title">Ausschnitt wählen</h2>
      </header>
      <div class="modal-body avatar-crop-body">
        <div class="avatar-crop-frame">
          <img class="avatar-crop-img" alt="" draggable="false">
          <div class="avatar-crop-ring"></div>
        </div>
        <p class="avatar-crop-hint">Verschieben und zoomen</p>
        <input class="avatar-crop-zoom" type="range" min="0" max="${zoomSteps}" value="0" aria-label="Zoom">
      </div>
      <div class="avatar-crop-actions">
        <button class="avatar-crop-cancel" type="button">Abbrechen</button>
        <button class="avatar-crop-ok" type="button">Auswählen</button>
      </div>
    </div>`;
  dom.avatarView.after(backdrop);
  frame = backdrop.querySelector(".avatar-crop-frame");
  img = backdrop.querySelector(".avatar-crop-img");
  slider = backdrop.querySelector(".avatar-crop-zoom");

  frame.addEventListener("pointerdown", onPointerDown);
  frame.addEventListener("pointermove", onPointerMove);
  frame.addEventListener("pointerup", onPointerUp);
  frame.addEventListener("pointercancel", onPointerUp);
  frame.addEventListener("wheel", onWheel, { passive: false });
  slider.addEventListener("input", onSlider);
  backdrop.querySelector(".avatar-crop-cancel").addEventListener("click", () => onClose && onClose());
  backdrop.querySelector(".avatar-crop-ok").addEventListener("click", () => {
    const whole = { image: img.src, crop: null };
    const result = cropResult();
    whole.crop = result.crop;
    const done = onDone;
    if (onClose) onClose();
    if (done) done(result.photo, whole);
  });
}

/**
 * Den Editor öffnen.
 * @param whole   { image, crop } — das ganze Foto und der zuletzt gewählte Ausschnitt
 * @param handlers.done  bekommt das fertige Bild und { image, crop }
 * @param handlers.close schließt den Editor (über den Verlauf)
 */
export function openCropper(whole, { done, close }) {
  if (!backdrop) build();
  onDone = done;
  onClose = close;
  pointers.clear();
  pinch = null;
  backdrop.hidden = false;
  img.onload = () => place(whole.crop);
  img.src = whole.image;
  if (img.complete && img.naturalWidth) place(whole.crop);
}

/** Den Editor ohne Umweg über den Verlauf schließen. */
export function hideCropper() {
  if (!backdrop) return;
  backdrop.hidden = true;
  onDone = null;
  pointers.clear();
  pinch = null;
}
