/*
 * Zwei Bedienelemente für die Zeilen einer Einstellungs-Karte
 * (src/ui/view-panel.js): das Segment aus zwei, drei Knöpfen (Liste | Board)
 * und der Schalter an/aus. Beide tragen `data-settings`, damit die Seite
 * ihre Klicks an einer Stelle behandelt.
 * Pfad: src/ui/panel-rows.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen in styles/tasks-settings.css
 * (Klassen .tasks-seg, .tasks-switch; --tasks-switch-w/-h, --tasks-seg-h).
 */

import { escapeHtml, icon } from "../core/html.js";

/** Ein Segment aus zwei, drei Knöpfen; der gewählte ist gefüllt. `items` sind { id, label, icon? }. */
export function panelSegment(items, current, setting) {
  return `<span class="tasks-seg">${items
    .map(
      (item) => `
        <button class="tasks-seg-btn${item.id === current ? " is-on" : ""}" type="button"
          data-settings="${setting}" data-value="${item.id}" aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}"
          aria-pressed="${item.id === current}">${item.icon ? icon(item.icon) : escapeHtml(item.label)}</button>`
    )
    .join("")}</span>`;
}

/** Ein Schalter, an oder aus; `locked` sperrt ihn (blass, nicht antippbar). */
export function panelToggle(setting, on, label, locked = false) {
  return `<button class="tasks-switch${on ? " is-on" : ""}" type="button" role="switch" aria-checked="${on}"
    data-settings="${setting}" aria-label="${escapeHtml(label)}"${locked ? " disabled" : ""}><span class="tasks-switch-knob"></span></button>`;
}
