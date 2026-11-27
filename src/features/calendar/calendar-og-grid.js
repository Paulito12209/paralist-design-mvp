/*
 * Das Stundenraster der „OG Version“ (CalendarDayTimeline.swift): Einträge
 * aller drei Kategorien in ihrer Farbe, überschneidende Einträge nebeneinander,
 * ganztägige als Chips unter der Beschriftung „Ganztägig“.
 * Pfad: src/features/calendar/calendar-og-grid.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * minutes      -> Dauer, die ein Eintrag im Raster belegt: Einträge haben hier nur
 *                 eine Startzeit, die Vorlage rechnet dann mit 15 Minuten. Der Block
 *                 ist damit 22 pt hoch (Mindesthöhe) und zeigt nur den Titel — wie
 *                 ein kompakter Block der Vorlage, die darunter die Uhrzeit weglässt
 * kinds        -> welche Kategorien im Raster stehen (Aufgabe, Termin, Projekt)
 * allDayLabel  -> Beschriftung links vom Band der ganztägigen Einträge
 *
 * Maße und Farben: styles/og-calendar.css, Werte in styles/tokens-og-calendar.css
 * (Höhe der Stunde kommt aus --cal-hour-h).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { typeIcon } from "../../data/config.js";
import { entryTime } from "../../data/queries.js";
import { gridTopOffset } from "./calendar-state.js";

const minutes = 15;
const kinds = ["aufgabe", "termin", "projekt"];
const allDayLabel = "Ganztägig";

/** Nur Einträge, die einen Platz im Kalender haben können. */
export function ogGridEntries(entries) {
  return entries.filter((entry) => kinds.includes(entry.type));
}

/* Beginn eines Eintrags in Minuten nach Mitternacht. */
function startOf(entry) {
  const [hour, minute] = entryTime(entry).split(":").map(Number);
  return hour * 60 + minute;
}

/*
 * Verteilt Einträge auf Spalten: Eine Gruppe läuft, solange ein neuer Eintrag
 * noch in den bisher längsten hineinreicht; jede Gruppe braucht so viele
 * Spalten, wie gleichzeitig laufen (CalendarTimelineLayout in der Vorlage).
 */
function place(entries) {
  const sorted = [...entries].sort((a, b) => startOf(a) - startOf(b) || a.title.localeCompare(b.title, "de"));
  const slots = [];
  let group = [];
  let ends = [];
  const close = () => {
    for (const slot of group) slot.cols = Math.max(1, ends.length);
    slots.push(...group);
    group = [];
    ends = [];
  };
  for (const entry of sorted) {
    const start = startOf(entry);
    if (ends.length && start >= Math.max(...ends)) close();
    let col = ends.findIndex((end) => end <= start);
    if (col < 0) col = ends.length;
    ends[col] = start + minutes;
    group.push({ entry, col, cols: 1 });
  }
  close();
  return slots;
}

/** Die Einträge mit Uhrzeit als farbige Blöcke, jeder an seiner Stunde. */
export function ogEventsMarkup(entries, height) {
  return place(entries)
    .map(({ entry, col, cols }) => {
      const top = gridTopOffset + (startOf(entry) / 60) * height;
      return `
        <button class="cal-event og-block" type="button" data-open-entry="${entry.id}" data-kind="${entry.type}" style="top:${top}px;height:${(minutes / 60) * height}px;--col:${col};--cols:${cols}">
          <span class="og-block-title">${escapeHtml(entry.title)}</span>
        </button>`;
    })
    .join("");
}

/** Ganztägige Einträge: „Ganztägig“ links, daneben die Chips in Kategoriefarbe. */
export function ogAllDayMarkup(entries) {
  if (!entries.length) return "";
  const chips = [...entries]
    .sort((a, b) => a.title.localeCompare(b.title, "de"))
    .map(
      (entry) => `
        <button class="cal-allday-chip og-chip" type="button" data-open-entry="${entry.id}" data-kind="${entry.type}">
          ${icon(typeIcon(entry.type))}<span>${escapeHtml(entry.title)}</span>
        </button>`
    )
    .join("");
  return `<div class="cal-allday og-allday"><span class="og-allday-label">${allDayLabel}</span><div class="og-allday-chips">${chips}</div></div>`;
}
