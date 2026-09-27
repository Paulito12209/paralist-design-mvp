/*
 * Kalenderwochen im Text: aus „KW 40“ wird „KW 40 (28.09. – 04.10.)“.
 * Steht ein Jahr dahinter („KW 40 2027“, „KW 40 '27“, „KW40/27“), gelten die
 * Tage dieses Jahres. Ohne Jahr nimmt die Rechnung die Woche, die heute am
 * nächsten liegt — im Herbst ist „KW 2“ also schon die im Januar danach.
 * Eine vorhandene Klammer wird nur ersetzt, wenn Woche oder Jahr nicht mehr
 * zu ihr passen; so springt ein alter Titel nicht still ins neue Jahr.
 * Pfad: src/core/week-range.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * RANGE_DASH       -> Strich zwischen erstem und letztem Tag der Woche
 * KEEP_YEARS_AROUND -> so viele Jahre vor und nach heute gilt eine vorhandene
 *                      Klammer ohne Jahresangabe noch als „passt schon“
 */

import { addDays, pad2 } from "./dates.js";

const RANGE_DASH = " – ";
const KEEP_YEARS_AROUND = 3;

/* „KW“, die Wochennummer und — mit oder ohne Trennzeichen — ein Jahr. Ein bis
   vier Ziffern als Jahr, damit halb getippte Jahre („KW 40 2“) den Ausdruck
   nicht zerreißen; zählen tun aber nur zwei oder vier Ziffern. */
const WEEK_TOKEN = /\bKW\s*(\d{1,2})(?!\d)(?:\s*[/.,-]?\s*('?\d{1,4})(?![\d.]))?/gi;

/* Eine schon eingesetzte Klammer mit Tagen, z.B. „(28.09. – 04.10.)“ */
const RANGE = /\s*\(\d{1,2}\.\d{1,2}\.(?:\d{2,4})?\s*[–-]\s*\d{1,2}\.\d{1,2}\.(?:\d{2,4})?\)/;

/* Montag der ISO-Woche 1: die Woche mit dem 4. Januar. */
function weekOneMonday(year) {
  const jan4 = new Date(year, 0, 4);
  return addDays(jan4, -((jan4.getDay() + 6) % 7));
}

/* Montag der gewünschten Woche, oder null, wenn das Jahr so viele Wochen nicht hat. */
function mondayOf(week, year) {
  if (week < 1) return null;
  const monday = addDays(weekOneMonday(year), (week - 1) * 7);
  return monday < weekOneMonday(year + 1) ? monday : null;
}

/* Getipptes Jahr → volle Jahreszahl; halb getippt oder leer → null. */
function typedYear(raw) {
  const digits = (raw || "").replace("'", "");
  if (digits.length === 4) return Number(digits);
  if (digits.length === 2) return 2000 + Number(digits);
  return null;
}

/* Tage einer Woche als Text; über den Jahreswechsel mit Jahreszahlen. */
function rangeText(monday) {
  const sunday = addDays(monday, 6);
  const crosses = monday.getFullYear() !== sunday.getFullYear();
  const day = (date) => `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${crosses ? date.getFullYear() : ""}`;
  return `(${day(monday)}${RANGE_DASH}${day(sunday)})`;
}

/* Ohne Jahr: die Woche mit dieser Nummer, die heute am nächsten liegt. */
function nearestMonday(week, today) {
  const year = today.getFullYear();
  const candidates = [year - 1, year, year + 1].map((y) => mondayOf(week, y)).filter(Boolean);
  const distance = (monday) => Math.abs(monday - today);
  return candidates.sort((a, b) => distance(a) - distance(b))[0] || null;
}

/* Passt eine vorhandene Klammer zu dieser Woche in einem Jahr rund um heute? */
function fitsSomeYear(week, bracket, today) {
  const year = today.getFullYear();
  for (let y = year - KEEP_YEARS_AROUND; y <= year + KEEP_YEARS_AROUND; y += 1) {
    const monday = mondayOf(week, y);
    if (monday && rangeText(monday) === bracket) return true;
  }
  return false;
}

/* Die gewünschte Klammer für einen Treffer, oder null bei unmöglicher Woche. */
function wantedRange(week, year, oldBracket, today) {
  if (year !== null) {
    const monday = mondayOf(week, year);
    return monday ? rangeText(monday) : null;
  }
  if (oldBracket && fitsSomeYear(week, oldBracket, today)) return oldBracket;
  const monday = nearestMonday(week, today);
  return monday ? rangeText(monday) : null;
}

/**
 * Hinter jede „KW nn“ im Text die Tage der Woche schreiben oder sie anpassen.
 * `caret` ist die Stelle der Schreibmarke; zurück kommen der neue Text und
 * die verschobene Schreibmarke. Direkt eingefügte Klammern landen hinter der
 * Schreibmarke, damit man an der Wochennummer weitertippen kann.
 */
export function fillWeekRanges(text, caret = text.length, today = new Date()) {
  const tokens = [...String(text).matchAll(WEEK_TOKEN)];
  let result = text;
  let newCaret = caret;
  /* Von hinten nach vorn ändern, damit die Stellen weiter vorn gültig bleiben. */
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    const tokenEnd = token.index + token[0].length;
    const nextStart = i + 1 < tokens.length ? tokens[i + 1].index : text.length;
    /* Die Klammer darf ein Stück weiter hinten stehen („KW 40 Plan (…)“),
       aber nicht hinter der nächsten KW und nicht in der nächsten Zeile. */
    const tail = text.slice(tokenEnd, nextStart).split("\n")[0];
    const found = tail.match(RANGE);
    const oldBracket = found ? found[0].trim() : null;
    const wanted = wantedRange(Number(token[1]), typedYear(token[2]), oldBracket, today);
    if (!wanted || wanted === oldBracket) continue;

    const start = found ? tokenEnd + found.index + found[0].indexOf("(") : tokenEnd;
    const end = found ? start + oldBracket.length : tokenEnd;
    const insert = found ? wanted : ` ${wanted}`;
    result = result.slice(0, start) + insert + result.slice(end);
    if (newCaret >= end && newCaret > start) newCaret += insert.length - (end - start);
    else if (newCaret > start) newCaret = start;
  }
  return { text: result, caret: newCaret };
}
