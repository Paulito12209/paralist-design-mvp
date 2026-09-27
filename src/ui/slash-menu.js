/*
 * Das „/“-Menü im Inhalt einer Notiz, wie in Notion: „/“ am Anfang einer
 * Zeile oder nach einem Leerzeichen öffnet unter der Zeile eine Auswahl aller
 * Bausteine, in Gruppen mit Überschrift und zwei Kacheln je Reihe. Weitertippen
 * filtert („/vid“ -> Video), Pfeiltasten und Enter wählen, Escape oder ein
 * Leerzeichen ohne Treffer schließt. Das getippte „/…“ verschwindet beim Wählen.
 * Steht in der Zeile sonst nur ein Link, wird er mit Standort, Video oder
 * Web-Lesezeichen gleich zur Karte.
 * Pfad: src/ui/slash-menu.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * slashGroups  -> welche Bausteine im Menü stehen, in welcher Gruppe und
 *                 Reihenfolge, mit Icon und Suchwörtern
 * MAX_QUERY    -> nach so vielen Zeichen ohne Treffer schließt das Menü
 *
 * Aussehen: styles/slash-menu.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { normalizeUrl } from "../data/link-kinds.js";
import { isTextKind, makeBlock } from "../data/note-blocks.js";
import { commitUrl } from "./block-embeds.js";

const MAX_QUERY = 12;

const slashGroups = [
  {
    title: "Grundlagen",
    items: [
      { kind: "text", label: "Text", icon: "text", words: "absatz text normal" },
      { kind: "bullet", label: "Stichpunkte", icon: "list", words: "liste aufzählung punkte bullet" },
      { kind: "number", label: "Nummerierte Liste", icon: "list-num", words: "nummer zahlen liste reihenfolge" },
      { kind: "check", label: "Checkbox", icon: "check-circle", words: "to-do todo aufgabe haken checkliste" },
      { kind: "divider", label: "Trennlinie", icon: "divider", words: "linie trenner abschnitt divider" },
    ],
  },
  {
    title: "Einbettungen",
    items: [
      { kind: "place", label: "Standort", icon: "pin", words: "ort karte google maps adresse location" },
      { kind: "video", label: "Video", icon: "video", words: "youtube film clip" },
      { kind: "link", label: "Web-Lesezeichen", icon: "bookmark", words: "link website url seite lesezeichen" },
    ],
  },
];

/* Das offene Menü: zu welchem Editor und welcher Zeile, wo das „/“ steht,
   was dahinter getippt ist und welche Kachel markiert ist. */
let open = null;
/* Menü-Element je Editor (es gibt nur einen, die Karte merkt es sich trotzdem sauber) */
const menus = new WeakMap();

function matches(item, query) {
  const needle = query.toLowerCase();
  return !needle || item.label.toLowerCase().includes(needle) || item.words.includes(needle);
}

/* Die Gruppen mit den Kacheln, die zur Eingabe passen. */
function filtered(query) {
  return slashGroups
    .map((group) => ({ title: group.title, items: group.items.filter((item) => matches(item, query)) }))
    .filter((group) => group.items.length);
}

function render() {
  const menu = menus.get(open.ed);
  const groups = filtered(open.query);
  open.items = groups.flatMap((group) => group.items);
  open.active = Math.min(open.active, open.items.length - 1);
  let flat = 0;
  menu.innerHTML = groups
    .map((group) => {
      const tiles = group.items
        .map((item) => {
          const index = flat++;
          const on = index === open.active;
          return `<button class="slash-item${on ? " is-active" : ""}" type="button" role="option" aria-selected="${on}" data-slash="${index}">${icon(item.icon)}<span>${escapeHtml(item.label)}</span></button>`;
        })
        .join("");
      return `<p class="slash-heading">${escapeHtml(group.title)}</p><div class="slash-grid">${tiles}</div>`;
    })
    .join("");
  /* Unter die Zeile mit dem „/“ legen */
  const node = open.ed.nodeAt(open.index);
  if (node) menu.style.top = `${node.offsetTop + node.offsetHeight}px`;
  menu.hidden = false;
  menu.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
}

/** Ist das Menü gerade offen? */
export function slashOpen() {
  return Boolean(open);
}

/** Menü schließen, ohne etwas zu wählen. */
export function closeSlash() {
  if (!open) return;
  const menu = menus.get(open.ed);
  menu.hidden = true;
  menu.innerHTML = "";
  open = null;
}

/* Die Zeile wird zum gewählten Baustein; das getippte „/…“ fällt weg. */
function choose(item) {
  const { ed, index, start, query } = open;
  closeSlash();
  const block = ed.blocks[index];
  if (!block) return;
  const text = block.text.slice(0, start) + block.text.slice(start + 1 + query.length);
  if (isTextKind(item.kind)) {
    ed.replace(index, 1, makeBlock(item.kind, { text }));
    ed.focusBlock(index, start);
    return;
  }
  /* Steht in der Zeile nur ein Link (z.B. ein eingefügter Maps-Link), wird
     er direkt zur Karte — ohne ihn noch einmal einfügen zu müssen. */
  if (item.kind !== "divider" && normalizeUrl(text)) {
    ed.replace(index, 1, makeBlock(item.kind));
    const input = ed.nodeAt(index).querySelector(".nb-url");
    input.value = text.trim();
    commitUrl(ed, index, input);
    return;
  }
  /* Trennlinie und Karten sind eigene Zeilen: steht noch Text in der Zeile,
     bleibt er darüber stehen. */
  const keep = text.trim() ? [{ ...block, text }] : [];
  const inserted = item.kind === "divider" ? [makeBlock("divider"), makeBlock()] : [makeBlock(item.kind)];
  ed.replace(index, 1, ...keep, ...inserted);
  ed.focusBlock(index + keep.length + (item.kind === "divider" ? 1 : 0), 0);
  if (item.kind !== "divider") ed.nodeAt(index + keep.length)?.scrollIntoView({ block: "nearest" });
}

/**
 * Nach jeder Eingabe in Zeile `index`: Menü öffnen, filtern oder schließen.
 * before ist der Text vor der Eingabe, caret die Cursorstelle danach.
 */
export function slashInput(ed, index, before, caret) {
  const text = ed.blocks[index].text;
  if (open) {
    const stillThere = open.ed === ed && open.index === index && text[open.start] === "/" && caret > open.start;
    const query = stillThere ? text.slice(open.start + 1, caret) : "";
    if (!stillThere || (/\s$/.test(query) && !filtered(query.trim()).length)) {
      closeSlash();
      return;
    }
    open.query = query;
    if (!filtered(query).length && query.length > MAX_QUERY) closeSlash();
    else render();
    return;
  }
  /* Genau ein „/“ dazugekommen, am Zeilenanfang oder nach einem Leerzeichen */
  const typed = text.length === before.length + 1 && text[caret - 1] === "/";
  const fresh = caret === 1 || /\s/.test(text[caret - 2] || "");
  if (!typed || !fresh) return;
  open = { ed, index, start: caret - 1, query: "", active: 0, items: [] };
  render();
  /* Beim Öffnen einmal ganz ins Bild holen (Abstand nach unten: styles/slash-menu.css) */
  menus.get(ed).scrollIntoView({ block: "nearest" });
}

/**
 * Pfeile, Enter und Escape bei offenem Menü. true, wenn die Taste dem Menü
 * galt (dann tut sie in der Zeile nichts).
 */
export function slashKey(event) {
  if (!open) return false;
  const count = open.items.length;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    open.active = (open.active + (event.key === "ArrowDown" ? 1 : -1) + count) % count;
    render();
    return true;
  }
  if (event.key === "Enter" && count) {
    choose(open.items[open.active]);
    return true;
  }
  if (event.key === "Escape") {
    closeSlash();
    return true;
  }
  return false;
}

/** Das Menü-Element für einen Editor anlegen (liegt direkt hinter ihm). */
export function createSlashMenu(ed) {
  const menu = document.createElement("div");
  menu.className = "slash-menu";
  menu.hidden = true;
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Bausteine");
  /* Tippen ins Menü schließt nicht die Tastatur (src/ui/write-tap.js) und
     nimmt der Zeile nicht den Cursor */
  menu.dataset.writeKeep = "";
  menu.addEventListener("mousedown", (event) => event.preventDefault());
  menu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-slash]");
    if (open && button) choose(open.items[Number(button.dataset.slash)]);
  });
  ed.root.after(menu);
  menus.set(ed, menu);
  /* Verlässt der Cursor die Zeile, schließt das Menü */
  ed.root.addEventListener("focusout", () => {
    setTimeout(() => {
      if (open && open.ed === ed && !ed.root.contains(document.activeElement)) closeSlash();
    });
  });
}
