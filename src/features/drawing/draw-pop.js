/*
 * Kleine Fenster an der Werkzeugleiste der Zeichnung: Strichbreite, Formen,
 * Farbwähler (draw-color-pop.js) und „Weitere Werkzeuge“ (draw-bar-fit.js). Es ist immer höchstens eines offen; es
 * steht über der Leiste, wenn sie unten ist, und rechts daneben, wenn sie
 * links steht. Ein Klick daneben oder Escape schließt es.
 * Pfad: src/features/drawing/draw-pop.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * popGap     -> Abstand des Fensters zum Knopf (Pixel)
 * edgeMargin -> so nah darf das Fenster an den Fensterrand (Pixel)
 * widthNames -> Beschriftung der drei Strichbreiten
 *
 * Aussehen: styles/drawing-pop.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { shapes } from "../../data/draw-shapes.js";
import { shapeIcon } from "./draw-icons.js";
import { draw, drawChanged, saveDrawPrefs, setTool } from "./draw-state.js";
import { widthPresets } from "./drawing-tools.js";

const popGap = 10;
const edgeMargin = 8;
const widthNames = ["Fein", "Mittel", "Breit"];

let pop = null;
let anchor = null;
let kind = "";

/** Ist gerade ein Fenster offen? */
export function isDrawPopOpen() {
  return Boolean(pop && !pop.hidden);
}

/** Welches Fenster gerade offen ist ("width", "shape", "color", "more") oder "". */
export function drawPopKind() {
  return isDrawPopOpen() ? kind : "";
}

/** Das offene Fenster schließen. */
export function closeDrawPop() {
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  if (anchor) anchor.setAttribute("aria-expanded", "false");
  anchor = null;
  kind = "";
}

/* Neben den Knopf stellen: über die Leiste unten, rechts neben die Leiste links */
function place() {
  const rect = anchor.getBoundingClientRect();
  const width = pop.offsetWidth;
  const height = pop.offsetHeight;
  const maxLeft = window.innerWidth - width - edgeMargin;
  const maxTop = window.innerHeight - height - edgeMargin;
  let left;
  let top;
  if (draw.dock === "left") {
    left = rect.right + popGap;
    top = rect.top + rect.height / 2 - height / 2;
  } else {
    left = rect.left + rect.width / 2 - width / 2;
    top = rect.top - height - popGap;
  }
  pop.style.left = `${Math.round(Math.min(Math.max(edgeMargin, left), maxLeft))}px`;
  pop.style.top = `${Math.round(Math.min(Math.max(edgeMargin, top), maxTop))}px`;
  pop.dataset.side = draw.dock;
}

/**
 * Ein Fenster öffnen oder — ist es schon offen — schließen.
 * @param button  der Knopf, an dem es hängt
 * @param name    welches Fenster ("width", "shape", "color")
 * @param markup  Inhalt als HTML
 * @param bind    optional: richtet Felder im Inhalt ein (z.B. Farbfeld)
 */
export function toggleDrawPop(button, name, markup, bind) {
  if (isDrawPopOpen() && kind === name) {
    closeDrawPop();
    return;
  }
  closeDrawPop();
  if (!pop) build();
  anchor = button;
  kind = name;
  pop.dataset.kind = name;
  pop.innerHTML = markup;
  pop.hidden = false;
  button.setAttribute("aria-expanded", "true");
  /* Ein Klick-Empfänger des vorigen Fensters darf im neuen nichts auslösen */
  pop.onclick = null;
  if (bind) bind(pop);
  place();
}

/** Inhalt des offenen Fensters neu zeichnen, ohne es zu schließen. */
export function refreshDrawPop(name, markup, bind) {
  if (!isDrawPopOpen() || kind !== name) return;
  pop.innerHTML = markup;
  if (bind) bind(pop);
}

/** Die drei Strichbreiten des gewählten Malwerkzeugs. */
export function widthMarkup() {
  const presets = widthPresets[draw.tool] || [];
  const options = presets
    .map((width, index) => {
      const active = draw.widths[draw.tool] === width;
      /* Der Punkt zeigt die echte Breite, gedeckelt, damit „Breit“ beim Radierer ins Fenster passt */
      const dot = Math.min(width, 26);
      return `<button class="draw-pop-option${active ? " is-active" : ""}" type="button" data-draw-width="${width}" aria-pressed="${active}">
        <span class="draw-width-dot" style="--draw-dot: ${dot}px"></span><span>${widthNames[index] || width}</span></button>`;
    })
    .join("");
  return `<div class="draw-pop-title">Strichbreite</div><div class="draw-pop-row">${options}</div>`;
}

/** Die zehn Formen und darüber „Kontur | Gefüllt“. */
export function shapeMarkup() {
  const tiles = shapes
    .map((shape) => {
      const active = draw.tool === "shape" && draw.shape === shape.id;
      return `<button class="draw-shape-tile${active ? " is-active" : ""}" type="button" data-draw-shape="${shape.id}" title="${escapeHtml(shape.label)}">
        ${shapeIcon(shape.id, draw.fill)}<span>${escapeHtml(shape.label)}</span></button>`;
    })
    .join("");
  return `<div class="draw-pop-head"><span class="draw-pop-title">Formen</span>
    <div class="draw-seg" role="group" aria-label="Füllung">
      <button type="button" data-draw-fill="0" class="${draw.fill ? "" : "is-active"}" aria-pressed="${!draw.fill}">Kontur</button>
      <button type="button" data-draw-fill="1" class="${draw.fill ? "is-active" : ""}" aria-pressed="${draw.fill}">Gefüllt</button>
    </div></div>
    <div class="draw-shape-grid">${tiles}</div>
    <p class="draw-pop-hint">Auf der Fläche aufziehen oder klicken.</p>`;
}

/* Klicks in den Fenstern für Strichbreite und Formen */
function onPopClick(event) {
  const width = event.target.closest("[data-draw-width]");
  if (width) {
    draw.widths[draw.tool] = Number(width.dataset.drawWidth);
    saveDrawPrefs();
    closeDrawPop();
    drawChanged();
    return;
  }
  const fill = event.target.closest("[data-draw-fill]");
  if (fill) {
    draw.fill = fill.dataset.drawFill === "1";
    refreshDrawPop("shape", shapeMarkup());
    drawChanged();
    return;
  }
  const shape = event.target.closest("[data-draw-shape]");
  if (shape) {
    draw.shape = shape.dataset.drawShape;
    closeDrawPop();
    setTool("shape");
  }
}

function build() {
  pop = document.createElement("div");
  pop.className = "draw-pop";
  pop.setAttribute("role", "dialog");
  pop.hidden = true;
  dom.device.appendChild(pop);
  pop.addEventListener("click", onPopClick);
  /* Ein Klick irgendwo anders schließt — außer auf den eigenen Knopf, der schaltet selbst um */
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!isDrawPopOpen()) return;
      if (pop.contains(event.target) || (anchor && anchor.contains(event.target))) return;
      closeDrawPop();
    },
    true
  );
  window.addEventListener("resize", closeDrawPop);
  /* Seite wechselt (Zurück, Seitenleiste): das Fenster gehört zur Zeichnung und geht mit */
  on(events.viewWillChange, closeDrawPop);
}
