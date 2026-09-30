/*
 * Das Blatt mit den Rollen der Kalenderseite, in zwei Arten:
 * - „Datum“ hinter dem Datum unter „Kalender“: Rollen für Tag, Monat und Jahr
 * - „Woche“ hinter der Zeile „Woche“ im Panel „Ansicht“: Rollen für Jahr und KW
 * Darunter jeweils „Fertig“. Jede Rolle wählt sofort, der Kalender dahinter
 * zieht mit.
 * Pfad: src/features/calendar/calendar-date-picker.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * yearsBack / yearsAhead -> wie viele Jahre die Jahresrolle zurück und voraus anbietet
 * settleMs               -> wie lange nach dem Rollen gewartet wird, bis die Auswahl gilt
 * kinds[*].title         -> Überschrift des Blatts je Art
 * weekLabel              -> wie eine Zeile der KW-Rolle heißt („KW 40“)
 *
 * Größen und Farben stehen in styles/calendar.css (--date-wheel-h, --date-wheel-item-h).
 */

import { events, on } from "../../core/bus.js";
import { cssNumber } from "../../core/css-vars.js";
import { addDays, dayKey, isoWeek, isoWeekStart, isoWeekYear, isoWeeksInYear, parseDay } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { monthName } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { ui } from "../../data/state.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { goToDay } from "./calendar-nav.js";

const yearsBack = 25;
const yearsAhead = 25;
const settleMs = 140;
const weekLabel = (week) => `KW ${week}`;

/* Die Rollen je Art von links nach rechts, wie in der iOS-Vorlage. */
const kinds = {
  date: { title: "Datum", units: ["day", "month", "year"] },
  week: { title: "Woche", units: ["weekYear", "week"] },
};

let root = null;
/* Welche Art gerade offen ist. */
let kind = "date";
/*
 * Die Auswahl, während das Blatt offen ist. weekday merkt sich den Wochentag
 * (0 = Montag): wer die KW wechselt, landet am selben Wochentag der neuen Woche.
 */
let pick = { year: 2026, month: 0, day: 1, weekYear: 2026, week: 1, weekday: 0 };
/* Je Rolle ein Timer: die Auswahl gilt erst, wenn das Rollen zur Ruhe kommt. */
const timers = {};

/* Wie viele Tage der gewählte Monat hat — der 0. des Folgemonats ist der letzte. */
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstYear() {
  return new Date().getFullYear() - yearsBack;
}

/* Alle Jahre der Jahresrolle. */
function yearOptions() {
  return Array.from({ length: yearsBack + yearsAhead + 1 }, (_, index) => ({
    value: firstYear() + index,
    label: String(firstYear() + index),
  }));
}

/* Die Einträge einer Rolle als { value, label }. */
function optionsOf(unit) {
  if (unit === "day") {
    return Array.from({ length: daysInMonth(pick.year, pick.month) }, (_, index) => ({
      value: index + 1,
      label: `${index + 1}.`,
    }));
  }
  if (unit === "month") {
    return Array.from({ length: 12 }, (_, index) => ({ value: index, label: monthName(index) }));
  }
  if (unit === "week") {
    return Array.from({ length: isoWeeksInYear(pick.weekYear) }, (_, index) => ({
      value: index + 1,
      label: weekLabel(index + 1),
    }));
  }
  return yearOptions();
}

/* Welcher Eintrag der Rolle gerade gewählt ist. */
function indexOf(unit) {
  if (unit === "day") return pick.day - 1;
  if (unit === "month") return pick.month;
  if (unit === "week") return pick.week - 1;
  return Math.min(Math.max(pick[unit] - firstYear(), 0), yearsBack + yearsAhead);
}

function wheelOf(unit) {
  return root.querySelector(`[data-unit="${unit}"]`);
}

function itemHeight() {
  return cssNumber("--date-wheel-item-h", 40);
}

/* Die Rolle an ihre Auswahl schieben. */
function scrollToPick(unit, smooth) {
  wheelOf(unit).scrollTo({ top: indexOf(unit) * itemHeight(), behavior: smooth ? "smooth" : "auto" });
}

/* Nur die Hervorhebung nachziehen, ohne die Rolle neu zu bauen. */
function markSelected(unit) {
  const chosen = indexOf(unit);
  wheelOf(unit)
    .querySelectorAll(".date-item")
    .forEach((item, index) => item.classList.toggle("is-on", index === chosen));
}

/* Eine Rolle neu füllen und an ihre Auswahl setzen. */
function renderWheel(unit, smooth = false) {
  wheelOf(unit).innerHTML = optionsOf(unit)
    .map(
      (option, index) =>
        `<button class="date-item${index === indexOf(unit) ? " is-on" : ""}" type="button" data-index="${index}">${option.label}</button>`
    )
    .join("");
  scrollToPick(unit, smooth);
}

/* Die Auswahl geht an den Kalender dahinter — er zeichnet sich sofort neu. */
function applyPick() {
  const day =
    kind === "week"
      ? addDays(isoWeekStart(pick.weekYear, pick.week), pick.weekday)
      : new Date(pick.year, pick.month, pick.day);
  goToDay(dayKey(day));
}

/*
 * Nach einem Wechsel von Monat oder Jahr kann der Tag zu groß sein
 * (31. Februar), nach einem Jahreswechsel die KW (53 in einem Jahr mit 52):
 * er wird gekürzt und die abhängige Rolle bekommt die passende Länge.
 */
function clampDependent(unit) {
  if (unit === "month" || unit === "year") {
    pick.day = Math.min(pick.day, daysInMonth(pick.year, pick.month));
    renderWheel("day");
  } else if (unit === "weekYear") {
    pick.week = Math.min(pick.week, isoWeeksInYear(pick.weekYear));
    renderWheel("week");
  }
}

/* Der Wert einer Rolle in die Auswahl übernehmen; sagt, ob sich etwas geändert hat. */
function setPick(unit, value) {
  if (pick[unit] === value) return false;
  pick[unit] = value;
  return true;
}

/* Nach einer neuen Auswahl: Hervorhebung, abhängige Rolle, Kalender. */
function afterPick(unit) {
  markSelected(unit);
  clampDependent(unit);
  applyPick();
}

/*
 * Die Rolle ist zur Ruhe gekommen: der Eintrag in der Mitte gilt. Läuft auch
 * nach unseren eigenen Sprüngen — die landen auf der Auswahl, also ändert sich
 * dann nichts. So braucht es keine Sperre, die eine echte Bewegung verschlucken könnte.
 */
function settle(unit) {
  const options = optionsOf(unit);
  const raw = Math.round(wheelOf(unit).scrollTop / itemHeight());
  const index = Math.min(Math.max(raw, 0), options.length - 1);
  if (setPick(unit, options[index].value)) afterPick(unit);
}

/* Ein Tipp auf einen Eintrag rollt ihn in die Mitte und wählt ihn. */
function onWheelsClick(event) {
  const item = event.target.closest("[data-index]");
  if (!item) return;
  const unit = item.closest(".date-wheel").dataset.unit;
  const changed = setPick(unit, optionsOf(unit)[Number(item.dataset.index)].value);
  scrollToPick(unit, true);
  if (changed) afterPick(unit);
}

/** Das Blatt schließen. */
export function closeDatePicker() {
  if (!root || root.hidden) return;
  root.hidden = true;
  clearModalPull(root);
}

/*
 * Die Rollen der gewählten Art einsetzen. Scroll-Ereignisse steigen nicht
 * auf, darum hängt jede neue Rolle ihre eigenen Zuhörer an; die alten gehen
 * mit ihren Rollen.
 */
function mountWheels() {
  const wheels = root.querySelector(".date-wheels");
  wheels.classList.toggle("is-week", kind === "week");
  wheels.innerHTML = kinds[kind].units.map((unit) => `<div class="date-wheel" data-unit="${unit}"></div>`).join("");
  kinds[kind].units.forEach((unit) => {
    const wheel = wheelOf(unit);
    wheel.addEventListener(
      "scroll",
      () => {
        clearTimeout(timers[unit]);
        timers[unit] = setTimeout(() => settle(unit), settleMs);
      },
      { passive: true }
    );
    /* Wo der Browser das Ende des Rollens meldet, gilt die Auswahl sofort. */
    wheel.addEventListener("scrollend", () => settle(unit));
  });
  root.querySelector("#date-modal-title").textContent = kinds[kind].title;
}

/* Das Blatt einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "modal-backdrop date-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="modal date-modal" role="dialog" aria-modal="true" aria-labelledby="date-modal-title">
      <header class="modal-head">
        <div class="modal-grip"></div>
        <h2 id="date-modal-title"></h2>
        <button class="modal-close" type="button" data-date-close aria-label="Schließen">${icon("close")}</button>
      </header>
      <div class="modal-body date-body">
        <div class="date-wheels"></div>
        <button class="date-done" type="button" data-date-close>Fertig</button>
      </div>
    </div>`;
  dom.device.appendChild(root);

  root.addEventListener("click", (event) => {
    if (event.target === root || event.target.closest("[data-date-close]")) closeDatePicker();
  });
  root.querySelector(".date-wheels").addEventListener("click", onWheelsClick);
  bindModalPull(root, closeDatePicker);
  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — geht das Blatt zu. */
  on(events.viewWillChange, closeDatePicker);
}

/**
 * Das Blatt öffnen; die Rollen stehen auf dem gewählten Kalendertag.
 * @param which "date" (Tag, Monat, Jahr) oder "week" (Jahr, KW)
 */
export function openDatePicker(which = "date") {
  if (!root) build();
  kind = kinds[which] ? which : "date";
  const day = parseDay(ui.calendarDay);
  pick = {
    year: day.getFullYear(),
    month: day.getMonth(),
    day: day.getDate(),
    weekYear: isoWeekYear(day),
    week: isoWeek(day),
    weekday: (day.getDay() + 6) % 7,
  };
  clearModalPull(root);
  mountWheels();
  /* Erst sichtbar machen: eine versteckte Rolle lässt sich nicht verschieben. */
  root.hidden = false;
  kinds[kind].units.forEach((unit) => renderWheel(unit));
}
