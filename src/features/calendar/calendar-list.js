/*
 * Die Listenansicht der Kalenderseite: drei Spalten (Aufgaben, Termine,
 * Projekte) mit der Anzahl ihrer Einträge auf der Pille und darunter die
 * Einträge des gewählten Tages. Die Zahl steht erst ab einem Eintrag da —
 * eine „0“ wird gar nicht erst gezeigt. Rechts in der Reiterzeile steht das
 * Symbol „Ansicht“ (Regler), das nur die Android-Fassungen zeigen
 * (styles/android-calendar-tabs.css); ein Tipp darauf öffnet das Blatt
 * „Ansicht“ (src/ui/view-panel.js, data-view-panel-open).
 * Android: ein Tipp unter die letzte Zeile legt an, was die Spalte zeigt, an
 * dem Tag, den man ansieht (src/ui/inline-add.js) — ein Termin um die
 * aktuelle Uhrzeit (heute) bzw. um `inlineTime` (jeder andere Tag).
 * Pfad: src/features/calendar/calendar-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * viewLabel  -> Vorlesetext und Hinweis des Symbols „Ansicht“
 * inlineTime -> Uhrzeit eines per Tipp angelegten Termins an einem anderen Tag als heute
 *
 * Aussehen: styles/calendar-panel.css
 * (Klassen .cal-empty, .cal-time, .cal-seg-btn) und styles/overview.css
 * (Klasse .card-count, für die Zahl auf der Pille). Die Beschriftung der
 * Pille am leeren Tag steht bei `calendarSegments` in src/data/config.js.
 */

import { dayKey, timeKey } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { calendarSegments } from "../../data/config.js";
import { createEntryInline } from "../../data/mutations-inline.js";
import { entriesOfDay, entryTime } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { addInlineList, openEntryRow, reopenIn } from "../../ui/inline-add.js";
import { entryRow } from "../../ui/rows.js";
import { isViewActive } from "../../ui/views.js";
import { cal } from "./calendar-state.js";

/** Ordnet der Spalte den Eintragstyp zu, den sie zeigt. */
const segTypes = { aufgaben: "aufgabe", termine: "termin", projekte: "projekt" };

const viewLabel = "Ansicht";
/* Dieselbe Uhrzeit wie beim Eingabefeld (applyCalendarDate in src/features/composer/composer.js) */
const inlineTime = "09:00";

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
        ${icon("calendar")}
        <b>${seg.empty}</b>
        <button class="empty-add" type="button" data-empty-add="${seg.pick}">
          ${icon("plus", "empty-add-icon")}<span>${seg.add}</span>
        </button>
      </div>`;

  /* cal-seg-tabs: Hülle der drei Reiter, damit Android sie als eine Kapsel
     bzw. Reiterzeile neben das Symbol stellen kann; sonst ohne eigene Box */
  return `<div class="cal-seg"><div class="cal-seg-tabs">${tabs}</div>${viewButton}</div>${body}`;
}

/* Tipp unter die letzte Zeile (Android): ein Eintrag der gewählten Spalte am gezeigten Tag */
const inlineList = {
  area() {
    if (!isViewActive("calendar") || state.prefs.calendar.mode !== "list") return null;
    return dom.calPanel.querySelector(":scope > .workspace-list");
  },
  open(area) {
    const seg = calendarSegments.find((item) => item.id === state.prefs.calendar.seg) || calendarSegments[0];
    const type = seg.pick;
    const date = ui.calendarDay;
    const fields = { date };
    if (type === "termin") fields.time = date === dayKey(new Date()) ? timeKey(Date.now()) : inlineTime;
    openEntryRow(area, {
      type,
      onCommit: (title) => createEntryInline({ title, type, fields }),
      reopen: () => reopenIn(inlineList),
    });
  },
};
addInlineList(inlineList);
