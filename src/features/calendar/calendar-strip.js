/*
 * Der Wochenstreifen oben auf der Kalenderseite: Kalenderwoche links,
 * sieben Tage daneben, die Vor- und Nachwoche scheinen schwach durch.
 * Pfad: src/features/calendar/calendar-strip.js
 *
 * Keine anpassbaren visuellen Werte: Farben und Größen stehen in
 * styles/calendar.css (--cal-accent, --cal-day-ring, --cal-row-h).
 */

import { addDays, dayKey, isoWeek, parseDay, startOfWeek } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { longDate, monthHeading } from "../../core/format.js";
import { calendarSpans } from "../../data/config.js";
import { entriesOfDay, entryColor } from "../../data/queries.js";
import { state } from "../../data/state.js";
import { cal } from "./calendar-state.js";

/** Die Montage der sichtbaren Wochen: eine, zwei oder alle Wochen des Monats. */
export function visibleWeeks() {
  const selected = parseDay(cal.selected);

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
  const month = parseDay(cal.selected).getMonth();
  let html = `<div class="cal-week${extra ? ` ${extra}` : ""}"><span class="cal-kw">${isoWeek(monday)}</span>`;

  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(monday, offset);
    const key = dayKey(day);
    const items = entriesOfDay(key);
    const classes = ["cal-day"];
    if (key === cal.selected) classes.push("is-selected");
    if (key === todayKey) classes.push("is-today");
    if (items.length) classes.push("has-items");
    if (state.prefs.calendar.span === 0 && day.getMonth() !== month) classes.push("is-other");

    /* Der Punkt hat die Farbe des ersten Termins, sonst die des ersten Eintrags. */
    const marker = items.find((item) => item.type === "termin") || items[0];
    html += `
      <button class="${classes.join(" ")}" type="button" data-day="${key}" aria-label="${longDate(key)}">
        <span class="cal-day-num">${day.getDate()}</span>
        ${items.length ? `<span class="cal-day-dot" style="background:${entryColor(marker)}"></span>` : ""}
      </button>`;
  }

  return `${html}</div>`;
}

/** Streifen, Monatsname und die drei Knöpfe darunter neu zeichnen. */
export function renderStrip() {
  const weeks = visibleWeeks();
  const { calendar } = state.prefs;

  dom.calMonthLabel.textContent = monthHeading(parseDay(cal.selected).getTime());
  dom.calWeeks.innerHTML =
    weekMarkup(addDays(weeks[0], -7), "is-peek is-before") +
    weeks.map((monday) => weekMarkup(monday)).join("") +
    weekMarkup(addDays(weeks[weeks.length - 1], 7), "is-peek is-after");

  dom.calTodayBtn.classList.toggle("is-on", cal.selected === dayKey(new Date()));
  const span = calendarSpans.find((item) => item.id === calendar.span) || calendarSpans[0];
  dom.calSpanBtn.textContent = span.short;
  /* Der runde Knopf zeigt immer die Ansicht, zu der er wechselt. */
  dom.calModeIcon.setAttribute("href", calendar.mode === "grid" ? "#icon-list" : "#icon-timeline");
}
