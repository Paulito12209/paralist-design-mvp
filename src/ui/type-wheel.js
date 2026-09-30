/*
 * Das Blatt „Typ ändern“ als Rolle, gebaut wie „Sortieren“
 * (src/ui/sort-sheet.js): Titel mit ✕ oben, eine Rolle mit Icon und Namen
 * jedes Typs, das Band in der Mitte zeigt die Wahl, darunter der Knopf.
 *
 * Anders als beim Sortieren gilt die Rolle nicht sofort: ein Typwechsel
 * verändert den Eintrag, und beim Durchrollen käme man an anderen Typen
 * vorbei. Deshalb steht unten „Fertig“, solange der jetzige Typ in der Mitte
 * steht, und „Umwandeln“, sobald ein anderer dort steht — erst dieser Knopf
 * wandelt um. ✕ und ein Tipp daneben brechen ab.
 *
 * Eine Option ist { id, label, icon, color? } — color färbt das Icon der
 * gewählten Zeile (die Farbe des Typs).
 * Pfad: src/ui/type-wheel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * doneLabel  -> Aufschrift des Knopfs, solange nichts gewechselt würde
 * applyLabel -> Aufschrift, sobald ein anderer Typ in der Mitte steht
 *
 * Aussehen: Rolle, Band und Knopf wie „Woche“ (styles/calendar.css); was nur
 * hier gilt — Höhe, eine Spalte, Icon neben dem Namen —, steht in
 * styles/sort-wheels.css (.type-modal).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";
import { fillWheel, markWheel, scrollWheelTo, watchWheel } from "./wheel.js";

const doneLabel = "Fertig";
const applyLabel = "Umwandeln";

let root = null;
/* Das offene Blatt: { options, current, index, onApply } */
let open = null;

function wheel() {
  return root.querySelector(".date-wheel");
}

/* Der Knopf sagt, was ein Tipp darauf tut. */
function renderButton() {
  const changes = open.options[open.index].id !== open.current;
  root.querySelector("[data-type-apply]").textContent = changes ? applyLabel : doneLabel;
}

/* Die Zeile in der Mitte wird die Wahl — noch ohne umzuwandeln. */
function choose(index) {
  if (!open || index === open.index) return;
  open.index = index;
  markWheel(wheel(), index);
  renderButton();
}

/** Das Blatt schließen, ohne etwas zu ändern. */
export function closeTypeWheel() {
  if (!root || root.hidden) return;
  root.hidden = true;
  open = null;
  clearModalPull(root);
}

/* Umwandeln, wenn ein anderer Typ gewählt ist; das Blatt geht vorher zu,
   damit eine Rückfrage (src/ui/type-menu.js) nicht darunter liegt. */
function apply() {
  const { id } = open.options[open.index];
  const { current, onApply } = open;
  closeTypeWheel();
  if (id !== current) onApply(id);
}

function onClick(event) {
  if (event.target === root || event.target.closest("[data-type-close]")) {
    closeTypeWheel();
    return;
  }
  if (!open) return;
  if (event.target.closest("[data-type-apply]")) {
    apply();
    return;
  }
  /* Ein Tipp auf eine Zeile rollt sie in die Mitte und wählt sie. */
  const item = event.target.closest("[data-index]");
  if (!item) return;
  choose(Number(item.dataset.index));
  scrollWheelTo(wheel(), open.index, true);
}

/* Das Blatt einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "modal-backdrop date-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="modal date-modal type-modal" role="dialog" aria-modal="true" aria-labelledby="type-modal-title">
      <header class="modal-head">
        <div class="modal-grip"></div>
        <h2 id="type-modal-title"></h2>
        <button class="modal-close" type="button" data-type-close aria-label="Schließen">${icon("close")}</button>
      </header>
      <div class="modal-body date-body">
        <div class="date-wheels"><div class="date-wheel"></div></div>
        <button class="date-done" type="button" data-type-apply></button>
      </div>
    </div>`;
  dom.device.appendChild(root);
  root.addEventListener("click", onClick);
  /* Kommt die Rolle zur Ruhe, wird der Typ in der Mitte die Wahl. */
  watchWheel(wheel(), choose);
  bindModalPull(root, closeTypeWheel);
  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — geht das Blatt zu. */
  on(events.viewWillChange, closeTypeWheel);
}

/* Icon und Name einer Zeile; --item-color färbt das Icon, solange sie gewählt ist. */
function itemMarkup(option) {
  const color = option.color ? ` style="--item-color:${option.color}"` : "";
  return `<span class="type-wheel-item"${color}>${icon(option.icon, "type-wheel-icon")}<span>${escapeHtml(option.label)}</span></span>`;
}

/**
 * Das Blatt öffnen.
 * @param title   Überschrift, z.B. „Typ ändern“
 * @param options die Typen wie oben beschrieben
 * @param current id des jetzigen Typs — er steht zu Beginn in der Mitte
 * @param onApply (id) — wandelt um; nur gerufen, wenn sich der Typ ändert
 */
export function openTypeWheel({ title, options, current, onApply }) {
  if (!root) build();
  const index = Math.max(
    options.findIndex((option) => option.id === current),
    0
  );
  open = { options, current, index, onApply };
  root.querySelector("#type-modal-title").textContent = title;
  clearModalPull(root);
  /* Erst sichtbar machen: eine versteckte Rolle lässt sich nicht verschieben. */
  root.hidden = false;
  fillWheel(wheel(), options.map(itemMarkup), index);
  renderButton();
}
