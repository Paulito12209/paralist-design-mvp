/*
 * Die Ringe um die Tageszahlen im Wochenstreifen — mit Murmeln für jeden Eintrag.
 * Pfad: src/features/calendar/calendar-rings.js
 *
 * Die Logik:
 * - Es zählen nur Aufgaben, Projekte und Termine, archivierte ausdrücklich mit.
 * - Aufgaben UND Projekte am Tag: zwei Halbkreise, links blau (Aufgaben),
 *   rechts rot (Projekte). Sonst ein ganzer Ring in der Farbe der einen Art.
 * - Gibt es nur Termine, ist der ganze Ring türkis mit einer Murmel je Termin.
 *   Gibt es daneben Aufgaben oder Projekte, steht für alle Termine zusammen nur
 *   EIN türkiser Punkt unten in einer Lücke des Rings.
 * - Jede Murmel ist ein Eintrag. Die Murmeln „fallen“ nach unten: offene liegen
 *   ganz unten, erledigte sind leichter und liegen darüber, in blassem Grün.
 * - Passen nicht alle Murmeln in einen Halbkreis, wird die letzte am Ende
 *   des Bogens abgeschnitten, der Rest fällt weg.
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * BOX          -> Zeichenfläche in Punkten; entspricht dem 44-px-Kreis der Tageszahl
 * MARBLE_GAP   -> Luft zwischen zwei Murmeln (in Punkten der Zeichenfläche)
 * DOT_GAP      -> Luft zwischen dem Termin-Punkt und den Bogenenden
 * SPLIT_GAP    -> Breite der Lücke zwischen den beiden Halbkreisen
 *
 * Breite des Rings (= Durchmesser der Murmeln), Deckkraft des Rings und die
 * Blässe erledigter Murmeln stehen in styles/tokens-pages.css
 * (--cal-ring-w, --cal-ring-mix, --cal-done-mix); die Farben je Art in
 * xpItems in src/data/config.js.
 */

import { cssNumber } from "../../core/css-vars.js";
import { xpItems } from "../../data/config.js";
import { isTaskDone } from "../../data/config-tasks.js";
import { calendarDayEntries } from "../../data/queries.js";

const BOX = 44;
const MARBLE_GAP = 1;
const DOT_GAP = 2;
const SPLIT_GAP = 2;

const CENTER = BOX / 2;

/* Laufende Nummer für die Masken, damit jede Id im Dokument nur einmal vorkommt. */
let maskCount = 0;

/*
 * Winkel φ läuft von unten (0) über links (π/2), oben (π) und rechts (3π/2)
 * wieder nach unten (2π) — im Bild also im Uhrzeigersinn.
 */
function point(phi, radius) {
  return [CENTER - radius * Math.sin(phi), CENTER + radius * Math.cos(phi)].map((v) => v.toFixed(2));
}

/* Bogen von φ1 bis φ2 (φ1 < φ2) als SVG-Pfad. */
function arcPath(from, to, radius) {
  const [x1, y1] = point(from, radius);
  const [x2, y2] = point(to, radius);
  const large = to - from > Math.PI ? 1 : 0;
  return `M${x1} ${y1}A${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
}

/* Offene zuerst (liegen unten), erledigte danach (steigen nach oben). */
function byWeight(items) {
  return [...items].sort((a, b) => Number(isTaskDone(a)) - Number(isTaskDone(b)));
}

function marble(phi, radius, size, entry) {
  const [x, y] = point(phi, radius);
  const done = entry.type !== "termin" && isTaskDone(entry);
  return `<circle class="cal-marble${done ? " is-done" : ""}" cx="${x}" cy="${y}" r="${size / 2}"/>`;
}

/* Ein Bogen samt Maske, damit überzählige Murmeln am Bogenende abgeschnitten werden. */
function arcGroup(type, path, marbles) {
  maskCount += 1;
  const id = `cal-ring-mask-${maskCount}`;
  return `
    <g style="--ring-color:${xpItems[type].color}">
      <mask id="${id}"><path d="${path}" class="cal-ring-mask"/></mask>
      <path d="${path}" class="cal-ring-arc"/>
      <g mask="url(#${id})">${marbles.join("")}</g>
    </g>`;
}

/* Termin-Punkt unten in der Lücke. */
function terminDot(radius, size) {
  const [x, y] = point(0, radius);
  return `<circle class="cal-marble" style="--ring-color:${xpItems.termin.color}" cx="${x}" cy="${y}" r="${size / 2}"/>`;
}

/* Aufgaben und Projekte zusammen: links Aufgaben, rechts Projekte. */
function splitRing(tasks, projects, hasTermin, radius, size, step) {
  const bottom = hasTermin ? (size + DOT_GAP) / radius : (size + SPLIT_GAP) / 2 / radius;
  const top = (size + SPLIT_GAP) / 2 / radius;
  /* Eine Murmel mehr als ganz hineinpasst: die wird am Bogenende angeschnitten. */
  const room = Math.floor((Math.PI - top - bottom) / step) + 2;

  const left = byWeight(tasks)
    .slice(0, room)
    .map((entry, index) => marble(bottom + index * step, radius, size, entry));
  const right = byWeight(projects)
    .slice(0, room)
    .map((entry, index) => marble(2 * Math.PI - bottom - index * step, radius, size, entry));

  return (
    arcGroup("aufgabe", arcPath(bottom, Math.PI - top, radius), left) +
    arcGroup("projekt", arcPath(Math.PI + top, 2 * Math.PI - bottom, radius), right) +
    (hasTermin ? terminDot(radius, size) : "")
  );
}

/* Nur eine Art: ganzer Ring, mit Termin-Punkt unten eine Lücke darin. */
function fullRing(type, items, hasDot, radius, size, step) {
  const sorted = byWeight(items);

  if (hasDot) {
    const bottom = (size + DOT_GAP) / radius;
    /* Abwechselnd links und rechts neben dem Punkt, jede Seite bis nach oben. */
    const marbles = sorted
      .map((entry, index) => {
        const offset = bottom + Math.floor(index / 2) * step;
        return offset > Math.PI ? "" : marble(index % 2 ? 2 * Math.PI - offset : offset, radius, size, entry);
      })
      .join("");
    return arcGroup(type, arcPath(bottom, 2 * Math.PI - bottom, radius), [marbles]) + terminDot(radius, size);
  }

  /* Ohne Lücke liegen die Murmeln als Reihe mittig unten; die Plätze nahe
     dem tiefsten Punkt bekommen die offenen Einträge. */
  const count = Math.min(sorted.length, Math.floor((2 * Math.PI) / step));
  const slots = Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * step).sort(
    (a, b) => Math.abs(a) - Math.abs(b) || a - b
  );
  const marbles = slots.map((phi, index) => marble((phi + 2 * Math.PI) % (2 * Math.PI), radius, size, sorted[index]));
  return `
    <g style="--ring-color:${xpItems[type].color}">
      <circle class="cal-ring-arc" cx="${CENTER}" cy="${CENTER}" r="${radius}"/>
      ${marbles.join("")}
    </g>`;
}

/**
 * Das SVG für einen Tag, oder "" wenn dort keine Aufgabe, kein Projekt und kein Termin liegt.
 * @param key Tagesschlüssel wie „2026-09-27“.
 */
export function dayRing(key) {
  const entries = calendarDayEntries(key);
  const tasks = entries.filter((entry) => entry.type === "aufgabe");
  const projects = entries.filter((entry) => entry.type === "projekt");
  const termine = entries.filter((entry) => entry.type === "termin");
  if (!tasks.length && !projects.length && !termine.length) return "";

  const size = cssNumber("--cal-ring-w", 8);
  const radius = CENTER - size / 2;
  const step = (size + MARBLE_GAP) / radius;

  let body;
  if (tasks.length && projects.length) body = splitRing(tasks, projects, termine.length > 0, radius, size, step);
  else if (tasks.length) body = fullRing("aufgabe", tasks, termine.length > 0, radius, size, step);
  else if (projects.length) body = fullRing("projekt", projects, termine.length > 0, radius, size, step);
  else body = fullRing("termin", termine, false, radius, size, step);

  /* svg: Bögen und Murmeln brauchen echte Kreisgeometrie, die CSS allein nicht zeichnen kann. */
  return `<svg class="cal-ring" viewBox="0 0 ${BOX} ${BOX}" aria-hidden="true">${body}</svg>`;
}
