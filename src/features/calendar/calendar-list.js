/*
 * Die Listenansicht der Kalenderseite: drei Spalten (Aufgaben, Termine,
 * Projekte) und darunter die Einträge des gewählten Tages.
 * Pfad: src/features/calendar/calendar-list.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/calendar-panel.css
 * (Klassen .cal-empty, .cal-time) und styles/calendar.css (.cal-seg). Die
 * Beschriftung der Pille am leeren Tag steht bei `calendarSegments` in
 * src/data/config.js.
 */

import { icon } from "../../core/html.js";
import { longDate } from "../../core/format.js";
import { calendarSegments } from "../../data/config.js";
import { entriesOfDay, entryTime } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { entryRow } from "../../ui/rows.js";
import { cal } from "./calendar-state.js";

/** Die Einträge, die in der gewählten Spalte stehen — nach Uhrzeit sortiert. */
export function listEntries() {
  const seg = state.prefs.calendar.seg;
  return entriesOfDay(ui.calendarDay)
    .filter((entry) => {
      if (seg === "aufgaben") return entry.type === "aufgabe";
      if (seg === "termine") return entry.type === "termin";
      return entry.type === "projekt";
    })
    .sort((a, b) => String(entryTime(a) || "").localeCompare(String(entryTime(b) || "")));
}

/** Die Liste des gewählten Tages als HTML. */
export function renderList() {
  const list = listEntries();
  const seg = calendarSegments.find((item) => item.id === state.prefs.calendar.seg) || calendarSegments[0];

  const tabs = calendarSegments
    .map(
      (item) =>
        `<button class="cal-seg-btn${item.id === seg.id ? " is-active" : ""}" type="button" data-seg="${item.id}">${item.label}</button>`
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
