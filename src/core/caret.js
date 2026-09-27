/*
 * Cursor in einem bearbeitbaren Block (contenteditable) lesen und setzen —
 * gezählt in Zeichen ab dem Anfang des Blocks, wie bei einem Textfeld.
 * Pfad: src/core/caret.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/** An welcher Zeichenstelle steht der Cursor in `node`? -1, wenn er woanders steht. */
export function caretOffset(node) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return -1;
  const range = selection.getRangeAt(0);
  if (!node.contains(range.startContainer)) return -1;
  const before = document.createRange();
  before.selectNodeContents(node);
  before.setEnd(range.startContainer, range.startOffset);
  return before.toString().length;
}

/** Ist gerade Text markiert (nicht nur ein blinkender Cursor)? */
export function hasSelection() {
  const selection = window.getSelection();
  return Boolean(selection && selection.rangeCount && !selection.isCollapsed);
}

/** Den Cursor an Zeichenstelle `offset` setzen; zu große Werte landen am Ende. */
export function setCaret(node, offset) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  /* Durch alle Textstücke laufen, bis die Stelle erreicht ist */
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let left = Math.max(0, offset);
  let text = walker.nextNode();
  while (text) {
    if (left <= text.length) {
      range.setStart(text, left);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    left -= text.length;
    text = walker.nextNode();
  }
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Den ganzen Text eines Blocks markieren (z.B. beim Umbenennen). */
export function selectAll(node) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}
