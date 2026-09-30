/*
 * Das Suchfeld in der Kopfzeile. Es liegt außerhalb der Suchseite, damit man
 * von jeder Seite aus tippen kann; die Suchseite selbst wird beim ersten
 * Antippen nachgeladen.
 *
 * Auf der Suche tritt die untere Navigation zurück (styles/search.css); an
 * ihrer Stelle stehen drei Knöpfe: Mikrofon, die Suchen-Pille und Abbrechen.
 * Steht etwas im Feld, heißt die Pille „Neue Suche“ und leert es — die
 * Tastatur zu holen hilft dann nichts, man hat ja gerade getippt. Das × im
 * Kreis rechts im Feld leert es auch, lässt aber den Cursor im Feld.
 * Solange die Tastatur offen ist (ui.searchTyping), sind sie weg; die Zeilen
 * darüber lassen sich trotzdem direkt antippen
 * (src/features/search/search-tap.js).
 * Am Desktop öffnet das Feld stattdessen die Such-Palette
 * (src/shell/search-palette.js, angemeldet über setSearchTakeover).
 * Pfad: src/shell/search-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pillLabels -> Wort auf der Pille unten: ohne Eingabe, mit Eingabe
 *
 * Höhe und Rundung des Felds stehen in styles/top-bar.css (--search-bar-height,
 * --search-bar-radius, dort auch der Kreis mit dem ×); die Knöpfe unten
 * stehen in styles/search.css (--search-pill-height, --search-pill-side).
 */

import { events, on } from "../core/bus.js";
import { dom, el } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { noteSearch } from "../data/opens.js";
import { ui } from "../data/state.js";
import { closeSearch, showSearch } from "../ui/router.js";
import { isViewActive } from "../ui/views.js";
import { initSearchVoice } from "./search-voice.js";

/*
 * Wer das Feld übernehmen will — am Desktop die Such-Palette. Wird von
 * src/shell/desk.js hereingegeben; gibt sie `true` zurück, ist das Ereignis
 * erledigt und die Suchseite bleibt zu.
 */
let takeOver = () => false;

/* „Neue Suche“ statt „Suche leeren“: sagt, was danach kommt, und klingt
   nicht danach, als würde der Verlauf der Suche gelöscht. */
const pillLabels = { empty: "Suchen", filled: "Neue Suche" };

/* Die Pille unten sagt, was sie tut: Tastatur holen oder das Feld leeren. */
function syncPill() {
  dom.searchPill.textContent = ui.searchQuery ? pillLabels.filled : pillLabels.empty;
}

/* Feld leeren und die Übersicht der Suche zeigen. */
function clearQuery() {
  dom.searchInput.value = "";
  ui.searchQuery = "";
  ui.searchList = null;
  syncPill();
  if (isViewActive("search")) redrawSearch();
}

/** Feld an jemand anderen abgeben (siehe `takeOver`). */
export function setSearchTakeover(handler) {
  takeOver = handler;
}

/* Neu zeichnen, sobald das Modul da ist. */
function redrawSearch() {
  load("search").then((module) => module.renderSearch());
}

/* Tastatur öffnet sich: Navigation bleibt unten, Suchen-Pille verschwindet. */
function onFocus(event) {
  if (takeOver(event)) return;
  ui.searchTyping = true;
  document.body.classList.add("is-search-typing");
  showSearch();
}

/* Tastatur schließt sich (zugeklappt, Enter, Wechsel der Seite): Pille zeigt sich wieder. */
function onBlur() {
  ui.searchTyping = false;
  document.body.classList.remove("is-search-typing");
}

/** Suchfeld und Lupe anmelden. */
export function initSearchBar() {
  el("search-entry").addEventListener("click", (event) => {
    if (!takeOver(event)) showSearch();
  });
  dom.searchInput.addEventListener("focus", onFocus);
  dom.searchInput.addEventListener("blur", onBlur);

  /* Suchen-Pille unten: erscheint erst, wenn die Tastatur zugeklappt wurde.
     Leeres Feld: holt die Tastatur mit dem Cursor im Suchfeld zurück.
     Mit Eingabe: leert das Feld, die Tastatur bleibt zu. */
  dom.searchPill.addEventListener("click", () => {
    if (ui.searchQuery) clearQuery();
    else dom.searchInput.focus();
  });

  /* × im Feld: leert es und lässt den Cursor drin. mousedown ohne Folgen,
     sonst verlöre das Feld kurz den Fokus und die Tastatur zuckte. */
  const clear = el("search-clear");
  clear.addEventListener("mousedown", (event) => event.preventDefault());
  clear.addEventListener("click", (event) => {
    /* Nicht bis zum Feld (#search-entry) durchreichen — das öffnet am Desktop die Palette */
    event.preventDefault();
    event.stopPropagation();
    clearQuery();
    dom.searchInput.focus();
  });

  /* Die Suchseite meldet jedes Neuzeichnen — auch wenn ein gemerkter Begriff
     eingesetzt wurde; dann stimmt das Wort auf der Pille wieder. */
  on(events.contextChanged, syncPill);

  /* Abbrechen: leert die Suche und geht zurück auf die Seite, von der aus sie
     geöffnet wurde (Kalender bleibt Kalender), nicht pauschal zur Übersicht. */
  el("search-close").addEventListener("click", () => {
    dom.searchInput.value = "";
    ui.searchQuery = "";
    ui.searchList = null;
    closeSearch();
  });

  initSearchVoice(el("search-voice"));

  /* Wurde die Tastatur weggewischt statt mit einem Tipp geschlossen, blinkt
     der Cursor sonst weiter im Suchfeld, ohne dass die Tastatur noch da ist. */
  on(events.keyboardClosed, () => {
    if (ui.searchTyping) dom.searchInput.blur();
  });

  dom.searchInput.addEventListener("input", () => {
    ui.searchQuery = dom.searchInput.value.trim();
    syncPill();
    /* Beim Tippen verlässt man eine Unterliste und landet in den Treffern. */
    if (ui.searchQuery) ui.searchList = null;
    if (!isViewActive("search")) showSearch();
    else redrawSearch();
  });

  /* change: Handy-Tastaturen schicken beim „Suchen“-Knopf kein Enter, aber immer ein change. */
  dom.searchInput.addEventListener("change", () => noteSearch(dom.searchInput.value));

  dom.searchInput.addEventListener("keydown", (event) => {
    if (takeOver(event)) return;
    if (event.key === "Enter") {
      event.preventDefault();
      noteSearch(ui.searchQuery);
      dom.searchInput.blur();
      redrawSearch();
      return;
    }
    if (event.key === "Escape") clearQuery();
  });
}
