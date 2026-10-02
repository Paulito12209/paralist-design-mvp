/*
 * Die großen Seiten zur Analyse im Fortschritt: „Nutzungszeit“ (Balken je Tag
 * mit der Aufteilung nach Bereichen) und „Serie“ (Punkte-Raster des Jahres).
 * Sie öffnen sich aus den beiden kleinen Kacheln „Analyse“ (src/ui/insight-tiles.js),
 * am Handy im Fortschritt-Blatt, am Desktop im Profil.
 * Pfad: src/ui/usage-pages.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * stepSizes      -> die runden Schritte der senkrechten Achse (Minuten)
 * fallbackStep   -> Schritt, wenn kein passender gefunden wird (Minuten)
 * barWidthShare  -> wie breit ein Balken im Verhältnis zu seiner Spalte ist
 * dotLevels      -> wie viele Helligkeitsstufen das Punkte-Raster hat
 *
 * Farben und Größen: styles/profile.css (Karten, Balken, Punkte-Raster) und
 * styles/usage-split.css.
 */

import { dayShift, parseDay, startOfDay } from "../core/dates.js";
import { axisDateFormat, dayMonth, formatAxisSpan, formatSpan } from "../core/format.js";
import { icon } from "../core/html.js";
import { chartRanges } from "../data/config.js";
import { ui } from "../data/state.js";
import { usageDays, usageOfDay, usageSince, usageStreaks } from "../data/usage.js";
import { chartBox, dateMarks, gridLines, niceStep, rangeSwitch, yAxis } from "./chart.js";
import { usageSplitCard } from "./usage-split.js";

const stepSizes = [5, 10, 15, 30, 60, 90, 120, 180, 240, 360, 480];
const fallbackStep = 720;
const barWidthShare = 0.55;
const dotLevels = 4;

/**
 * Balken je Tag: wie lange die App an diesem Tag offen war. Darunter die
 * Aufteilung nach Bereichen für denselben Zeitraum.
 */
export function usageCard() {
  const days = ui.usageRange;
  const today = startOfDay(Date.now());
  const rows = [];
  for (let back = days - 1; back >= 0; back -= 1) {
    const ts = dayShift(today, -back);
    rows.push({ ts, seconds: usageOfDay(ts) });
  }

  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  const activeDays = rows.filter((row) => row.seconds > 0).length;
  /* Vor Beginn der Aufzeichnung gibt es keine Werte — diese Tage zählen nicht
     als „nicht genutzt“, sonst sähe ein frischer Start schlechter aus, als er ist. */
  const since = usageSince();
  const trackedDays = rows.filter((row) => row.ts >= since).length;
  const sinceNote = trackedDays < days ? `<p class="chart-note">Aufgezeichnet seit ${dayMonth(since)}</p>` : "";
  const maxMinutes = Math.max(...rows.map((row) => row.seconds / 60), 1);

  const step = niceStep(maxMinutes, stepSizes, 4) || fallbackStep;
  const { yMax, y } = yAxis(maxMinutes, step);
  const x = (index) => chartBox.left + ((index + 0.5) / days) * (chartBox.right - chartBox.left);

  const format = axisDateFormat(days);
  const grid = gridLines(yMax, step, y, formatAxisSpan);
  const marks = dateMarks(days, x, (index) => format.format(new Date(rows[index].ts)));

  const barWidth = Math.max(2, ((chartBox.right - chartBox.left) / days) * barWidthShare);
  const bars = rows
    .map((row, index) => {
      const minutes = row.seconds / 60;
      if (!minutes) return "";
      const top = y(minutes);
      /* x/y/width/height in SVG-Einheiten: die Höhe ergibt sich erst aus der Zeit */
      return `<rect class="usage-bar" x="${(x(index) - barWidth / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(1.5, chartBox.bottom - top).toFixed(1)}" rx="${Math.min(2.5, barWidth / 2).toFixed(1)}" />`;
    })
    .join("");

  const average = activeDays ? total / activeDays : 0;
  return `
    <section class="pcard">
      <div class="pcard-head">${icon("clock")}<span>Nutzungszeit</span></div>
      <p class="stat-big">${formatSpan(total)}</p>
      <p class="stat-sub">an ${activeDays} von ${trackedDays} ${trackedDays === 1 ? "Tag" : "Tagen"} · ⌀ ${formatSpan(average)} je aktivem Tag</p>
      ${rangeSwitch("usage-range", chartRanges, days, "data-usage-range")}
      <svg class="chart" viewBox="0 0 ${chartBox.width} ${chartBox.height}" aria-hidden="true">
        ${grid}
        ${marks}
        ${bars}
      </svg>
      ${sinceNote}
    </section>
    ${usageSplitCard(days)}
  `;
}

const weekdayLetters = ["M", "D", "M", "D", "F", "S", "S"];
const weekdayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const monthLetters = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const monthNames = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

/*
 * Punkte-Raster: eine Spalte je Monat, eine Zeile je Wochentag.
 * Je dunkler der Punkt, desto mehr Zeit lief an diesem Wochentag im Monat.
 */
export function streakCard() {
  const streak = usageStreaks();
  const year = new Date().getFullYear();
  const cells = Array.from({ length: 12 }, () => new Array(7).fill(0));

  usageDays().forEach((key) => {
    const date = parseDay(key);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return;
    /* (getDay() + 6) % 7 rückt Montag an die erste Stelle */
    cells[date.getMonth()][(date.getDay() + 6) % 7] += usageOfDay(date.getTime());
  });

  const max = Math.max(...cells.flat(), 1);
  let grid = "";
  for (let row = 0; row < 7; row += 1) {
    grid += `<span class="dot-label">${weekdayLetters[row]}</span>`;
    for (let month = 0; month < 12; month += 1) {
      const value = cells[month][row];
      const level = value ? Math.min(dotLevels, Math.ceil((value / max) * dotLevels)) : 0;
      const spent = value ? formatSpan(value) : "keine Zeit";
      grid += `<span class="dot is-l${level}" title="${weekdayNames[row]} im ${monthNames[month]}: ${spent}"></span>`;
    }
  }
  grid += `<span class="dot-label"></span>`;
  grid += monthLetters.map((letter) => `<span class="dot-month">${letter}</span>`).join("");

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("flame")}<span>Serie</span></div>
      <div class="streak-row">
        <div class="streak-box">
          <p class="streak-label">Aktuelle Serie</p>
          <p class="streak-value">${streak.current} T</p>
        </div>
        <div class="streak-box">
          <p class="streak-label">Längste</p>
          <p class="streak-value">${streak.longest} T</p>
        </div>
      </div>
      <div class="dotgrid">${grid}</div>
      <p class="chart-note">Wochentage von Montag oben bis Sonntag unten · ${year}</p>
    </section>
  `;
}
