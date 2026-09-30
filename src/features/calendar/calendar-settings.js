/*
 * Das Panel „Ansicht“ der Kalenderseite, dasselbe wie auf Aufgaben und
 * Übersicht (src/ui/view-panel.js). Im Kopf links vom Symbol „Heute“, darin
 * die Zeilen:
 *
 * - Darstellung: Stundenraster | Liste
 * - Zeitspanne: 1 W | 2 W | 1 M — wie viele Wochen der Streifen zeigt
 * - Woche: die KW des gewählten Tages; ein Tipp öffnet das Blatt mit den
 *   Rollen Jahr | KW (src/features/calendar/calendar-date-picker.js)
 *
 * Am Handy immer, am Desktop nur in der Tagesansicht — Woche und Monat haben
 * ihre Werkzeugzeile (styles/calendar.css).
 * Pfad: src/features/calendar/calendar-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * panelTitle -> Überschrift des Panels
 * rowLabels  -> Beschriftungen der Zeilen und des Knopfs „Heute“
 * modes      -> Symbole und Namen im Segment Darstellung
 *
 * Aussehen: styles/tasks-settings.css (Panel, Segment) und styles/calendar.css
 * (Knopf „Heute“, Luft unter dem Kalender).
 */

import { isoWeek, parseDay } from "../../core/dates.js";
import { escapeHtml } from "../../core/html.js";
import { calendarSpans } from "../../data/config.js";
import { state, ui } from "../../data/state.js";
import { panelSegment } from "../../ui/panel-rows.js";
import { createViewPanel } from "../../ui/view-panel.js";
import { openDatePicker } from "./calendar-date-picker.js";
import { goToday, setMode, setSpan } from "./calendar-nav.js";

const panelTitle = "Ansicht";
const rowLabels = {
  mode: "Darstellung",
  span: "Zeitspanne",
  week: "Woche",
  today: "Heute",
};
const modes = [
  { id: "grid", label: "Stundenraster", icon: "timeline" },
  { id: "list", label: "Liste", icon: "list" },
];

let panel = null;

/* Die Zeilen des Panels für den gewählten Tag. */
function settingsMarkup() {
  const { calendar } = state.prefs;
  const spans = calendarSpans.map((span) => ({ id: String(span.id), label: span.short }));
  return `
      <div class="details-list tasks-settings">
        <div class="details-row">
          <span class="details-row-label">${rowLabels.mode}</span>${panelSegment(modes, calendar.mode, "mode")}
        </div>
        <div class="details-row">
          <span class="details-row-label">${rowLabels.span}</span>${panelSegment(spans, String(calendar.span), "span")}
        </div>
        <button class="details-row is-editable" type="button" data-settings="week">
          <span class="details-row-label">${rowLabels.week}</span><span class="details-row-value">KW ${isoWeek(parseDay(ui.calendarDay))}</span>
        </button>
      </div>`;
}

/* Klicks im Panel und auf „Heute“ im Kopf. */
function onClick(event) {
  const button = event.target.closest("[data-settings]");
  if (!button) return;
  const { settings, value } = button.dataset;
  if (settings === "today") goToday();
  else if (settings === "mode" && value !== state.prefs.calendar.mode) setMode(value);
  else if (settings === "span") setSpan(Number(value));
  else if (settings === "week") openDatePicker("week");
}

/** Das Panel einmal anlegen; calendar.js ruft das beim Laden des Moduls. */
export function initCalendarSettings() {
  panel = createViewPanel({
    title: panelTitle,
    className: "cal-view-panel",
    onClick,
    actions: `<button class="cal-today" type="button" data-settings="today">${escapeHtml(rowLabels.today)}</button>`,
  });
}

/** Die Zeilen auf den Stand bringen — bei jedem Neuzeichnen des Kalenders. */
export function renderCalendarSettings() {
  panel?.setContent(settingsMarkup());
}

/**
 * „Heute“ tritt nur hervor, wenn er gerade etwas bedeutet: am heutigen Tag,
 * solange die Jetzt-Linie zu sehen ist (entscheidet calendar.js).
 */
export function setTodayActive(active) {
  panel?.actions.querySelector(".cal-today")?.classList.toggle("is-on", active);
}
