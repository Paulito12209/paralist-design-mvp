/*
 * Zahlen, Zeiten und Datumsangaben in deutscher Schreibweise.
 * Pfad: src/core/format.js
 *
 * Keine anpassbaren visuellen Werte.
 *
 * Achtung bei Dauer-Angaben: es gibt zwei Schreibweisen und sie dürfen nicht
 * verwechselt werden — `formatSpan` für Nutzungszeiten („1 Std 20 Min“),
 * `formatClock` für die Länge eines Videos oder einer Aufnahme („1:20“).
 */

import { MS_PER_DAY, pad2, parseDay, sameDay, startOfDay } from "./dates.js";

/* Formatierer einmal anlegen: sie sind teuer zu erzeugen und werden oft gebraucht. */
const numberFormat = new Intl.NumberFormat("de-DE");
const weekdayShort = new Intl.DateTimeFormat("de-DE", { weekday: "short" });
const dayMonthShort = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });
const weekdayDayMonth = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "long" });
const monthYear = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
const clockTime = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });
const shortDate = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
const longWeekdayDate = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" });
const fullDate = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Tausenderpunkte, z.B. 1234 → „1.234“. */
export function formatNumber(value) {
  return numberFormat.format(value);
}

/** Zeitspanne in Worten, z.B. 4800 Sekunden → „1 Std 20 Min“. Für Nutzungszeiten. */
export function formatSpan(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} Std ${rest} Min` : `${hours} Std`;
}

/** Dauer wie auf einem Player, z.B. 80 Sekunden → „1:20“. Für Videos und Aufnahmen. */
export function formatClock(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${pad2(total % 60)}`;
}

/** Kurze Achsenbeschriftung: volle Stunden als Stunden, sonst Minuten. */
export function formatAxisSpan(minutes) {
  if (!minutes) return "0";
  if (minutes % 60 === 0) return `${minutes / 60} Std`;
  return `${minutes} Min`;
}

/** Wochentag oder Datum je Zeitraum — für die Achsen der Verlaufsdiagramme. */
export function axisDateFormat(days) {
  return days <= 7 ? weekdayShort : dayMonthShort;
}

/** Überschrift einer Tagesgruppe im Fortschritt, z.B. „Heute“ oder „Sa 13. September“. */
export function activityDayHeading(ts) {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  if (day === today) return "Heute";
  if (day === today - MS_PER_DAY) return "Gestern";
  return weekdayDayMonth.format(new Date(ts)).replace(",", "");
}

/** Überschrift einer Tagesgruppe in der Suche, z.B. „Heute“ oder „Samstag, 13.09.“. */
export function historyDayHeading(ts) {
  const now = Date.now();
  if (sameDay(ts, now)) return "Heute";
  if (sameDay(ts, now - MS_PER_DAY)) return "Gestern";
  return longWeekdayDate.format(new Date(ts));
}

/** Uhrzeit bei heute, sonst Tag und Monat — die knappe Angabe rechts in Such-Zeilen. */
export function shortOpenTime(ts) {
  const date = new Date(ts);
  return sameDay(ts, Date.now()) ? clockTime.format(date) : shortDate.format(date);
}

/** Monatsüberschrift über einem Block, z.B. „September 2026“. */
export function monthHeading(ts) {
  if (!ts) return "Älter";
  return monthYear.format(new Date(ts));
}

/** Ausgeschriebenes Datum für Vorlesehilfen und den leeren Kalendertag. */
export function longDate(key) {
  return fullDate.format(parseDay(key));
}

/**
 * Teilt eine bereits sortierte Liste in Monatsblöcke: [{ heading, items }].
 * Die Reihenfolge der Liste bleibt erhalten.
 */
export function groupByMonth(list) {
  const groups = [];
  list.forEach((entry) => {
    const heading = monthHeading(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(entry);
    else groups.push({ heading, items: [entry] });
  });
  return groups;
}
