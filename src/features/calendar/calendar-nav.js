/*
 * Blättern im Kalender: eine Woche, ein Monat, zurück zu heute, Zeitraum und
 * Ansicht umstellen.
 * Pfad: src/features/calendar/calendar-nav.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { addDays, dayKey, parseDay } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { saveState, state, ui } from "../../data/state.js";
import { cal } from "./calendar-state.js";

/* Wird von calendar.js gesetzt, damit hier niemand das Zeichnen importieren muss. */
let redraw = () => {};

/** Die Funktion hinterlegen, die den Kalender neu zeichnet. */
export function setRedraw(fn) {
  redraw = fn;
}

/** Einen Monat vor oder zurück; der Tag im Monat bleibt so gut wie möglich erhalten. */
export function shiftMonth(direction) {
  const selected = parseDay(ui.calendarDay);
  const next = new Date(selected.getFullYear(), selected.getMonth() + direction, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(selected.getDate(), lastDay));
  ui.calendarDay = dayKey(next);
  redraw();
}

/** Einen Tag weiterschalten, gemessen in Wochen des sichtbaren Zeitraums. */
export function shiftWeeks(weeks) {
  ui.calendarDay = dayKey(addDays(parseDay(ui.calendarDay), weeks * 7));
  redraw();
}

/** Den ganzen sichtbaren Zeitraum vor oder zurück. */
export function shiftSpan(direction) {
  if (state.prefs.calendar.span === 0) {
    shiftMonth(direction);
    return;
  }
  shiftWeeks(direction * state.prefs.calendar.span);
}

/** Zu einem bestimmten Tag springen (Tagesschlüssel wie „2026-09-17“). */
export function goToDay(key) {
  if (key === ui.calendarDay) return;
  ui.calendarDay = key;
  redraw();
}

/** Zurück zum heutigen Tag. */
export function goToday() {
  ui.calendarDay = dayKey(new Date());
  redraw(true);
}

/** Zeitraum des Streifens umstellen (1 Woche, 2 Wochen, 1 Monat). */
export function setSpan(span) {
  state.prefs.calendar.span = span;
  saveState();
  /* Wird der Kopf höher (mehr Wochen), verankert Chrome den Scrollstand an
     einer Stundenzeile und rollt von selbst um die Kopfhöhe weiter: die Zeile
     bliebe stehen, der höhere Kopf legte sich über die Jetzt-Linie. Der alte
     Scrollstand lässt Kopf und Stunden gemeinsam wandern — der Abstand
     zwischen beiden bleibt, wie er war. */
  const scrollBefore = dom.content.scrollTop;
  redraw();
  dom.content.scrollTop = scrollBefore;
}

/** Zwischen Stundenraster und Liste wechseln. */
export function setMode(mode) {
  state.prefs.calendar.mode = mode;
  saveState();
  /* Beim Umschalten auf das Stundenraster beginnt die Seite wieder ganz oben:
     Titel, Monat, Streifen und die drei Knöpfe sind vollständig zu sehen, die
     Uhrzeit sucht sich das Raster in sich selbst. */
  if (mode === "grid") dom.content.scrollTop = 0;
  redraw(mode === "grid");
}

/** Spalte der Liste wechseln. */
export function setSegment(seg) {
  state.prefs.calendar.seg = seg;
  saveState();
  redraw();
}
