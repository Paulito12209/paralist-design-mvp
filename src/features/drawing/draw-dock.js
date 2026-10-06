/*
 * Wo die Werkzeugleiste der Zeichnung am Desktop steht: unter der Fläche
 * (Vorgabe) oder links daneben. Am Griff zieht man sie hin — beim Ziehen
 * leuchten unten und links zwei Ziele auf, losgelassen rastet sie am
 * näheren ein. Ein Klick auf den Griff ohne Ziehen wechselt die Seite.
 * Die Wahl bleibt gemerkt (draw-state.js).
 *
 * Links stehen Leiste und Fläche nebeneinander in einem Raster
 * (styles/drawing-desk.css, Klasse is-draw-left am Reiter „Inhalt“). Die
 * Fläche wird dabei schmaler; Striche und Dinge schrumpfen mit ihr mit.
 * Pfad: src/features/drawing/draw-dock.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * dragThreshold -> ab so vielen Pixeln Bewegung am Griff wird gezogen statt geklickt
 *
 * Aussehen der Ziele und der gezogenen Leiste: styles/drawing-desk.css.
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { isDesk } from "../../ui/desk-mode.js";
import { closeDrawPop } from "./draw-pop.js";
import { draw, saveDrawPrefs } from "./draw-state.js";

const dragThreshold = 4;

let drag = null;

/** Die gemerkte Seite anwenden (nur am Desktop; am Handy steht die Leiste immer unten). */
export function applyDock() {
  const left = isDesk() && draw.dock === "left";
  dom.entryPanelNotes.classList.toggle("is-draw-left", left);
  dom.drawTools.classList.toggle("is-left", left);
  /* Die Fläche bekommt mehr oder weniger Höhe: der Reiter misst neu (src/features/entry/entry-fold.js) */
  emit(events.layoutChanged);
}

function setDock(side) {
  if (draw.dock === side) return;
  draw.dock = side;
  saveDrawPrefs();
  applyDock();
}

/* Die zwei Ziele beim Ziehen, als dünne Streifen am Rand der Fläche */
function showZones() {
  ["left", "bottom"].forEach((side) => {
    const zone = document.createElement("div");
    zone.className = `draw-dock-zone is-${side}`;
    zone.dataset.zone = side;
    dom.drawPad.append(zone);
  });
}

/* Welches Ziel liegt näher am Zeiger: der linke oder der untere Rand der Fläche? */
function nearestSide(event) {
  const rect = dom.drawPad.getBoundingClientRect();
  const toLeft = Math.abs(event.clientX - rect.left);
  const toBottom = Math.abs(event.clientY - rect.bottom);
  return toLeft < toBottom ? "left" : "bottom";
}

function onPointerDown(event) {
  const grip = event.target.closest("[data-draw-grip]");
  if (!grip || (event.pointerType === "mouse" && event.button !== 0)) return;
  event.preventDefault();
  closeDrawPop();
  try {
    grip.setPointerCapture(event.pointerId);
  } catch (error) {
    /* ohne Capture endet das Ziehen, sobald der Zeiger den Griff verlässt */
  }
  drag = { grip, x: event.clientX, y: event.clientY, moved: false };
}

function onPointerMove(event) {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < dragThreshold) return;
  if (!drag.moved) {
    drag.moved = true;
    dom.drawTools.classList.add("is-dragging");
    showZones();
  }
  /* transform: die Leiste folgt dem Zeiger, ohne dass die Seite neu angeordnet wird */
  dom.drawTools.style.transform = `translate(${dx}px, ${dy}px)`;
  const side = nearestSide(event);
  dom.drawPad.querySelectorAll(".draw-dock-zone").forEach((zone) => zone.classList.toggle("is-target", zone.dataset.zone === side));
}

function onPointerUp(event) {
  if (!drag) return;
  const done = drag;
  drag = null;
  dom.drawTools.classList.remove("is-dragging");
  dom.drawTools.style.transform = "";
  dom.drawPad.querySelectorAll(".draw-dock-zone").forEach((zone) => zone.remove());
  if (event.type === "pointercancel") return;
  if (done.moved) setDock(nearestSide(event));
  else setDock(draw.dock === "left" ? "bottom" : "left");
}

/** Griff anmelden. Die Leiste wird neu gefüllt, darum hängen die Zuhörer an ihr, nicht am Griff. */
export function initDock() {
  dom.drawTools.addEventListener("pointerdown", onPointerDown);
  dom.drawTools.addEventListener("pointermove", onPointerMove);
  dom.drawTools.addEventListener("pointerup", onPointerUp);
  dom.drawTools.addEventListener("pointercancel", onPointerUp);
}
