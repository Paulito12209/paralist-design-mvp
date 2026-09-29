/*
 * Gemeinsames Gerüst der beiden Verlaufsdiagramme (XP im Fortschritt-Blatt,
 * Nutzungszeit im Profil-Blatt): Größe der Fläche, waagerechte Hilfslinien mit
 * Beschriftung rechts und senkrechte Marken mit Datum darunter.
 * Pfad: src/ui/chart.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * chartBox.width / .height -> Größe der Zeichenfläche (SVG-Einheiten)
 * chartBox.right           -> wo die Kurve endet; rechts davon stehen die Zahlen
 * chartBox.top / .bottom   -> obere und untere Kante der Kurve
 * wideChartBox             -> dasselbe für eine breite Karte am Desktop: mehr
 *                             Breite bei gleicher Höhe, sonst würde die Kurve
 *                             mit der Karte in die Höhe wachsen
 * labelOffset              -> Abstand der Datumszeile unter der Fläche
 *
 * Alle Helfer nehmen als letzten Wert die Fläche (`box`); ohne Angabe gilt chartBox.
 *
 * Farben und Strichbreiten stehen in styles/progress.css
 * (Klassen .chart-axis, .chart-grid, .chart-label, .chart-line, .chart-area).
 */

export const chartBox = { width: 326, height: 200, left: 0, right: 282, top: 10, bottom: 160 };
export const wideChartBox = { width: 720, height: 200, left: 0, right: 676, top: 10, bottom: 160 };

const labelOffset = 22;

/** Nächstgrößerer runder Schritt, sodass höchstens `maxLines` Linien entstehen. */
export function niceStep(max, steps, maxLines = 5) {
  return steps.find((step) => max / step <= maxLines) || steps[steps.length - 1];
}

/**
 * Rechnet Werte in senkrechte Stellen um.
 * @returns { yMax, y } — obere Grenze der Achse und die Umrechnung.
 */
export function yAxis(max, step, headroom = 1, box = chartBox) {
  const yMax = Math.max(step, Math.ceil((max * headroom) / step) * step);
  return {
    yMax,
    y: (value) => box.bottom - (value / yMax) * (box.bottom - box.top),
  };
}

/** Die waagerechten Hilfslinien mit ihrer Beschriftung rechts. */
export function gridLines(yMax, step, y, labelOf, box = chartBox) {
  let markup = "";
  for (let value = 0; value <= yMax; value += step) {
    const at = y(value).toFixed(1);
    markup += `<line class="chart-axis" x1="${box.left}" x2="${box.right}" y1="${at}" y2="${at}" />
      <text class="chart-label" x="${box.width}" y="${(y(value) + 4).toFixed(1)}" text-anchor="end">${labelOf(value)}</text>`;
  }
  return markup;
}

/** Abstand zwischen zwei Datumsmarken: bei 7 Tagen jeder Tag, bei 30 jede Woche, sonst alle drei Wochen. */
export function labelStepFor(days) {
  if (days <= 7) return 1;
  if (days <= 30) return 7;
  return 21;
}

/**
 * Die senkrechten Marken mit Datum darunter.
 * @param days Zahl der Tage im Zeitraum.
 * @param xOf Umrechnung von Tagesnummer in waagerechte Stelle.
 * @param labelOf Beschriftung einer Tagesnummer.
 * @param anchorFirstAtStart true, wenn die erste Beschriftung linksbündig stehen soll.
 * @param box die Zeichenfläche, ohne Angabe chartBox.
 */
export function dateMarks(days, xOf, labelOf, anchorFirstAtStart = false, box = chartBox) {
  const step = labelStepFor(days);
  let markup = "";
  /* Bei 30 und 90 Tagen beginnt die erste Beschriftung erst nach dem ersten Schritt, sonst überlappt sie. */
  for (let index = days <= 7 ? 0 : step; index < days; index += step) {
    const at = xOf(index).toFixed(1);
    const anchor = anchorFirstAtStart && index === 0 ? "start" : "middle";
    markup += `<line class="chart-grid" x1="${at}" x2="${at}" y1="${box.top}" y2="${box.bottom}" />
      <text class="chart-label" x="${at}" y="${box.bottom + labelOffset}" text-anchor="${anchor}">${labelOf(index)}</text>`;
  }
  return markup;
}

/** Die Umschalter „7 Tage / 30 Tage / 90 Tage“ über einem Diagramm. */
export function rangeSwitch(id, ranges, active, attribute) {
  const buttons = ranges
    .map(
      (value) =>
        `<button type="button" ${attribute}="${value}" class="${value === active ? "is-active" : ""}">${value} Tage</button>`
    )
    .join("");
  return `<div class="seg" id="${id}">${buttons}</div>`;
}
