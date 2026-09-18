/*
 * Der Zustand der Kalenderseite, den mehrere Dateien brauchen: welcher Tag
 * gewählt ist und ob gerade gewischt oder geblättert wird.
 * Pfad: src/features/calendar/calendar-state.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --cal-row-h, --cal-hour-h (styles/tokens.css)
 *                -> Höhe einer Wochenzeile und einer Stunde
 * gridTopOffset  -> Abstand über der 00:00-Linie (muss zum Innenabstand von .cal-hours passen)
 */

import { cssNumber } from "../../core/css-vars.js";

export const gridTopOffset = 10;

/*
 * Der gewählte Tag steht in `ui.calendarDay` (src/data/state.js), weil auch das
 * Eingabefeld ihn braucht. Hier liegt nur, was allein den Streifen betrifft.
 */
export const cal = {
  /* Laufende Ziehbewegung auf dem Wochenstreifen */
  drag: null,
  /* true kurz nach einem Wisch: der folgende Klick soll keinen Tag wählen */
  swiped: false,
  /* true, solange der Streifen zur nächsten Zeile gleitet */
  snapping: false,
  /* Aufgelaufene Mausrad-Bewegung, bis eine Zeile voll ist */
  wheel: 0,
};

/** Höhe einer Stunde im Raster in Pixeln. */
export function hourHeight() {
  return cssNumber("--cal-hour-h", 56);
}

/** Höhe einer Wochenzeile im Streifen in Pixeln. */
export function rowHeight() {
  return cssNumber("--cal-row-h", 52);
}

/** Senkrechte Stelle der Jetzt-Linie im Raster. */
export function nowOffset(height) {
  const now = new Date();
  return gridTopOffset + (now.getHours() + now.getMinutes() / 60) * height;
}

/** Nach einem Wisch kurz sperren, damit der Klick danach nichts auswählt. */
export function markSwiped() {
  cal.swiped = true;
  setTimeout(() => {
    cal.swiped = false;
  }, 0);
}
