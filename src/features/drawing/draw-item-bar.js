/*
 * Die kleine Leiste über einem ausgewählten Ding der Zeichnung: je nach Art
 * Schrift kleiner/größer, Kontur oder gefüllt, Zettelfarbe, Notiz öffnen,
 * Bearbeiten, Duplizieren, Nach vorn und Löschen. Sie steht über dem Ding,
 * und darunter, wenn oben kein Platz ist.
 * Pfad: src/features/drawing/draw-item-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * barGap      -> Abstand der Leiste zum Ding (Pixel)
 * sizeStep    -> um welchen Faktor „Schrift kleiner/größer“ die Schrift ändert
 * sizeLimits  -> kleinste und größte Schrift (Tausendstel der Flächenbreite)
 * duplicateShift -> um wie viel ein Duplikat versetzt liegt (Tausendstel der Breite)
 *
 * Aussehen: styles/drawing-items.css (.draw-item-bar).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { createStickyNote, noteOfItem, noteText, stickyColors } from "../../data/draw-items.js";
import { openEntry } from "../../ui/router.js";
import { drawIcon, shapeIcon } from "./draw-icons.js";
import { addItem, bringToFront, drawingEntry, itemById, removeItem, updateItem } from "./draw-model.js";
import { draw } from "./draw-state.js";

const barGap = 10;
const sizeStep = 1.2;
const sizeLimits = [12, 160];
const duplicateShift = 24;

/* Gesetzt von draw-select.js: Text oder Zettel zum Schreiben öffnen */
let startEditing = () => {};

function button(action, content, label, extra = "") {
  return `<button class="draw-item-btn${extra}" type="button" data-item-act="${action}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${content}</button>`;
}

const split = '<span class="draw-item-split" aria-hidden="true"></span>';

/* Die Knöpfe je Art des Dings */
function buttonsFor(item) {
  const common = [
    button("front", drawIcon("front"), "Nach vorn"),
    button("delete", icon("trash"), "Löschen", " is-danger"),
  ];
  if (item.kind === "text") {
    return [
      button("smaller", '<span class="draw-size-a is-small">A</span>', "Schrift kleiner"),
      button("bigger", '<span class="draw-size-a">A</span>', "Schrift größer"),
      split,
      button("edit", icon("pencil"), "Bearbeiten"),
      button("duplicate", icon("copy"), "Duplizieren"),
      ...common,
    ];
  }
  if (item.kind === "shape") {
    const label = item.fill ? "Nur Kontur" : "Füllen";
    return [button("fill", shapeIcon(item.shape, !item.fill), label), split, button("duplicate", icon("copy"), "Duplizieren"), ...common];
  }
  if (item.kind === "note") {
    const dots = stickyColors
      .map(
        (color) =>
          `<button class="draw-note-dot${color === item.color ? " is-active" : ""}" type="button" data-item-note-color="${color}" style="--draw-note-bg: ${color}" aria-label="Zettelfarbe" title="Zettelfarbe"></button>`
      )
      .join("");
    return [dots, split, button("edit", icon("pencil"), "Bearbeiten"), button("open", icon("external"), "Notiz öffnen"), button("duplicate", icon("copy"), "Duplizieren"), ...common];
  }
  return [button("duplicate", icon("copy"), "Duplizieren"), ...common];
}

/** Die Leiste für dieses Ding füllen und neben ihm hinstellen. */
export function renderItemBar(bar, item, node) {
  const markup = buttonsFor(item).join("");
  if (bar.dataset.markup !== markup) {
    bar.dataset.markup = markup;
    bar.innerHTML = markup;
  }
  const pad = node.offsetParent || node.parentElement;
  const padWidth = pad ? pad.clientWidth : 0;
  const width = bar.offsetWidth;
  const height = bar.offsetHeight;
  const left = Math.min(Math.max(4, node.offsetLeft + node.offsetWidth / 2 - width / 2), Math.max(4, padWidth - width - 4));
  const above = node.offsetTop - height - barGap;
  const top = above >= 4 ? above : node.offsetTop + node.offsetHeight + barGap;
  bar.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

/* Ein Ding noch einmal, leicht versetzt; ein Zettel bekommt dabei eine eigene neue Notiz */
function duplicate(item) {
  const copy = { ...item, x: item.x + duplicateShift, y: item.y + duplicateShift };
  delete copy.id;
  if (item.kind === "note") {
    const entry = drawingEntry();
    const note = entry ? createStickyNote(entry, noteText(noteOfItem(item))) : null;
    if (!note) return;
    copy.noteId = note.id;
  }
  addItem(copy);
}

/** Was ein Klick in der Leiste auslöst. */
export function runItemAction(action, item) {
  if (action === "delete") removeItem(item.id);
  else if (action === "front") bringToFront(item.id);
  else if (action === "duplicate") duplicate(item);
  else if (action === "edit") startEditing(item.id);
  else if (action === "fill") updateItem(item.id, { fill: !item.fill });
  else if (action === "open" && item.noteId != null) openEntry(item.noteId);
  else if (action === "smaller" || action === "bigger") {
    const factor = action === "bigger" ? sizeStep : 1 / sizeStep;
    const size = Math.min(sizeLimits[1], Math.max(sizeLimits[0], Math.round(item.size * factor)));
    updateItem(item.id, { size });
  }
}

/** Klicks der Leiste anmelden. `edit` öffnet ein Ding zum Schreiben. */
export function initItemBar(bar, { edit }) {
  startEditing = edit;
  /* pointerdown nicht weiterreichen: sonst hielte die Fläche darunter den Klick für „daneben“ */
  bar.addEventListener("pointerdown", (event) => event.stopPropagation());
  bar.addEventListener("click", (event) => {
    const item = draw.selected == null ? null : itemById(draw.selected);
    if (!item) return;
    const dot = event.target.closest("[data-item-note-color]");
    if (dot) {
      updateItem(item.id, { color: dot.dataset.itemNoteColor });
      return;
    }
    const target = event.target.closest("[data-item-act]");
    if (target) runItemAction(target.dataset.itemAct, item);
  });
}
