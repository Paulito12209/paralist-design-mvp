/*
 * Das Stundenraster der Kalenderseite. Im Raster liegen nur Termine;
 * Aufgaben, Notizen und Medien gehören in die Liste.
 * Pfad: src/features/calendar/calendar-grid.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --cal-hour-h (styles/tokens.css) -> Höhe einer Stunde
 * overlapShift -> um wie viele Pixel gleichzeitige Termine versetzt werden
 * nowTopGap    -> Abstand der Jetzt-Linie zum feststehenden Kopf beim Öffnen
 */

import { dayKey, pad2, timeKey } from "../../core/dates.js";
import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { typeIcon } from "../../data/config.js";
import { ui } from "../../data/state.js";
import { entriesOfDay, entryColor, entryTime } from "../../data/queries.js";
import { cal, gridTopOffset, hourHeight, nowOffset } from "./calendar-state.js";

const overlapShift = 12;
const nowTopGap = 40;

/* Ganztägige Termine stehen als Chips über dem Raster. */
function allDayMarkup(entries) {
  if (!entries.length) return "";
  const chips = entries
    .map(
      (entry) => `
        <button class="cal-allday-chip" type="button" data-open-entry="${entry.id}" style="--event-color:${entryColor(entry)}">
          ${icon(typeIcon(entry.type))}${escapeHtml(entry.title)}
        </button>`
    )
    .join("");
  return `<div class="cal-allday">${chips}</div>`;
}

/* Die 24 Stundenzeilen. */
function hoursMarkup() {
  let html = "";
  for (let hour = 0; hour < 24; hour += 1) {
    html += `<div class="cal-hour" data-hour="${hour}"><span class="cal-hour-label">${pad2(hour)}:00</span><span class="cal-hour-line"></span></div>`;
  }
  return html;
}

/* Termine als farbige Blöcke. Gleiche Uhrzeiten werden versetzt, damit keiner verschwindet. */
function eventsMarkup(entries, height) {
  const seen = {};
  return entries
    .map((entry) => {
      const time = entryTime(entry);
      const [hour, minute] = time.split(":").map(Number);
      const shift = seen[time] || 0;
      seen[time] = shift + 1;
      /* top/height in Pixeln: die Stelle ergibt sich erst aus der Uhrzeit */
      const top = gridTopOffset + (hour + minute / 60) * height;
      return `
        <button class="cal-event" type="button" data-open-entry="${entry.id}" style="top:${top}px;height:${height - 4}px;margin-left:${shift * overlapShift}px;--event-color:${entryColor(entry)}">
          ${escapeHtml(entry.title)}<small>${time}</small>
        </button>`;
    })
    .join("");
}

/* Die Jetzt-Linie, nur am heutigen Tag. */
function nowMarkup(height) {
  if (ui.calendarDay !== dayKey(new Date())) return "";
  return `
    <div class="cal-now" id="cal-now" style="top:${nowOffset(height)}px">
      <span class="cal-now-time"><span id="cal-now-label">${timeKey(Date.now())}</span></span>
      <span class="cal-now-line"></span>
    </div>`;
}

/** Das Raster des gewählten Tages als HTML. */
export function renderGrid() {
  const items = entriesOfDay(ui.calendarDay).filter((entry) => entry.type === "termin");
  const timed = items.filter((entry) => entryTime(entry));
  const allDay = items.filter((entry) => !entryTime(entry));
  const height = hourHeight();

  return `${allDayMarkup(allDay)}<div class="cal-hours">${hoursMarkup()}${eventsMarkup(timed, height)}${nowMarkup(height)}</div>`;
}

/*
 * Zur Jetzt-Linie scrollen; ohne sie zur 8-Uhr-Zeile. Titel und Monat
 * scrollen dabei weg, der Kopf (.cal-head) rastet oben am Scrollbereich ein.
 * Gemessen wird gegen diese Endlage, nicht gegen die Ruhelage des Kopfes —
 * sonst stimmt der Abstand nach dem Einrasten nicht mehr.
 */
export function scrollToNow() {
  const target = el("cal-now") || dom.calPanel.querySelector('[data-hour="8"]');
  if (!target) return;
  requestAnimationFrame(() => {
    const stuckBottom = dom.content.getBoundingClientRect().top + dom.calHead.offsetHeight;
    const targetTop = target.getBoundingClientRect().top;
    dom.content.scrollTop += targetTop - stuckBottom - nowTopGap;
  });
}

/** Die Jetzt-Linie mit der Uhr weiterwandern lassen. */
export function moveNowLine() {
  const now = el("cal-now");
  if (!now) return;
  now.style.top = `${nowOffset(hourHeight())}px`;
  const label = el("cal-now-label");
  if (label) label.textContent = timeKey(Date.now());
}
