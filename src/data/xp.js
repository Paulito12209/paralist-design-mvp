/*
 * Erfahrungspunkte und Stufen. Jedes Anlegen und jedes Erledigen wird
 * protokolliert; daraus entstehen die Level-Anzeige oben links und alle
 * Karten im Fortschritt-Blatt.
 * Pfad: src/data/xp.js
 *
 * ANPASSBARE WERTE: Punkte je Ereignis und Stufen-Schwellen stehen in
 * src/data/config.js (xpKinds[*].amount, levelSteps, levelStep).
 */

import { emit, events } from "../core/bus.js";
import { levelStep, levelSteps, xpKinds } from "./config.js";
import { saveState, state } from "./state.js";

/** Ein Ereignis ins Protokoll schreiben, ohne zu speichern oder neu zu zeichnen. */
export function logXp(kind, item, title, count = 1) {
  state.xpLog.push({
    id: state.nextXpId++,
    ts: Date.now(),
    kind,
    item,
    title: title || "",
    amount: xpKinds[kind].amount * count,
  });
}

/** Ein Ereignis protokollieren, speichern und die Level-Anzeige auffrischen. */
export function awardXp(kind, item, title, count = 1) {
  logXp(kind, item, title, count);
  saveState();
  emit(events.xpChanged);
}

/**
 * Archivierte Aufgaben zählen als erledigt; andere Typen nur als weggeräumt.
 * Die Punkte fürs Erledigen gibt es je Aufgabe nur einmal — wie beim Abhaken
 * (noteDone in src/data/mutations.js). Sonst brächte eine abgehakte und danach
 * archivierte Aufgabe doppelte Punkte und zählte bei „Erledigt“ zweimal.
 */
export function archiveEntry(entry) {
  entry.archived = true;
  if (entry.type === "aufgabe" && !entry.doneAwarded) {
    entry.doneAwarded = true;
    awardXp("done", "aufgabe", entry.title);
  } else saveState();
}

/** Punkte je XP-Art. Unbekannte Arten aus älteren Ständen werden übersprungen. */
export function xpTotals() {
  const totals = { created: 0, done: 0 };
  state.xpLog.forEach((row) => {
    if (!(row.kind in totals)) return;
    totals[row.kind] += row.amount;
  });
  return totals;
}

/** Punkte insgesamt. */
export function totalXp() {
  return state.xpLog.reduce((sum, row) => sum + row.amount, 0);
}

/**
 * Ab wie vielen Punkten eine Stufe beginnt.
 * Stufe 2 ab 300, 3 ab 600, 4 ab 1000; danach wächst der Abstand um je 100.
 */
export function levelThreshold(level) {
  if (level < levelSteps.length) return levelSteps[level];
  let previous = levelSteps[levelSteps.length - 1];
  let step = 400;
  for (let n = levelSteps.length; n <= level; n += 1) {
    step += levelStep;
    previous += step;
  }
  return previous;
}

/** Stufe, ihre Grenzen und der Fortschritt darin (0 bis 1). */
export function levelInfo(xp) {
  let level = 1;
  while (xp >= levelThreshold(level + 1)) level += 1;
  const from = levelThreshold(level);
  const to = levelThreshold(level + 1);
  return { level, from, to, progress: Math.max(0, Math.min(1, (xp - from) / (to - from))) };
}

/** Beschreibung einer XP-Art; unbekannte Arten aus älteren Ständen bleiben grau. */
export function xpKindStyle(kind) {
  return xpKinds[kind] || { label: "Sonstiges", icon: "placeholder", color: "var(--muted)", amount: 0 };
}
