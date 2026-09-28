/*
 * Die Karte „Ansicht konfigurieren“ als eigene Ebene: sie liegt über der
 * Aufgaben-Liste, aber unter der Navigation, und hängt fest über ihr. Zwei
 * Lagen: eingeklappt schaut nur der Kopf über der Navigation hervor,
 * ausgeklappt steht die ganze Karte darüber. Die Liste darunter scrollt dabei
 * nicht mit — man sieht die Einstellungen, ohne seinen Platz zu verlieren.
 *
 * Umschalten: Tipp auf den Kopf oder das Symbol rechts, oder den Kopf nach
 * oben bzw. unten ziehen. Kopf und Karte werden einmal angelegt; beim
 * Neuzeichnen wird nur der Inhalt ersetzt — so blinkt die Karte nie leer auf.
 * Pfad: src/features/tasks/tasks-panel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * panelTitle    -> Überschrift im Kopf
 * DRAG_START_PX -> so weit muss der Finger wandern, bevor aus einem Tipp ein Ziehen wird
 * SNAP_PX       -> so weit muss man ziehen, damit die Karte in die andere Lage springt
 *
 * Aussehen, Lage und Geschwindigkeit: styles/tasks-settings.css
 * (--details-head-h, --tasks-panel-gap, --tasks-panel-slide).
 */

import { icon } from "../../core/html.js";
import { cssNumber } from "../../core/css-vars.js";

const panelTitle = "Ansicht konfigurieren";
const DRAG_START_PX = 6;
const SNAP_PX = 40;

let panel = null;
let body = null;
let expanded = false;
/* Beim Ziehen: { y, from, moved } — from ist die Lage in px beim Aufsetzen. */
let drag = null;
/* Nach einem Ziehen kommt noch ein Klick — der schaltet nicht noch einmal um. */
let skipClick = false;

/* Wie weit die Karte eingeklappt nach unten geschoben ist. */
function collapsedOffset() {
  return Math.max(0, panel.offsetHeight - cssNumber("--details-head-h", 52));
}

function setExpanded(next) {
  expanded = next;
  panel.classList.toggle("is-expanded", next);
  const toggle = panel.querySelector(".tasks-panel-toggle");
  toggle.setAttribute("aria-expanded", String(next));
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  skipClick = false;
  drag = { y: event.clientY, from: expanded ? 0 : collapsedOffset(), moved: false, id: event.pointerId };
  /* Der Kopf behält den Finger, auch wenn er ihn beim Ziehen gleich verlässt. */
  event.currentTarget.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const dy = event.clientY - drag.y;
  if (!drag.moved) {
    if (Math.abs(dy) < DRAG_START_PX) return;
    drag.moved = true;
    panel.classList.add("is-dragging");
  }
  const top = Math.min(collapsedOffset(), Math.max(0, drag.from + dy));
  panel.style.transform = `translateY(${top}px)`;
}

function onPointerUp(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const dy = event.clientY - drag.y;
  /* Auch ohne Zwischenschritte zählt die Strecke vom Aufsetzen bis zum Loslassen. */
  const moved = drag.moved || Math.abs(dy) >= DRAG_START_PX;
  drag = null;
  if (!moved) return;
  panel.classList.remove("is-dragging");
  panel.style.transform = "";
  if (Math.abs(dy) >= SNAP_PX) setExpanded(dy < 0);
  skipClick = true;
}

/* Der ganze Kopf schaltet um — mit festgehaltenem Zeiger trifft der Klick
   den Kopf selbst, nicht den Knopf darin. */
function onHeadClick() {
  if (skipClick) {
    skipClick = false;
    return;
  }
  setExpanded(!expanded);
}

/** Die Ebene einmal anlegen. `onClick` bekommt die Klicks im Inhalt. */
export function initTaskPanel(onClick) {
  panel = document.createElement("section");
  panel.className = "details-card tasks-panel";
  panel.setAttribute("aria-label", panelTitle);
  panel.innerHTML = `
    <div class="details-head tasks-panel-head">
      <button class="details-title" type="button">${panelTitle}</button>
      <button class="details-link tasks-panel-toggle" type="button"
        aria-label="${panelTitle}" aria-expanded="false">${icon("panel-open")}</button>
    </div>
    <div class="tasks-panel-body"></div>
  `;
  body = panel.querySelector(".tasks-panel-body");
  const head = panel.querySelector(".tasks-panel-head");
  head.addEventListener("pointerdown", onPointerDown);
  head.addEventListener("pointermove", onPointerMove);
  head.addEventListener("pointerup", onPointerUp);
  head.addEventListener("pointercancel", onPointerUp);
  head.addEventListener("click", onHeadClick);
  body.addEventListener("click", onClick);
  /* Vor der unteren Leiste einhängen: dieselbe Ebene wie die Seite, die
     Navigation (styles/navigation.css) bleibt darüber. */
  document.querySelector(".bottom-bar").before(panel);
}

/** Nur den Inhalt der Karte ersetzen — Kopf und Lage bleiben. */
export function setTaskPanelContent(html) {
  body.innerHTML = html;
}
