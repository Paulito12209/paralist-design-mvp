/*
 * Die Regel für erledigte Aufgaben: eine erledigte Aufgabe bleibt den ganzen
 * Tag, an dem sie erledigt wurde, in allen Listen stehen (ausgegraut, auf der
 * Aufgaben-Seite ganz unten). Ab 00:00 Uhr des nächsten Tages liegt sie im
 * Archiv — unabhängig davon, um welche Uhrzeit sie erledigt wurde.
 * Pfad: src/data/task-archive.js
 *
 * Dafür merkt sich jede erledigte Aufgabe in `doneAt`, wann sie erledigt
 * wurde. Wer aufräumt und wann, entscheidet src/shell/lifecycle.js (beim
 * Start, beim Zurückkommen in die App und um Mitternacht).
 *
 * Keine anpassbaren visuellen Werte. Welcher Status als „erledigt“ zählt,
 * steht in taskStatuses in src/data/config.js.
 */

import { dayKey } from "../core/dates.js";
import { isTaskDone } from "./config.js";

/**
 * Zeitpunkt des Erledigens pflegen, nachdem sich der Status geändert hat.
 * Wird die Aufgabe gerade erledigt, gilt ab jetzt; wird sie wieder geöffnet,
 * fällt der Zeitpunkt weg.
 */
export function noteDoneTime(entry, wasDone) {
  if (!isTaskDone(entry)) delete entry.doneAt;
  else if (!wasDone || !Number.isFinite(entry.doneAt)) entry.doneAt = Date.now();
}

/**
 * Alle erledigten Aufgaben archivieren, die vor heute erledigt wurden.
 * Bekommt die Liste hereingegeben, damit src/data/state.js diese Datei beim
 * Laden nutzen kann, ohne dass sich beide gegenseitig importieren.
 * Gibt zurück, ob etwas archiviert wurde.
 */
export function archiveFinishedTasks(entries, now = new Date()) {
  const today = dayKey(now);
  let changed = false;
  entries.forEach((entry) => {
    if (entry.type !== "aufgabe" || entry.archived || !isTaskDone(entry)) return;
    if (!Number.isFinite(entry.doneAt)) return;
    if (dayKey(new Date(entry.doneAt)) >= today) return;
    entry.archived = true;
    changed = true;
  });
  return changed;
}
