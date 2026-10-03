/*
 * Die Suche. Am Handy liegt sie als Overlay über der Seite, von der aus sie
 * geöffnet wurde (styles/search-overlay.css). Oben, deckend unter dem
 * Suchfeld, stehen die Reiter mit der Linie darunter und eine Zeile mit der
 * Anzahl, rechts Sortieren und Filtern; darunter läuft die Liste.
 * Ohne Eingabe sind es drei Reiter (search-browse.js): „Zuletzt geöffnet“,
 * „Am häufigsten“, „Zuletzt gesucht“; mit Eingabe die Arten der Treffer
 * (Alle, Projekte, Aufgaben …), die Chips der Eingrenzungen (search-sheet.js)
 * und die Treffer. Ist das Feld leer, fallen Filter und Sortierung der Treffer
 * auf die Vorgabe zurück — jede neue Suche beginnt bei „Relevanz“.
 * Geht ein Blatt (Sortieren, Filtern) auf, klappt die Tastatur zu; war sie
 * offen, kommt sie zurück, sobald das Blatt zu ist.
 * Die Zeilen lassen sich auch bei offener Tastatur direkt antippen — ob
 * getippt oder gescrollt wurde, entscheidet src/features/search/search-tap.js.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/search/search.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyHits / emptyLimited -> die Platzhalter, wenn nichts passt
 * resetLabel               -> Knopf unter dem Platzhalter, wenn Filter alles ausblenden
 *
 * Die Reiter ohne Eingabe und ihre Platzhalter stehen in search-browse.js,
 * Schriftgrößen in styles/search.css (--search-meta-size), der Platzhalter
 * in styles/empty-state.css.
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { noteSearch } from "../../data/opens.js";
import { ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe, revealActive } from "../../ui/pill-swipe.js";
import { isViewActive } from "../../ui/views.js";
import { browseMarkup, browseRefine, browseSortsOf, searchTabs } from "./search-browse.js";
import { defaultRefine, hasLimits, refinedHits } from "./search-refine.js";
import { resultRow } from "./search-rows.js";
import {
  chipsMarkup,
  clearChip,
  clearLimits,
  countRowMarkup,
  countText,
  kindPillsMarkup,
  openSearchFilter,
  openSearchSort,
  words,
} from "./search-sheet.js";
import { initSearchTap } from "./search-tap.js";

/* Für die Such-Palette am Desktop, die dieses Modul über load("search") holt. */
export { paletteGroups } from "./search-palette-data.js";
export { markHit } from "./search-rows.js";

const emptyHits = {
  icon: "search",
  accent: "var(--prio-spaeter)",
  title: "Keine Treffer",
};

const emptyLimited = {
  icon: "sliders",
  accent: "var(--prio-spaeter)",
  title: "Keine Treffer mit diesen Filtern",
  text: "Ohne die Eingrenzungen gäbe es Treffer.",
};
const resetLabel = "Filter zurücksetzen";

/* Platzhalter, wenn die Filter alles ausblenden: mit Knopf zum Zurücksetzen. */
function limitedEmpty() {
  return `${emptyState(emptyLimited)}<button class="search-reset" type="button" data-search-reset>${resetLabel}</button>`;
}

/* Kopf und Liste in die Seite schreiben. Der Titel „Suchen“ steht nur am
   Desktop, am Handy sagt das Feld oben genug (styles/search-overlay.css). */
function paint(tabs, count, rest) {
  /* Die Reiter stehen nach dem Neuzeichnen dort, wo man sie hingeschoben hat —
     sonst sprängen sie bei jeder Wahl im Blatt an den Anfang zurück. */
  const shift = dom.searchResults.querySelector(".search-tabs .tab-pills")?.scrollLeft || 0;
  dom.searchResults.innerHTML =
    `<h1 class="screen-title">Suchen</h1>` +
    `<div class="search-head"><div class="search-tabs">${tabs}</div>${count}</div>` +
    `<div class="search-list">${rest}</div>`;
  const bar = dom.searchResults.querySelector(".search-tabs .tab-pills");
  if (bar) bar.scrollLeft = shift;
}

/* Treffer zum eingegebenen Begriff: Arten, Anzahl mit Sortieren und Filter, Chips, Liste. */
function renderHits() {
  const refine = ui.searchRefine;
  const { pills, total, hits, hiddenByLimits } = refinedHits(ui.searchQuery, refine);
  const list = hits.length
    ? `<div class="workspace-list">${hits
        .map((item) => resultRow(item, item.note ? `${item.label} · ${item.note}` : item.label, ui.searchQuery))
        .join("")}</div>`
    : hiddenByLimits
      ? limitedEmpty()
      : emptyState({ ...emptyHits, text: `Zu „${ui.searchQuery}“ gibt es nichts. Versuch ein kürzeres Wort.` });
  const count = countRowMarkup(countText(total, words.hits, words.hits), refine);
  paint(kindPillsMarkup(pills, refine.type), count, chipsMarkup(refine) + list);
}

/* Die drei Reiter ohne Eingabe; wie auf der Seite eines Eintrags. */
function tabsMarkup() {
  return `<div class="tab-pills page-pills">${searchTabs
    .map(
      (tab) =>
        `<button class="tab-pill${tab.id === ui.searchTab ? " is-active" : ""}" type="button" data-search-tab="${tab.id}">${escapeHtml(tab.label)}</button>`
    )
    .join("")}</div>`;
}

/* Ohne Eingabe: Reiter, Anzahl, darunter die Liste des gewählten Reiters. */
function renderOverviewLists() {
  if (!searchTabs.some((tab) => tab.id === ui.searchTab)) ui.searchTab = searchTabs[0].id;
  const refine = browseRefine(ui.searchTab);
  const { count, list } = browseMarkup(ui.searchTab, limitedEmpty);
  paint(tabsMarkup(), count, (refine ? chipsMarkup(refine) : "") + list);
}

/** Reiter wählen und die Übersicht neu zeichnen. */
function selectTab(id) {
  if (ui.searchTab === id) return;
  ui.searchTab = id;
  renderSearch();
  revealActive(el("view-search"));
}

/** Die Suchseite passend zum Zustand zeichnen. */
export function renderSearch() {
  drawSearch();
  /* Am Desktop zeigt die Spalte rechts eine Vorschau des ersten Treffers (search-rail.js). */
  emit(events.contextChanged);
}

function drawSearch() {
  /* Leeres Feld = neue Suche: Filter und Sortierung zurück auf die Vorgabe */
  if (!ui.searchRefine || !ui.searchQuery) ui.searchRefine = defaultRefine();
  if (ui.searchQuery) {
    renderHits();
    return;
  }
  /* Ältere Verlaufseinträge (#/suchen/gesucht, #/suchen/haeufig) zeigen
     heute einfach den passenden Reiter. */
  if (ui.searchList) {
    ui.searchTab = ui.searchList === "searches" ? "searched" : "most";
    ui.searchList = null;
  }
  renderOverviewLists();
}

/* Art wählen; die Reiterzeile rollt die gewählte ins Bild. */
function selectKind(id) {
  if (ui.searchRefine.type === id) return;
  ui.searchRefine.type = id;
  renderSearch();
  revealActive(el("view-search"));
}

/* Die Art-Reiter der Treffer, fürs Wischen. */
function kindOrder() {
  return [...el("view-search").querySelectorAll("[data-search-kind]")].map((pill) => pill.dataset.searchKind);
}

/* Was Sortieren und Filtern gerade betreffen: die Treffer oder den Reiter ohne Eingabe. */
function activeRefine() {
  return ui.searchQuery ? ui.searchRefine : browseRefine(ui.searchTab);
}

/* Lag die Tastatur offen, als ein Blatt aufging? Dann wartet dieser Wächter,
   bis kein Blatt mehr offen ist, und holt sie zurück. */
let keyboardBack = null;

function anySheetOpen() {
  return !dom.sheet.hidden || Boolean(document.querySelector(".modal-backdrop:not([hidden])"));
}

/* Tastatur weg, sonst verdeckt sie das Blatt; war sie offen, kommt sie danach wieder. */
function keyboardAsideFor(openSheet) {
  const typing = ui.searchTyping;
  dom.searchInput.blur();
  openSheet();
  keyboardBack?.disconnect();
  keyboardBack = null;
  if (!typing) return;
  keyboardBack = new MutationObserver(() => {
    if (anySheetOpen()) return;
    keyboardBack.disconnect();
    keyboardBack = null;
    if (isViewActive("search")) dom.searchInput.focus();
  });
  /* Ein Blatt schließt, indem es hidden bekommt — darauf hören, egal welches Blatt */
  keyboardBack.observe(dom.device, { attributes: true, attributeFilter: ["hidden"], subtree: true });
}

/* Klicks auf die Bedienung: Art, Sortieren, Filter, Chip, Zurücksetzen.
   Gibt true zurück, wenn der Klick erledigt ist. */
function onRefineClick(event) {
  const kind = event.target.closest("[data-search-kind]");
  if (kind) {
    selectKind(kind.dataset.searchKind);
    return true;
  }
  const refine = activeRefine();
  if (!refine) return false;
  /* Ohne Eingabe hat jeder Reiter eigene Sortierungen; mit Eingabe gelten die der Treffer */
  const sorts = ui.searchQuery ? undefined : browseSortsOf(ui.searchTab);
  if (event.target.closest("[data-search-sort]")) {
    keyboardAsideFor(() => openSearchSort(refine, renderSearch, sorts));
    return true;
  }
  const filter = event.target.closest("[data-search-filter], [data-search-chip-open]");
  if (filter) {
    keyboardAsideFor(() => openSearchFilter(refine, renderSearch, filter.dataset.searchChipOpen, Boolean(ui.searchQuery)));
    return true;
  }
  const chip = event.target.closest("[data-search-chip]");
  if (chip) {
    clearChip(refine, chip.dataset.searchChip);
    renderSearch();
    return true;
  }
  if (event.target.closest("[data-search-reset]") && hasLimits(refine)) {
    clearLimits(refine);
    renderSearch();
    return true;
  }
  return false;
}

/* Klicks auf der Suchseite, die nicht schon list-clicks.js erledigt. */
function onViewClick(event) {
  if (onRefineClick(event)) return;
  const tab = event.target.closest("[data-search-tab]");
  if (tab) {
    selectTab(tab.dataset.searchTab);
    return;
  }

  const query = event.target.closest("[data-search-query]");
  if (query) {
    dom.searchInput.value = query.dataset.searchQuery;
    ui.searchQuery = dom.searchInput.value;
    renderSearch();
    return;
  }

  /* Ein geöffneter Treffer macht die Eingabe zu einer gemerkten Suche.
     Das Öffnen selbst erledigt src/ui/list-clicks.js für alle Listen gemeinsam. */
  if (event.target.closest("[data-open-entry], [data-open-workspace], [data-open-overview]")) {
    noteSearch(ui.searchQuery);
  }
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  /* Tippen oder Scrollen unterscheiden, auch bei offener Tastatur */
  initSearchTap(el("view-search"));
  el("view-search").addEventListener("click", onViewClick);

  /* Waagerecht wischen wechselt den Reiter — ohne Eingabe die Liste, bei
     Treffern die Art. */
  initPillSwipe(el("view-search"), {
    order: () => (ui.searchQuery ? kindOrder() : searchTabs.map((tab) => tab.id)),
    current: () => (ui.searchQuery ? ui.searchRefine.type : ui.searchTab),
    select: (id) => (ui.searchQuery ? selectKind(id) : selectTab(id)),
    enabled: () => !ui.searchList,
  });

  on(events.viewOpened, (name) => {
    if (name === "search") renderSearch();
  });
  on(events.dataChanged, () => {
    if (isViewActive("search")) renderSearch();
  });

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("search")) renderSearch();
}

init();
