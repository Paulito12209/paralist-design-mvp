/*
 * Datum und Uhrzeit eines Eintrags wählen — aus der Karte „Details“ heraus
 * (Kennzahl „Fälligkeit“ bzw. der Tag eines Termins, auf dem Handy und in der
 * Spalte rechts am Desktop). Es öffnet sich die Auswahl des Systems für Tag
 * und Uhrzeit in einem Zug; unter Android ist das der Kalender, danach die
 * Uhr — genau das, was die spätere native App auch zeigt. Leeren entfernt
 * Datum und Uhrzeit; eine Erinnerung an der Fälligkeit wandert mit
 * (followDue in src/data/reminders.js).
 *
 * Dieselbe Auswahl setzt auch eine Erinnerung (openReminderField): dann
 * landet der Zeitpunkt in `remindAt` statt im Datum, Leeren nimmt die
 * Erinnerung weg.
 * Pfad: src/ui/date-field.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * defaultTime    -> Uhrzeit, mit der die Auswahl beginnt, wenn der Eintrag noch keine hat
 * remindLeadMins -> eine neue Erinnerung schlägt die nächste volle Stunde vor, die
 *                   mindestens so viele Minuten entfernt ist
 * reminderIcon   -> Icon der Erinnerung in Meldung, Blatt und Karte „Details“
 *
 * Für mehrere gewählte Aufgaben gibt es openDayPicker: nur der Tag, ohne
 * Uhrzeit, und das Ergebnis geht an den Aufrufer statt an einen Eintrag.
 *
 * Das Feld selbst ist unsichtbar (styles/entry-details.css, Klasse .date-field).
 */

import { dayKey, timeKey } from "../core/dates.js";
import { dayClock } from "../core/format.js";
import { commit, markEdited } from "../data/mutations.js";
import { dueTime, followDue, removeReminder, setReminderAt } from "../data/reminders.js";
import { showToast } from "./toast.js";

const defaultTime = "09:00";
const remindLeadMins = 30;
const MS_PER_MINUTE = 60000;
/* Platzhalter, bis die Glocke (Lucide „bell“) in der Icon-Sammlung liegt */
export const reminderIcon = "clock";

/* Datum und Uhrzeit übernehmen; ein leerer Wert nimmt beides weg. */
function applyWhen(entry, value) {
  const [date, time] = value ? value.split("T") : ["", ""];
  if ((entry.date || "") === date && (entry.time || "") === (time || "")) return;
  const before = dueTime(entry);
  if (date) {
    entry.date = date;
    entry.time = time;
  } else {
    delete entry.date;
    delete entry.time;
  }
  followDue(entry, before);
  markEdited(entry);
  commit();
}

/**
 * Kurze Meldung unten, wann die Erinnerung kommt — die Kennzahl oben zeigt
 * nur den Tag, und man soll sehen, dass die Uhrzeit angekommen ist.
 */
export function announceReminder(entry) {
  if (!Number.isFinite(entry.remindAt)) return;
  showToast({ icon: reminderIcon, accent: "var(--link-color)", title: `Erinnerung: ${dayClock(entry.remindAt)}` });
}

/* Den gewählten Zeitpunkt als Erinnerung übernehmen; leer nimmt sie weg. */
function applyReminder(entry, value) {
  if (!value) {
    removeReminder(entry);
    return;
  }
  setReminderAt(entry, new Date(value).getTime());
  announceReminder(entry);
}

/* Ein Zeitpunkt als Wert des Feldes: „JJJJ-MM-TTTHH:MM“ in Ortszeit */
function fieldValue(ts) {
  return `${dayKey(new Date(ts))}T${timeKey(ts)}`;
}

/* Vorschlag für eine neue Erinnerung: die nächste volle Stunde mit etwas Luft */
function suggestedReminder() {
  const at = new Date(Date.now() + remindLeadMins * MS_PER_MINUTE);
  at.setMinutes(0, 0, 0);
  at.setHours(at.getHours() + 1);
  return at.getTime();
}

/* Ein einziges Feld für alle Aufrufe, einmal angelegt; `current` sagt, was
   mit der Wahl geschieht ({ entry, apply }). Es bleibt im Dokument — manche
   Systeme nehmen dem Feld beim Öffnen der Auswahl den Fokus, ein Entfernen
   dabei würde die Wahl verschlucken. */
let input = null;
let current = null;

function ensureInput() {
  if (input) return input;
  /* input type=datetime-local: Tag und Uhrzeit in einer Auswahl des Systems */
  input = document.createElement("input");
  input.type = "datetime-local";
  input.className = "date-field";
  input.tabIndex = -1;
  input.setAttribute("aria-label", "Datum und Uhrzeit");
  input.addEventListener("change", () => {
    if (current) current.apply(current.entry, input.value);
  });
  document.body.append(input);
  return input;
}

/* Das unsichtbare Feld genau auf den angetippten Knopf legen — damit die
   Auswahl am Desktop dort aufklappt — und sie öffnen. */
function showOver(field, anchor) {
  const rect = anchor.getBoundingClientRect();
  Object.assign(field.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  /* showPicker öffnet die Auswahl sofort; ältere Browser kennen es nicht —
     dort genügt Fokus und Klick auf das Feld */
  try {
    field.showPicker();
  } catch {
    field.focus({ preventScroll: true });
    field.click();
  }
}

/** Datum und Uhrzeit (Fälligkeit bzw. Tag eines Termins) über `anchor` wählen. */
export function openDateField(entry, anchor) {
  const field = ensureInput();
  current = { entry, apply: applyWhen };
  field.value = `${entry.date || dayKey(new Date())}T${entry.time || defaultTime}`;
  showOver(field, anchor);
}

/** Den Zeitpunkt der Erinnerung über `anchor` wählen. */
export function openReminderField(entry, anchor) {
  const field = ensureInput();
  current = { entry, apply: applyReminder };
  field.value = fieldValue(Number.isFinite(entry.remindAt) ? entry.remindAt : suggestedReminder());
  showOver(field, anchor);
}

/* Das Feld für openDayPicker und was mit dem gewählten Tag geschehen soll. */
let dayInput = null;
let onDay = null;

/**
 * Nur einen Tag wählen (ohne Uhrzeit) — für mehrere Aufgaben auf einmal.
 * `onPick(tag)` bekommt „JJJJ-MM-TT“; leeren in der Auswahl gibt "".
 */
export function openDayPicker(anchor, day, onPick) {
  if (!dayInput) {
    /* input type=date: nur der Kalender des Systems, keine Uhr */
    dayInput = document.createElement("input");
    dayInput.type = "date";
    dayInput.className = "date-field";
    dayInput.tabIndex = -1;
    dayInput.setAttribute("aria-label", "Datum");
    dayInput.addEventListener("change", () => {
      if (onDay) onDay(dayInput.value);
    });
    document.body.append(dayInput);
  }
  onDay = onPick;
  dayInput.value = day || dayKey(new Date());
  showOver(dayInput, anchor);
}
