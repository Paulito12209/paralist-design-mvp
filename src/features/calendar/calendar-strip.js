/*
 * Der Wochenstreifen oben auf der Kalenderseite: sieben Tage je Woche, die
 * Vor- und Nachwoche scheinen schwach durch. Darüber steht der gewählte Tag
 * als Überschrift, rechts daneben seine Kalenderwoche („KW 40“) — zusätzlich
 * zur Zeile „Woche“ im Panel „Ansicht“ (calendar-settings.js).
 * Pfad: src/features/calendar/calendar-strip.js
 *
 * Keine anpassbaren visuellen Werte: Farben und Größen stehen in
 * styles/calendar.css (--cal-accent, --cal-row-h). Die Ringe mit den Murmeln
 * zeichnet calendar-rings.js.
 */

import { addDays, dayKey, isoWeek, parseDay, startOfWeek } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { calendarDayHeading, longDate } from "../../core/format.js";
import { state, ui } from "../../data/state.js";
import { dayRing } from "./calendar-rings.js";

/** Die Montage der sichtbaren Wochen: eine, zwei oder alle Wochen des Monats. */
export function visibleWeeks() {
  const selected = parseDay(ui.calendarDay);

  if (state.prefs.calendar.span === 0) {
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const last = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
    const weeks = [];
    for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) weeks.push(monday);
    return weeks;
  }

  const start = startOfWeek(selected);
  return Array.from({ length: state.prefs.calendar.span }, (_, index) => addDays(start, index * 7));
}

/* Eine Woche als Zeile. `extra` markiert die durchscheinenden Nachbarwochen. */
function weekMarkup(monday, extra = "") {
  const todayKey = dayKey(new Date());
  const month = parseDay(ui.calendarDay).getMonth();
  let html = `<div class="cal-week${extra ? ` ${extra}` : ""}">`;

  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(monday, offset);
    const key = dayKey(day);
    const ring = dayRing(key);
    const classes = ["cal-day"];
    if (key === ui.calendarDay) classes.push("is-selected");
    if (key === todayKey) classes.push("is-today");
    if (ring) classes.push("has-items");
    if (state.prefs.calendar.span === 0 && day.getMonth() !== month) classes.push("is-other");

    html += `
      <button class="${classes.join(" ")}" type="button" data-day="${key}" aria-label="${longDate(key)}">
        <span class="cal-day-num">${ring}${day.getDate()}</span>
      </button>`;
  }

  return `${html}</div>`;
}

/** Überschrift und Streifen neu zeichnen. */
export function renderStrip() {
  const weeks = visibleWeeks();

  dom.calMonthLabel.textContent = calendarDayHeading(ui.calendarDay);
  dom.calKwBtn.textContent = `KW ${isoWeek(parseDay(ui.calendarDay))}`;
  dom.calWeeks.innerHTML =
    weekMarkup(addDays(weeks[0], -7), "is-peek is-before") +
    weeks.map((monday) => weekMarkup(monday)).join("") +
    weekMarkup(addDays(weeks[weeks.length - 1], 7), "is-peek is-after");
}
