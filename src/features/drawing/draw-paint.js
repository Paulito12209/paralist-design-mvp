/*
 * Einen Strich auf die Leinwand malen — mit Stift, Marker oder Radierer.
 * Ausgelagert aus drawing.js, das die Leinwand, das Speichern und die
 * Zeiger-Ereignisse führt; hier steht nur, wie gemalt wird.
 * Pfad: src/features/drawing/draw-paint.js
 *
 * Keine anpassbaren visuellen Werte: Breite und Deckkraft der Werkzeuge
 * stehen in drawing-tools.js.
 */

import { tools } from "./drawing-tools.js";

/* Werkzeug auf den Kontext übertragen; gilt bis zum nächsten ctx.restore(). */
function applyTool(ctx, current) {
  const settings = tools[current.tool];
  /* destination-out: der Radierer nimmt Farbe weg, statt Weiß aufzutragen */
  ctx.globalCompositeOperation = settings.erase ? "destination-out" : "source-over";
  ctx.globalAlpha = settings.alpha;
  ctx.strokeStyle = current.color;
  ctx.lineWidth = current.width;
}

/*
 * Der ganze Strich wird neu auf das Bild davor gemalt: so bleibt der
 * durchscheinende Marker gleichmäßig, statt an jedem Zwischenpunkt dunkler zu
 * werden. Das kopiert jedes Mal die ganze Fläche — darum nur für den Marker,
 * und höchstens einmal je Bildaufbau (siehe onPointerMove).
 */
export function paintStroke(ctx, current) {
  ctx.putImageData(current.before, 0, 0);
  ctx.save();
  applyTool(ctx, current);
  ctx.beginPath();
  current.points.forEach((point, index) =>
    index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)
  );
  /* Tipp ohne Bewegung: ein Punkt */
  if (current.points.length === 1) ctx.lineTo(current.points[0].x + 0.01, current.points[0].y);
  ctx.stroke();
  ctx.restore();
}

/*
 * Deckende Werkzeuge (Stift, Radierer) malen nur das neue Stück ab dem
 * zuletzt gemalten Punkt weiter. Bei voller Deckkraft sieht man keinen
 * Übergang, und die Fläche muss nicht bei jeder Bewegung kopiert werden.
 */
export function extendStroke(ctx, current, from) {
  const points = current.points;
  const start = Math.max(0, from - 1);
  ctx.save();
  applyTool(ctx, current);
  ctx.beginPath();
  ctx.moveTo(points[start].x, points[start].y);
  for (let index = start + 1; index < points.length; index += 1) ctx.lineTo(points[index].x, points[index].y);
  ctx.stroke();
  ctx.restore();
}
