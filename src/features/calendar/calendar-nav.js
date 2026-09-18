/*
 * Blättern im Kalender: eine Woche, ein Monat, zurück zu heute, Zeitraum und
 * Ansicht umstellen.
 * Pfad: src/features/calendar/calendar-nav.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { addDays, dayKey, parseDay } from "../../core/dates.js";
import { saveState, state } from "../../data/state.js";
import { cal } from "./calendar-state.js";

/* Wird von calendar.js gesetzt, damit hier niemand das Zeichnen importieren muss. */
let redraw = () => {};

/** Die Funktion hinterlegen, die den Kalender neu zeichnet. */
export function setRedraw(fn) {
  redraw = fn;
}

/** Einen Monat vor oder zurück; der Tag im Monat bleibt so gut wie möglich erhalten. */
export function shiftMonth(direction) {
  const selected = parseDay(cal.selected);
  const next = new Date(selected.getFullYear(), selected.getMonth() + direction, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(selected.getDate(), lastDay));
  cal.selected = dayKey(next);
  redraw();
}

/** Einen Tag weiterschalten, gemessen in Wochen des sichtbaren Zeitraums. */
export function shiftWeeks(weeks) {
  cal.selected = dayKey(addDays(parseDay(cal.selected), weeks * 7));
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

/** Zurück zum heutigen Tag. */
export function goToday() {
  cal.selected = dayKey(new Date());
  redraw(true);
}

/** Zeitraum des Streifens umstellen (1 Woche, 2 Wochen, 1 Monat). */
export function setSpan(span) {
  state.prefs.calendar.span = span;
  saveState();
  redraw();
}

/** Zwischen Stundenraster und Liste wechseln. */
export function setMode(mode) {
  state.prefs.calendar.mode = mode;
  saveState();
  redraw(mode === "grid");
}

/** Spalte der Liste wechseln. */
export function setSegment(seg) {
  state.prefs.calendar.seg = seg;
  saveState();
  redraw();
}
