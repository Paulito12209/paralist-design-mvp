/*
 * Nutzungszeit je Tag in Sekunden: { "2026-09-18": 2400 }.
 * Gezählt wird nur, solange die App sichtbar ist; lange Pausen zählen nicht mit.
 * Pfad: src/data/usage.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tickSeconds   -> wie oft die Zeit fortgeschrieben wird (Sekunden)
 * maxTickGap    -> längste Pause, die noch als Nutzung zählt (Sekunden)
 * seedDays      -> wie viele Tage Beispieldaten der erste Start anlegt
 */

import { dayKey, dayShift, parseDay, startOfDay } from "../core/dates.js";
import { readJson, storageKeys, writeJson } from "../core/storage.js";

const tickSeconds = 15;
const maxTickGap = 60;
const seedDays = 250;

let usage = {};
let lastTickAt = Date.now();
let unsaved = false;

/** Tagesschlüssel eines Zeitpunkts, wie im Kalender. */
function keyOf(ts) {
  return dayKey(new Date(ts));
}

/** Nutzungszeit eines Tages in Sekunden. */
export function usageOfDay(ts) {
  return usage[keyOf(ts)] || 0;
}

/** Alle gespeicherten Tage als Schlüssel-Liste. */
export function usageDays() {
  return Object.keys(usage);
}

function saveUsage() {
  writeJson(storageKeys.usage, usage);
  unsaved = false;
}

/**
 * Beispielwerte für den ersten Start, damit Verlauf und Raster nicht leer sind.
 * Fester Startwert, damit auf jedem Gerät dieselbe Beispielkurve entsteht.
 */
function seedUsage() {
  let seed = 20250619;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const today = startOfDay(Date.now());
  for (let back = seedDays; back >= 0; back -= 1) {
    const ts = dayShift(today, -back);
    const weekday = new Date(ts).getDay();
    const chance = weekday === 0 || weekday === 6 ? 0.32 : 0.7;
    if (random() > chance) continue;
    usage[keyOf(ts)] = Math.round((10 + random() * 75) * 60);
  }
  const todayKey = keyOf(Date.now());
  usage[todayKey] = Math.max(usage[todayKey] || 0, 14 * 60);
}

/** Beim Start einlesen; ohne gespeicherte Werte entstehen die Beispieldaten. */
export function loadUsage() {
  const saved = readJson(storageKeys.usage);
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    usage = saved;
    return;
  }
  seedUsage();
  saveUsage();
}

/** Die Zeit seit dem letzten Aufruf dem heutigen Tag zuschlagen. */
export function trackUsage() {
  const now = Date.now();
  const spent = Math.min(maxTickGap, Math.round((now - lastTickAt) / 1000));
  lastTickAt = now;
  if (document.hidden || spent <= 0) return;
  const key = keyOf(now);
  usage[key] = (usage[key] || 0) + spent;
  unsaved = true;
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
  const active = new Set(Object.keys(usage).filter((key) => usage[key] > 0));
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

/**
 * Zählung starten. Geschrieben wird nur beim Wechsel in den Hintergrund
 * und beim Schließen — nicht bei jedem Zählschritt.
 */
export function startUsageTracking() {
  setInterval(trackUsage, tickSeconds * 1000);
  document.addEventListener("visibilitychange", () => {
    trackUsage();
    flushUsage();
    lastTickAt = Date.now();
  });
  window.addEventListener("pagehide", () => {
    trackUsage();
    flushUsage();
  });
}
