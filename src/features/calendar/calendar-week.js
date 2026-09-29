/*
 * Der Kalender am Desktop (ab 1024px): die Werkzeugzeile über der Fläche —
 * Pfeile, Monat, „Heute“, das Segment Tag / Woche / Monat und Plus — und die
 * zwei breiten Ansichten. „Woche“ ist ein Raster mit sieben Spalten und
 * Stundenzeilen, die Jetzt-Linie läuft quer; ein Klick in eine freie Stunde
 * legt dort einen Termin an. „Monat“ zeigt sechs Zeilen mit Terminchips.
 * „Tag“ ist die gewohnte Ansicht mit Wochenstreifen und Tagesraster
 * (calendar-grid.js, calendar-list.js). Am Handy gibt es nichts davon.
 * Pfad: src/features/calendar/calendar-week.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * deskViews      -> Beschriftung und Reihenfolge des Segments
 * defaultView    -> womit der Kalender am Desktop aufgeht
 * chipsPerDay    -> wie viele Termine ein Tag im Monat zeigt, bevor „+ n weitere“ kommt
 * weekdayNames   -> Kurznamen über den Spalten (ab Montag)
 *
 * Größen und Farben in styles/calendar-week.css; die Höhe einer Stunde ist
 * dieselbe wie im Tagesraster (--cal-hour-h in styles/tokens.css).
 */

import { addDays, dayKey, pad2, parseDay, startOfWeek, timeKey } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { longDate, monthHeading } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { saveState, state, ui } from "../../data/state.js";
import { entriesOfDay, entryColor, entryTime } from "../../data/queries.js";
import { isDesk } from "../../ui/desk-mode.js";
import { scrollToNow } from "./calendar-grid.js";
import { gridTopOffset, hourHeight, nowOffset } from "./calendar-state.js";

export const deskViews = [
  { id: "day", label: "Tag" },
  { id: "week", label: "Woche" },
  { id: "month", label: "Monat" },
];
const defaultView = "week";
const chipsPerDay = 3;
const weekdayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const hoursPerDay = 24;
/* Sechs Wochen decken jeden Monat ab, egal auf welchen Wochentag der Erste fällt. */
const monthDays = 42;

let toolbar = null;

/** Welche breite Ansicht gilt: "day", "week" oder "month" — am Handy `null`. */
export function deskView() {
  if (!isDesk()) return null;
  const chosen = state.prefs.calendar.deskView;
  return deskViews.some((view) => view.id === chosen) ? chosen : defaultView;
}

/** Ansicht wechseln und merken. */
export function setDeskView(id) {
  state.prefs.calendar.deskView = id;
  saveState();
}

/* Die Termine eines Tages: mit Uhrzeit nach Zeit sortiert, ohne Uhrzeit getrennt. */
function eventsOf(key) {
  const events = entriesOfDay(key).filter((entry) => entry.type === "termin");
  const timed = events.filter((entry) => entryTime(entry)).sort((a, b) => entryTime(a).localeCompare(entryTime(b)));
  return { timed, allDay: events.filter((entry) => !entryTime(entry)) };
}

/* ---------- Werkzeugzeile ---------- */

/* Was oben mittig steht: in der Woche „28. Sep. – 4. Okt.“ wäre zu lang, der Monat reicht. */
function toolbarMarkup(view) {
  const segments = deskViews
    .map(
      (item) =>
        `<button class="cal-views-btn${item.id === view ? " is-active" : ""}" type="button" data-cal-view="${item.id}" aria-pressed="${item.id === view}">${item.label}</button>`
    )
    .join("");
  return `
    <div class="cal-tool-nav">
      <button class="cal-tool-round" type="button" data-cal-step="-1" aria-label="Zurück">${icon("back")}</button>
      <button class="cal-tool-round" type="button" data-cal-step="1" aria-label="Weiter">${icon("chevron")}</button>
      <button class="cal-tool-month" type="button" data-cal-picker="1">${escapeHtml(monthHeading(parseDay(ui.calendarDay).getTime()))}</button>
    </div>
    <button class="cal-tool-pill" type="button" data-cal-today="1">Heute</button>
    <div class="cal-views" role="group" aria-label="Ansicht">${segments}</div>
    <button class="cal-tool-round cal-tool-add" type="button" data-cal-add="1" aria-label="Termin anlegen">${icon("plus")}</button>
  `;
}

/** Werkzeugzeile einhängen (einmal) und auf den Stand bringen. Am Handy bleibt sie leer. */
export function renderToolbar() {
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "cal-toolbar";
    dom.calHead.before(toolbar);
  }
  const view = deskView();
  toolbar.innerHTML = view ? toolbarMarkup(view) : "";
  /* Die Klasse schaltet in styles/calendar-week.css Streifen und Monatsknopf ab. */
  const section = dom.calPanel.closest(".view");
  section.classList.toggle("is-desk-week", view === "week");
  section.classList.toggle("is-desk-month", view === "month");
  section.classList.toggle("is-desk-day", view === "day");
}

/** Die Werkzeugzeile, damit calendar.js ihre Klicks anmelden kann. */
export function toolbarElement() {
  renderToolbar();
  return toolbar;
}

/* ---------- Woche ---------- */

/* Kopf über den sieben Spalten: Wochentag und Datum; Klick öffnet den Tag. */
function weekHead(days, todayKey) {
  const cells = days
    .map((date, index) => {
      const key = dayKey(date);
      const classes = ["cw-day"];
      if (key === todayKey) classes.push("is-today");
      if (key === ui.calendarDay) classes.push("is-selected");
      return `<button class="${classes.join(" ")}" type="button" data-cw-day="${key}" aria-label="${escapeHtml(longDate(key))}"><span>${weekdayNames[index]}</span><b>${date.getDate()}</b></button>`;
    })
    .join("");
  return `<div class="cw-head"><span></span>${cells}</div>`;
}

/* Reihe der ganztägigen Termine — nur, wenn es in der Woche welche gibt. */
function allDayRow(columns) {
  if (!columns.some((column) => column.allDay.length)) return "";
  const cells = columns
    .map(
      (column) =>
        `<div class="cw-allday-cell">${column.allDay
          .map(
            (entry) =>
              `<button class="cw-chip" type="button" data-open-entry="${entry.id}" style="--event-color:${entryColor(entry)}">${escapeHtml(entry.title || "Ohne Titel")}</button>`
          )
          .join("")}</div>`
    )
    .join("");
  return `<div class="cw-allday"><span class="cw-allday-label">ganztags</span>${cells}</div>`;
}

/* Eine Spalte: 24 anklickbare Stunden, darüber die Termine an ihrer Uhrzeit. */
function dayColumn(column, height, todayKey) {
  let slots = "";
  for (let hour = 0; hour < hoursPerDay; hour += 1) {
    slots += `<div class="cw-slot" data-hour="${hour}" data-day="${column.key}" aria-label="${pad2(hour)}:00"></div>`;
  }
  /* Termine zur selben Uhrzeit teilen sich die Spaltenbreite nebeneinander. */
  const perTime = {};
  column.timed.forEach((entry) => {
    perTime[entryTime(entry)] = (perTime[entryTime(entry)] || 0) + 1;
  });
  const seen = {};
  const events = column.timed
    .map((entry) => {
      const time = entryTime(entry);
      const [hour, minute] = time.split(":").map(Number);
      const index = seen[time] || 0;
      seen[time] = index + 1;
      /* top/height in Pixeln: die Stelle ergibt sich erst aus der Uhrzeit;
         --lane und --lanes legen gleichzeitige Termine nebeneinander */
      const top = gridTopOffset + (hour + minute / 60) * height;
      return `
        <button class="cw-event" type="button" data-open-entry="${entry.id}" style="top:${top}px;height:${height - 4}px;--lane:${index};--lanes:${perTime[time]};--event-color:${entryColor(entry)}">
          <span>${escapeHtml(entry.title || "Ohne Titel")}</span><small>${time}</small>
        </button>`;
    })
    .join("");
  return `<div class="cw-col${column.key === todayKey ? " is-today" : ""}">${slots}${events}</div>`;
}

/* Die Stunden links neben dem Raster. */
function hourLabels(height) {
  let labels = "";
  for (let hour = 1; hour < hoursPerDay; hour += 1) {
    labels += `<span class="cw-hour-label" style="top:${gridTopOffset + hour * height}px">${pad2(hour)}:00</span>`;
  }
  return labels;
}

/* Die Jetzt-Linie quer über alle Tage — nur, wenn heute in dieser Woche liegt.
   Sie heißt wie im Tagesraster (#cal-now), damit Uhr und „Heute“ sie finden. */
function nowLine(days, todayKey, height) {
  if (!days.some((date) => dayKey(date) === todayKey)) return "";
  return `
    <div class="cal-now cw-now" id="cal-now" style="top:${nowOffset(height)}px">
      <span class="cal-now-time"><span id="cal-now-label">${timeKey(Date.now())}</span></span>
      <span class="cal-now-line"></span>
    </div>`;
}

/** Die Woche des gewählten Tages als Raster mit sieben Spalten. */
export function renderWeek() {
  const monday = startOfWeek(parseDay(ui.calendarDay));
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const todayKey = dayKey(new Date());
  const height = hourHeight();
  const columns = days.map((date) => ({ key: dayKey(date), ...eventsOf(dayKey(date)) }));
  return `
    <div class="cw">
      ${weekHead(days, todayKey)}
      ${allDayRow(columns)}
      <div class="cw-body">
        <div class="cw-gutter">${hourLabels(height)}</div>
        ${columns.map((column) => dayColumn(column, height, todayKey)).join("")}
        ${nowLine(days, todayKey, height)}
      </div>
    </div>`;
}

/* ---------- Monat ---------- */

/* Ein Tag im Monat: Zahl oben (öffnet den Tag), darunter bis zu drei Terminchips. */
function monthCell(date, month, todayKey) {
  const key = dayKey(date);
  const { timed, allDay } = eventsOf(key);
  const events = [...allDay, ...timed];
  const classes = ["cm-cell"];
  if (date.getMonth() !== month) classes.push("is-other");
  if (key === todayKey) classes.push("is-today");
  if (key === ui.calendarDay) classes.push("is-selected");
  const chips = events
    .slice(0, chipsPerDay)
    .map((entry) => {
      const time = entryTime(entry);
      return `<button class="cm-chip" type="button" data-open-entry="${entry.id}" style="--event-color:${entryColor(entry)}">${time ? `<small>${time}</small>` : ""}<span>${escapeHtml(entry.title || "Ohne Titel")}</span></button>`;
    })
    .join("");
  const rest = events.length - chipsPerDay;
  const more = rest > 0 ? `<button class="cm-more" type="button" data-cw-day="${key}">+ ${rest} weitere</button>` : "";
  return `
    <div class="${classes.join(" ")}" data-cm-day="${key}">
      <button class="cm-num" type="button" data-cw-day="${key}" aria-label="${escapeHtml(longDate(key))}">${date.getDate()}</button>
      ${chips}${more}
    </div>`;
}

/** Der Monat des gewählten Tages: sechs Wochen, Montag zuerst. */
export function renderMonth() {
  const selected = parseDay(ui.calendarDay);
  const start = startOfWeek(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const todayKey = dayKey(new Date());
  const cells = Array.from({ length: monthDays }, (_, index) => monthCell(addDays(start, index), selected.getMonth(), todayKey));
  return `
    <div class="cm">
      <div class="cm-head">${weekdayNames.map((name) => `<span>${name}</span>`).join("")}</div>
      <div class="cm-grid">${cells.join("")}</div>
    </div>`;
}

/**
 * Die Woche bekommt wie das Tagesraster eine feste Höhe und rollt in sich:
 * genau der Platz von ihrer Oberkante bis zum unteren Rand der Seite.
 */
export function sizeWeek() {
  const bottom = dom.content.getBoundingClientRect().bottom;
  const top = dom.calPanel.getBoundingClientRect().top;
  dom.calPanel.style.height = `${Math.max(0, bottom - top)}px`;
}

/** Zur Jetzt-Linie rollen (sonst 8 Uhr) — unter dem Kopf der Woche, der oben stehen bleibt. */
export function scrollWeekToNow() {
  scrollToNow();
  const head = dom.calPanel.querySelector(".cw-head");
  if (head) dom.calPanel.scrollTop -= head.offsetHeight;
}
