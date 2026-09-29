/*
 * Die Such-Palette am Desktop: ein Dialog in der Fenstermitte mit Suchfeld
 * oben und Treffern in Gruppen darunter. Pfeiltasten wählen, Enter öffnet,
 * Esc schließt; die Seite dahinter bleibt stehen und wird leicht abgedunkelt.
 * Die letzte Zeile öffnet die Suchseite mit allen Treffern. Ohne Suchwort
 * zeigt die Palette „Zuletzt geöffnet“, „Am häufigsten“ und „Zuletzt gesucht“.
 * Geöffnet wird sie über ⌘K, „/“ (src/shell/desk.js), das Suchfeld der
 * Seitenleiste und den runden Such-Knopf der Reiterzeile
 * (src/shell/desk-head.js). Sie legt keinen Verlaufsschritt an: sie ist
 * flüchtig, Browser-Zurück schließt sie einfach mit.
 * Die Gruppen kommen aus src/features/search/search-palette-data.js — über
 * load("search"), weil src/shell/ keinen Bereich direkt importieren darf.
 * Pfad: src/shell/search-palette.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * placeholder -> grauer Text im leeren Suchfeld der Palette
 * allLabel    -> letzte Zeile mit Suchwort („Alle 9 Ergebnisse anzeigen“)
 * pageLabel   -> letzte Zeile ohne Suchwort oder ohne Treffer
 * emptyText   -> Hinweis, wenn nichts passt oder noch nichts geöffnet wurde
 *
 * Maße, Farben und das Auftauchen stehen in styles/search-palette.css.
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { load } from "../core/lazy.js";
import { noteSearch } from "../data/opens.js";
import { ui } from "../data/state.js";
import { keyCap } from "../ui/dot-keys.js";
import { openEntryOrFile, openTarget, showSearch } from "../ui/router.js";
import { isViewActive } from "../ui/views.js";

const placeholder = "Suchen";
const allLabel = (total) => (total === 1 ? "Das Ergebnis auf der Suchseite zeigen" : `Alle ${total} Ergebnisse anzeigen`);
const pageLabel = "Suchseite öffnen";
const emptyText = (query) => (query ? `Zu „${query}“ gibt es nichts.` : "Noch nichts geöffnet oder gesucht.");

let backdrop = null;
let input = null;
let list = null;
/* Das geladene Such-Modul; bis es da ist, zeigt die Palette nur das Feld. */
let search = null;
/* Alle wählbaren Zeilen der Reihe nach, die letzte ist „Alle Ergebnisse“. */
let rows = [];
/* Gewählte Zeile; -1 heißt: keine — Enter öffnet dann die Suchseite. */
let selected = -1;
/* Wo der Fokus vor dem Öffnen stand; dorthin kehrt er beim Schließen zurück. */
let returnTo = null;
/* Solange der Fokus zurück ins Suchfeld der Seitenleiste springt, darf das
   die Palette nicht gleich wieder öffnen. */
let returning = false;

/** Ist die Palette gerade offen? */
export function isPaletteOpen() {
  return Boolean(backdrop && !backdrop.hidden);
}

function query() {
  return input.value.trim();
}

/* Eine Treffer-Zeile; `index` verbindet sie mit `rows` und der Tastatur-Wahl. */
function rowMarkup(item, index, text) {
  const title = search.markHit(item.title, text);
  return `
    <button class="palette-row" type="button" role="option" id="palette-opt-${index}" data-palette-index="${index}" tabindex="-1">
      ${icon(item.icon)}
      <span class="palette-title">${title}</span>
      <span class="palette-meta">${escapeHtml(item.meta || "")}</span>
      ${keyCap("Enter", " palette-enter")}
    </button>`;
}

function footerMarkup(index, text, total) {
  const label = text && total ? allLabel(total) : pageLabel;
  return `
    <button class="palette-row palette-all" type="button" role="option" id="palette-opt-${index}" data-palette-index="${index}" tabindex="-1">
      ${icon("search")}
      <span class="palette-title">${escapeHtml(label)}</span>
      ${keyCap("Enter", " palette-enter")}
    </button>`;
}

/* Gruppen und Zeilen neu setzen. Die Wahl springt dabei auf „keine“ zurück. */
function render() {
  if (!search) return;
  const text = query();
  const { groups, total } = search.paletteGroups(text);
  rows = [];
  let markup = "";
  groups.forEach((group) => {
    markup += `<div class="palette-group" role="group" aria-label="${escapeHtml(group.title)}"><p class="palette-heading" aria-hidden="true">${escapeHtml(group.title)}</p>`;
    group.items.forEach((item) => {
      markup += rowMarkup(item, rows.length, text);
      rows.push(item);
    });
    markup += "</div>";
  });
  if (!groups.length) markup += `<p class="palette-empty">${escapeHtml(emptyText(text))}</p>`;
  markup += footerMarkup(rows.length, text, total);
  rows.push({ kind: "all" });
  list.innerHTML = markup;
  select(-1);
}

/* Zeile wählen: Markierung, Vorlesehilfe und sichtbar halten. */
function select(index) {
  selected = index;
  list.querySelectorAll(".palette-row").forEach((row) => {
    const chosen = Number(row.dataset.paletteIndex) === index;
    row.classList.toggle("is-selected", chosen);
    row.setAttribute("aria-selected", String(chosen));
  });
  /* Ohne Wahl gehört das Schild „Enter“ der letzten Zeile — dorthin führt Enter dann. */
  list.classList.toggle("is-unselected", index < 0);
  if (index < 0) {
    input.removeAttribute("aria-activedescendant");
    return;
  }
  input.setAttribute("aria-activedescendant", `palette-opt-${index}`);
  list.querySelector(`[data-palette-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
}

/* Pfeil hoch oder runter; am Ende geht es über „keine Wahl“ wieder von vorn. */
function move(step) {
  if (!rows.length) return;
  let next = selected + step;
  if (next >= rows.length) next = -1;
  if (next < -1) next = rows.length - 1;
  select(next);
}

/* Die Suchseite in der Mitte öffnen, mit dem Suchwort der Palette. */
function openAll() {
  const text = query();
  noteSearch(text);
  close(false);
  dom.searchInput.value = text;
  showSearch();
  load("search").then((module) => module.renderSearch());
}

/* Eine Zeile ausführen: Treffer öffnen, Suchbegriff einsetzen oder alles zeigen. */
function run(index) {
  const item = rows[index];
  if (!item || item.kind === "all") {
    openAll();
    return;
  }
  if (item.kind === "query") {
    input.value = item.title;
    render();
    input.focus();
    return;
  }
  noteSearch(query());
  close(false);
  if (item.kind === "entry") openEntryOrFile(item.id);
  else if (item.kind === "workspace") openTarget("workspace", item.id);
  else if (item.kind === "overview") openTarget("overview", item.id);
}

function onKeyDown(event) {
  const key = event.key;
  if (key === "ArrowDown" || key === "ArrowUp") move(key === "ArrowDown" ? 1 : -1);
  else if (key === "Enter") run(selected);
  else if (key === "Escape") close();
  /* Tab bleibt im Feld: die Palette ist ein Dialog, der Fokus verlässt ihn nicht. */
  else if (key === "Tab") input.focus();
  /* ⌘K bei offener Palette: das Suchwort markieren, statt etwas anderes zu tun. */
  else if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "k") input.select();
  else return;
  /* Behandelt: die Tastenkürzel in src/shell/desk.js lassen die Taste dann liegen. */
  event.preventDefault();
}

function onClick(event) {
  if (event.target === backdrop) {
    close();
    return;
  }
  const row = event.target.closest("[data-palette-index]");
  if (row) run(Number(row.dataset.paletteIndex));
}

/* Die Maus wählt mit: was sie überfährt, öffnet danach auch Enter. */
function onPointerMove(event) {
  const row = event.target.closest("[data-palette-index]");
  if (row && Number(row.dataset.paletteIndex) !== selected) select(Number(row.dataset.paletteIndex));
}

function mount() {
  backdrop = document.createElement("div");
  backdrop.className = "palette-backdrop";
  backdrop.hidden = true;
  /* role=dialog und aria-modal: Vorlesehilfen lesen nur die Palette, nicht die Seite dahinter */
  backdrop.innerHTML = `
    <div class="palette" role="dialog" aria-modal="true" aria-label="Suchen">
      <div class="palette-field">
        ${icon("search", "palette-field-icon")}
        <input class="palette-input" type="text" placeholder="${escapeHtml(placeholder)}" form="no-history"
          role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" spellcheck="false" />
        ${keyCap("Esc")}
      </div>
      <div class="palette-list" id="palette-list" role="listbox" aria-label="Treffer"></div>
    </div>`;
  dom.device.append(backdrop);
  input = backdrop.querySelector(".palette-input");
  list = backdrop.querySelector(".palette-list");

  input.addEventListener("input", render);
  input.addEventListener("keydown", onKeyDown);
  backdrop.addEventListener("click", onClick);
  list.addEventListener("pointermove", onPointerMove);
  /* Ein Klick auf eine Zeile nimmt dem Feld den Fokus nicht: Pfeile gehen danach weiter. */
  list.addEventListener("mousedown", (event) => event.preventDefault());
}

/**
 * Palette öffnen. Auf der Suchseite steht deren Suchwort schon drin.
 * @param seed Zeichen, das schon getippt wurde (etwa im Suchfeld der Seitenleiste).
 */
export function openPalette(seed = "") {
  if (!backdrop) mount();
  if (isPaletteOpen()) {
    input.focus();
    input.select();
    return;
  }
  returnTo = document.activeElement;
  input.value = seed || (isViewActive("search") ? ui.searchQuery : "");
  backdrop.hidden = false;
  input.focus();
  if (!seed) input.select();
  if (search) render();
  else {
    list.innerHTML = "";
    load("search").then((module) => {
      search = module;
      if (isPaletteOpen()) render();
    });
  }
}

/**
 * Palette schließen. Der Fokus kehrt dorthin zurück, wo er vorher stand —
 * außer beim Öffnen eines Treffers (`restore = false`): dann gehört er der neuen Seite.
 */
function close(restore = true) {
  if (!isPaletteOpen()) return;
  backdrop.hidden = true;
  const target = returnTo;
  returnTo = null;
  if (document.activeElement === input) input.blur();
  if (!restore || !target?.isConnected || target === document.body) return;
  returning = target === dom.searchInput;
  target.focus();
  returning = false;
}

/** Palette schließen, etwa über Escape in src/shell/desk.js. */
export function closePalette() {
  close();
}

/**
 * Am Desktop übernimmt die Palette das Suchfeld der Seitenleiste: Klick,
 * Fokus und Tippen darin öffnen sie. src/shell/search-bar.js fragt hier
 * zuerst; `true` heißt „erledigt, nichts weiter tun“.
 * @param isDesk sagt, ob gerade die Desktop-Fassung zu sehen ist.
 */
export function takeOverSearchField(event, isDesk) {
  if (!isDesk) return false;
  if (event.type === "focus" && returning) return true;
  if (event.type === "keydown") {
    const plain = !event.metaKey && !event.ctrlKey && !event.altKey;
    const typed = plain && event.key.length === 1 && event.key !== " ";
    const opens = typed || event.key === "Enter" || event.key === "ArrowDown" || event.key === " ";
    /* Tab, Escape und Kürzel gehen ihren gewohnten Weg (src/shell/desk.js). */
    if (!opens) return true;
    event.preventDefault();
    openPalette(typed ? event.key : "");
    return true;
  }
  openPalette();
  return true;
}
