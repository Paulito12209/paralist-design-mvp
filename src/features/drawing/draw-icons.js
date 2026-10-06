/*
 * Icons, die nur die Werkzeugleiste der Zeichnung braucht (Zeichnen, Auswählen,
 * Formen, Anhang, Zettel, Nach vorn, Andocken). Sie stehen hier statt im Sprite, weil
 * beide Sprite-Dateien schon an der Zeilengrenze sind und sonst kein Bereich
 * sie benutzt. Gleicher Stil wie das Sprite: 24er-Raster, Linie 1.6,
 * Farbe aus der Schrift (currentColor), Größe aus der Klasse .icon.
 * Pfad: src/features/drawing/draw-icons.js
 *
 * Keine anpassbaren visuellen Werte: Größe und Farbe kommen aus
 * styles/base.css (.icon) und styles/drawing-desk.css.
 */

import { shapeOf } from "../../data/draw-shapes.js";

const line = 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"';

const paths = {
  select: `<path d="M6 4.5 18 11l-5.2 1.6L10.4 18 6 4.5Z" ${line}/>`,
  shapes: `<rect x="3.5" y="10.5" width="9" height="9" rx="1.6" ${line}/><circle cx="15.5" cy="8.5" r="5" ${line}/>`,
  attach: `<path d="M19 11.2 12.3 18a4.6 4.6 0 0 1-6.5-6.5l7-7a3.1 3.1 0 0 1 4.4 4.4l-7 7a1.5 1.5 0 0 1-2.2-2.2l6.4-6.4" ${line}/>`,
  sticky: `<path d="M5 4.5h14v9.5l-5 5.5H5V4.5Z" ${line}/><path d="M14 19.5V14h5" ${line}/>`,
  front: `<rect x="8.5" y="8.5" width="11" height="11" rx="2" ${line}/><path d="M15.5 5.5V4.6a1.1 1.1 0 0 0-1.1-1.1H5.6a1.1 1.1 0 0 0-1.1 1.1v8.8a1.1 1.1 0 0 0 1.1 1.1h.9" ${line}/>`,
  "dock-bottom": `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" ${line}/><path d="M7 16h10" ${line}/>`,
  "dock-left": `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" ${line}/><path d="M7 8v8" ${line}/>`,
  /* Wie Apples Markup-Symbol: Kreis, darin eine Füllerspitze, die nach unten zeigt */
  markup: `<circle cx="12" cy="12" r="9.2" ${line}/><path d="M8.6 3.4V9.6L12 18.8l3.4-9.2V3.4" ${line}/><path d="M8.6 9.6h6.8" ${line}/><circle cx="12" cy="13.6" r="1.1" fill="currentColor"/>`,
  grip: `<g fill="currentColor"><circle cx="9" cy="7" r="1.3"/><circle cx="15" cy="7" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="17" r="1.3"/><circle cx="15" cy="17" r="1.3"/></g>`,
};

/* svg: ein Icon als eingebettete Grafik, wie die Icons aus dem Sprite */
function wrap(inner, className) {
  return `<svg class="icon${className ? ` ${className}` : ""}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
}

/** Ein Icon dieser Datei als HTML. */
export function drawIcon(name, className = "") {
  return wrap(paths[name] || "", className);
}

/**
 * Das Bild einer Form (src/data/draw-shapes.js) für Leiste und Auswahlfenster.
 * vector-effect: die Linie bleibt gleich dünn, egal wie groß die Form gezeichnet wird.
 */
export function shapeIcon(id, filled = false, className = "") {
  const shape = shapeOf(id);
  const fill = filled ? "currentColor" : "none";
  return `<svg class="icon${className ? ` ${className}` : ""}" viewBox="-4 -4 108 108" aria-hidden="true"><path d="${shape.path}" fill="${fill}" fill-rule="evenodd" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
