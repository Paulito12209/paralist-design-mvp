/*
 * Nutzungszeit — nur echte, gemessene Zeit, keine Beispielwerte.
 * Gespeichert wird { v, since, days: { "2026-09-18": 2400 },
 * areas: { "2026-09-18": { notiz: 1200, … } }, entries: { "12": 340 } } in
 * Sekunden. `entries` ist die Zeit auf der Seite eines einzelnen Eintrags
 * (Details am Ende der Seite, src/data/entry-facts.js); welcher gerade offen
 * ist, meldet src/shell/lifecycle.js über setUsageEntry().
 * Gezählt wird nur, solange die App sichtbar ist; lange Pausen zählen nicht mit.
 * Wann gezählt und geschrieben wird, entscheidet src/shell/lifecycle.js,
 * welcher Bereich gerade offen ist, meldet es über setUsageArea().
 * Pfad: src/data/usage.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxTickGap    -> längste Pause, die noch als Nutzung zählt (Sekunden)
 * formatVersion -> Stand des Speicherformats; ältere Stände werden verworfen
 */

import { dayKey, dayShift, parseDay, startOfDay } from "../core/dates.js";
import { readJson, storageKeys, writeJson } from "../core/storage.js";
import { fallbackArea } from "./usage-areas.js";

const maxTickGap = 60;
const formatVersion = 2;

let usage = freshUsage();
let area = fallbackArea;
/* Der offene Eintrag als Text-Schlüssel, oder null, wenn keiner offen ist. */
let openEntry = null;
let lastTickAt = Date.now();
let unsaved = false;

function freshUsage() {
  return { v: formatVersion, since: dayKey(new Date()), days: {}, areas: {}, entries: {} };
}

/** Tagesschlüssel eines Zeitpunkts, wie im Kalender. */
function keyOf(ts) {
  return dayKey(new Date(ts));
}

/** Nutzungszeit eines Tages in Sekunden. */
export function usageOfDay(ts) {
  return usage.days[keyOf(ts)] || 0;
}

/** Alle gespeicherten Tage als Schlüssel-Liste. */
export function usageDays() {
  return Object.keys(usage.days);
}

/** Beginn der Aufzeichnung als Tagesanfang (ms) — davor gibt es keine Werte. */
export function usageSince() {
  return parseDay(usage.since).getTime();
}

/**
 * Zeit je Bereich über die letzten `days` Tage (heute eingeschlossen),
 * absteigend sortiert: [{ area, seconds }].
 */
export function usageByArea(days) {
  const from = dayShift(startOfDay(Date.now()), -(days - 1));
  const totals = {};
  Object.entries(usage.areas).forEach(([key, split]) => {
    if (parseDay(key).getTime() < from) return;
    Object.entries(split).forEach(([name, seconds]) => {
      totals[name] = (totals[name] || 0) + seconds;
    });
  });
  return Object.entries(totals)
    .map(([name, seconds]) => ({ area: name, seconds }))
    .filter((row) => row.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);
}

function saveUsage() {
  writeJson(storageKeys.usage, usage);
  unsaved = false;
}

/*
 * Beim Start einlesen. Der alte Stand war ein flaches { Tag: Sekunden } und
 * enthielt ausgedachte Beispieltage — echte und erfundene Werte lassen sich
 * darin nicht trennen, deshalb beginnt die Aufzeichnung dann neu.
 */
export function loadUsage() {
  const saved = readJson(storageKeys.usage);
  if (saved && saved.v === formatVersion && saved.days && saved.areas) {
    usage = saved;
    /* Die Zeit je Eintrag kam später dazu: ältere Stände beginnen dort bei null */
    if (!usage.entries) usage.entries = {};
    return;
  }
  usage = freshUsage();
  saveUsage();
}

/** Die Zeit seit dem letzten Aufruf dem heutigen Tag und dem offenen Bereich zuschlagen. */
export function trackUsage() {
  const now = Date.now();
  const spent = Math.min(maxTickGap, Math.round((now - lastTickAt) / 1000));
  lastTickAt = now;
  if (document.hidden || spent <= 0) return;
  const key = keyOf(now);
  usage.days[key] = (usage.days[key] || 0) + spent;
  const split = usage.areas[key] || (usage.areas[key] = {});
  split[area] = (split[area] || 0) + spent;
  if (openEntry) usage.entries[openEntry] = (usage.entries[openEntry] || 0) + spent;
  unsaved = true;
}

/**
 * Den offenen Eintrag wechseln (null: keiner). Wie beim Bereich gehört die
 * bis jetzt gelaufene Zeit noch dem alten — von einer Notiz zur nächsten
 * wechselt der Bereich nicht, deshalb bucht auch diese Stelle vorher.
 */
export function setUsageEntry(id) {
  const next = id == null ? null : String(id);
  if (next === openEntry) return;
  trackUsage();
  openEntry = next;
}

/** Gemessene Zeit auf der Seite eines Eintrags in Sekunden (seit es die Messung gibt). */
export function entryUsage(id) {
  trackUsage();
  return usage.entries[String(id)] || 0;
}

/**
 * Den offenen Bereich wechseln. Die bis jetzt gelaufene Zeit gehört noch dem
 * alten Bereich, deshalb wird vorher gebucht.
 */
export function setUsageArea(next) {
  if (next === area) return;
  trackUsage();
  area = next;
}

/** Gezählte Zeit wegschreiben, wenn sich etwas geändert hat. */
export function flushUsage() {
  if (unsaved) saveUsage();
}

/**
 * Serie: jeder Tag mit Nutzungszeit zählt. Läuft heute noch nichts,
 * beginnt die laufende Serie bei gestern, damit sie nicht vorzeitig reißt.
 */
export function usageStreaks() {
  const active = new Set(Object.keys(usage.days).filter((key) => usage.days[key] > 0));
  const today = startOfDay(Date.now());
  let current = 0;
  let cursor = active.has(keyOf(today)) ? today : dayShift(today, -1);
  while (active.has(keyOf(cursor))) {
    current += 1;
    cursor = dayShift(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous = null;
  [...active].sort().forEach((key) => {
    const ts = parseDay(key).getTime();
    run = previous !== null && Math.round((ts - previous) / 86400000) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = ts;
  });
  return { current, longest };
}

/** Den Zählpunkt auf jetzt setzen — nach einer Pause im Hintergrund. */
export function resetUsageTick() {
  lastTickAt = Date.now();
}
