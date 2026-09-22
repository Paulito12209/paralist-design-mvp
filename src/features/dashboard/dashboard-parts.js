/*
 * Die Bausteine im Kopf der Übersicht am Desktop als HTML-Schnipsel: die
 * Reihe der vier großen Zahlen, das Aktivitätsband mit dem gläsernen Chip
 * und die zwei großen Karten „Diese Woche“ und „Serie“. Hier wird nur
 * zusammengesetzt — gezeichnet wird in dashboard.js, die Grafiken kommen aus
 * dashboard-charts.js, das Aussehen aus styles/dashboard.css und
 * styles/dashboard-motion.css.
 * Pfad: src/features/dashboard/dashboard-parts.js
 *
 * Jeder Knopf trägt `data-dash` mit dem, was ein Klick öffnet; dashboard.js
 * fängt alle Klicks an einer Stelle ab. `--i` ist die Reihenfolge beim
 * Auftauchen (0 kommt zuerst).
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * daysPerWeek    -> Tage einer Woche, für „12 Wochen“ über dem Band
 * statOrder      -> Reihenfolge, Beschriftung und Ziel der vier Zahlen
 * legendLevels   -> welche Stufen die Legende über dem Band zeigt (0 = nichts … 4 = viel)
 *
 * Den Zeitraum unter „Erledigt“ gibt weekDays in src/data/insights.js vor —
 * dieselbe Zahl, mit der deskStats() zählt.
 */

import { formatNumber } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { weekDays } from "../../data/insights.js";
import { bandLabels, bandSvg, gaugeSvg, streakSvg } from "./dashboard-charts.js";

const daysPerWeek = 7;
const legendLevels = [0, 1, 2, 3, 4];

/* Einzahl oder Mehrzahl samt Zahl: „1 Termin“, „3 Termine“. */
function countText(value, one, many) {
  return `${formatNumber(value)} ${value === 1 ? one : many}`;
}

/*
 * Die vier Zahlen. `key` liest aus deskStats(), `action` ist das Ziel eines
 * Klicks (ohne `action` ist die Zahl nur zum Lesen da), `say` der Satz für
 * Vorlesehilfen — in Worten statt „12 Offen“.
 */
const statOrder = [
  { key: "entries", label: "Einträge", sub: "insgesamt" },
  {
    key: "openTasks",
    label: "Offen",
    sub: "Aufgaben",
    action: "tasks",
    say: (n) => `${countText(n, "offene Aufgabe", "offene Aufgaben")}. Aufgaben öffnen`,
  },
  {
    key: "today",
    label: "Heute",
    sub: "Termine",
    action: "calendar",
    say: (n) => `${countText(n, "Termin", "Termine")} heute. Kalender öffnen`,
  },
  {
    key: "doneWeek",
    label: "Erledigt",
    sub: `${weekDays} Tage`,
    action: "progress",
    say: (n) => `${countText(n, "erledigte Aufgabe", "erledigte Aufgaben")} in den letzten ${weekDays} Tagen. Fortschritt öffnen`,
  },
];

/* Eine Zahl mit ihrer Pille oben rechts; die erste Pille steht dunkel auf hell. */
function statMarkup(stat, value, index) {
  const inner = `
    <span class="dash-stat-num">${formatNumber(value)}</span>
    <span class="dash-pill${index === 0 ? " is-lead" : ""}">${stat.label}</span>
    <span class="dash-stat-sub">${stat.sub}</span>`;
  if (!stat.action) return `<div class="dash-stat dash-enter" style="--i: ${index}">${inner}</div>`;
  return `<button class="dash-stat dash-enter" type="button" data-dash="${stat.action}" aria-label="${stat.say(value)}" style="--i: ${index}">${inner}</button>`;
}

/** Die Reihe der vier großen Zahlen. @param stats aus deskStats(). */
export function statRow(stats) {
  return `<div class="dash-stats">${statOrder.map((stat, index) => statMarkup(stat, stats[stat.key], index)).join("")}</div>`;
}

/* Fünf Punkte von „nichts“ bis „viel“ — die Legende rechts über dem Band. */
function legendMarkup() {
  const swatches = legendLevels.map((level) => `<span class="dash-swatch is-l${level}"></span>`).join("");
  return `<p class="dash-legend" aria-hidden="true">Weniger${swatches}Mehr</p>`;
}

/**
 * Das Aktivitätsband: Überschrift, Legende, die Punktsäulen und darüber
 * schwebend der gläserne Chip mit der Stufe.
 * @param days aus xpByDay(), @param level aus levelSummary(), @param order Platz beim Auftauchen.
 */
export function bandBlock(days, level, order) {
  const weeks = Math.round(days.length / daysPerWeek);
  const active = days.filter((day) => day.xp > 0).length;
  const sum = days.reduce((total, day) => total + day.xp, 0);
  const summary = `Aktivität der letzten ${weeks} Wochen: an ${active} von ${days.length} Tagen Punkte gesammelt, zusammen ${formatNumber(sum)} XP`;
  const chipSay = `Stufe ${level.level}, noch ${formatNumber(level.missing)} XP bis Stufe ${level.level + 1}. Fortschritt öffnen`;
  return `
    <section class="dash-band dash-enter" style="--i: ${order}" aria-label="Aktivität">
      <div class="dash-band-head">
        <p class="dash-caption">Aktivität · ${weeks} Wochen</p>
        ${legendMarkup()}
      </div>
      <div class="dash-band-field">
        ${bandSvg(days, summary)}
        <button class="dash-chip" type="button" data-dash="progress" aria-label="${chipSay}">
          ${icon("stairs", "dash-chip-icon")}
          <span class="dash-chip-strong">Stufe ${level.level}</span>
          <span>noch ${formatNumber(level.missing)} XP</span>
        </button>
      </div>
      ${bandLabels(days)}
    </section>`;
}

/* Eine große Karte: Kopf mit Icon und Pfeil-Kreis rechts, große Zahl, Zeile darunter, Grafik unten. */
function cardMarkup({ action, say, iconName, title, value, unit, sub, foot, order }) {
  return `
    <button class="dash-card dash-enter" type="button" data-dash="${action}" aria-label="${say}" style="--i: ${order}">
      <span class="dash-card-head">
        ${icon(iconName, "dash-card-icon")}<span>${title}</span>
        <span class="dash-card-go">${icon("arrow-right")}</span>
      </span>
      <span class="dash-card-body">
        <span class="dash-hero-num">${value}<span class="dash-hero-unit">${unit}</span></span>
        <span class="dash-card-sub">${sub}</span>
      </span>
      ${foot}
    </button>`;
}

/**
 * Die zwei großen Karten nebeneinander.
 * @param data { week, level, streak, usage, order } — Punkte dieser Woche,
 *   levelSummary(), usageStreaks(), usageByDay() und der Platz der ersten Karte beim Auftauchen.
 */
export function heroCards({ week, level, streak, usage, order }) {
  const next = level.level + 1;
  const dayWord = (n) => (n === 1 ? "Tag" : "Tage");
  const weekCard = cardMarkup({
    action: "progress",
    say: `Diese Woche ${formatNumber(week)} XP, Stufe ${level.level}, noch ${formatNumber(level.missing)} XP bis Stufe ${next}. Fortschritt öffnen`,
    iconName: "trend",
    title: "Diese Woche",
    value: formatNumber(week),
    unit: "XP",
    sub: `Stufe ${level.level} · noch ${formatNumber(level.missing)} bis Stufe ${next}`,
    foot: gaugeSvg(level.progress),
    order,
  });
  const streakCard = cardMarkup({
    action: "streak",
    say: `Serie ${countText(streak.current, "Tag", "Tage")}, längste Serie ${countText(streak.longest, "Tag", "Tage")}. Serie öffnen`,
    iconName: "flame",
    title: "Serie",
    value: formatNumber(streak.current),
    unit: dayWord(streak.current),
    sub: `Längste Serie: ${countText(streak.longest, "Tag", "Tage")}`,
    foot: streakSvg(usage),
    order: order + 1,
  });
  return `<div class="dash-cards">${weekCard}${streakCard}</div>`;
}
