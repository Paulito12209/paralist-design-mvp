/*
 * Was die Karte „Details“ auf der Seite eines Arbeitsbereichs zeigt
 * (Blatt in src/ui/details-sheet.js) und dieselbe Karte in der
 * rechten Spalte am Desktop (src/features/overview/workspace-rail.js). Gleich
 * aufgebaut wie die Karte eines Eintrags (src/data/entry-facts.js): oben drei
 * Kennzahlen, darunter Abschnitte; fehlt ein Wert, fällt die Zeile weg.
 *
 * Oben nach derselben Regel wie bei den Einträgen: links wie viel darin liegt
 * („Einträge“ — ein Tipp wechselt zur Pille „Verknüpfte Einträge“), in der
 * Mitte die Erinnerung, rechts wie frisch er ist („Geändert“: der Text des
 * Arbeitsbereichs oder ein Eintrag darin, je nachdem, was zuletzt war).
 * Pfad: src/data/workspace-facts.js
 *
 * Keine anpassbaren Werte: Reihenfolge der Arten unter „Inhalt“ und ihre
 * Namen stehen in src/data/config.js (typeOrder, typePlurals).
 */

import { dayClock, formatNumber, relativeTime } from "../core/format.js";
import { typeOrder, typePlurals } from "./config.js";
import { isTaskDone } from "./config-tasks.js";
import { freshness, remindStat } from "./entry-stats.js";
import { openStats } from "./opens.js";
import { entriesOf } from "./queries.js";
import { workspaceRef } from "./refs.js";
import { hasReminder } from "./reminders.js";
import { state } from "./state.js";

/* Der letzte Zeitpunkt, an dem sich im Arbeitsbereich etwas getan hat */
function lastChange(workspace, entries) {
  const stamps = entries.map((entry) => entry.editedAt || entry.createdAt || 0);
  stamps.push(workspace.editedAt || 0, workspace.createdAt || 0);
  const latest = Math.max(...stamps);
  return latest > 0 ? latest : null;
}

/* Abschnitt „Inhalt“: wie viel von jeder Art darin liegt, dazu die offenen Aufgaben */
function contentRows(entries) {
  const rows = typeOrder
    .map((type) => ({ type, count: entries.filter((entry) => entry.type === type).length }))
    .filter((item) => item.count)
    .map((item) => ({ label: typePlurals[item.type], value: formatNumber(item.count) }));
  const tasks = entries.filter((entry) => entry.type === "aufgabe");
  if (tasks.length) rows.push({ label: "Offene Aufgaben", value: formatNumber(tasks.filter((task) => !isTaskDone(task)).length) });
  return rows;
}

/* Abschnitt „Nutzung“: wie oft er geöffnet wurde und wann davor */
function usageRows(workspace) {
  const opens = openStats("workspace", workspace.id);
  if (!opens) return [];
  const rows = [{ label: "Aufrufe", value: opens.count === 1 ? "1-mal" : `${formatNumber(opens.count)}-mal` }];
  if (opens.prev) rows.push({ label: "Aufruf davor", value: relativeTime(opens.prev) });
  return rows;
}

/* Abschnitt „Ablage“: wo er liegt, wie viel Text er hat, ob er Favorit ist */
function placeRows(workspace) {
  const tab = state.tabs.find((item) => String(item.id) === String(workspace.tab));
  const rows = [
    { label: "Typ", value: "Arbeitsbereich" },
    { label: "Speicherort", value: tab ? `Arbeitsbereiche · ${tab.name}` : "Arbeitsbereiche" },
  ];
  const chars = (workspace.body || "").trim().length;
  if (chars) rows.push({ label: "Zeichen", value: formatNumber(chars) });
  if (workspace.favorite) rows.push({ label: "Favorit", value: "Ja" });
  return rows;
}

/**
 * Alles für die Karte „Details“ eines Arbeitsbereichs.
 * @returns { stats: [{ value, label, color?, field? }] (immer drei),
 *            groups: [{ heading, rows: [{ label, value, edit? }] }] (leere fallen weg) }
 */
export function workspaceFacts(workspace) {
  const entries = entriesOf(workspaceRef(workspace.id));
  const changed = lastChange(workspace, entries);
  const stats = [
    { value: formatNumber(entries.length), label: entries.length === 1 ? "Eintrag" : "Einträge", field: "entries" },
    remindStat(workspace),
    { value: changed ? freshness(changed) : "—", label: "Geändert" },
  ];
  /* Gesetzt wird die Erinnerung oben; hier steht sie mit Uhrzeit und lässt sich wegnehmen */
  const time = hasReminder(workspace) ? [{ label: "Erinnerung", value: dayClock(workspace.remindAt), edit: "remind" }] : [];
  const groups = [
    { heading: "Zeit", rows: time },
    { heading: "Inhalt", rows: contentRows(entries) },
    { heading: "Nutzung", rows: usageRows(workspace) },
    { heading: "Verlauf", rows: workspace.createdAt ? [{ label: "Erstellt", value: relativeTime(workspace.createdAt) }] : [] },
    { heading: "Ablage", rows: placeRows(workspace) },
  ].filter((group) => group.rows.length);
  return { stats, groups };
}
