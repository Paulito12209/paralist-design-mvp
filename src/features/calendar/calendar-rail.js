/*
 * Die Karten des Kalenders in der rechten Spalte am Desktop: oben der Monat
 * als kleines Raster zum Springen (Punkt unter Tagen mit Einträgen), darunter
 * der gewählte Tag mit allem, was dort steht. Klick auf einen Tag wählt ihn
 * im Kalender; der Kalender meldet den Wechsel (events.contextChanged) und die
 * Spalte zieht nach. Geladen über registerRailCards in src/main.js.
 * Pfad: src/features/calendar/calendar-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * weekdayLetters -> Beschriftung der sieben Spalten im kleinen Monat (ab Montag)
 * dayLimit       -> wie viele Einträge die Karte des gewählten Tags höchstens zeigt
 *
 * Aussehen in styles/desk-rail-views.css, die Karten selbst in styles/desk-rail.css.
 */

import { addDays, dayKey, parseDay, startOfWeek } from "../../core/dates.js";
import { formatNumber, longDate, monthHeading } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { typeIcon } from "../../data/config.js";
import { entriesOfDay, entryDay, entryTime } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { cardHead, createPill, railTitle } from "../../ui/rail-parts.js";
import { goToDay, goToday, shiftMonth } from "./calendar-nav.js";

const weekdayLetters = ["M", "D", "M", "D", "F", "S", "S"];
const dayLimit = 8;
/* Sechs Wochen decken jeden Monat ab, egal auf welchen Wochentag der Erste fällt. */
const gridDays = 42;

/* Alle Tage mit mindestens einem sichtbaren Eintrag — einmal je Zeichnung, nicht je Tag. */
function busyDays() {
  const days = new Set();
  state.entries.forEach((entry) => {
    if (!entry.archived) days.add(entryDay(entry));
  });
  return days;
}

/* Ein Tag im kleinen Monat. Tage aus dem Nachbarmonat sind blass, aber wählbar. */
function dayButton(date, month, selected, todayKey, busy) {
  const key = dayKey(date);
  const classes = ["rail-month-day"];
  if (date.getMonth() !== month) classes.push("is-outside");
  if (key === todayKey) classes.push("is-today");
  if (key === selected) classes.push("is-selected");
  if (busy.has(key)) classes.push("has-entries");
  const current = key === selected ? ' aria-current="date"' : "";
  return `<button class="${classes.join(" ")}" type="button" data-rail="cal-day" data-id="${key}" aria-label="${escapeHtml(longDate(key))}"${current}>${date.getDate()}</button>`;
}

/** Karte „Monat“: Monatsname mit Pfeilen, darunter sechs Wochen zum Anklicken. */
function monthCard() {
  const selected = ui.calendarDay;
  const anchor = parseDay(selected);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  const todayKey = dayKey(new Date());
  const busy = busyDays();
  const days = Array.from({ length: gridDays }, (_, index) =>
    dayButton(addDays(start, index), anchor.getMonth(), selected, todayKey, busy)
  );
  const arrows = `
    <span class="rail-head-end rail-month-arrows">
      <button class="rail-round" type="button" data-rail="cal-month" data-id="-1" aria-label="Voriger Monat">${icon("back")}</button>
      <button class="rail-round" type="button" data-rail="cal-month" data-id="1" aria-label="Nächster Monat">${icon("chevron")}</button>
    </span>`;
  const today = selected === todayKey ? "" : `<button class="rail-pill" type="button" data-rail="cal-today">Heute</button>`;
  return `
    ${cardHead(escapeHtml(monthHeading(first.getTime())), arrows)}
    <div class="rail-month" role="group" aria-label="Tage">
      ${weekdayLetters.map((letter) => `<span class="rail-month-weekday" aria-hidden="true">${letter}</span>`).join("")}
      ${days.join("")}
    </div>
    ${today ? `<div class="rail-card-foot"><span></span>${today}</div>` : ""}
  `;
}

/* Uhrzeit zum Sortieren: ohne Uhrzeit ganz oben, wie „ganztags“. */
function timeOf(entry) {
  return entryTime(entry) || "";
}

/* Eine Zeile des gewählten Tags: Uhrzeit, Icon der Art, Titel. */
function dayRow(entry) {
  const time = entry.type === "termin" ? timeOf(entry) : "";
  return `
    <li>
      <button class="rail-day-row" type="button" data-rail="entry" data-id="${escapeHtml(entry.id)}">
        <span class="rail-day-time">${escapeHtml(time)}</span>
        ${icon(typeIcon(entry.type))}
        <span class="rail-day-title">${railTitle(entry)}</span>
      </button>
    </li>`;
}

/** Karte des gewählten Tags: alles, was dort steht, Termine nach Uhrzeit zuerst. */
function dayCard() {
  const key = ui.calendarDay;
  const entries = entriesOfDay(key).sort((a, b) => {
    const eventA = a.type === "termin" ? 0 : 1;
    const eventB = b.type === "termin" ? 0 : 1;
    return eventA - eventB || timeOf(a).localeCompare(timeOf(b));
  });
  const count = entries.length ? `<span class="rail-muted rail-head-end">${formatNumber(entries.length)}</span>` : "";
  const body = entries.length
    ? `<ul class="rail-day-list">${entries.slice(0, dayLimit).map(dayRow).join("")}</ul>`
    : `<p class="rail-empty">Nichts geplant.</p>${createPill('data-rail="create" data-pick="termin"', "Termin anlegen")}`;
  return cardHead(escapeHtml(longDate(key)), count) + body;
}

/** Die Plätze der Spalte auf der Kalenderseite (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [
  { name: "month", className: "rail-card rail-month-card", render: monthCard },
  { name: "day", className: "rail-card rail-day-card", render: dayCard },
];

/** Was die eigenen Knöpfe tun; der Kalender zeichnet sich neu und meldet den neuen Tag. */
export const railActions = {
  "cal-day": (button) => goToDay(button.dataset.id),
  "cal-month": (button) => shiftMonth(Number(button.dataset.id)),
  "cal-today": () => goToday(),
};
