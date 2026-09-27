/*
 * Meilensteine: aus den Zahlen der Kategorien (src/data/milestone-tracks.js)
 * werden erreichte Stufen. Eine einmal erreichte Stufe bleibt — auch wenn man
 * später Seiten löscht oder die Serie reißt. Dafür merkt sich die App je
 * Kategorie die höchste Zahl und wann jede Stufe erreicht wurde.
 * Gespeichert als { aufgaben: { best: 37, at: [ts, ts], seen: 2 } }.
 * Pfad: src/data/milestones.js
 *
 * Keine anpassbaren Werte: Namen, Schwellen und Farben stehen in
 * src/data/milestone-tracks.js.
 */

import { readJson, storageKeys, writeJson } from "../core/storage.js";
import { lockedName, milestoneTiers, milestoneTracks } from "./milestone-tracks.js";

let saved = null;

/* Erst beim ersten Gebrauch einlesen — die Startseite braucht die Abzeichen nicht. */
function records() {
  if (saved) return saved;
  const raw = readJson(storageKeys.milestones, {});
  saved = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return saved;
}

function recordOf(id) {
  const all = records();
  const record = all[id] && typeof all[id] === "object" ? all[id] : {};
  record.best = Number.isFinite(record.best) ? record.best : 0;
  record.at = Array.isArray(record.at) ? record.at : [];
  record.seen = Number.isFinite(record.seen) ? record.seen : 0;
  all[id] = record;
  return record;
}

/* Wie viele Stufen eine Zahl erreicht (0 = noch keine). */
function tierOf(value, steps) {
  return steps.filter((step) => value >= step).length;
}

/**
 * Alle Kategorien mit ihrem Stand. Neue Bestwerte und neu erreichte Stufen
 * werden dabei gleich gemerkt.
 * Je Kategorie: { track, value, tier, tierName, from, to, progress, at, fresh }.
 * `fresh` heißt: seit dem letzten Ansehen dazugekommen.
 */
export function milestoneStatus() {
  let changed = false;
  const now = Date.now();
  const list = milestoneTracks.map((track) => {
    const record = recordOf(track.id);
    const value = Math.max(record.best, track.count());
    if (value !== record.best) {
      record.best = value;
      changed = true;
    }
    const tier = tierOf(value, track.steps);
    for (let index = 0; index < tier; index += 1) {
      if (record.at[index]) continue;
      record.at[index] = now;
      changed = true;
    }
    const maxed = tier >= track.steps.length;
    const from = tier ? track.steps[tier - 1] : 0;
    const to = maxed ? from : track.steps[tier];
    return {
      track,
      value,
      tier,
      tierName: tier ? milestoneTiers[tier - 1] : lockedName,
      from,
      to,
      maxed,
      progress: maxed ? 1 : Math.max(0, Math.min(1, value / to)),
      at: record.at.slice(),
      fresh: tier > record.seen,
    };
  });
  if (changed) writeJson(storageKeys.milestones, records());
  return list;
}

/** Alle erreichten Stufen gelten als gesehen — die Markierung „Neu“ verschwindet beim nächsten Öffnen. */
export function markMilestonesSeen(list) {
  let changed = false;
  list.forEach((item) => {
    const record = recordOf(item.track.id);
    if (record.seen === item.tier) return;
    record.seen = item.tier;
    changed = true;
  });
  if (changed) writeJson(storageKeys.milestones, records());
}

/** Wie viele Stufen es insgesamt gibt und wie viele erreicht sind. */
export function milestoneTotals(list) {
  const reached = list.reduce((sum, item) => sum + item.tier, 0);
  const all = list.reduce((sum, item) => sum + item.track.steps.length, 0);
  return { reached, all };
}

/**
 * Die nächste Stufe, die am nächsten liegt (größter Anteil geschafft) — für
 * den Satz „Als Nächstes“. Null, wenn alles erreicht ist.
 */
export function nextMilestone(list) {
  const open = list.filter((item) => !item.maxed);
  if (!open.length) return null;
  return open.reduce((best, item) => (item.progress > best.progress ? item : best));
}
