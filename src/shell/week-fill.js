/*
 * Kalenderwochen beim Tippen ergänzen — in jedem Titel und Textfeld der App:
 * wer „KW 40“ schreibt, bekommt gleich „(28.09. – 04.10.)“ dahinter, und die
 * Klammer zieht mit, wenn Wochennummer oder Jahr sich ändern. Die Rechnung
 * steht in src/core/week-range.js; hier hängt nur ein einziger Zuhörer an der
 * Seite, der das Feld nach jeder Eingabe umschreibt.
 *
 * Der Zuhörer läuft in der Fangphase (capture), also bevor das Feld selbst
 * von der Eingabe erfährt — so speichert jedes Feld schon den ergänzten Text.
 * Beim Löschen passiert nichts: wer die Klammer wegnehmen will, kann das.
 * Das Suchfeld bleibt außen vor, dort wäre die Klammer nur im Weg.
 * Pfad: src/shell/week-fill.js
 *
 * Keine anpassbaren visuellen Werte: Schreibweise der Klammer steht in
 * src/core/week-range.js.
 */

import { isTextField } from "../core/dom.js";
import { fillWeekRanges } from "../core/week-range.js";

/* Nur Felder, in denen man Titel oder Text schreibt — keine Suche, keine Mail. */
function wantsWeeks(node) {
  if (!isTextField(node)) return false;
  if (node.tagName !== "INPUT") return true;
  return node.type === "text";
}

/* Schreibmarke in einem bearbeitbaren Textblock als Zeichenzahl ab Anfang. */
function blockCaret(node) {
  const selection = window.getSelection();
  if (!selection.rangeCount || !node.contains(selection.anchorNode)) return node.textContent.length;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.setEnd(selection.anchorNode, selection.anchorOffset);
  return range.toString().length;
}

/* Nach dem Umschreiben steht im Block genau ein Textknoten. */
function setBlockCaret(node, offset) {
  const text = node.firstChild;
  if (!text) return;
  const range = document.createRange();
  range.setStart(text, Math.min(offset, text.length));
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function onInput(event) {
  const node = event.target;
  if (event.isComposing || !wantsWeeks(node)) return;
  if (String(event.inputType || "").startsWith("delete")) return;
  if (!/kw/i.test(node.isContentEditable ? node.textContent : node.value)) return;

  if (node.isContentEditable) {
    const { text, caret } = fillWeekRanges(node.textContent, blockCaret(node));
    if (text === node.textContent) return;
    node.textContent = text;
    setBlockCaret(node, caret);
    return;
  }
  const { text, caret } = fillWeekRanges(node.value, node.selectionStart ?? node.value.length);
  if (text === node.value) return;
  node.value = text;
  node.setSelectionRange(caret, caret);
}

/** Den einen Zuhörer an der ganzen Seite anmelden. */
export function initWeekFill() {
  document.addEventListener("input", onInput, true);
}
