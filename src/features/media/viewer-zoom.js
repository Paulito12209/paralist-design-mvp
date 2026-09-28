/*
 * Zoomen in der Dateiansicht: nur die Datei selbst wird größer — Kopfzeile
 * (Zurück, Name, Teilen) und die Leiste unten bleiben immer stehen und in
 * ihrer Größe. Zwei Finger zoomen, ein Finger schiebt das vergrößerte Bild,
 * doppelt tippen springt hinein bzw. zurück. Am Rechner zoomt das Trackpad
 * (Zusammenziehen) oder Strg + Mausrad. Das Zoomen des ganzen Browsers ist,
 * solange die Ansicht offen ist, gesperrt — sonst würde wieder alles mit
 * vergrößert.
 * Pfad: src/features/media/viewer-zoom.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * MAX_ZOOM        -> wie weit man höchstens hineinzoomen kann (5 = fünffach)
 * DOUBLE_TAP_ZOOM -> wie weit doppelt tippen hineinspringt
 * DOUBLE_TAP_MS   -> wie schnell der zweite Tipp kommen muss, damit er als Doppeltipp gilt
 * TAP_SLOP_PX     -> so weit darf der Finger wandern, und es gilt noch als Tipp
 * WHEEL_SPEED     -> wie stark Trackpad bzw. Strg + Mausrad zoomen
 * LOCKED_VIEWPORT -> Zusatz für die Viewport-Angabe, der den Browser-Zoom sperrt
 */

import { cancelModalPull } from "../../ui/modal-pull.js";

const MAX_ZOOM = 5;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;
const TAP_SLOP_PX = 10;
const WHEEL_SPEED = 0.01;
const LOCKED_VIEWPORT = ", maximum-scale=1, user-scalable=no";

/* Rahmen (bewegt sich nie) und die Fläche darin, die vergrößert wird */
let frame = null;
let stage = null;
/* Wird bei einem einzelnen Tipp gerufen (erst, wenn kein zweiter folgt) */
let onTap = null;

/* Zoom und Verschiebung der Fläche in Pixeln, bezogen auf ihre linke obere Ecke */
const view = { zoom: 1, x: 0, y: 0 };
/* Finger auf der Fläche: pointerId -> { x, y } */
const pointers = new Map();
let pinch = null;
let pan = null;
/* Erster Tipp eines möglichen Doppeltipps */
let lastTap = null;
let tapTimer = 0;
/* Die ursprüngliche Viewport-Angabe, solange der Browser-Zoom gesperrt ist */
let savedViewport = null;

/** Ist die Datei gerade vergrößert (oder zoomen gerade zwei Finger)? */
export function isZoomed() {
  return view.zoom > 1.01 || pointers.size > 1;
}

/* Nur Bild und Video lassen sich zoomen — PDF zoomt selbst, Ton und Karten nicht. */
function canZoom() {
  return Boolean(stage && stage.querySelector(".viewer-img, .viewer-video, .viewer-embed"));
}

/* Die Fläche darf nie so weit rutschen, dass am Rand Leere hereinkommt. */
function clamp() {
  const w = stage.offsetWidth;
  const h = stage.offsetHeight;
  view.x = Math.min(0, Math.max(w - w * view.zoom, view.x));
  view.y = Math.min(0, Math.max(h - h * view.zoom, view.y));
}

function paint() {
  if (!stage) return;
  if (view.zoom <= 1.01) {
    view.zoom = 1;
    view.x = 0;
    view.y = 0;
  }
  clamp();
  /* transform statt Größe: nur die Fläche wird größer, Kopf und Leiste bleiben stehen */
  stage.style.transform = view.zoom === 1 ? "" : `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
  /* Merkmal für modal-pull.js: vergrößert schiebt ein Finger das Bild, statt die Ansicht zu schließen */
  if (view.zoom === 1) delete stage.dataset.zoomed;
  else stage.dataset.zoomed = "1";
}

/* Zoomen, sodass der Punkt (px, py) im Rahmen an seiner Stelle bleibt. */
function zoomAt(zoom, px, py) {
  const next = Math.min(MAX_ZOOM, Math.max(1, zoom));
  view.x = px - ((px - view.x) * next) / view.zoom;
  view.y = py - ((py - view.y) * next) / view.zoom;
  view.zoom = next;
  paint();
}

/* Bildschirmpunkt in Rahmen-Koordinaten */
function local(x, y) {
  const box = frame.getBoundingClientRect();
  return { x: x - box.left, y: y - box.top };
}

function midpoint() {
  const [a, b] = [...pointers.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, gap: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
}

/** Zurück auf Originalgröße — beim Blättern und bei jeder neuen Datei. */
export function resetZoom() {
  view.zoom = 1;
  pointers.clear();
  pinch = null;
  pan = null;
  lastTap = null;
  clearTimeout(tapTimer);
  paint();
}

function onDown(event) {
  if (event.target.closest(".viewer-nav") || !canZoom()) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
  if (pointers.size === 2) {
    /* Der zweite Finger macht aus Ziehen und Wischen ein Zoomen */
    cancelModalPull();
    pan = null;
    pinch = { ...midpoint(), zoom: view.zoom };
  } else if (pointers.size === 1 && view.zoom > 1) {
    pan = { x: event.clientX, y: event.clientY };
  }
}

function onMove(event) {
  const point = pointers.get(event.pointerId);
  if (!point) return;
  point.x = event.clientX;
  point.y = event.clientY;
  if (pinch && pointers.size === 2) {
    const now = midpoint();
    view.x += now.x - pinch.x;
    view.y += now.y - pinch.y;
    const at = local(now.x, now.y);
    zoomAt(pinch.zoom * (now.gap / pinch.gap), at.x, at.y);
    pinch = { ...now, zoom: view.zoom };
    return;
  }
  if (pan) {
    view.x += event.clientX - pan.x;
    view.y += event.clientY - pan.y;
    pan = { x: event.clientX, y: event.clientY };
    paint();
  }
}

/* Tipp oder Doppeltipp? Ein einzelner Tipp wartet kurz, ob noch einer kommt. */
function handleTap(event) {
  const now = Date.now();
  if (lastTap && now - lastTap.time < DOUBLE_TAP_MS && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < TAP_SLOP_PX * 3) {
    clearTimeout(tapTimer);
    lastTap = null;
    const at = local(event.clientX, event.clientY);
    zoomAt(view.zoom > 1 ? 1 : DOUBLE_TAP_ZOOM, at.x, at.y);
    return;
  }
  lastTap = { time: now, x: event.clientX, y: event.clientY };
  const target = event.target;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => {
    lastTap = null;
    if (onTap) onTap(target);
  }, DOUBLE_TAP_MS);
}

function onUp(event) {
  const point = pointers.get(event.pointerId);
  if (!point) return;
  pointers.delete(event.pointerId);
  const wasPinch = Boolean(pinch);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 1 && view.zoom > 1) {
    const [rest] = pointers.values();
    pan = { x: rest.x, y: rest.y };
    return;
  }
  pan = null;
  if (event.type !== "pointerup" || wasPinch || pointers.size) return;
  const moved = Math.hypot(event.clientX - point.startX, event.clientY - point.startY);
  /* Die eigenen Knöpfe eines Videos behalten ihren Tipp für sich */
  if (moved < TAP_SLOP_PX && !event.target.closest(".viewer-video")) handleTap(event);
}

/* Trackpad (Chrome, Firefox) und Strg + Mausrad: zoomen; vergrößert rollt das Rad die Datei. */
function onWheel(event) {
  if (!canZoom()) return;
  if (event.ctrlKey) {
    event.preventDefault();
    const at = local(event.clientX, event.clientY);
    zoomAt(view.zoom * Math.exp(-event.deltaY * WHEEL_SPEED), at.x, at.y);
    return;
  }
  if (view.zoom === 1) return;
  event.preventDefault();
  view.x -= event.deltaX;
  view.y -= event.deltaY;
  paint();
}

/* Safari am Rechner meldet das Zusammenziehen am Trackpad nur als „gesture“.
   Auf dem iPhone kommen dieselben Meldungen zusätzlich zu den Fingern — dort
   rechnen schon die Finger, hier wird dann nur der Seiten-Zoom verhindert. */
let gestureStart = 1;
function onGestureStart(event) {
  event.preventDefault();
  gestureStart = view.zoom;
}

function onGestureChange(event) {
  event.preventDefault();
  if (pointers.size || !canZoom()) return;
  const at = local(event.clientX, event.clientY);
  zoomAt(gestureStart * event.scale, at.x, at.y);
}

/* Den Browser-Zoom sperren bzw. wieder freigeben (vor allem für Android, wo
   ein Finger über dem YouTube-Player sonst die ganze Seite vergrößert). */
function lockViewport(lock) {
  /* meta viewport: nur hier legt man fest, ob der Browser selbst zoomen darf */
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  if (lock && savedViewport === null) {
    savedViewport = meta.content;
    meta.content = savedViewport + LOCKED_VIEWPORT;
  } else if (!lock && savedViewport !== null) {
    meta.content = savedViewport;
    savedViewport = null;
  }
}

/**
 * Zoomen im frisch gezeichneten Gerüst anmelden.
 * @param root  die ganze Ansicht (.viewer) — dort ist der Browser-Zoom aus
 * @param tap   wird bei einem einfachen Tipp auf die Datei gerufen (Video: Abspielen/Anhalten)
 */
export function bindZoom(root, tap) {
  frame = root.querySelector(".viewer-main");
  stage = root.querySelector(".viewer-stage");
  onTap = tap;
  resetZoom();
  frame.addEventListener("pointerdown", onDown);
  frame.addEventListener("pointermove", onMove);
  frame.addEventListener("pointerup", onUp);
  frame.addEventListener("pointercancel", onUp);
  frame.addEventListener("pointerleave", onUp);
  /* passive: false — nur so lässt sich der Browser-Zoom per preventDefault verhindern */
  frame.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("gesturestart", onGestureStart);
  root.addEventListener("gesturechange", onGestureChange);
  lockViewport(true);
}

/** Beim Schließen der Ansicht: Merkungen leeren und den Browser-Zoom wieder erlauben. */
export function unbindZoom() {
  resetZoom();
  clearTimeout(tapTimer);
  frame = null;
  stage = null;
  onTap = null;
  lockViewport(false);
}
