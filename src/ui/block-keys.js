/*
 * Tasten im Baustein-Editor: Enter teilt eine Zeile (eine Liste läuft
 * weiter, eine leere Listenzeile wird wieder Text), Löschen am Zeilenanfang
 * macht aus einer Listenzeile Text oder hängt sie an die Zeile darüber,
 * Pfeiltasten springen am Rand in die Nachbarzeile, Einfügen mehrerer Zeilen
 * wird zu mehreren Bausteinen. Im Link-Feld einer Karte übernimmt Enter den
 * Link, Escape und Löschen im leeren Feld verwerfen die Karte.
 *
 * Enter und Löschen kommen auf zwei Wegen an: am Rechner als keydown, auf
 * Android-Tastaturen oft nur als beforeinput. Wer zuerst kommt, erledigt es;
 * preventDefault im keydown verhindert das zweite.
 * Pfad: src/ui/block-keys.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { caretOffset, hasSelection } from "../core/caret.js";
import { isTextKind, makeBlock, parseBlocks } from "../data/note-blocks.js";
import { commitUrl } from "./block-embeds.js";
import { slashKey, slashOpen } from "./slash-menu.js";

/* Enter an Stelle `offset`: Zeile teilen. */
function splitAt(ed, index, offset) {
  const block = ed.blocks[index];
  /* Leere Listenzeile + Enter: raus aus der Liste, wie in jedem Schreibprogramm */
  if (block.kind !== "text" && !block.text) {
    ed.replace(index, 1, makeBlock("text"));
    ed.focusBlock(index, 0);
    return;
  }
  const head = { ...block, text: block.text.slice(0, offset) };
  const next = makeBlock(block.kind, { text: block.text.slice(offset) });
  ed.replace(index, 1, head, next);
  ed.focusBlock(index + 1, 0);
}

/* Löschen am Zeilenanfang. */
function backspaceAt(ed, index) {
  const block = ed.blocks[index];
  if (block.kind !== "text") {
    ed.replace(index, 1, makeBlock("text", { text: block.text }));
    ed.focusBlock(index, 0);
    return;
  }
  const prev = ed.blocks[index - 1];
  if (!prev) return;
  if (prev.kind === "divider") {
    ed.replace(index - 1, 1);
    ed.focusBlock(index - 1, 0);
    return;
  }
  /* Über einer Karte: eine leere Zeile verschwindet, die Karte bleibt —
     entfernt wird sie bewusst über ihr Menü. */
  if (!isTextKind(prev.kind)) {
    if (!block.text && ed.blocks[index + 1]) {
      ed.replace(index, 1);
      ed.focusBlock(index, 0);
    }
    return;
  }
  const joint = prev.text.length;
  ed.replace(index - 1, 2, { ...prev, text: prev.text + block.text });
  ed.focusBlock(index - 1, joint);
}

/* Die nächste Zeile mit Textfeld in Richtung `step` (-1 hoch, +1 runter). */
function neighbour(ed, index, step) {
  for (let i = index + step; i >= 0 && i < ed.blocks.length; i += step) {
    if (isTextKind(ed.blocks[i].kind)) return i;
  }
  return -1;
}

/* Mehrere Zeilen einfügen: jede Zeile ein Baustein, der Rest der Zeile mit
   dem Cursor hängt hinten an. */
function pasteLines(ed, index, caret, text) {
  const block = ed.blocks[index];
  const pasted = parseBlocks(text);
  const tail = block.text.slice(caret);
  const first = pasted[0];
  const head = block.text.slice(0, caret);
  /* Die erste Zeile setzt die aktuelle fort; ist diese leer, übernimmt sie
     deren Art (z.B. eine eingefügte Liste). */
  pasted[0] = !head && block.kind === "text" ? first : { ...block, text: head + (first.text || "") };
  let last = pasted[pasted.length - 1];
  if (isTextKind(last.kind)) pasted[pasted.length - 1] = { ...last, text: last.text + tail };
  else if (tail) pasted.push(makeBlock("text", { text: tail }));
  last = pasted[pasted.length - 1];
  ed.replace(index, 1, ...pasted);
  ed.focusBlock(index + pasted.length - 1, last.text.length - tail.length);
}

/* Tasten im Link-Feld einer noch leeren Karte. */
function urlKey(ed, event, input) {
  const index = ed.indexOf(input);
  if (event.key === "Enter") {
    event.preventDefault();
    commitUrl(ed, index, input);
  } else if (event.key === "Escape" || (event.key === "Backspace" && !input.value)) {
    event.preventDefault();
    ed.replace(index, 1);
    const back = neighbour(ed, index, -1);
    if (back >= 0) ed.focusBlock(back, "end");
  }
}

/* Tasten in einer Textzeile; true, wenn erledigt. */
function lineKey(ed, event, edit) {
  const index = ed.indexOf(edit);
  if (index < 0 || event.isComposing) return false;
  const caret = caretOffset(edit);
  const atStart = caret === 0 && !hasSelection();
  const atEnd = caret === edit.textContent.length && !hasSelection();
  if (event.key === "Enter" && !event.shiftKey) {
    splitAt(ed, index, caret);
    return true;
  }
  if (event.key === "Backspace" && atStart) {
    backspaceAt(ed, index);
    return true;
  }
  const up = (event.key === "ArrowUp" || event.key === "ArrowLeft") && atStart;
  const down = (event.key === "ArrowDown" || event.key === "ArrowRight") && atEnd;
  const target = up ? neighbour(ed, index, -1) : down ? neighbour(ed, index, 1) : -1;
  if (target < 0) return false;
  ed.focusBlock(target, up ? "end" : 0);
  return true;
}

/** Tasten, Einfügen und Eingaben des Editors anmelden (ein Zuhörer je Art am Editor). */
export function bindBlockKeys(ed) {
  const { root } = ed;

  root.addEventListener("keydown", (event) => {
    const input = event.target.closest(".nb-url");
    if (input) {
      urlKey(ed, event, input);
      return;
    }
    const edit = event.target.closest(".nb-edit");
    if (!edit) return;
    if (slashOpen() && slashKey(event)) {
      event.preventDefault();
      return;
    }
    if (lineKey(ed, event, edit)) event.preventDefault();
  });

  root.addEventListener("beforeinput", (event) => {
    const edit = event.target.closest?.(".nb-edit");
    if (!edit) return;
    const index = ed.indexOf(edit);
    if (event.inputType === "insertParagraph" || event.inputType === "insertLineBreak") {
      event.preventDefault();
      /* Enter bei offenem Menü wählt den markierten Baustein */
      if (slashOpen() && slashKey({ key: "Enter" })) return;
      splitAt(ed, index, caretOffset(edit));
    } else if (event.inputType === "deleteContentBackward" && caretOffset(edit) === 0 && !hasSelection()) {
      event.preventDefault();
      backspaceAt(ed, index);
    }
  });

  root.addEventListener("paste", (event) => {
    const edit = event.target.closest(".nb-edit");
    const text = event.clipboardData?.getData("text/plain") || "";
    if (!edit || !/\r|\n/.test(text)) return;
    event.preventDefault();
    const index = ed.indexOf(edit);
    /* Markierter Text wird ersetzt: vorher herausnehmen */
    if (hasSelection()) {
      window.getSelection().deleteFromDocument();
      ed.blocks[index].text = edit.textContent;
    }
    pasteLines(ed, index, Math.max(0, caretOffset(edit)), text.replace(/\r\n?/g, "\n").replace(/\n+$/, ""));
  });

  /* Den Link auch übernehmen, wenn man das Feld einfach verlässt. Ein leeres
     Feld bleibt stehen — vielleicht holt man den Link gerade aus einer
     anderen App. Gespeichert wird es erst mit Link. */
  root.addEventListener("focusout", (event) => {
    const input = event.target.closest?.(".nb-url");
    if (!input || !input.value.trim() || !document.hasFocus()) return;
    const index = ed.indexOf(input);
    const block = ed.blocks[index];
    if (block && !block.url) commitUrl(ed, index, input, { keepFocus: true });
  });
}
