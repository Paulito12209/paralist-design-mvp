/*
 * Einen Eintrag direkt in der Kalenderliste anlegen — nur mit Titel, ohne
 * Eingabefeld (Tipp in die freie Fläche, src/features/calendar/calendar-inline.js).
 * Er gehört an den Tag, den man ansieht, nicht an heute. Speichert selbst und
 * meldet die Änderung, bringt dieselben Punkte wie das Eingabefeld.
 * Pfad: src/data/mutations-calendar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * defaultTime -> Uhrzeit eines neuen Termins an einem anderen Tag als heute
 *                (am heutigen Tag gilt die aktuelle Uhrzeit)
 */

import { dayKey, timeKey } from "../core/dates.js";
import { commit } from "./mutations.js";
import { applyEntryDefaults } from "./mutations-tasks.js";
import { state } from "./state.js";
import { awardXp } from "./xp.js";

const defaultTime = "09:00";

/** Legt Aufgabe, Termin oder Projekt (`type`) mit `title` am Tag `day` an. */
export function createCalendarEntryInline(type, title, day) {
  const entry = {
    id: state.nextEntryId++,
    type,
    title,
    body: "",
    places: [],
    links: [],
    archived: false,
    favorite: false,
    createdAt: Date.now(),
    date: day,
  };
  if (type === "termin") entry.time = day === dayKey(new Date()) ? timeKey(Date.now()) : defaultTime;
  applyEntryDefaults(entry);
  state.entries.push(entry);
  awardXp("created", type, title);
  commit();
  return entry;
}
