/*
 * Die Karten der rechten Spalte am Desktop als HTML-Schnipsel: die Kacheln
 * „Eingang“ und „Fortschritt“, „Als Nächstes“ mit der Tagesleiste, die
 * dringendsten Aufgaben und die zuletzt geöffneten Einträge. Die Karten lesen
 * nur — was ein Klick auslöst, entscheidet src/shell/desk-rail.js anhand der
 * Angabe data-rail am Knopf.
 * Pfad: src/shell/desk-rail-cards.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * taskLimit   -> wie viele Aufgaben die Karte „Aufgaben“ zeigt
 * recentLimit -> wie viele zuletzt geöffnete Einträge nebeneinander stehen
 * nowMinutes  -> bis wie viele Minuten vor Beginn der Chip „jetzt“ sagt
 * soonMinutes -> ab wie vielen Minuten vor Beginn der Chip einen pulsierenden Punkt bekommt
 *
 * Wie weit „Als Nächstes“ nach einem Termin sucht, steht in src/data/insights.js
 * (weekDays). Aussehen, Größen und Abstände stehen in styles/desk-rail.css und
 * styles/desk-rail-tiles.css.
 */

import { dayKey, dayShift, parseDay, startOfDay } from "../core/dates.js";
import { formatNumber, formatSpan, shortDay, shortOpenTime } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { inboxPick, isTaskDone, taskPriorityOf, typeSingular } from "../data/config.js";
import {
  eventStart,
  eventsOfDay,
  focusTasks,
  levelSummary,
  newestInbox,
  nextEvent,
  recentEntries,
} from "../data/insights.js";
import { inboxEntries, taskEntries } from "../data/queries.js";
import { entryGlyph } from "../ui/rows.js";
import { dayPassed, dayTrack, levelRing, paperPile, pileSize } from "./desk-rail-visuals.js";

const taskLimit = 4;
const recentLimit = 3;
const nowMinutes = 1;
const soonMinutes = 60;
const msPerMinute = 60000;
const secondsPerMinute = 60;

/* Wochentag kurz („Fr.“) für Termine ab übermorgen — einmal angelegt, weil teuer. */
const weekdayShort = new Intl.DateTimeFormat("de-DE", { weekday: "short" });

/* Titel für die Ausgabe: immer abgesichert, ein leerer Titel bekommt einen Platzhalter. */
function titleOf(entry) {
  return escapeHtml(entry.title || "Ohne Titel");
}

/* „1 Termin“ oder „3 Termine“ — die Mehrzahl hängt an der Zahl. */
function eventCount(count) {
  return `${formatNumber(count)} ${count === 1 ? "Termin" : "Termine"}`;
}

/* Wie lange noch bis zum Termin, in Worten: „jetzt“, „in 2 Std 10 Min“, „morgen 09:00“, „Fr. 14:30“. */
function untilLabel(next, now, todayKey) {
  if (next.key === todayKey) {
    if (!next.time) return "heute";
    const minutes = Math.max(0, Math.round((next.ts - now) / msPerMinute));
    return minutes <= nowMinutes ? "jetzt" : `in ${formatSpan(minutes * secondsPerMinute)}`;
  }
  const tomorrowKey = dayKey(new Date(dayShift(startOfDay(now), 1)));
  const day = next.key === tomorrowKey ? "morgen" : weekdayShort.format(parseDay(next.key));
  return next.time ? `${day} ${next.time}` : day;
}

/* Kopfzeile einer Karte: Titel links, rechts ein Chip oder eine Pille. */
function cardHead(title, end = "") {
  return `<div class="rail-head"><h2 class="rail-title">${title}</h2>${end}</div>`;
}

/* Pille, die etwas anlegt — für leere Karten. `action` sind die data-Angaben, an
   denen src/shell/desk-rail.js erkennt, was angelegt wird (fester Text, nie Eingaben). */
function createPill(action, label) {
  return `<button class="rail-pill" type="button" ${action}>${icon("plus")}${label}</button>`;
}

/** Kachel „Eingang“: Papierstapel der neuesten Einträge, Zahl darunter, Plus oben rechts. */
export function inboxTile() {
  const count = inboxEntries().length;
  const foot = count
    ? `<span class="rail-tile-num">${formatNumber(count)}</span><span class="rail-tile-note">zu sortieren</span>`
    : `<span class="rail-tile-note">Alles sortiert</span>`;
  const label = count ? `Eingang öffnen, ${formatNumber(count)} zu sortieren` : "Eingang öffnen, alles sortiert";
  /* Der große Knopf liegt unter dem Inhalt und macht die ganze Kachel anklickbar;
     das Plus ist ein eigener Knopf darüber — Knöpfe dürfen nicht ineinander stecken.
     Es legt im Eingang ab, wo es draufsteht, egal welche Seite gerade offen ist. */
  return `
    <button class="rail-tile-hit" type="button" data-rail="inbox" aria-label="${label}"></button>
    <div class="rail-tile-head">
      <span class="rail-tile-label" aria-hidden="true">${icon("inbox", "rail-inbox-icon")}Eingang</span>
      <button class="rail-plus" type="button" data-rail="create" data-pick="${inboxPick}" aria-label="Neu im Eingang">${icon("plus")}</button>
    </div>
    ${paperPile(newestInbox(pileSize))}
    <div class="rail-tile-foot" aria-hidden="true">${foot}</div>
  `;
}

/** Kachel „Fortschritt“: Strich-Ring mit der Stufe in der Mitte, darunter die fehlenden Punkte. */
export function levelTile() {
  const level = levelSummary();
  const missing = formatNumber(level.missing);
  return `
    <button class="rail-tile-hit" type="button" data-rail="level" aria-label="Fortschritt öffnen, Stufe ${level.level}, noch ${missing} XP bis zur nächsten"></button>
    <div class="rail-tile-head" aria-hidden="true">
      <span class="rail-tile-label">Fortschritt</span>
      ${icon("arrow-right", "rail-tile-arrow")}
    </div>
    <div class="rail-ring-wrap" aria-hidden="true">
      ${levelRing(level.progress)}
      <span class="rail-ring-center"><span class="rail-ring-num">${level.level}</span><span class="rail-ring-label">Stufe</span></span>
    </div>
    <div class="rail-tile-foot" aria-hidden="true"><span class="rail-tile-note">noch ${missing} XP</span></div>
  `;
}

/* Der nächste Termin als großer Knopf: Uhrzeit groß, Titel darunter, Tag daneben, wenn nicht heute. */
function eventButton(next, todayKey) {
  const title = titleOf(next.entry);
  const day = next.key === todayKey ? "" : escapeHtml(shortDay(next.key));
  const time = next.time ? escapeHtml(next.time) : "ganztags";
  const label = `${title}, ${day || "heute"}, ${next.time ? `${time} Uhr` : time}`;
  return `
    <button class="rail-event" type="button" data-rail="entry" data-id="${escapeHtml(next.entry.id)}" aria-label="${label}">
      <span class="rail-event-when">
        <span class="rail-event-time${next.time ? "" : " is-allday"}">${time}</span>
        ${day ? `<span class="rail-muted">${day}</span>` : ""}
      </span>
      <span class="rail-event-title">${title}</span>
    </button>
  `;
}

/** Karte „Als Nächstes“: der nächste Termin, die Tagesleiste und der Weg in den Kalender. */
export function nextCard(now) {
  const todayKey = dayKey(new Date(now));
  const next = nextEvent();
  const today = eventsOfDay(todayKey);
  const marks = today
    .filter((item) => item.time)
    .map((item) => ({ ts: eventStart(todayKey, item.time), isNext: Boolean(next) && item.entry === next.entry }));

  let chip = "";
  if (next) {
    const minutes = (next.ts - now) / msPerMinute;
    const soon = next.key === todayKey && next.time && minutes <= soonMinutes;
    chip = `<span class="rail-chip${soon ? " is-soon" : ""}">${escapeHtml(untilLabel(next, now, todayKey))}</span>`;
  }
  const body = next
    ? eventButton(next, todayKey)
    : `<p class="rail-empty">Keine Termine in Sicht</p>${createPill('data-rail="event"', "Termin anlegen")}`;
  const summary = today.length ? `Heute ${eventCount(today.length)}` : "Heute frei";

  return `
    ${cardHead("Als Nächstes", chip)}
    ${body}
    ${dayTrack(now, marks, `${summary}, der Tag ist zu ${dayPassed(now)} % vorbei`)}
    <div class="rail-card-foot">
      <span class="rail-muted">${summary}</span>
      <button class="rail-pill" type="button" data-rail="calendar">Kalender${icon("arrow-right")}</button>
    </div>
  `;
}

/* Eine Aufgabe: runder Haken zum Erledigen, daneben der Titel, rechts Fälligkeit und Dringlichkeit. */
function taskRow(entry) {
  const id = escapeHtml(entry.id);
  const title = titleOf(entry);
  const prio = taskPriorityOf(entry.priority);
  const due = entry.date ? escapeHtml(shortDay(entry.date)) : "";
  const label = `${title}${due ? `, fällig ${due}` : ""}, Dringlichkeit ${escapeHtml(prio.label)}`;
  return `
    <li class="rail-task">
      <button class="rail-check" type="button" data-rail="done" data-id="${id}" aria-label="${title} erledigen">${icon("check")}</button>
      <button class="rail-task-title" type="button" data-rail="entry" data-id="${id}" aria-label="${label}">
        <span class="rail-task-text">${title}</span>
        ${due ? `<span class="rail-task-day">${due}</span>` : ""}
        <span class="rail-prio" style="background:${prio.color}"></span>
      </button>
    </li>
  `;
}

/** Karte „Aufgaben“: die dringendsten offenen Aufgaben, zum Abhaken direkt hier. */
export function tasksCard() {
  const open = taskEntries().filter((entry) => !isTaskDone(entry)).length;
  const tasks = focusTasks(taskLimit);
  const end = `
    ${open ? `<span class="rail-muted">${formatNumber(open)} offen</span>` : ""}
    <button class="rail-pill rail-head-end" type="button" data-rail="tasks">Alle</button>
  `;
  const body = tasks.length
    ? `<ul class="rail-task-list">${tasks.map(taskRow).join("")}</ul>`
    : `<p class="rail-empty">Nichts offen.</p>${createPill('data-rail="create" data-pick="aufgabe"', "Aufgabe anlegen")}`;
  return cardHead("Aufgaben", end) + body;
}

/* Kleine Karte eines zuletzt geöffneten Eintrags: Typ oben, Vorschau oder Icon in der Mitte, Titel und Zeit unten. */
function recentCard({ entry, ts }) {
  const title = titleOf(entry);
  const kind = escapeHtml(typeSingular(entry.type));
  const time = shortOpenTime(ts);
  return `
    <button class="rail-recent-card" type="button" data-rail="entry" data-id="${escapeHtml(entry.id)}" aria-label="${title}, ${kind}, geöffnet ${time}">
      <span class="rail-type">${kind}</span>
      <span class="rail-recent-visual">${entryGlyph(entry)}</span>
      <span class="rail-recent-title">${title}</span>
      <span class="rail-recent-time">${time}</span>
    </button>
  `;
}

/** Abschnitt „Zuletzt geöffnet“ — leer (und damit ausgeblendet), solange nichts geöffnet wurde. */
export function recentSection() {
  const recent = recentEntries(recentLimit);
  if (!recent.length) return "";
  const end = `<button class="rail-pill rail-head-end" type="button" data-rail="recent">Alle</button>`;
  return `${cardHead("Zuletzt geöffnet", end)}<div class="rail-recent-grid">${recent.map(recentCard).join("")}</div>`;
}
