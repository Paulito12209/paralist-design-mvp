/*
 * Die Listenansicht der Kalenderseite: drei Spalten (Aufgaben, Termine,
 * Projekte) mit der Anzahl ihrer Einträge auf der Pille und darunter die
 * Einträge des gewählten Tages. Die Zahl steht erst ab einem Eintrag da —
 * eine „0“ wird gar nicht erst gezeigt. Rechts in der Reiterzeile steht das
 * Symbol „Ansicht“ (Regler), das nur die Android-Fassungen zeigen
 * (styles/android-calendar-tabs.css); ein Tipp darauf öffnet das Blatt
 * „Ansicht“ (src/ui/view-panel.js, data-view-panel-open).
 * Pfad: src/features/calendar/calendar-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * viewLabel -> Vorlesetext und Hinweis des Symbols „Ansicht“
 *
 * Aussehen: styles/calendar-panel.css
 * (Klassen .cal-empty, .cal-time, .cal-seg-btn) und styles/overview.css
 * (Klasse .card-count, für die Zahl auf der Pille). Die Beschriftung der
 * Emblem, Satz und Pille am leeren Tag stehen bei `calendarSegments`
 * in src/data/config-calendar.js.
 */

import { icon } from "../../core/html.js";
import { calendarSegments } from "../../data/config-calendar.js";
import { entriesOfDay, entryTime } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { entryRow } from "../../ui/rows.js";
import { cal } from "./calendar-state.js";

/** Ordnet der Spalte den Eintragstyp zu, den sie zeigt. */
const segTypes = { aufgaben: "aufgabe", termine: "termin", projekte: "projekt" };

const viewLabel = "Ansicht";

/* Dasselbe Regler-Symbol wie in der Werkzeugzeile über den Listen (src/ui/list-head.js) */
const viewButton = `<button class="view-panel-btn cal-seg-view" type="button" data-view-panel-open aria-label="${viewLabel}" title="${viewLabel}">${icon("tune")}</button>`;

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
        ${icon(seg.icon)}
        <b>${seg.empty}</b>
        <p>${seg.hint}</p>
        <button class="empty-add" type="button" data-empty-add="${seg.pick}">
          ${icon(seg.addIcon, "empty-add-icon")}<span>${seg.add}</span>
        </button>
      </div>`;

  /* cal-seg-tabs: Hülle der drei Reiter, damit Android sie als eine Kapsel
     bzw. Reiterzeile neben das Symbol stellen kann; sonst ohne eigene Box */
  return `<div class="cal-seg"><div class="cal-seg-tabs">${tabs}</div>${viewButton}</div>${body}`;
}
