/*
 * Eine Rolle wie beim Blatt „Woche“: senkrecht rollen, die Zeile in der Mitte
 * gilt. Genutzt von „Sortieren“ (src/ui/sort-sheet.js) und „Typ ändern“
 * (src/ui/type-wheel.js). Die Rolle selbst ist ein .date-wheel mit
 * .date-item-Knöpfen darin; wer sie nutzt, baut das Gerüst und bekommt hier
 * Füllen, Hinrollen, Markieren und die Meldung, wo das Rollen zur Ruhe kam.
 * Pfad: src/ui/wheel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * settleMs -> wie lange nach dem Rollen gewartet wird, bis die Auswahl gilt
 *
 * Aussehen: styles/calendar.css (.date-wheel, .date-item, --date-wheel-item-h).
 */

import { cssNumber } from "../core/css-vars.js";

const settleMs = 140;

function itemHeight() {
  return cssNumber("--date-wheel-item-h", 44);
}

/** Die Rolle so weit rollen, dass Zeile `index` in der Mitte steht. */
export function scrollWheelTo(wheel, index, smooth) {
  wheel.scrollTo({ top: index * itemHeight(), behavior: smooth ? "smooth" : "auto" });
}

/** Die Zeile `index` als gewählt zeichnen, alle anderen nicht. */
export function markWheel(wheel, index) {
  wheel.querySelectorAll(".date-item").forEach((item, i) => item.classList.toggle("is-on", i === index));
}

/**
 * Die Rolle neu füllen und an ihre Auswahl setzen.
 * @param items  fertiges, schon maskiertes Markup je Zeile
 * @param chosen welche Zeile gewählt ist
 */
export function fillWheel(wheel, items, chosen) {
  wheel.innerHTML = items
    .map(
      (markup, index) =>
        `<button class="date-item${index === chosen ? " is-on" : ""}" type="button" data-index="${index}">${markup}</button>`
    )
    .join("");
  scrollWheelTo(wheel, chosen, false);
}

/**
 * Melden, wo das Rollen zur Ruhe kommt: onSettle(index) mit der Zeile in der
 * Mitte. Wo der Browser das Ende des Rollens meldet, sofort; sonst nach settleMs.
 */
export function watchWheel(wheel, onSettle) {
  let timer = 0;
  const settle = () => {
    const last = wheel.querySelectorAll(".date-item").length - 1;
    onSettle(Math.min(Math.max(Math.round(wheel.scrollTop / itemHeight()), 0), last));
  };
  wheel.addEventListener(
    "scroll",
    () => {
      clearTimeout(timer);
      timer = setTimeout(settle, settleMs);
    },
    { passive: true }
  );
  wheel.addEventListener("scrollend", () => {
    clearTimeout(timer);
    settle();
  });
}
