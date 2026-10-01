/*
 * Erinnerungen an Einträge und Arbeitsbereiche: wann man an etwas erinnert
 * werden will. Jeder kann genau eine tragen, als Zeitpunkt in `remindAt` (Millisekunden)
 * — bewusst nicht in `date`: danach sortiert der Kalender, und eine Notiz
 * spränge sonst auf den Tag der Erinnerung.
 *
 * Bei Aufgabe, Projekt und Termin hängt die Erinnerung an der Fälligkeit:
 * `remindOffset` sagt, wie viele Minuten davor („1 Stunde vorher“). Wird die
 * Fälligkeit verschoben, wandert die Erinnerung mit. Fehlt `remindOffset`,
 * ist es ein eigener Zeitpunkt.
 *
 * Eine Erinnerung meldet sich genau einmal, wie ein Wecker: nach dem Banner
 * (src/shell/reminder-banner.js) ist sie verbraucht und verschwindet. Was
 * erledigt ist, meldet sich nicht mehr; Archiviertes wartet, bis es
 * zurückgeholt wird. Eine Erinnerung zu setzen ist keine Bearbeitung: „Zuletzt
 * bearbeitet“ in der Karte „Details“ bleibt, wie es war.
 * Pfad: src/data/reminders.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * remindChoices -> die festen Optionen im Blatt „Erinnerung“ bei Aufgabe,
 *                  Projekt und Termin: Minuten vor der Fälligkeit und Wortlaut
 * dayStartTime  -> Uhrzeit, die für eine Fälligkeit ohne Uhrzeit gilt
 */

import { parseDay } from "../core/dates.js";
import { isTaskDone, isTimeType } from "./config-tasks.js";
import { commit } from "./mutations.js";
import { state } from "./state.js";

/** Die festen Optionen, gemessen von der Fälligkeit aus. */
export const remindChoices = [
  { offset: 0, label: "Zur Fälligkeit" },
  { offset: 60, label: "1 Stunde vorher" },
  { offset: 1440, label: "1 Tag vorher" },
];

/* Eine Fälligkeit ohne Uhrzeit heißt „im Laufe des Tages“ — erinnert wird morgens. */
const dayStartTime = "09:00";
const MS_PER_MINUTE = 60000;

/** Zeitpunkt der Fälligkeit (Tag plus Uhrzeit) in Millisekunden, ohne Datum null. */
export function dueTime(entry) {
  if (!entry || !entry.date) return null;
  const [hours, minutes] = (entry.time || dayStartTime).split(":").map(Number);
  const day = parseDay(entry.date);
  day.setHours(hours || 0, minutes || 0, 0, 0);
  return day.getTime();
}

/** Trägt der Eintrag eine Erinnerung? */
export function hasReminder(entry) {
  return Boolean(entry) && Number.isFinite(entry.remindAt);
}

/** Die gewählte feste Option — oder null bei einem eigenen Zeitpunkt. */
export function reminderChoice(entry) {
  if (!hasReminder(entry) || !Number.isFinite(entry.remindOffset)) return null;
  return remindChoices.find((choice) => choice.offset === entry.remindOffset) || null;
}

/** Erinnerung wegnehmen, ohne zu speichern. */
export function dropReminder(entry) {
  delete entry.remindAt;
  delete entry.remindOffset;
}

/** Einen eigenen Zeitpunkt setzen; kein gültiger Zeitpunkt nimmt die Erinnerung weg. */
export function setReminderAt(entry, at) {
  if (Number.isFinite(at)) {
    entry.remindAt = at;
    delete entry.remindOffset;
  } else dropReminder(entry);
  commit();
}

/** Erinnerung so viele Minuten vor der Fälligkeit — nur mit Fälligkeit. */
export function setReminderOffset(entry, offset) {
  const due = dueTime(entry);
  if (due === null) return;
  entry.remindAt = due - offset * MS_PER_MINUTE;
  entry.remindOffset = offset;
  commit();
}

/** Erinnerung entfernen und speichern. */
export function removeReminder(entry) {
  if (!hasReminder(entry)) return;
  dropReminder(entry);
  commit();
}

/**
 * Die Fälligkeit hat sich geändert (ohne zu speichern — das macht der
 * Aufrufer): die Erinnerung wandert mit. Eine feste Option folgt der neuen
 * Fälligkeit und fällt mit ihr weg; ein eigener Zeitpunkt verschiebt sich um
 * dieselbe Spanne und bleibt stehen, wenn die Fälligkeit wegfällt.
 * @param before dueTime(entry) vor der Änderung
 */
export function followDue(entry, before) {
  if (!hasReminder(entry)) return;
  const after = dueTime(entry);
  if (Number.isFinite(entry.remindOffset)) {
    if (after === null) dropReminder(entry);
    else entry.remindAt = after - entry.remindOffset * MS_PER_MINUTE;
  } else if (before !== null && after !== null) entry.remindAt += after - before;
}

/* Darf sich diese Erinnerung melden? Erledigtes nicht, Archiviertes noch nicht. */
function isLive(entry) {
  return hasReminder(entry) && !entry.archived && !(isTimeType(entry.type) && isTaskDone(entry));
}

/* Einträge und Arbeitsbereiche — beide können eine Erinnerung tragen */
function reminderTargets() {
  return [...state.entries, ...state.workspaces];
}

/** Gehört die Erinnerung zu einem Arbeitsbereich (statt zu einem Eintrag)? */
export function isWorkspaceTarget(target) {
  return state.workspaces.includes(target);
}

/** Alle Erinnerungen, die jetzt dran sind — älteste zuerst. */
export function dueReminders(now = Date.now()) {
  return reminderTargets().filter((item) => isLive(item) && item.remindAt <= now).sort((a, b) => a.remindAt - b.remindAt);
}

/** Zeitpunkt der nächsten Erinnerung, die noch kommt — oder null, dann braucht es keinen Zeitgeber. */
export function nextReminderAt() {
  return reminderTargets().reduce((next, item) => (isLive(item) && (next === null || item.remindAt < next) ? item.remindAt : next), null);
}

/** Die Erinnerung hat sich gemeldet: sie ist verbraucht. */
export function consumeReminder(entry) {
  if (!hasReminder(entry)) return;
  dropReminder(entry);
  commit();
}
