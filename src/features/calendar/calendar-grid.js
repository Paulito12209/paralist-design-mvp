/*
 * Das Stundenraster der Kalenderseite. Im Raster liegen nur Termine;
 * Aufgaben, Notizen und Medien gehören in die Liste.
 * Pfad: src/features/calendar/calendar-grid.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --cal-hour-h (styles/tokens.css) -> Höhe einer Stunde
 * overlapShift -> um wie viele Pixel gleichzeitige Termine versetzt werden
 * nowTopGap    -> Abstand der Jetzt-Linie zum oberen Rand des Rasters beim Öffnen
 * minGridHeight -> Mindesthöhe des Rasters, falls der Kopf einmal sehr hoch wird
 */

import { dayKey, pad2, timeKey } from "../../core/dates.js";
import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { typeIcon } from "../../data/config.js";
import { ui } from "../../data/state.js";
import { entriesOfDay, entryColor, entryTime } from "../../data/queries.js";
import { cssNumber } from "../../core/css-vars.js";
import { cal, gridTopOffset, hourHeight, nowOffset } from "./calendar-state.js";

const overlapShift = 12;
const nowTopGap = 40;
const minGridHeight = 240;

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
 * Das Raster bekommt eine feste Höhe und rollt in sich selbst: so bleibt der
 * blaue Kopfbereich (Titel, Monat, Wochenstreifen, Knöpfe) beim Öffnen ganz
 * sichtbar, während die Stunden trotzdem an der richtigen Stelle stehen.
 * Die Höhe ist genau der Platz vom eingerasteten Kopf bis zum unteren Rand —
 * dadurch bleibt für die Seite selbst nur noch der Weg übrig, den Titel und
 * Monat zum Wegscrollen brauchen.
 */
export function sizeGrid() {
  const stuckHead = dom.calHead.offsetHeight - cssNumber("--content-top", 32);
  const height = Math.max(minGridHeight, dom.content.clientHeight - stuckHead);
  dom.calPanel.style.height = `${height}px`;
}

/*
 * Im Raster zur Jetzt-Linie rollen; ohne sie zur 8-Uhr-Zeile. Gerollt wird nur
 * das Raster selbst, die Seite darüber bleibt stehen — der Kopfbereich bleibt
 * also sichtbar, und die Linie steht trotzdem weit oben.
 */
export function scrollToNow() {
  const target = el("cal-now") || dom.calPanel.querySelector('[data-hour="8"]');
  if (!target) return;
  const panelTop = dom.calPanel.getBoundingClientRect().top;
  dom.calPanel.scrollTop += target.getBoundingClientRect().top - panelTop - nowTopGap;
}

/** Die Jetzt-Linie mit der Uhr weiterwandern lassen. */
export function moveNowLine() {
  const now = el("cal-now");
  if (!now) return;
  now.style.top = `${nowOffset(hourHeight())}px`;
  const label = el("cal-now-label");
  if (label) label.textContent = timeKey(Date.now());
}

/*
 * Ob die Jetzt-Linie gerade im sichtbaren Ausschnitt des Rasters steht —
 * darauf entscheidet calendar.js, ob der „Heute“-Knopf blau ist. Sichtbar
 * heißt: innerhalb des Rasters, unterhalb des feststehenden Kopfes
 * (.cal-head) und oberhalb des unteren Rands des Scrollbereichs.
 */
export function nowLineVisible() {
  const now = el("cal-now");
  if (!now) return false;
  const nowRect = now.getBoundingClientRect();
  const panelRect = dom.calPanel.getBoundingClientRect();
  const visibleTop = Math.max(panelRect.top, dom.calHead.getBoundingClientRect().bottom);
  const visibleBottom = Math.min(panelRect.bottom, dom.content.getBoundingClientRect().bottom);
  return nowRect.bottom > visibleTop && nowRect.top < visibleBottom;
}
