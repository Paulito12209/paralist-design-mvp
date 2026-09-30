/*
 * Das Blatt „Erinnerung“ — geöffnet über die Zeile „Erinnerung“ im
 * Abschnitt „Zeit“ der Karte „Details“. Oben „Keine“, bei Aufgabe, Projekt
 * und Termin mit Fälligkeit die festen Optionen „Zur Fälligkeit“, „1 Stunde
 * vorher“, „1 Tag vorher“ (src/data/reminders.js, remindChoices), unten
 * „Eigener Zeitpunkt …“ mit der Auswahl des Systems (ist er gewählt, steht
 * er dahinter: „Eigener Zeitpunkt · Heute, 14:00“). Die gewählte Option
 * trägt den Haken.
 *
 * Eine feste Option, deren Zeitpunkt schon vorbei ist, steht nicht da: sie
 * würde sich sofort melden und wäre damit keine Erinnerung mehr.
 * Pfad: src/ui/remind-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sheetTitle  -> Überschrift des Blatts
 * noneLabel   -> Option, die die Erinnerung wegnimmt
 * customLabel -> Option für einen eigenen Zeitpunkt
 * dueHint     -> Hinweis bei Aufgabe, Projekt und Termin ohne Fälligkeit
 *
 * Aussehen: styles/overlays.css und styles/sheet-tabs.css (wie jedes Blatt).
 */

import { dayClock } from "../core/format.js";
import { isTimeType } from "../data/config-tasks.js";
import {
  dueTime,
  hasReminder,
  reminderChoice,
  remindChoices,
  removeReminder,
  setReminderOffset,
} from "../data/reminders.js";
import { announceReminder, openReminderField, reminderIcon } from "./date-field.js";
import { openSheet } from "./sheet.js";

const sheetTitle = "Erinnerung";
const noneLabel = "Keine";
const customLabel = "Eigener Zeitpunkt";
const dueHint = "Mit einer Fälligkeit gibt es auch „1 Stunde vorher“ und „1 Tag vorher“.";
const MS_PER_MINUTE = 60000;

/* Die festen Optionen, die noch in der Zukunft liegen — nur mit Fälligkeit. */
function choiceOptions(entry, current) {
  const due = isTimeType(entry.type) ? dueTime(entry) : null;
  if (due === null) return [];
  return remindChoices
    .filter((choice) => due - choice.offset * MS_PER_MINUTE > Date.now())
    .map((choice) => ({
      label: choice.label,
      icon: reminderIcon,
      active: current === choice,
      onSelect: () => {
        setReminderOffset(entry, choice.offset);
        announceReminder(entry);
      },
    }));
}

/**
 * Blatt öffnen. `anchor` ist die angetippte Zeile: über ihr klappt am
 * Desktop die Auswahl für „Eigener Zeitpunkt …“ auf.
 */
export function openRemindSheet(entry, anchor) {
  const set = hasReminder(entry);
  const current = reminderChoice(entry);
  const custom = set && !current;
  const options = [
    { label: noneLabel, icon: "close", active: !set, onSelect: () => removeReminder(entry) },
    ...choiceOptions(entry, current),
    {
      /* Beim eigenen Zeitpunkt steht er gleich dabei — so sieht man, was gilt */
      label: custom ? `${customLabel} · ${dayClock(entry.remindAt)}` : `${customLabel} …`,
      icon: "calendar",
      active: custom,
      onSelect: () => openReminderField(entry, anchor),
    },
  ];
  if (isTimeType(entry.type) && !entry.date) options.push({ note: true, label: dueHint });
  openSheet(sheetTitle, options);
}
