/*
 * Zwei Bedienelemente für die Zeilen einer Einstellungs-Karte
 * (src/ui/view-panel.js): das Segment aus zwei, drei Knöpfen (Liste | Board)
 * und der Schalter an/aus. Beide tragen `data-settings`, damit die Seite
 * ihre Klicks an einer Stelle behandelt.
 * Pfad: src/ui/panel-rows.js
 *
 * Ein Knopf trägt immer Haken, Icon und Wort: iOS und Desktop zeigen davon nur
 * das Icon (oder das Wort, wenn es kein Icon gibt), die Android-Fassung zeigt
 * wie Material 3 „Segmented button“ das Wort, davor beim gewählten den Haken,
 * sonst das Icon.
 *
 * Keine anpassbaren visuellen Werte: Aussehen in styles/tasks-settings.css
 * (Klassen .tasks-seg, .tasks-switch; --tasks-switch-w/-h, --tasks-seg-h),
 * Android in styles/android-sheet.css.
 */

import { escapeHtml, icon } from "../core/html.js";

/** Ein Segment aus zwei, drei Knöpfen; der gewählte ist gefüllt. `items` sind { id, label, icon? }. */
export function panelSegment(items, current, setting) {
  return `<span class="tasks-seg">${items
    .map(
      (item) => `
        <button class="tasks-seg-btn${item.id === current ? " is-on" : ""}${item.icon ? " has-icon" : ""}" type="button"
          data-settings="${setting}" data-value="${item.id}" aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}"
          aria-pressed="${item.id === current}">${item.id === current ? icon("check", "tasks-seg-check") : ""}${item.icon ? icon(item.icon, "tasks-seg-icon") : ""}<span class="tasks-seg-label">${escapeHtml(item.label)}</span></button>`
    )
    .join("")}</span>`;
}

/** Ein Schalter, an oder aus; `locked` sperrt ihn (blass, nicht antippbar). */
export function panelToggle(setting, on, label, locked = false) {
  return `<button class="tasks-switch${on ? " is-on" : ""}" type="button" role="switch" aria-checked="${on}"
    data-settings="${setting}" aria-label="${escapeHtml(label)}"${locked ? " disabled" : ""}><span class="tasks-switch-knob"></span></button>`;
}
