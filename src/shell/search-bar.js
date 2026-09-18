/*
 * Das Suchfeld in der Kopfzeile. Es liegt außerhalb der Suchseite, damit man
 * von jeder Seite aus tippen kann; die Suchseite selbst wird beim ersten
 * Antippen nachgeladen.
 * Pfad: src/shell/search-bar.js
 *
 * Keine anpassbaren visuellen Werte: Höhe und Rundung stehen in
 * styles/top-bar.css (--search-bar-height, --search-bar-radius).
 */

import { dom, el } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { noteSearch } from "../data/opens.js";
import { ui } from "../data/state.js";
import { showSearch } from "../ui/router.js";
import { isViewActive } from "../ui/views.js";

/* Neu zeichnen, sobald das Modul da ist. */
function redrawSearch() {
  load("search").then((module) => module.renderSearch());
}

/** Suchfeld und Lupe anmelden. */
export function initSearchBar() {
  el("search-entry").addEventListener("click", () => showSearch());
  dom.searchInput.addEventListener("focus", () => showSearch());

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
