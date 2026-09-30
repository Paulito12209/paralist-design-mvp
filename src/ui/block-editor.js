/*
 * Der Inhalt einer Notiz als Bausteine, wie in Notion: jede Zeile ist ein
 * eigener Block (Absatz, Stichpunkt, Zahl, Checkbox, Trennlinie, Karte).
 * „/“ am Anfang einer Zeile oder nach einem Leerzeichen öffnet das Menü mit
 * allen Bausteinen (src/ui/slash-menu.js); „- “, „1. “, „[] “ und „---“
 * am Zeilenanfang wandeln die Zeile direkt um. Auf dem Handy steht beim
 * Schreiben eine Leiste mit allen Bausteinen über der Tastatur
 * (src/ui/block-bar.js).
 *
 * Gespeichert wird weiter reiner Text (src/data/note-blocks.js). Beim
 * Tippen gehört der Text dem Block auf der Seite; nur wer die Reihe der
 * Blöcke ändert (Enter, Löschen am Zeilenanfang, Menü), zeichnet neu — und
 * zwar nur die Blöcke, die sich geändert haben. Eine Karte mit Landkarte
 * lädt dadurch nicht bei jedem Enter neu.
 * Pfad: src/ui/block-editor.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen in styles/blocks.css,
 * styles/embeds.css und styles/slash-menu.css; Platzhalter unten in
 * createBlockEditor.
 */

import { caretOffset, setCaret } from "../core/caret.js";
import { isTextKind, makeBlock, numberAt, parseBlocks, serializeBlocks, shortcutFor } from "../data/note-blocks.js";
import { attachBlockBar } from "./block-bar.js";
import { bindBlockEmbeds, fillMissingColors } from "./block-embeds.js";
import { bindBlockKeys } from "./block-keys.js";
import { blockClass, blockInner } from "./block-markup.js";
import { closeSlash, createSlashMenu, slashInput } from "./slash-menu.js";

/* Grauer Hinweis in einer leeren Zeile: in der Zeile mit dem Cursor der Tipp
   zum Menü, in einer ganz leeren Notiz der gewohnte Platzhalter. */
const LINE_HINT = "Schreib etwas oder „/“ für Bausteine …";
const EMPTY_HINT = "Schreib etwas …";

/**
 * Den Baustein-Editor in `root` einrichten.
 * onChange(text) wird nach jeder Änderung mit dem neuen Text aufgerufen —
 * das Speichern (und wie oft) entscheidet der Aufrufer.
 * emptyHint ist der graue Platzhalter einer ganz leeren Notiz.
 * onVideo(block, card) übernimmt, wenn gesetzt, den Tipp auf eine YouTube-Karte
 * (Player an der Stelle der Karte statt neuer Tab, siehe block-embeds.js).
 * Liefert { setText, focusEnd, blur }.
 */
export function createBlockEditor(root, { onChange, onVideo = null, emptyHint = EMPTY_HINT }) {
  /* Zu jedem Baustein sein Element. Ein geänderter Baustein ist ein neues
     Objekt und bekommt darum beim nächsten Zeichnen ein neues Element. */
  let nodes = new WeakMap();

  const ed = {
    root,
    blocks: [makeBlock()],

    /** Die Blöcke auf die Seite bringen; unveränderte bleiben stehen. */
    render() {
      if (!ed.blocks.length) ed.blocks.push(makeBlock());
      const list = ed.blocks.map((block, index) => {
        let node = nodes.get(block);
        const number = block.kind === "number" ? numberAt(ed.blocks, index) : 0;
        if (!node || node.dataset.n !== String(number)) {
          node = document.createElement("div");
          node.className = blockClass(block);
          node.innerHTML = blockInner(block, number, LINE_HINT);
          node.dataset.n = String(number);
          const edit = node.querySelector(".nb-edit");
          if (edit) edit.dataset.empty = emptyHint;
          nodes.set(block, node);
        }
        node.dataset.i = String(index);
        return node;
      });
      /* Erst Weggefallenes entfernen, dann Neues einsetzen: so wird kein
         stehengebliebener Block verschoben (ein verschobenes iframe lädt neu). */
      const keep = new Set(list);
      Array.from(root.children).forEach((child) => keep.has(child) || child.remove());
      let cursor = root.firstElementChild;
      list.forEach((node) => {
        if (node === cursor) cursor = node.nextElementSibling;
        else root.insertBefore(node, cursor);
      });
      const only = ed.blocks.length === 1 && ed.blocks[0];
      root.classList.toggle("is-empty", Boolean(only && only.kind === "text" && !only.text));
    },

    /** Das Element eines Bausteins. */
    nodeAt(index) {
      return nodes.get(ed.blocks[index]) || null;
    },

    /** Zu welchem Baustein gehört dieses Element? -1, wenn zu keinem. */
    indexOf(target) {
      const node = target.closest(".nb");
      return node && root.contains(node) ? Number(node.dataset.i) : -1;
    },

    /** Cursor in Baustein `index` an Zeichenstelle `offset` ("end" = ans Ende). */
    focusBlock(index, offset = 0) {
      const node = ed.nodeAt(index);
      const field = node && node.querySelector(".nb-edit, .nb-url");
      if (!field) return;
      field.focus();
      if (field.classList.contains("nb-edit")) setCaret(field, offset === "end" ? Infinity : offset);
    },

    /** Den neuen Text melden. */
    commit() {
      onChange(serializeBlocks(ed.blocks));
    },

    /** Baustein `index` durch andere ersetzen, neu zeichnen, melden. */
    replace(index, count, ...blocks) {
      ed.blocks.splice(index, count, ...blocks);
      ed.render();
      ed.commit();
    },
  };

  /* Tippt man „- “, „1. “, „[] “ oder „---“ an den Zeilenanfang, wird die
     Zeile zum passenden Baustein. true, wenn umgewandelt wurde. */
  function applyShortcut(index, caret) {
    const block = ed.blocks[index];
    const hit = shortcutFor(block.text.slice(0, caret));
    if (!hit) return false;
    const allowed = block.kind === "text" || (block.kind === "bullet" && hit.kind === "check");
    if (!allowed) return false;
    closeSlash();
    const rest = block.text.slice(caret);
    if (hit.kind === "divider") {
      ed.replace(index, 1, makeBlock("divider"), makeBlock("text", { text: rest }));
      ed.focusBlock(index + 1, 0);
    } else {
      ed.replace(index, 1, makeBlock(hit.kind, { text: rest, done: hit.done }));
      ed.focusBlock(index, 0);
    }
    return true;
  }

  root.addEventListener("input", (event) => {
    const edit = event.target.closest(".nb-edit");
    if (!edit) return;
    const index = ed.indexOf(edit);
    const block = ed.blocks[index];
    if (!block) return;
    /* Ein Block ist genau eine Zeile: ein Zeilenumbruch, der doch durchrutscht
       (Autokorrektur), wird zum Leerzeichen. Ein leerer Block verliert sein
       übrig gebliebenes <br>, damit der Platzhalter wieder erscheint. */
    let text = edit.textContent;
    if (text.includes("\n")) {
      const caret = caretOffset(edit);
      text = text.replace(/\n/g, " ");
      edit.textContent = text;
      setCaret(edit, caret);
    } else if (!text && edit.firstChild) edit.textContent = "";
    const before = block.text;
    block.text = text;
    root.classList.remove("is-empty");
    const caret = caretOffset(edit);
    if (applyShortcut(index, caret)) return;
    slashInput(ed, index, before, caret);
    ed.commit();
  });

  /* Tipp in die freie Fläche des Editors unter der letzten Zeile (am Rechner
     ist er höher als sein Text): dort weiterschreiben, wo der Text endet. */
  root.addEventListener("click", (event) => {
    if (event.target !== root) return;
    const last = root.lastElementChild;
    if (!last || event.clientY > last.getBoundingClientRect().bottom) api.focusEnd();
  });

  createSlashMenu(ed);
  attachBlockBar(ed);
  bindBlockKeys(ed);
  bindBlockEmbeds(ed, { onVideo });

  const api = {
    /** Einen gespeicherten Text zeigen (beim Öffnen einer Notiz). */
    setText(text) {
      closeSlash();
      nodes = new WeakMap();
      root.replaceChildren();
      ed.blocks = parseBlocks(text);
      ed.render();
      fillMissingColors(ed);
    },
    /** Am Ende weiterschreiben; endet die Notiz mit einer Karte, kommt eine leere Zeile dazu. */
    focusEnd() {
      const last = ed.blocks[ed.blocks.length - 1];
      if (!last || !isTextKind(last.kind)) {
        ed.blocks.push(makeBlock());
        ed.render();
      }
      ed.focusBlock(ed.blocks.length - 1, "end");
    },
    /** Cursor herausnehmen, Menü schließen. */
    blur() {
      closeSlash();
      if (root.contains(document.activeElement)) document.activeElement.blur();
    },
  };
  return api;
}
