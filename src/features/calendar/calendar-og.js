/*
 * Die Teile des Kalenders, die nur die „OG Version“ (Nachbau von Organi7er)
 * braucht: die Zeile mit den drei Knöpfen unter dem Datumsstreifen
 * (CalendarSpanPicker.swift), der Monatstitel und der Knopf „Kalender
 * anpassen“ am Ende der Seite (TabCustomizationButton.swift).
 * Alles hier bleibt in anderen Fassungen unsichtbar — die Regeln stehen in
 * styles/og-calendar.css und gelten nur mit data-mobile-variant="og".
 * Pfad: src/features/calendar/calendar-og.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * labels    -> Beschriftungen der drei Knöpfe und von „Kalender anpassen“
 * spanIcons -> Symbol je Zeitspanne im Menü
 *
 * Aussehen: styles/og-calendar.css, Werte in styles/tokens-og-calendar.css.
 */

import { addDays, dayKey, parseDay } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { calendarSpans } from "../../data/config.js";
import { state, ui } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { isMobileOs } from "../../ui/platform.js";
import { goToday, setMode, setSpan } from "./calendar-nav.js";

const labels = {
  today: "Heute",
  span: "Ansicht",
  toList: "Liste",
  toGrid: "Stundenraster",
  customize: "Kalender anpassen",
};

/* Symbol je Zeitspanne: eine Fläche, zwei Zeilen, ein Gitter (id 0 = ganzer Monat) */
const spanIcons = { 1: "calendar", 2: "layers", 0: "grid" };

/** Ist gerade die „OG Version“ am Handy oder Tablet zu sehen? */
export function isOg() {
  return isMobileOs("ios") && document.documentElement.dataset.mobileVariant === "og";
}

/**
 * Der Monat in der Überschrift: der, aus dem das meiste des sichtbaren
 * Ausschnitts stammt. Im Monatsraster der gewählte Monat, sonst die Mitte der
 * sichtbaren Wochen (bei einer Woche also der Donnerstag).
 */
export function ogMonthTitle(weeks) {
  const selected = parseDay(ui.calendarDay);
  const middle = state.prefs.calendar.span === 0 ? selected : addDays(weeks[0], (weeks.length * 7) / 2);
  return middle.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

/* Die Zeile einmal anlegen, direkt unter dem Streifen im Kopf der Seite. */
function ensureActions() {
  let row = document.querySelector(".og-cal-actions");
  if (row) return row;
  row = document.createElement("div");
  row.className = "og-cal-actions";
  row.innerHTML = `
    <button class="og-cal-circle" type="button" data-og-act="layout"></button>
    <button class="og-cal-pill og-cal-today" type="button" data-og-act="today">${labels.today}</button>
    <button class="og-cal-pill og-cal-span" type="button" data-og-act="span" aria-label="${labels.span}"></button>`;
  dom.calStrip.after(row);
  row.addEventListener("click", onActionClick);
  return row;
}

/* Das Menü der Zeitspanne: jede Zeile mit Haken an der gewählten. */
function openSpanMenu(anchor) {
  openCtxMenu(
    anchor,
    calendarSpans.map((span) => ({
      label: span.label,
      icon: spanIcons[span.id],
      active: span.id === state.prefs.calendar.span,
      onSelect: () => setSpan(span.id),
    }))
  );
}

function onActionClick(event) {
  const button = event.target.closest("[data-og-act]");
  if (!button) return;
  const { ogAct } = button.dataset;
  if (ogAct === "layout") setMode(state.prefs.calendar.mode === "grid" ? "list" : "grid");
  else if (ogAct === "today") goToday();
  else if (ogAct === "span") openSpanMenu(button);
}

/** Die drei Knöpfe auf den Stand bringen — bei jedem Neuzeichnen des Kalenders. */
export function renderOgActions() {
  const row = ensureActions();
  const grid = state.prefs.calendar.mode === "grid";
  const layout = row.querySelector("[data-og-act=layout]");
  /* Der Knopf trägt das Symbol der anderen Ansicht: ein Umschalter zeigt sein Ziel */
  layout.innerHTML = icon(grid ? "list" : "timeline");
  layout.setAttribute("aria-label", grid ? labels.toList : labels.toGrid);
  row.querySelector(".og-cal-today").classList.toggle("is-on", ui.calendarDay === dayKey(new Date()));
  const span = calendarSpans.find((item) => item.id === state.prefs.calendar.span) || calendarSpans[0];
  row.querySelector(".og-cal-span").textContent = span.short;
}

/** Welche Spalte (Aufgaben, Termine, Projekte) gerade gilt — die Farbe der Jetzt-Marke hängt daran. */
export function markOgSegment() {
  document.getElementById("view-calendar")?.setAttribute("data-og-seg", state.prefs.calendar.seg);
}

/**
 * „Kalender anpassen“ am Ende der Fläche. In der Vorlage ein Knopf ohne
 * eigene Aktion; hier öffnet er das Blatt „Ansicht“ (data-view-panel-open),
 * damit er nicht ins Leere läuft.
 */
export function ogCustomizeMarkup() {
  return `<button class="og-cal-customize" type="button" data-view-panel-open>${icon("sliders")}<span>${escapeHtml(labels.customize)}</span></button>`;
}
