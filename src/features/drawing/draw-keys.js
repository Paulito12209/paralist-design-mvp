/*
 * Tastatur in einer offenen Zeichnung: Strg/⌘+Z nimmt zurück,
 * Strg/⌘+Umschalt+Z oder Strg+Y wiederholt, Entf/Rücktaste löscht das
 * ausgewählte Ding, Strg/⌘+D dupliziert es, die Pfeiltasten schieben es
 * (mit Umschalt weiter), Escape beendet das Schreiben bzw. hebt die Auswahl
 * auf und schließt ein offenes Fenster der Leiste. Strg/⌘+V setzt ein Bild
 * aus der Zwischenablage ein.
 *
 * Gehört angemeldet in der Einfangphase: so kommt die Zeichnung vor den
 * Tasten der Desktop-Fassung (src/shell/desk.js) dran, deren Escape sonst
 * die Seite verlassen würde.
 * Pfad: src/features/drawing/draw-keys.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * nudgeSmall / nudgeLarge -> wie weit die Pfeiltasten schieben (Tausendstel der Breite), ohne und mit Umschalt
 */

import { dom } from "../../core/dom.js";
import { isViewActive } from "../../ui/views.js";
import { runItemAction } from "./draw-item-bar.js";
import { closeDrawPop, isDrawPopOpen } from "./draw-pop.js";
import { editingItem } from "./draw-layer.js";
import { itemById, removeItem, updateItem } from "./draw-model.js";
import { finishEditing } from "./draw-select.js";
import { draw, drawChanged } from "./draw-state.js";

const nudgeSmall = 2;
const nudgeLarge = 20;
const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/* Steht eine Zeichnung offen und liegt keine andere Ebene darüber? */
function drawingOpen() {
  return isViewActive("entry") && !dom.drawPad.hidden && draw.entryId != null && !document.querySelector(".sheet-backdrop:not([hidden]), .modal-backdrop:not([hidden]), .draw-attach-backdrop:not([hidden])");
}

/* Tippt man gerade in ein Feld außerhalb der Zeichnung (Titel, Suche)? */
function typingElsewhere(target) {
  if (!(target instanceof Element)) return false;
  return target.matches("input, textarea, select") || (target.isContentEditable && !target.closest(".draw-layer"));
}

function handle(event, keys) {
  const command = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();
  if (event.key === "Escape") {
    if (editingItem() != null) finishEditing();
    else if (draw.selected != null) {
      draw.selected = null;
      drawChanged();
    } else return false;
    return true;
  }
  /* Beim Schreiben im Zettel oder Text gehören alle übrigen Tasten dem Text */
  if (editingItem() != null) return false;
  if (command && key === "z") {
    if (event.shiftKey) keys.redo();
    else keys.undo();
    return true;
  }
  if (command && key === "y") {
    keys.redo();
    return true;
  }
  const item = draw.selected == null ? null : itemById(draw.selected);
  if (!item) return false;
  if (event.key === "Delete" || event.key === "Backspace") {
    removeItem(item.id);
    return true;
  }
  if (command && key === "d") {
    runItemAction("duplicate", item);
    return true;
  }
  if (arrows[event.key] && !command) {
    const step = event.shiftKey ? nudgeLarge : nudgeSmall;
    const [dx, dy] = arrows[event.key];
    updateItem(item.id, { x: item.x + dx * step, y: item.y + dy * step });
    return true;
  }
  return false;
}

/* Ein Bild aus der Zwischenablage (Bildschirmfoto, kopiertes Bild) einsetzen */
function onPaste(event) {
  if (!drawingOpen() || typingElsewhere(event.target) || editingItem() != null) return;
  const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  event.preventDefault();
  import("./draw-attach.js").then((module) => module.insertImageFiles(files, null));
}

/** Tasten anmelden. `keys` bringt undo und redo aus drawing.js mit. */
export function initDrawKeys(keys) {
  document.addEventListener(
    "keydown",
    (event) => {
      if (!drawingOpen()) return;
      /* Escape schließt ein offenes Fenster der Leiste zuerst — auch aus seinem Hex-Feld heraus */
      if (event.key === "Escape" && isDrawPopOpen()) {
        closeDrawPop();
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (typingElsewhere(event.target)) return;
      if (handle(event, keys)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
  document.addEventListener("paste", onPaste);
}
