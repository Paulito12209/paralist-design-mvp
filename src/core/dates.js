/*
 * Rechnen mit Tagen. Tage werden als Text „JJJJ-MM-TT“ gemerkt, damit
 * Vergleiche ohne Zeitzonen-Ärger klappen.
 * Pfad: src/core/dates.js
 *
 * Keine anpassbaren visuellen Werte.
 */

export const MS_PER_DAY = 86400000;

/** Einstellige Zahlen mit führender Null, z.B. 7 → „07“. */
export function pad2(value) {
  return String(value).padStart(2, "0");
}

/** Tagesschlüssel eines Datums, z.B. „2026-09-18“. */
export function dayKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Aus „2026-09-18“ wird wieder ein Datum (Ortszeit, 00:00 Uhr). */
export function parseDay(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Uhrzeit eines Zeitpunkts als „HH:MM“. */
export function timeKey(ts) {
  const date = new Date(ts);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Datum um ganze Tage verschieben. */
export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Zeitpunkt auf 00:00 Uhr desselben Tages zurücksetzen. */
export function startOfDay(ts) {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Tagesbeginn um ganze Tage verschieben. Über `addDays` statt über Millisekunden,
 * damit die Umstellung auf Sommer- und Winterzeit nicht verrutscht.
 */
export function dayShift(ts, days) {
  const date = addDays(new Date(ts), days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Montag der Woche, in der das Datum liegt. */
export function startOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/** Kalenderwoche nach ISO 8601 (die Woche mit dem ersten Donnerstag des Jahres ist Woche 1). */
export function isoWeek(date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc - yearStart) / MS_PER_DAY + 1) / 7);
}

/** Liegen zwei Zeitpunkte am selben Kalendertag? */
export function sameDay(a, b) {
  return startOfDay(a) === startOfDay(b);
}
