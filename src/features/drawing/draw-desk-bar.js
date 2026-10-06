/*
 * Die Werkzeugleiste einer Zeichnung am Desktop (ab 1024px Fensterbreite).
 * Am Handy bleibt die schlanke Leiste aus index.html (Stift, Marker,
 * Radierer, Farben, Rückgängig); am Desktop füllt diese Datei dasselbe
 * Element neu, in Gruppen:
 *
 *   Griff | Rückgängig Wiederholen | Auswählen Stift Marker Radierer |
 *   fünf Farben + Farbwähler | Formen Text Notiz Anhang
 *
 * Ein zweiter Klick auf das gewählte Malwerkzeug öffnet die Strichbreite.
 * Am Griff lässt sich die Leiste unter die Fläche oder links daneben ziehen
 * (draw-dock.js). Sie nutzt die ganze Länge der Fläche; wie viele Spalten
 * sie links hat und was hinter „⋯“ wandert, entscheidet draw-bar-fit.js.
 * Pfad: src/features/drawing/draw-desk-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * toolLabels -> Name und Tastenhinweis jedes Knopfs (Tooltip und Vorlesehilfe)
 *
 * Aussehen: styles/drawing-desk.css, Maße in styles/tokens-entry.css (--draw-desk-tool u. a.).
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { isCustomColor, toggleColorPop } from "./draw-color-pop.js";
import { canRedo, canUndo, onHistoryChange, redoStep, undoStep } from "./draw-history.js";
import { fitBar, initBarFit, toggleMorePop } from "./draw-bar-fit.js";
import { applyDock, initDock } from "./draw-dock.js";
import { drawIcon, shapeIcon } from "./draw-icons.js";
import { chooseColor } from "./draw-model.js";
import { closeDrawPop, refreshDrawPop, shapeMarkup, toggleDrawPop, widthMarkup } from "./draw-pop.js";
import { draw, drawChanged, isInkTool, onDrawChange, setTool } from "./draw-state.js";
import { colors, colorsMarkup } from "./drawing-tools.js";

const toolLabels = {
  undo: "Rückgängig (Strg+Z)",
  redo: "Wiederholen (Strg+Y)",
  select: "Auswählen und verschieben",
  pen: "Stift — noch einmal klicken für die Strichbreite",
  marker: "Marker — noch einmal klicken für die Strichbreite",
  eraser: "Radierer — noch einmal klicken für die Größe",
  picker: "Farbwähler",
  shape: "Formen",
  text: "Text — auf die Fläche klicken",
  note: "Notiz — Zettel auf die Fläche kleben, wird als verknüpfte Notiz angelegt",
  attach: "Anhang — Bild aus Medien oder eigenen Dateien",
  grip: "Leiste verschieben: nach unten oder links ziehen, Klick wechselt",
  more: "Weitere Werkzeuge",
};

/* Die schlanke Leiste aus index.html, gemerkt für den Weg zurück unter 1024px */
let mobileMarkup = "";
let deskShown = false;

function toolButton(name, content) {
  const label = escapeHtml(toolLabels[name]);
  return `<button class="draw-tool" type="button" data-draw-tool="${name}" aria-label="${label}" title="${label}">${content}</button>`;
}

function plainButton(attr, name, content, extra = "") {
  const label = escapeHtml(toolLabels[name]);
  return `<button class="draw-tool${extra}" type="button" ${attr} aria-label="${label}" title="${label}">${content}</button>`;
}

function deskMarkup() {
  return `
    <button class="draw-grip" type="button" data-draw-grip aria-label="${escapeHtml(toolLabels.grip)}" title="${escapeHtml(toolLabels.grip)}">${drawIcon("grip")}</button>
    <div class="draw-group is-history">
      ${plainButton("data-draw-undo", "undo", icon("undo"))}
      ${plainButton("data-draw-redo", "redo", icon("undo", "is-mirrored"))}
    </div>
    <span class="draw-split" aria-hidden="true"></span>
    <div class="draw-group is-tools">
      ${toolButton("select", drawIcon("select"))}
      ${toolButton("pen", icon("pencil"))}
      ${toolButton("marker", icon("marker"))}
      ${toolButton("eraser", icon("eraser"))}
    </div>
    <span class="draw-split" aria-hidden="true"></span>
    <div class="draw-group is-colors">
      <div class="draw-colors" id="draw-colors"></div>
      <button class="draw-picker" type="button" data-draw-pop="color" aria-haspopup="dialog" aria-expanded="false" aria-label="${escapeHtml(toolLabels.picker)}" title="${escapeHtml(toolLabels.picker)}"><span class="draw-picker-dot"></span></button>
    </div>
    <span class="draw-split" aria-hidden="true"></span>
    <div class="draw-group is-insert">
      ${plainButton('data-draw-pop="shape" aria-haspopup="dialog" aria-expanded="false"', "shape", drawIcon("shapes"), " draw-shape-btn")}
      ${toolButton("text", icon("text"))}
      ${toolButton("note", drawIcon("sticky"))}
      ${plainButton('data-draw-attach aria-haspopup="dialog"', "attach", drawIcon("attach"))}
    </div>
    ${plainButton('data-draw-more aria-haspopup="dialog" aria-expanded="false" hidden', "more", icon("dots"), " draw-more")}`;
}

/* Zustand der Knöpfe: gewähltes Werkzeug, Farbe, Form, Rückgängig möglich? */
function renderDeskBar() {
  if (!deskShown) return;
  const bar = dom.drawTools;
  bar.querySelectorAll("[data-draw-tool]").forEach((button) => {
    const name = button.dataset.drawTool;
    const active = name === draw.tool;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    /* Kleiner Punkt unter dem Malwerkzeug: zeigt die gewählte Strichbreite */
    if (isInkTool(name)) button.style.setProperty("--draw-width-mark", `${Math.min(8, Math.max(2, draw.widths[name] / 3))}px`);
  });
  const shapeButton = bar.querySelector(".draw-shape-btn");
  shapeButton.classList.toggle("is-active", draw.tool === "shape");
  shapeButton.innerHTML = draw.tool === "shape" ? shapeIcon(draw.shape, draw.fill) : drawIcon("shapes");
  dom.drawColors.innerHTML = colorsMarkup(draw.color);
  const picker = bar.querySelector(".draw-picker");
  const custom = isCustomColor(draw.color, colors);
  picker.classList.toggle("is-custom", custom);
  picker.style.setProperty("--draw-color", draw.color);
  bar.querySelector("[data-draw-undo]").disabled = !canUndo();
  bar.querySelector("[data-draw-redo]").disabled = !canRedo();
  refreshDrawPop("shape", shapeMarkup());
}

/**
 * Was ein Knopf der Leiste auslöst — auch derselbe Knopf im Fenster hinter
 * „⋯“ (draw-bar-fit.js). `anchor`: woran ein Fenster (Strichbreite, Formen,
 * Farben) hängt, wenn der Knopf selbst gerade nicht in der Leiste steht.
 */
export function runBarAction(target, anchor = null) {
  const tool = target.closest("[data-draw-tool]");
  if (tool) {
    const name = tool.dataset.drawTool;
    if (isInkTool(name) && draw.tool === name) toggleDrawPop(anchor || tool, "width", widthMarkup());
    else {
      closeDrawPop();
      setTool(name);
    }
    return;
  }
  const color = target.closest("[data-draw-color]");
  if (color) {
    closeDrawPop();
    chooseColor(color.dataset.drawColor);
    return;
  }
  const pop = target.closest("[data-draw-pop]");
  if (pop && pop.dataset.drawPop === "color") toggleColorPop(anchor || pop);
  else if (pop) toggleDrawPop(anchor || pop, "shape", shapeMarkup());
  else if (target.closest("[data-draw-undo]")) undoStep();
  else if (target.closest("[data-draw-redo]")) redoStep();
  else if (target.closest("[data-draw-attach]")) {
    closeDrawPop();
    import("./draw-attach.js").then((module) => module.openAttach());
  }
}

/* Klicks am Desktop: in der Einfangphase, damit die Handy-Logik (drawing.js) sie nicht doppelt sieht */
function onDeskClick(event) {
  if (!deskShown) return;
  event.stopPropagation();
  const more = event.target.closest("[data-draw-more]");
  if (more) toggleMorePop(more, runBarAction);
  else runBarAction(event.target);
}

/* Am Desktop die volle Leiste, darunter wieder die schlanke */
function applyMode() {
  const desk = isDesk();
  if (desk === deskShown) return;
  deskShown = desk;
  closeDrawPop();
  dom.drawTools.classList.toggle("is-desk", desk);
  dom.drawTools.innerHTML = desk ? deskMarkup() : mobileMarkup;
  /* Am Handy gibt es nur die Malwerkzeuge — und damit auch keine Auswahl */
  if (!desk) {
    if (!isInkTool()) draw.tool = "pen";
    draw.selected = null;
  }
  applyDock();
  drawChanged();
  fitBar();
}

/** Beim Laden einmal einrichten. */
export function initDeskBar() {
  mobileMarkup = dom.drawTools.innerHTML;
  dom.drawTools.setAttribute("role", "toolbar");
  dom.drawTools.setAttribute("aria-label", "Zeichenwerkzeuge");
  dom.drawTools.addEventListener("click", onDeskClick, true);
  onDrawChange(renderDeskBar);
  onHistoryChange(renderDeskBar);
  initDock();
  initBarFit(() => deskShown);
  onDeskChange(applyMode);
  applyMode();
}
