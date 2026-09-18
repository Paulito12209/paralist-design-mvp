/*
 * Gesten auf dem Wochenstreifen: senkrecht ziehen oder scrollen blättert eine
 * Zeile weiter, waagerecht wischen blättert den ganzen sichtbaren Zeitraum.
 * Pfad: src/features/calendar/calendar-gestures.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * axisSlack     -> ab wie vielen Pixeln die Richtung der Geste feststeht
 * swipeDistance -> wie weit man waagerecht wischen muss, damit geblättert wird
 * wheelStep     -> wie viel Mausrad-Bewegung eine Zeile weiterblättert
 * snapDuration  -> Dauer der Gleitbewegung in Millisekunden
 */

import { dom } from "../../core/dom.js";
import { state } from "../../data/state.js";
import { shiftMonth, shiftSpan, shiftWeeks } from "./calendar-nav.js";
import { cal, markSwiped, rowHeight } from "./calendar-state.js";

const axisSlack = 8;
const swipeDistance = 40;
const wheelStep = 40;
const snapDuration = 180;

/* Wird von calendar.js gesetzt. */
let redraw = () => {};

/** Die Funktion hinterlegen, die den Kalender neu zeichnet. */
export function setRedraw(fn) {
  redraw = fn;
}

/* Blättert um eine Zeile: der Block gleitet weg, danach wird neu gezeichnet. */
function snapRows(direction) {
  if (cal.snapping) return;
  cal.snapping = true;
  cal.swiped = true;

  const finish = () => {
    dom.calWeeks.removeEventListener("transitionend", finish);
    dom.calWeeks.style.transition = "none";
    dom.calWeeks.style.transform = "";
    if (state.prefs.calendar.span === 0) shiftMonth(direction);
    else shiftWeeks(direction);
    cal.snapping = false;
    markSwiped();
  };

  dom.calWeeks.addEventListener("transitionend", finish);
  /* transition/transform: die Gleitbewegung läuft im Browser, nicht in JavaScript */
  dom.calWeeks.style.transition = `transform ${snapDuration}ms ease-out`;
  dom.calWeeks.style.transform = `translateY(${-direction * rowHeight()}px)`;
  /* Sicherheitsnetz, falls kein transitionend kommt */
  setTimeout(finish, snapDuration + 80);
}

function resetDrag() {
  dom.calWeeks.style.transition = "transform 0.18s ease-out";
  dom.calWeeks.style.transform = "";
}

function onPointerDown(event) {
  if (cal.snapping) return;
  cal.drag = { x: event.clientX, y: event.clientY, axis: null, id: event.pointerId };
}

function onPointerMove(event) {
  if (!cal.drag || cal.drag.id !== event.pointerId) return;
  const dx = event.clientX - cal.drag.x;
  const dy = event.clientY - cal.drag.y;

  if (!cal.drag.axis) {
    if (Math.abs(dx) < axisSlack && Math.abs(dy) < axisSlack) return;
    cal.drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (cal.drag.axis === "y") {
      try {
        dom.calStrip.setPointerCapture(event.pointerId);
      } catch (error) {
        /* ohne Capture folgt die Bewegung nur, solange der Finger auf dem Streifen bleibt */
      }
    }
  }
  if (cal.drag.axis !== "y") return;

  const limit = rowHeight();
  dom.calWeeks.style.transition = "none";
  dom.calWeeks.style.transform = `translateY(${Math.max(-limit, Math.min(limit, dy))}px)`;
}

function onPointerUp(event) {
  if (!cal.drag) return;
  const dx = event.clientX - cal.drag.x;
  const dy = event.clientY - cal.drag.y;
  const { axis } = cal.drag;
  cal.drag = null;

  if (axis === "y") {
    if (Math.abs(dy) > rowHeight() / 3) snapRows(dy < 0 ? 1 : -1);
    else resetDrag();
    markSwiped();
    return;
  }

  if (axis !== "x" || Math.abs(dx) < swipeDistance) return;
  markSwiped();
  shiftSpan(dx < 0 ? 1 : -1);
}

/* Mausrad und Trackpad über dem Streifen blättern die Wochen statt die Seite. */
function onWheel(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  cal.wheel += event.deltaY;
  if (Math.abs(cal.wheel) < wheelStep || cal.snapping) return;
  const direction = cal.wheel > 0 ? 1 : -1;
  cal.wheel = 0;
  snapRows(direction);
}

/** Die Gesten auf dem Streifen anmelden. Wird einmal beim Laden des Kalenders aufgerufen. */
export function initCalendarGestures() {
  const strip = dom.calStrip;

  strip.addEventListener("click", (event) => {
    if (cal.swiped) return;
    const day = event.target.closest("[data-day]");
    if (!day) return;
    cal.selected = day.dataset.day;
    redraw();
  });

  strip.addEventListener("pointerdown", onPointerDown);
  strip.addEventListener("pointermove", onPointerMove);
  strip.addEventListener("pointerup", onPointerUp);
  strip.addEventListener("pointercancel", () => {
    cal.drag = null;
    resetDrag();
  });
  /* passive: false, weil das Blättern das normale Scrollen der Seite ersetzt */
  strip.addEventListener("wheel", onWheel, { passive: false });
}
