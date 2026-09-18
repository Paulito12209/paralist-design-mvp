/*
 * Das Blatt „Monat und Jahr“ hinter dem Monatsnamen der Kalenderseite:
 * drei Rollen für Tag, Monat und Jahr, darunter „Fertig“.
 * Pfad: src/features/calendar/calendar-date-picker.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * yearsBack / yearsAhead -> wie viele Jahre die Jahresrolle zurück und voraus anbietet
 * settleMs               -> wie lange nach dem Rollen gewartet wird, bis die Auswahl gilt
 *
 * Größen und Farben stehen in styles/calendar.css (--date-wheel-h, --date-wheel-item-h).
 */

import { events, on } from "../../core/bus.js";
import { cssNumber } from "../../core/css-vars.js";
import { dayKey, parseDay } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { monthName } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { ui } from "../../data/state.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { goToDay } from "./calendar-nav.js";

const yearsBack = 25;
const yearsAhead = 25;
const settleMs = 140;

/* Die drei Rollen von links nach rechts, wie in der iOS-Vorlage. */
const units = ["day", "month", "year"];

let root = null;
/* Der gerade gewählte Tag, während das Blatt offen ist. */
let pick = { year: 2026, month: 0, day: 1 };
/* Je Rolle ein Timer: die Auswahl gilt erst, wenn das Rollen zur Ruhe kommt. */
const timers = {};

/* Wie viele Tage der gewählte Monat hat — der 0. des Folgemonats ist der letzte. */
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstYear() {
  return new Date().getFullYear() - yearsBack;
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
  return Array.from({ length: yearsBack + yearsAhead + 1 }, (_, index) => ({
    value: firstYear() + index,
    label: String(firstYear() + index),
  }));
}

/* Welcher Eintrag der Rolle gerade gewählt ist. */
function indexOf(unit) {
  if (unit === "day") return pick.day - 1;
  if (unit === "month") return pick.month;
  return Math.min(Math.max(pick.year - firstYear(), 0), yearsBack + yearsAhead);
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

/* Der gewählte Tag geht an den Kalender dahinter — er zeichnet sich sofort neu. */
function applyPick() {
  goToDay(dayKey(new Date(pick.year, pick.month, pick.day)));
}

/*
 * Nach einem Monats- oder Jahreswechsel kann der Tag zu groß sein (31. Februar):
 * er wird gekürzt und die Tagesrolle bekommt die passende Länge.
 */
function clampDay() {
  const last = daysInMonth(pick.year, pick.month);
  pick.day = Math.min(pick.day, last);
  renderWheel("day");
}

/* Der Wert einer Rolle in die Auswahl übernehmen; sagt, ob sich etwas geändert hat. */
function setPick(unit, value) {
  if (pick[unit] === value) return false;
  pick[unit] = value;
  return true;
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
  if (!setPick(unit, options[index].value)) return;

  markSelected(unit);
  if (unit !== "day") clampDay();
  applyPick();
}

/* Ein Tipp auf einen Eintrag rollt ihn in die Mitte und wählt ihn. */
function onWheelsClick(event) {
  const item = event.target.closest("[data-index]");
  if (!item) return;
  const unit = item.closest(".date-wheel").dataset.unit;
  const changed = setPick(unit, optionsOf(unit)[Number(item.dataset.index)].value);
  scrollToPick(unit, true);
  if (!changed) return;
  markSelected(unit);
  if (unit !== "day") clampDay();
  applyPick();
}

/** Das Blatt schließen. */
export function closeDatePicker() {
  if (!root || root.hidden) return;
  root.hidden = true;
  clearModalPull(root);
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
        <h2 id="date-modal-title">Monat und Jahr</h2>
        <button class="modal-close" type="button" data-date-close aria-label="Schließen">${icon("close")}</button>
      </header>
      <div class="modal-body date-body">
        <div class="date-wheels">
          ${units.map((unit) => `<div class="date-wheel" data-unit="${unit}"></div>`).join("")}
        </div>
        <button class="date-done" type="button" data-date-close>Fertig</button>
      </div>
    </div>`;
  dom.device.appendChild(root);

  root.addEventListener("click", (event) => {
    if (event.target === root || event.target.closest("[data-date-close]")) closeDatePicker();
  });
  root.querySelector(".date-wheels").addEventListener("click", onWheelsClick);
  units.forEach((unit) => {
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
  bindModalPull(root, closeDatePicker);
  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — geht das Blatt zu. */
  on(events.viewWillChange, closeDatePicker);
}

/** Das Blatt öffnen; die Rollen stehen auf dem gewählten Kalendertag. */
export function openDatePicker() {
  if (!root) build();
  const day = parseDay(ui.calendarDay);
  pick = { year: day.getFullYear(), month: day.getMonth(), day: day.getDate() };
  clearModalPull(root);
  /* Erst sichtbar machen: eine versteckte Rolle lässt sich nicht verschieben. */
  root.hidden = false;
  units.forEach((unit) => renderWheel(unit));
}
