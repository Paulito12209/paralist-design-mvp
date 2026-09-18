/*
 * Die beiden Listen-Karten im Fortschritt-Blatt: die nächsten Stufen und die
 * Historie aller Ereignisse, nach Tagen gruppiert.
 * Pfad: src/features/progress/progress-lists.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * nextLevelCount -> wie viele kommende Stufen die Karte zeigt
 * historyPageSize -> wie viele Zeilen „Mehr anzeigen“ nachlegt
 *
 * Farben und Abstände stehen in styles/progress.css (.level-row, .hist-row).
 */

import { startOfDay } from "../../core/dates.js";
import { activityDayHeading, formatNumber } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { xpItemStyle } from "../../data/config.js";
import { state, ui } from "../../data/state.js";
import { levelInfo, levelThreshold, totalXp, xpKindStyle } from "../../data/xp.js";

const nextLevelCount = 3;
export const historyPageSize = 20;

/** Die nächsten drei Stufen und ihre Punktzahl. */
export function levelsCard() {
  const info = levelInfo(totalXp());
  const rows = Array.from({ length: nextLevelCount }, (_, index) => {
    const level = info.level + index + 1;
    return `<div class="level-row"><b>Stufe ${level}</b><span>${formatNumber(levelThreshold(level))} XP</span></div>`;
  }).join("");

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("stairs")}<span>Nächste Stufen</span></div>
      ${rows}
    </section>
  `;
}

/* Sammelposten aus älteren Speicherständen: sie haben keine Zeitpunkte. */
function bulkRows(rows) {
  return rows
    .map((row) => {
      const kind = xpKindStyle(row.kind);
      return `
        <div class="hist-row hist-bulk">
          <span style="color:${kind.color}">${icon(kind.icon)}</span>
          <div class="hist-copy">
            <p class="hist-title">${kind.label}</p>
            <p class="hist-meta">${formatNumber(row.count)} Einträge · ohne Zeitpunkte</p>
          </div>
          <span class="hist-xp" style="color:${kind.color}">+${formatNumber(row.amount)}</span>
        </div>
      `;
    })
    .join("");
}

/* Die Zeilen mit Zeitpunkt, gruppiert nach Tag mit Tagessumme in der Überschrift. */
function timedRows(rows) {
  /* Tagessummen einmal vorweg zusammenzählen, statt sie je Zeile neu zu suchen. */
  const dayTotals = new Map();
  rows.forEach((row) => {
    const day = startOfDay(row.ts);
    dayTotals.set(day, (dayTotals.get(day) || 0) + row.amount);
  });

  let html = "";
  let currentDay = null;
  rows.slice(0, ui.historyLimit).forEach((row) => {
    const day = startOfDay(row.ts);
    if (day !== currentDay) {
      currentDay = day;
      html += `<div class="hist-group"><span>${activityDayHeading(row.ts)}</span><span>+${formatNumber(dayTotals.get(day))}</span></div>`;
    }
    const style = xpItemStyle(row.item);
    const kind = xpKindStyle(row.kind);
    html += `
      <div class="hist-row">
        <span style="color:${style.color}">${icon(style.icon)}</span>
        <div class="hist-copy">
          <p class="hist-title">${escapeHtml(row.title || style.label)}</p>
          <p class="hist-meta">${kind.label} · ${style.label}</p>
        </div>
        <span class="hist-xp" style="color:${style.color}">+${formatNumber(row.amount)}</span>
      </div>
    `;
  });
  return html;
}

/** Historie aller Ereignisse, neueste zuerst. */
export function logCard() {
  const bulk = state.xpLog.filter((row) => row.ts == null);
  const timed = state.xpLog.filter((row) => row.ts != null).sort((a, b) => b.ts - a.ts);

  let body = bulkRows(bulk) + timedRows(timed);
  if (!bulk.length && !timed.length) body = `<p class="empty-note">Noch keine Aktivität.</p>`;

  const more =
    timed.length > ui.historyLimit
      ? `<button class="hist-more" type="button" id="history-more">Mehr anzeigen</button>`
      : "";

  return `
    <section class="pcard">
      <div class="pcard-head">${icon("history")}<span>Historie</span></div>
      ${body}${more}
    </section>
  `;
}
