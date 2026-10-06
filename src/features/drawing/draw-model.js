/*
 * Die Dinge auf der Fläche der offenen Zeichnung ändern — jede Änderung als
 * ein Schritt für Rückgängig und Wiederholen (draw-history.js). Wer etwas
 * hinzufügt, verschiebt oder löscht, geht über changeItems(): dort wird
 * vorher und nachher festgehalten, gespeichert und neu gezeichnet.
 * Pfad: src/features/drawing/draw-model.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * cascadeStep -> um wie viel (Tausendstel der Breite) nacheinander eingefügte Dinge
 *                versetzt liegen, damit sie sich nicht genau überdecken
 */

import { drawItemsOf, nextItemId, refWidth, setDrawItems } from "../../data/draw-items.js";
import { findEntry } from "../../data/queries.js";
import { scheduleSave } from "../../data/state.js";
import { record } from "./draw-history.js";
import { draw, drawChanged } from "./draw-state.js";

const cascadeStep = 24;

/* Gesetzt von drawing.js: nach jeder Änderung auch das Bild der Striche sichern,
   damit Größe und Vorschau der Zeichnung immer zusammenpassen. */
let afterChange = () => {};

export function setAfterItemsChange(handler) {
  afterChange = handler;
}

/** Die offene Zeichnung als Eintrag. */
export function drawingEntry() {
  return draw.entryId == null ? null : findEntry(draw.entryId);
}

/** Die Dinge der offenen Zeichnung. */
export function currentItems() {
  return drawItemsOf(drawingEntry());
}

/** Ein Ding der offenen Zeichnung nach Nummer. */
export function itemById(id) {
  return currentItems().find((item) => item.id === id) || null;
}

function applySnapshot(entry, json) {
  setDrawItems(entry, JSON.parse(json));
  if (draw.selected != null && !drawItemsOf(entry).some((item) => item.id === draw.selected)) draw.selected = null;
  scheduleSave();
  afterChange();
  drawChanged();
}

/**
 * Die Liste ändern. `mutate` bekommt eine Kopie, verändert sie und darf
 * etwas zurückgeben (z.B. das neue Ding). Ändert sich nichts, entsteht
 * auch kein Schritt.
 */
export function changeItems(mutate) {
  const entry = drawingEntry();
  if (!entry) return null;
  const before = JSON.stringify(drawItemsOf(entry));
  const items = JSON.parse(before);
  const result = mutate(items, entry);
  const after = JSON.stringify(items);
  if (after === before) return result;
  applySnapshot(entry, after);
  record({ ink: false, undo: () => applySnapshot(entry, before), redo: () => applySnapshot(entry, after) });
  return result;
}

/** Ein Ding hinzufügen, auswählen und zurückgeben. */
export function addItem(fields) {
  const entry = drawingEntry();
  if (!entry) return null;
  const item = { ...fields, id: nextItemId(entry) };
  draw.selected = item.id;
  changeItems((items) => items.push(item));
  return item;
}

/** Felder eines Dings ändern. */
export function updateItem(id, fields) {
  changeItems((items) => {
    const item = items.find((candidate) => candidate.id === id);
    if (item) Object.assign(item, fields);
  });
}

/** Ein Ding entfernen. */
export function removeItem(id) {
  if (draw.selected === id) draw.selected = null;
  changeItems((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) items.splice(index, 1);
  });
}

/** Ein Ding nach vorn holen: es rückt ans Ende der Liste und liegt damit über allen anderen. */
export function bringToFront(id) {
  changeItems((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) items.push(items.splice(index, 1)[0]);
  });
}

/**
 * Wo ein neues Ding hinkommt, wenn es nicht an eine Stelle geklickt wurde:
 * in die Mitte der Fläche, jedes weitere etwas versetzt.
 * @param width / height Größe des Dings in Tausendsteln der Breite
 * @param padRatio       Höhe der Fläche geteilt durch ihre Breite
 */
export function centeredSpot(width, height, padRatio) {
  const shift = (currentItems().length % 6) * cascadeStep;
  return {
    x: Math.max(0, Math.round(refWidth / 2 - width / 2 + shift)),
    y: Math.max(0, Math.round((padRatio * refWidth) / 2 - height / 2 + shift)),
  };
}

/**
 * Eine Farbe wählen: sie gilt für die nächsten Striche, und ein ausgewählter
 * Text oder eine ausgewählte Form nimmt sie gleich an. Wer radiert hatte,
 * malt danach wieder.
 */
export function chooseColor(color) {
  draw.color = color;
  if (draw.tool === "eraser") draw.tool = "pen";
  const item = draw.selected == null ? null : itemById(draw.selected);
  if (item && (item.kind === "text" || item.kind === "shape")) updateItem(item.id, { color });
  drawChanged();
}
