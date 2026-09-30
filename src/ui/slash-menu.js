/*
 * Das „/“-Menü im Inhalt einer Notiz, wie in Notion: „/“ am Anfang einer
 * Zeile oder nach einem Leerzeichen öffnet unter der Zeile eine Auswahl aller
 * Bausteine, in Gruppen mit Überschrift und zwei Kacheln je Reihe. Weitertippen
 * filtert („/vid“ -> Video), Pfeiltasten und Enter wählen, Escape oder ein
 * Leerzeichen ohne Treffer schließt. Das getippte „/…“ verschwindet beim Wählen.
 * Steht in der Zeile sonst nur ein Link, wird er mit Standort, Video oder
 * Web-Lesezeichen gleich zur Karte.
 *
 * Auf dem Handy, solange die Leiste über der Tastatur steht
 * (src/ui/block-bar.js), öffnet „/“ stattdessen deren Auswahl an Stelle der
 * Tastatur — wie das Plus in der Leiste. Unter der Zeile schwebt dann nichts,
 * und die Seite rollt nicht, um Platz für ein Menü zu schaffen.
 * Pfad: src/ui/slash-menu.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * MAX_QUERY    -> nach so vielen Zeichen ohne Treffer schließt das Menü
 * Welche Bausteine im Menü stehen: blockGroups in src/ui/block-choices.js.
 *
 * Aussehen: styles/slash-menu.css.
 */

import { applyChoice, blockGroups, choicesMarkup } from "./block-choices.js";
import { barShown, openPicker } from "./block-bar.js";

const MAX_QUERY = 12;

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
  return blockGroups
    .map((group) => ({ title: group.title, items: group.items.filter((item) => matches(item, query)) }))
    .filter((group) => group.items.length);
}

function render() {
  const menu = menus.get(open.ed);
  const groups = filtered(open.query);
  open.items = groups.flatMap((group) => group.items);
  open.active = Math.min(open.active, open.items.length - 1);
  menu.innerHTML = choicesMarkup(groups, open.active);
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
  applyChoice(ed, index, item.kind, { cut: { start, length: 1 + query.length } });
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
  /* Handy mit Leiste über der Tastatur: die Auswahl kommt an die Stelle der Tastatur */
  if (barShown()) {
    openPicker({ start: caret - 1 });
    return;
  }
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
    const button = event.target.closest("[data-choice]");
    if (open && button) choose(open.items[Number(button.dataset.choice)]);
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
