/*
 * Die Listenansicht der Kalenderseite: drei Spalten (Aufgaben, Termine,
 * Projekte) mit der Anzahl ihrer Einträge auf der Pille und darunter die
 * Einträge des gewählten Tages. Die Zahl steht erst ab einem Eintrag da —
 * eine „0“ wird gar nicht erst gezeigt.
 * Pfad: src/features/calendar/calendar-list.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/calendar-panel.css
 * (Klassen .cal-empty, .cal-time, .cal-seg-btn) und styles/overview.css
 * (Klasse .card-count, für die Zahl auf der Pille). Die Beschriftung der
 * Pille am leeren Tag steht bei `calendarSegments` in src/data/config.js.
 */

import { icon } from "../../core/html.js";
import { longDate } from "../../core/format.js";
import { calendarSegments } from "../../data/config.js";
import { entriesOfDay, entryTime } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { entryRow } from "../../ui/rows.js";
import { cal } from "./calendar-state.js";

/** Ordnet der Spalte den Eintragstyp zu, den sie zeigt. */
const segTypes = { aufgaben: "aufgabe", termine: "termin", projekte: "projekt" };

/** Die Einträge, die in der gewählten Spalte stehen — nach Uhrzeit sortiert. */
export function listEntries() {
  const type = segTypes[state.prefs.calendar.seg] || "projekt";
  return entriesOfDay(ui.calendarDay)
    .filter((entry) => entry.type === type)
    .sort((a, b) => String(entryTime(a) || "").localeCompare(String(entryTime(b) || "")));
}

/** Wie viele Einträge des Tages in jede der drei Spalten gehören. */
function segmentCounts() {
  const dayEntries = entriesOfDay(ui.calendarDay);
  const counts = {};
  for (const item of calendarSegments) {
    const type = segTypes[item.id] || "projekt";
    counts[item.id] = dayEntries.filter((entry) => entry.type === type).length;
  }
  return counts;
}

/** Die Liste des gewählten Tages als HTML. */
export function renderList() {
  const list = listEntries();
  const counts = segmentCounts();
  const seg = calendarSegments.find((item) => item.id === state.prefs.calendar.seg) || calendarSegments[0];

  const tabs = calendarSegments
    .map(
      (item) =>
        `<button class="cal-seg-btn${item.id === seg.id ? " is-active" : ""}" type="button" data-seg="${item.id}">${item.label}${
          counts[item.id] ? `<span class="card-count">${counts[item.id]}</span>` : ""
        }</button>`
    )
    .join("");

  const body = list.length
    ? `<div class="workspace-list">${list
        .map((entry) =>
          entryRow(entry, entryTime(entry) ? `<span class="cal-time">${entryTime(entry)}</span>` : "")
        )
        .join("")}</div>`
    : `
      <div class="cal-empty">
        ${icon("calendar")}
        <b>${seg.empty}</b>
        <span>${longDate(ui.calendarDay)}</span>
        <button class="empty-add" type="button" data-empty-add="${seg.pick}">
          ${icon("plus", "empty-add-icon")}<span>${seg.add}</span>
        </button>
      </div>`;

  return `<div class="cal-seg">${tabs}</div>${body}`;
}
