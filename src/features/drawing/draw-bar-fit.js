/*
 * Die Werkzeugleiste der Zeichnung am Desktop passt sich dem Platz an:
 *
 * - Unten reicht sie über die ganze Breite der Fläche, links über ihre ganze
 *   Höhe; die Gruppen verteilen sich darüber (styles/drawing-desk.css).
 * - Links steht sie einspaltig, solange die Höhe reicht, sonst zweispaltig.
 * - Reicht auch das nicht, wandern Knöpfe der Reihe nach (hideOrder) in ein
 *   Fenster hinter „⋯“ — dort funktionieren sie genauso wie in der Leiste.
 *
 * Gemessen wird nur, wenn sich die Größe der Fläche ändert (Fenster ziehen,
 * Andocken), nie in einer Bewegung.
 * Pfad: src/features/drawing/draw-bar-fit.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * hideOrder -> welche Knöpfe bei Platzmangel zuerst hinter „⋯“ wandern (der erste zuerst);
 *              Griff, Rückgängig, Stift, Radierer und die Farbpunkte bleiben immer in der Leiste
 *
 * Aussehen des Fensters hinter „⋯“: styles/drawing-pop.css (.draw-more-grid).
 */

import { dom } from "../../core/dom.js";
import { closeDrawPop, drawPopKind, toggleDrawPop } from "./draw-pop.js";
import { onDrawChange } from "./draw-state.js";

const hideOrder = [
  "[data-draw-attach]",
  '[data-draw-tool="note"]',
  '[data-draw-tool="text"]',
  '[data-draw-pop="shape"]',
  "[data-draw-redo]",
  '[data-draw-pop="color"]',
  '[data-draw-tool="select"]',
  '[data-draw-tool="marker"]',
];

/* Gesetzt von draw-desk-bar.js: steht gerade die Desktop-Leiste da? */
let deskShown = () => false;
let queued = 0;

function side() {
  return dom.drawTools.classList.contains("is-left") ? "left" : "bottom";
}

/* Wie lang die Leiste mit allen sichtbaren Knöpfen wäre, ohne Verteilen */
function naturalLength() {
  const bar = dom.drawTools;
  bar.classList.add("is-measuring");
  const length = side() === "left" ? bar.offsetHeight : bar.offsetWidth;
  bar.classList.remove("is-measuring");
  return length;
}

/* Wie lang sie sein darf: so breit bzw. so hoch wie die Fläche */
function room() {
  return side() === "left" ? dom.drawPad.clientHeight : dom.drawPad.clientWidth;
}

/* Gruppen ohne sichtbaren Knopf verschwinden samt Trennstrich davor */
function syncGroups() {
  dom.drawTools.querySelectorAll(".draw-group").forEach((group) => {
    const empty = !Array.from(group.querySelectorAll("button")).some((button) => !button.hidden);
    group.hidden = empty;
    const split = group.previousElementSibling;
    if (split && split.classList.contains("draw-split")) split.hidden = empty;
  });
}

/* Liegt das gewählte Werkzeug hinter „⋯“, zeigt der Knopf das an */
function markMore() {
  const more = dom.drawTools.querySelector("[data-draw-more]");
  if (!more) return;
  const activeHidden = Array.from(dom.drawTools.querySelectorAll("button[hidden].is-active")).length > 0;
  more.classList.toggle("is-active", activeHidden);
}

/** Spalten und „⋯“ für den Platz wählen, den die Fläche gerade hat. */
export function fitBar() {
  const bar = dom.drawTools;
  const more = bar.querySelector("[data-draw-more]");
  if (!deskShown() || !more || dom.drawPad.hidden || !dom.drawPad.clientWidth) return;
  const items = hideOrder.map((selector) => bar.querySelector(selector)).filter(Boolean);
  const limit = room();
  items.forEach((item) => {
    item.hidden = false;
  });
  more.hidden = true;
  syncGroups();
  /* Links erst einspaltig versuchen, dann zweispaltig */
  bar.classList.toggle("is-one-col", side() === "left");
  if (naturalLength() > limit && side() === "left") bar.classList.remove("is-one-col");
  if (naturalLength() > limit) {
    more.hidden = false;
    for (const item of items) {
      item.hidden = true;
      syncGroups();
      if (naturalLength() <= limit) break;
    }
  }
  /* Steht „⋯“ nicht mehr da, gehört auch sein Fenster weg */
  if (more.hidden && drawPopKind() === "more") closeDrawPop();
  markMore();
}

/* Die Knöpfe hinter „⋯“ als Raster — dieselben Knöpfe wie in der Leiste, nur sichtbar */
function moreMarkup() {
  const buttons = Array.from(dom.drawTools.querySelectorAll("button[hidden]:not([data-draw-more])"))
    .map((button) => button.outerHTML.replace(/\shidden(="")?/, ""))
    .join("");
  return `<div class="draw-pop-title">Weitere Werkzeuge</div><div class="draw-more-grid">${buttons}</div>`;
}

/**
 * Das Fenster hinter „⋯“ öffnen oder schließen.
 * @param run Aktion eines Knopfs (runBarAction aus draw-desk-bar.js);
 *            Fenster wie Strichbreite oder Formen hängen dann am „⋯“-Knopf.
 */
export function toggleMorePop(button, run) {
  toggleDrawPop(button, "more", moreMarkup(), (pop) => {
    pop.onclick = (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      run(target, button);
      /* Rückgängig und Wiederholen öffnen nichts Neues: dann geht das Fenster zu */
      if (drawPopKind() === "more") closeDrawPop();
    };
  });
}

/** Beim Laden einrichten. `isDeskShown` sagt, ob die Desktop-Leiste gerade steht. */
export function initBarFit(isDeskShown) {
  deskShown = isDeskShown;
  onDrawChange(markMore);
  /* ResizeObserver: Fläche breiter, schmaler, höher — einmal je Bild neu entscheiden */
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        fitBar();
      });
    }).observe(dom.drawPad);
  }
}
