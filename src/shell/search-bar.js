/*
 * Das Suchfeld in der Kopfzeile. Es liegt außerhalb der Suchseite, damit man
 * von jeder Seite aus tippen kann; die Suchseite selbst wird beim ersten
 * Antippen nachgeladen.
 *
 * Auf der Suche tritt die untere Navigation zurück (styles/search.css); an
 * ihrer Stelle stehen drei Knöpfe: Mikrofon, die Suchen-Pille und Abbrechen.
 * Solange die Tastatur offen ist (ui.searchTyping), sind sie weg; die Zeilen
 * darüber lassen sich trotzdem direkt antippen
 * (src/features/search/search-tap.js).
 * Pfad: src/shell/search-bar.js
 *
 * Keine anpassbaren visuellen Werte: Höhe und Rundung stehen in
 * styles/top-bar.css (--search-bar-height, --search-bar-radius); die Knöpfe
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

/* Neu zeichnen, sobald das Modul da ist. */
function redrawSearch() {
  load("search").then((module) => module.renderSearch());
}

/* Tastatur öffnet sich: Navigation bleibt unten, Suchen-Pille verschwindet. */
function onFocus() {
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
  el("search-entry").addEventListener("click", () => showSearch());
  dom.searchInput.addEventListener("focus", onFocus);
  dom.searchInput.addEventListener("blur", onBlur);

  /* Suchen-Pille unten rechts: erscheint erst, wenn die Tastatur zugeklappt
     wurde, und holt sie mit dem Cursor im Suchfeld zurück. */
  dom.searchPill.addEventListener("click", () => dom.searchInput.focus());

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
    /* Beim Tippen verlässt man eine Unterliste und landet in den Treffern. */
    if (ui.searchQuery) ui.searchList = null;
    if (!isViewActive("search")) showSearch();
    else redrawSearch();
  });

  /* change: Handy-Tastaturen schicken beim „Suchen“-Knopf kein Enter, aber immer ein change. */
  dom.searchInput.addEventListener("change", () => noteSearch(dom.searchInput.value));

  dom.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      noteSearch(ui.searchQuery);
      dom.searchInput.blur();
      redrawSearch();
      return;
    }
    if (event.key === "Escape") {
      dom.searchInput.value = "";
      ui.searchQuery = "";
      redrawSearch();
    }
  });
}
