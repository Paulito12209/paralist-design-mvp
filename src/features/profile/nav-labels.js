/*
 * Die Zeile im Einstellungs-Blatt, mit der man die Namen unter den Icons der
 * unteren Navigation wieder einblendet — ohne Namen sind die Icons dafür
 * 8px größer (styles/navigation.css, --tab-icon-grow). Geklickt wird sie in
 * src/features/profile/profile.js, hier entsteht nur ihr Markup und die
 * Änderung selbst; die Navigationsleiste hört über den Bus mit.
 * Pfad: src/features/profile/nav-labels.js
 *
 * Keine anpassbaren visuellen Werte: das Aussehen der Zeile steht in
 * styles/settings.css.
 */

import { emit, events } from "../../core/bus.js";
import { icon } from "../../core/html.js";
import { navLabelsOn, setNavLabelsOn } from "../../data/nav-labels.js";

/** Die eine Zeile; der Haken steht, sobald die Namen eingeblendet sind. */
export function navLabelsRowMarkup() {
  const active = navLabelsOn();
  return `
    <div class="settings-group">
      <button class="settings-row${active ? " is-active" : ""}" type="button" data-nav-labels-toggle="1">
        ${icon("tag")}
        <span>Namen unter den Reitern</span>
        ${icon("check", "settings-check")}
      </button>
    </div>
  `;
}

/** Die Wahl umschalten, merken und die Navigationsleiste sofort anpassen. */
export function toggleNavLabels() {
  const next = !navLabelsOn();
  setNavLabelsOn(next);
  emit(events.navLabelsChanged, next);
}
