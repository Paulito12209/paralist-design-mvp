/*
 * Das Blatt „Spalten“ eines Boards (Aufgaben und Projekte): öffnet sich beim
 * Halten eines Spaltenkopfs (src/ui/swipe.js). Es zeigt alle Spalten
 * untereinander in der Reihenfolge des Boards — oben die erste, also die
 * linke. Links in jeder Zeile der Griff „=“: daran zieht man die Spalte nach
 * oben oder unten, im Board rückt sie damit nach links oder rechts. Rechts
 * ein Auge: ein Tipp blendet die ganze Spalte aus (durchgestrichenes Auge,
 * Zeile blass) und wieder ein. Eine Spalte bleibt immer zu sehen.
 * Jede Änderung gilt sofort, das Board dahinter zieht mit; das Blatt bleibt
 * offen, bis man es schließt oder nach unten wegzieht.
 * Gemerkt wird je Ansicht (src/data/board-columns.js) — was gespeichert
 * wird, bringt die Seite mit (`onChange`).
 * Pfad: src/ui/columns-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title -> Überschrift des Blatts
 * words -> Vorlesetexte von Griff und Auge, Hinweis unter der Überschrift
 *
 * Aussehen: styles/columns-sheet.css; Blatt und Kopf wie die übrigen
 * Blätter (styles/overlays.css, in Android styles/android-bottom-sheet.css).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";

const title = "Spalten";
const words = {
  hint: "Halten und ziehen ändert die Reihenfolge",
  move: "verschieben",
  show: "einblenden",
  hide: "ausblenden",
  close: "Schließen",
};

let root = null;
let list = null;
/* Das offene Blatt: { columns, layout: { order, hidden }, onChange } — sonst null */
let open = null;
/* Der laufende Zug am Griff: { row, grip, pointerId, startY } — sonst null */
let drag = null;

/* Eine Zeile: Griff, Icon in der Spaltenfarbe, Name, Auge. */
function rowMarkup(column, hidden) {
  const name = escapeHtml(column.label);
  return `
    <li class="columns-row${hidden ? " is-hidden" : ""}" data-column-id="${column.id}" style="--col-color:${column.color}">
      <span class="columns-grip" data-column-grip role="button" aria-label="${name} ${words.move}">${icon("drag-handle")}</span>
      ${icon(column.icon, "columns-icon")}
      <span class="columns-name">${name}</span>
      <button class="columns-eye" type="button" data-column-eye aria-pressed="${!hidden}" aria-label="${name} ${hidden ? words.show : words.hide}">
        ${icon(hidden ? "eye-off" : "eye")}
      </button>
    </li>`;
}

function render() {
  const { columns, layout } = open;
  list.innerHTML = layout.order
    .map((id) => columns.find((column) => column.id === id))
    .filter(Boolean)
    .map((column) => rowMarkup(column, layout.hidden.includes(column.id)))
    .join("");
}

/* Neuen Stand merken und weitergeben — die Seite speichert und zeichnet das Board neu. */
function commit(layout) {
  open.layout = layout;
  open.onChange(layout);
}

/* Auge: Spalte aus- oder einblenden. Die letzte sichtbare bleibt stehen. */
function toggleColumn(row) {
  const id = row.dataset.columnId;
  const { order, hidden } = open.layout;
  const isHidden = hidden.includes(id);
  if (!isHidden && order.length - hidden.length <= 1) return;
  commit({ order, hidden: isHidden ? hidden.filter((item) => item !== id) : [...hidden, id] });
  render();
}

/* ---------- Ziehen am Griff ---------- */

function onGripDown(event) {
  const grip = event.target.closest("[data-column-grip]");
  if (!grip || drag || !event.isPrimary || event.button > 0) return;
  /* Das Blatt soll sich dabei nicht nach unten ziehen lassen (src/ui/modal-pull.js) */
  event.stopPropagation();
  event.preventDefault();
  const row = grip.closest(".columns-row");
  drag = { row, grip, pointerId: event.pointerId, startY: event.clientY };
  row.classList.add("is-dragging");
  /* Der Griff fängt den Zeiger ein, damit die Bewegung auch außerhalb der Zeile ankommt */
  try {
    grip.setPointerCapture(event.pointerId);
  } catch (error) {
    /* ohne Einfangen laufen die Bewegungen weiter über die Liste — das reicht auch */
  }
}

/* Die Zeile folgt dem Finger; steht sie über der Mitte ihrer Nachbarin, tauschen beide. */
function onGripMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const { row } = drag;
  let dy = event.clientY - drag.startY;
  const next = row.nextElementSibling;
  const prev = row.previousElementSibling;
  if (next && dy > next.offsetHeight / 2) {
    list.insertBefore(next, row);
    drag.startY += next.offsetHeight;
  } else if (prev && dy < -prev.offsetHeight / 2) {
    list.insertBefore(row, prev);
    drag.startY -= prev.offsetHeight;
  }
  dy = event.clientY - drag.startY;
  row.style.transform = `translateY(${dy}px)`;
}

function onGripUp(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const { row } = drag;
  drag = null;
  row.classList.remove("is-dragging");
  row.style.transform = "";
  const order = [...list.children].map((item) => item.dataset.columnId);
  if (order.join() !== open.layout.order.join()) commit({ order, hidden: open.layout.hidden });
}

/** Das Blatt schließen. */
export function closeColumnsSheet() {
  if (!root || root.hidden) return;
  root.hidden = true;
  open = null;
  drag = null;
  clearModalPull(root);
}

/* Das Blatt einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "modal-backdrop date-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="modal date-modal columns-modal" role="dialog" aria-modal="true" aria-labelledby="columns-modal-title">
      <header class="modal-head">
        <div class="modal-grip"></div>
        <h2 id="columns-modal-title">${escapeHtml(title)}</h2>
        <button class="modal-close" type="button" data-columns-close aria-label="${words.close}">${icon("close")}</button>
      </header>
      <div class="modal-body columns-body">
        <p class="columns-hint"></p>
        <ul class="columns-list"></ul>
      </div>
    </div>`;
  dom.device.appendChild(root);
  list = root.querySelector(".columns-list");

  root.addEventListener("click", (event) => {
    if (event.target === root || event.target.closest("[data-columns-close]")) {
      closeColumnsSheet();
      return;
    }
    const eye = event.target.closest("[data-column-eye]");
    if (eye && open) toggleColumn(eye.closest(".columns-row"));
  });
  list.addEventListener("pointerdown", onGripDown);
  list.addEventListener("pointermove", onGripMove);
  list.addEventListener("pointerup", onGripUp);
  list.addEventListener("pointercancel", onGripUp);
  bindModalPull(root, closeColumnsSheet);
  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — geht das Blatt zu. */
  on(events.viewWillChange, closeColumnsSheet);
}

/**
 * Das Blatt öffnen.
 * @param subtitle wonach das Board gerade Spalten bildet, z.B. „Status“
 * @param columns  alle Spalten, die es geben kann: [{ id, label, icon, color }]
 * @param layout   { order, hidden } — Reihenfolge aller Ids und die ausgeblendeten
 * @param onChange (layout) — speichert den neuen Stand
 */
export function openColumnsSheet({ subtitle, columns, layout, onChange }) {
  if (!root) build();
  open = { columns, layout, onChange };
  root.querySelector(".columns-hint").textContent = `${subtitle} · ${words.hint}`;
  render();
  clearModalPull(root);
  root.hidden = false;
}
