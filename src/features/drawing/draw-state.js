/*
 * Was in der Zeichnung gerade gewählt ist — Werkzeug, Farbe, Form, Strich-
 * breiten, ausgewähltes Ding — an einer Stelle, damit Leiste, Fläche und
 * Auswahl dasselbe sehen. Wer etwas ändert, ruft drawChanged(); alle, die
 * sich mit onDrawChange angemeldet haben, zeichnen sich dann neu.
 *
 * Gemerkt (pro Gerät) werden nur Vorlieben: wo die Leiste am Desktop steht,
 * die Strichbreiten und die zuletzt gemischten eigenen Farben.
 * Pfad: src/features/drawing/draw-state.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * recentLimit -> wie viele eigene Farben der Farbwähler sich merkt
 * docks       -> wo die Leiste stehen kann ("bottom" unter, "left" links neben der Fläche);
 *                die erste ist die Vorgabe
 */

import { readJson, storageKeys, writeJson } from "../../core/storage.js";
import { colors, tools } from "./drawing-tools.js";

const recentLimit = 8;
export const docks = ["bottom", "left"];

/* Werkzeuge, die auf der Leinwand malen; alle anderen legen Dinge auf die Fläche */
export const inkTools = ["pen", "marker", "eraser"];

const saved = readJson(storageKeys.drawPrefs, {}) || {};

export const draw = {
  tool: "pen",
  color: colors[0],
  /* Zuletzt gewählte Form und ob sie gefüllt wird */
  shape: "rect",
  fill: false,
  widths: {
    pen: tools.pen.width,
    marker: tools.marker.width,
    eraser: tools.eraser.width,
    ...(saved.widths || {}),
  },
  dock: docks.includes(saved.dock) ? saved.dock : docks[0],
  recent: Array.isArray(saved.recent) ? saved.recent.slice(0, recentLimit) : [],
  /* Zeichenmodus am Desktop: erst der Stift-Knopf blendet Stifte und Farben ein
     (draw-desk-bar.js); lastInk ist das Malwerkzeug, mit dem er wieder startet */
  inkMode: false,
  lastInk: "pen",
  /* Die offene Zeichnung und das ausgewählte Ding darin (Nummer oder null) */
  entryId: null,
  selected: null,
};

const listeners = [];

/** Bei jeder Änderung benachrichtigt werden. */
export function onDrawChange(handler) {
  listeners.push(handler);
}

/** Allen Angemeldeten sagen, dass sich etwas geändert hat. */
export function drawChanged() {
  listeners.forEach((handler) => handler());
}

/** Malt das Werkzeug auf der Leinwand (Stift, Marker, Radierer)? */
export function isInkTool(name = draw.tool) {
  return inkTools.includes(name);
}

/* Werkzeuge, die etwas Neues auf die Fläche setzen: sie beenden den Zeichenmodus */
const placeTools = ["text", "note", "shape"];

/** Werkzeug wechseln; ein Malwerkzeug hebt die Auswahl auf und öffnet den Zeichenmodus. */
export function setTool(name) {
  draw.tool = name;
  if (isInkTool(name)) {
    draw.selected = null;
    draw.inkMode = true;
    draw.lastInk = name;
  }
  if (placeTools.includes(name)) draw.inkMode = false;
  drawChanged();
}

/** Vorlieben merken. */
export function saveDrawPrefs() {
  writeJson(storageKeys.drawPrefs, { dock: draw.dock, widths: draw.widths, recent: draw.recent });
}

/** Eine selbst gemischte Farbe vorn in die Liste der zuletzt benutzten stellen. */
export function rememberColor(color) {
  draw.recent = [color, ...draw.recent.filter((item) => item !== color)].slice(0, recentLimit);
  saveDrawPrefs();
}
