/*
 * Kennzahlen für die Desktop-Fassung: die Zahlenreihe oben auf der Übersicht,
 * das Punkteband der letzten Wochen, der Termin, der als Nächstes kommt, die
 * dringendsten Aufgaben und was zuletzt geöffnet wurde. Diese Datei liest nur —
 * sie ändert nichts und fasst die Seite nicht an.
 * Pfad: src/data/insights.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * weekDays      -> wie viele Tage „diese Woche“ umfasst (Erledigt, Punkte) und wie
 *                  weit „Als Nächstes“ nach einem Termin sucht
 * activityLevels -> Punkte, ab denen ein Tag im Punkteband eine Stufe heller
 *                  wird; vier Grenzen = fünf Stufen von „nichts“ bis „viel“
 * allDayUntil   -> bis wann ein Termin ohne Uhrzeit als „kommt noch“ gilt
 *                  (Millisekunden nach Mitternacht: kurz vor Tagesende)
 */

import { MS_PER_DAY, dayKey, dayShift, parseDay, startOfDay } from "../core/dates.js";
import { isTaskDone } from "./config.js";
import { entriesOfDay, entryTime, findEntry, inboxEntries, sortTasks, taskEntries } from "./queries.js";
import { state } from "./state.js";
import { usageOfDay } from "./usage.js";
import { levelInfo, totalXp } from "./xp.js";

export const weekDays = 7;
const activityLevels = [1, 4, 8, 14];
const allDayUntil = MS_PER_DAY - 1000;

/** Zeitpunkt, ab dem „die letzten `days` Tage“ zählen — Mitternacht vor `days - 1` Tagen. */
function sinceDays(days) {
  return dayShift(startOfDay(Date.now()), -(days - 1));
}

/** Aktivitätsstufe 0–4 aus den Punkten eines Tages, für das Punkteband. */
function levelOf(xp) {
  return activityLevels.filter((limit) => xp >= limit).length;
}

/**
 * Die vier großen Zahlen oben auf der Übersicht.
 * entries   -> sichtbare Einträge insgesamt
 * openTasks -> Aufgaben, die noch nicht erledigt sind
 * today     -> Termine von heute
 * doneWeek  -> in den letzten sieben Tagen erledigte Aufgaben
 */
export function deskStats() {
  const since = sinceDays(weekDays);
  const todayKey = dayKey(new Date());
  return {
    entries: state.entries.filter((entry) => !entry.archived).length,
    openTasks: taskEntries().filter((entry) => !isTaskDone(entry)).length,
    today: entriesOfDay(todayKey).filter((entry) => entry.type === "termin").length,
    doneWeek: state.xpLog.filter((row) => row.kind === "done" && row.ts >= since).length,
  };
}

/**
 * Punkte je Tag der letzten `days` Tage, der älteste zuerst:
 * [{ key, ts, xp, level }] — `level` ist 0 (nichts) bis 4 (viel).
 */
export function xpByDay(days) {
  const since = sinceDays(days);
  const sums = new Map();
  state.xpLog.forEach((row) => {
    if (row.ts < since) return;
    const key = dayKey(new Date(row.ts));
    sums.set(key, (sums.get(key) || 0) + row.amount);
  });
  return Array.from({ length: days }, (_, index) => {
    const ts = dayShift(since, index);
    const key = dayKey(new Date(ts));
    const xp = sums.get(key) || 0;
    return { key, ts, xp, level: levelOf(xp) };
  });
}

/** Punkte der letzten sieben Tage zusammen. */
export function xpThisWeek() {
  return xpByDay(weekDays).reduce((sum, day) => sum + day.xp, 0);
}

/** Nutzungszeit je Tag der letzten `days` Tage in Sekunden, der älteste zuerst: [{ key, ts, seconds }]. */
export function usageByDay(days) {
  const since = sinceDays(days);
  return Array.from({ length: days }, (_, index) => {
    const ts = dayShift(since, index);
    return { key: dayKey(new Date(ts)), ts, seconds: usageOfDay(ts) };
  });
}

/** Stufe mit Fortschritt und den Punkten, die bis zur nächsten fehlen. */
export function levelSummary() {
  const xp = totalXp();
  const info = levelInfo(xp);
  return { ...info, xp, missing: Math.max(0, info.to - xp) };
}

/** Termine eines Tages nach Uhrzeit: [{ entry, time }] — ohne Uhrzeit ganz oben. */
export function eventsOfDay(key) {
  return entriesOfDay(key)
    .filter((entry) => entry.type === "termin")
    .map((entry) => ({ entry, time: entryTime(entry) }))
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}

/**
 * Der nächste Termin ab jetzt, heute oder an einem der folgenden `days` Tage:
 * { entry, key, time, ts } oder `null`. `ts` ist der Zeitpunkt des Beginns.
 */
export function nextEvent(days = weekDays) {
  const now = Date.now();
  for (let offset = 0; offset <= days; offset += 1) {
    const key = dayKey(new Date(dayShift(startOfDay(now), offset)));
    /* Nach Zeitpunkt wählen, nicht nach Listenplatz: ein Termin ohne Uhrzeit
       steht in der Liste oben, beginnt aber erst am Ende des Tages. */
    const found = eventsOfDay(key)
      .map(({ entry, time }) => ({ entry, key, time, ts: eventStart(key, time) }))
      .filter((item) => item.ts >= now)
      .sort((a, b) => a.ts - b.ts)[0];
    if (found) return found;
  }
  return null;
}

/** Beginn eines Termins als Zeitpunkt; ohne Uhrzeit zählt das Ende des Tages, damit er „heute noch“ kommt. */
export function eventStart(key, time) {
  const day = parseDay(key);
  if (!time) return day.getTime() + allDayUntil;
  const [hours, minutes] = time.split(":").map(Number);
  day.setHours(hours || 0, minutes || 0, 0, 0);
  return day.getTime();
}

/** Die dringendsten offenen Aufgaben, nach Priorität: höchstens `limit` Stück. */
export function focusTasks(limit) {
  const open = taskEntries().filter((entry) => !isTaskDone(entry));
  return sortTasks(open, "prio").slice(0, limit);
}

/** Zuletzt geöffnete Einträge, der jüngste zuerst: [{ entry, ts }] — höchstens `limit` Stück. */
export function recentEntries(limit) {
  return state.opens
    .filter((item) => item.kind === "entry")
    .sort((a, b) => b.ts - a.ts)
    .map((item) => ({ entry: findEntry(item.id), ts: item.ts }))
    .filter((item) => item.entry && !item.entry.archived)
    .slice(0, limit);
}

/** Die neuesten Einträge im Eingang, der jüngste zuerst: höchstens `limit` Stück. */
export function newestInbox(limit) {
  return [...inboxEntries()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, limit);
}
