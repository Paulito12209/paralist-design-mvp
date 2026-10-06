/*
 * Der Farbwähler der Zeichnung am Desktop: ein Raster aus 40 Farben, darunter
 * die zuletzt selbst gemischten und „Eigene Farbe“ — das Farbfeld des
 * Systems (unter Windows der bekannte Farbdialog) plus ein Feld für den
 * Hex-Wert zum Einfügen. Eine Farbe gilt sofort für den Stift und für einen
 * ausgewählten Text oder eine ausgewählte Form.
 * Pfad: src/features/drawing/draw-color-pop.js
 *
 * Keine anpassbaren visuellen Werte: die Farben des Rasters stehen in
 * drawing-tools.js (paletteColors), das Aussehen in styles/drawing-pop.css.
 */

import { escapeHtml } from "../../core/html.js";
import { chooseColor } from "./draw-model.js";
import { closeDrawPop, toggleDrawPop } from "./draw-pop.js";
import { draw, rememberColor } from "./draw-state.js";
import { paletteColors } from "./drawing-tools.js";

const hexPattern = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

/* #abc -> #aabbcc, damit das Farbfeld des Systems den Wert annimmt */
function normalizeHex(value) {
  const match = hexPattern.exec(String(value).trim());
  if (!match) return null;
  const digits = match[1].length === 3 ? match[1].replace(/./g, (char) => char + char) : match[1];
  return `#${digits.toLowerCase()}`;
}

function swatch(color, extraClass = "") {
  const active = color.toLowerCase() === draw.color.toLowerCase();
  return `<button class="draw-swatch${extraClass}${active ? " is-active" : ""}" type="button" data-pick-color="${color}" style="--draw-color: ${color}" aria-label="Farbe ${color}" title="${color}"></button>`;
}

function markup() {
  const recent = draw.recent.length
    ? `<div class="draw-pop-title">Zuletzt</div><div class="draw-swatch-row">${draw.recent.map((color) => swatch(color)).join("")}</div>`
    : "";
  const current = normalizeHex(draw.color) || "#000000";
  /* input type=color: öffnet den Farbdialog des Systems; nur so gibt es jede beliebige Farbe */
  return `<div class="draw-pop-title">Farben</div>
    <div class="draw-swatch-grid">${paletteColors.map((color) => swatch(color)).join("")}</div>
    ${recent}
    <div class="draw-custom">
      <label class="draw-custom-pick" title="Eigene Farbe mischen">
        <input type="color" value="${current}" data-pick-native aria-label="Eigene Farbe mischen">
        <span class="draw-custom-ring" style="--draw-color: ${current}"></span>
        <span>Eigene Farbe</span>
      </label>
      <input class="draw-custom-hex" type="text" value="${escapeHtml(current)}" maxlength="7" spellcheck="false" aria-label="Hex-Wert" data-pick-hex>
    </div>`;
}

/* Klicks und Felder im Farbwähler */
function bind(pop) {
  pop.onclick = (event) => {
    const button = event.target.closest("[data-pick-color]");
    if (!button) return;
    chooseColor(button.dataset.pickColor);
    closeDrawPop();
  };
  const native = pop.querySelector("[data-pick-native]");
  const hex = pop.querySelector("[data-pick-hex]");
  const ring = pop.querySelector(".draw-custom-ring");
  const show = (color) => {
    ring.style.setProperty("--draw-color", color);
    hex.value = color;
    native.value = color;
  };
  /* Beim Mischen gilt die Farbe sofort; gemerkt wird sie erst, wenn der Dialog zu ist */
  native.addEventListener("input", () => {
    show(native.value);
    chooseColor(native.value);
  });
  native.addEventListener("change", () => rememberColor(native.value));
  hex.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const color = normalizeHex(hex.value);
    if (!color) return;
    show(color);
    chooseColor(color);
    rememberColor(color);
    closeDrawPop();
  });
}

/** Den Farbwähler an diesem Knopf öffnen oder schließen. */
export function toggleColorPop(button) {
  toggleDrawPop(button, "color", markup(), bind);
}

/** Liegt die Farbe außerhalb der fünf Punkte der Leiste? Dann zeigt der Farbwähler-Knopf sie. */
export function isCustomColor(color, quick) {
  return !quick.some((item) => item.toLowerCase() === color.toLowerCase());
}
