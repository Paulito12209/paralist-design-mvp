/*
 * Die beiden Diagramm-Karten im Fortschritt-Blatt: der Ring mit der
 * XP-Verteilung und die Verlaufskurve über 7, 30 oder 90 Tage.
 * Pfad: src/features/progress/progress-charts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ringRadius / ringGap -> Größe des Rings und die Lücke zwischen den Anteilen
 * stepSizes            -> die runden Schritte der senkrechten Achse
 * headroom             -> wie viel Luft über der Kurve bleibt (1.15 = 15 %)
 *
 * Farben stehen in styles/progress.css und in src/data/config.js (xpKinds).
 */

import { MS_PER_DAY, startOfDay } from "../../core/dates.js";
import { axisDateFormat, formatNumber } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { chartRanges, xpKinds } from "../../data/config.js";
import { state, ui } from "../../data/state.js";
import { totalXp, xpTotals } from "../../data/xp.js";
import { chartBox, dateMarks, gridLines, niceStep, rangeSwitch, yAxis } from "../../ui/chart.js";

const ringRadius = 80;
const ringGap = 4;
const stepSizes = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
const headroom = 1.15;

/* Die Reihenfolge im Ring und in der Liste darunter. */
const kindOrder = ["created", "done"];

/** Ring mit der Verteilung „Angelegt“ / „Erledigt“ und den Punkten insgesamt. */
export function donutCard() {
  const totals = xpTotals();
  const total = totalXp();
  const circumference = 2 * Math.PI * ringRadius;
  const gap = total ? ringGap : 0;

  let offset = 0;
  const segments = kindOrder
    .filter((kind) => totals[kind] > 0)
    .map((kind) => {
      const share = totals[kind] / total;
      const length = Math.max(0, share * circumference - gap);
      /* stroke-dasharray/-dashoffset: so wird aus einem Kreis ein Ringabschnitt */
      const segment = `<circle class="donut-seg" cx="105" cy="105" r="${ringRadius}" stroke="${xpKinds[kind].color}" stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 105 105)" />`;
      offset += share * circumference;
      return segment;
    })
    .join("");

  const ring = total
    ? segments
    : `<circle class="donut-seg" cx="105" cy="105" r="${ringRadius}" stroke="var(--line)" />`;

  const rows = kindOrder
    .map((kind) => {
      const percent = total ? Math.round((totals[kind] / total) * 100) : 0;
      return `
        <div class="xp-row">
          <span style="color:${xpKinds[kind].color}">${icon(xpKinds[kind].icon)}</span>
          <span class="xp-row-label">${xpKinds[kind].label}</span>
          <span class="xp-row-pct">${percent} %</span>
          <span class="xp-row-xp">${formatNumber(totals[kind])} XP</span>
        </div>
      `;
    })
    .join("");

  return `
    <section class="pcard">
      <div class="donut-wrap">
        <svg class="donut" viewBox="0 0 210 210" aria-hidden="true">
          ${ring}
          <text class="donut-total" x="105" y="102" text-anchor="middle">${formatNumber(total)} XP</text>
          <text class="donut-sub" x="105" y="122" text-anchor="middle">insgesamt</text>
        </svg>
      </div>
      ${rows}
    </section>
  `;
}

/* Punktestand am Ende jedes Tages im Zeitraum, plus die Summe davor. */
function runningTotals(days) {
  const today = startOfDay(Date.now());
  const start = today - (days - 1) * MS_PER_DAY;
  const perDay = new Array(days).fill(0);
  let before = 0;
  let inRange = 0;

  state.xpLog.forEach((row) => {
    if (row.ts == null || row.ts < start) {
      before += row.amount;
      return;
    }
    const index = Math.min(days - 1, Math.floor((startOfDay(row.ts) - start) / MS_PER_DAY));
    perDay[index] += row.amount;
    inRange += row.amount;
  });

  let running = before;
  const values = perDay.map((amount) => {
    running += amount;
    return running;
  });

  return { values, inRange, start };
}

/** Verlaufskurve der Punkte über den gewählten Zeitraum. */
export function historyCard() {
  const days = ui.progressRange;
  const { values, inRange, start } = runningTotals(days);

  const step = niceStep(Math.max(...values, 1), stepSizes);
  const { yMax, y } = yAxis(Math.max(...values, 1), step, headroom);
  const x = (index) => chartBox.left + (index / Math.max(1, days - 1)) * (chartBox.right - chartBox.left);

  const format = axisDateFormat(days);
  const grid = gridLines(yMax, step, y, formatNumber);
  const marks = dateMarks(days, x, (index) => format.format(new Date(start + index * MS_PER_DAY)), true);

  const points = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const area = `${x(0).toFixed(1)},${chartBox.bottom} ${points} ${x(days - 1).toFixed(1)},${chartBox.bottom}`;

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("trend")}<span>Verlauf</span></div>
      ${rangeSwitch("progress-range", chartRanges, days, "data-range")}
      <svg class="chart" viewBox="0 0 ${chartBox.width} ${chartBox.height}" aria-hidden="true">
        ${grid}
        ${marks}
        <polygon class="chart-area" points="${area}" />
        <polyline class="chart-line" points="${points}" />
      </svg>
      <p class="chart-note">${formatNumber(inRange)} XP in diesem Zeitraum</p>
    </section>
  `;
}
