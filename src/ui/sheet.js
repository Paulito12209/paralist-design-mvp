/*
 * Das Auswahl-Blatt von unten: „Verknüpfen mit“, „Typ wählen“, Seitenmenüs.
 * Jede Option ist { label, icon, onSelect } plus optional active/danger/split/gap.
 * Pfad: src/ui/sheet.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen und Abstände stehen in
 * styles/overlays.css (Klassen .sheet, .sheet-option).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { closeCtxMenu } from "./ctx-menu.js";
import { bindModalPull } from "./modal-pull.js";

let actions = [];

function optionMarkup(option, index) {
  const classes = ["sheet-option"];
  if (option.active) classes.push("is-active");
  if (option.danger) classes.push("is-danger");
  /* split: setzt eine Trennlinie über die Option; gap: lässt etwas Luft darüber */
  if (option.split) classes.push("is-split");
  if (option.gap) classes.push("is-gap");
  return `
    <button class="${classes.join(" ")}" type="button" data-sheet="${index}">
      ${icon(option.icon)}
      <span>${escapeHtml(option.label)}</span>
    </button>
  `;
}

/** Blatt mit Titel und Optionen öffnen. */
export function openSheet(title, options) {
  closeCtxMenu();
  dom.sheetTitle.textContent = title;
  dom.sheetOptions.innerHTML = options.map(optionMarkup).join("");
  actions = options.map((option) => option.onSelect);
  dom.sheet.hidden = false;
}

/** Blatt schließen. */
export function closeSheet() {
  dom.sheet.hidden = true;
  actions = [];
}

/** Klicks im Blatt: Option ausführen, Klick daneben schließt. Ziehen schließt es auch. */
export function initSheet() {
  bindModalPull(dom.sheet, closeSheet);

  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — schließt sich das
     Blatt. Sonst bliebe es über der neuen Seite liegen und seine Aktionen
     bezögen sich noch auf die verlassene. */
  on(events.viewWillChange, closeSheet);

  dom.sheet.addEventListener("click", (event) => {
    const option = event.target.closest("[data-sheet]");
    if (!option) {
      if (event.target === dom.sheet) closeSheet();
      return;
    }
    const run = actions[Number(option.dataset.sheet)];
    closeSheet();
    if (run) run();
  });
}
