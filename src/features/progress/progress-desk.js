/*
 * Der Kopf der Seite Fortschritt am Desktop: die Karten „Diese Woche“ und
 * „Serie“ und darunter das Aktivitätsband der letzten zwölf Wochen — dieselben
 * Bausteine wie früher oben auf der Übersicht (src/ui/dash-parts.js), hier
 * niedriger und dort, wo man nach seinem Fortschritt sucht. Am Handy bleibt
 * das Blatt, wie es war: dort gibt diese Datei nichts zurück.
 * Pfad: src/features/progress/progress-desk.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * bandDays   -> wie viele Tage das Aktivitätsband zeigt (84 = 12 Wochen)
 * streakDays -> wie viele Tage die Punktsäulen in der Karte „Serie“ zeigen
 * bandOrder  -> Platz des Bands beim Auftauchen, nach den zwei Karten (0 und 1)
 *
 * Aussehen und Höhe der Karten auf dieser Seite: styles/desk-progress.css.
 */

import { load } from "../../core/lazy.js";
import { levelSummary, usageByDay, xpByDay, xpThisWeek } from "../../data/insights.js";
import { usageStreaks } from "../../data/usage.js";
import { bandBlock, heroCards } from "../../ui/dash-parts.js";
import { isDesk } from "../../ui/desk-mode.js";

const bandDays = 84;
const streakDays = 28;
const bandOrder = 2;

/** Karten und Band als HTML — am Handy leer. */
export function progressDeskHead() {
  if (!isDesk()) return "";
  const level = levelSummary();
  const cards = heroCards({
    week: xpThisWeek(),
    level,
    streak: usageStreaks(),
    usage: usageByDay(streakDays),
    order: 0,
    onPage: true,
  });
  return `<div class="desk-hero progress-hero">${cards}${bandBlock(xpByDay(bandDays), level, bandOrder, true)}</div>`;
}

/*
 * Die Karte „Serie“ öffnet das Einstellungs-Blatt gleich mit der vollen Karte
 * „Serie“: open() nimmt die aufzuklappende Kachel als zweiten Wert.
 */
function openStreak() {
  load("profile").then((module) => module.open(true, { detail: "streak" }));
}

/** Klick im Kopf behandeln; `true`, wenn er hierher gehörte. */
export function handleDeskClick(event) {
  const target = event.target.closest("[data-dash]");
  if (!target) return false;
  if (target.dataset.dash === "streak") openStreak();
  return true;
}
