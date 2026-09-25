/*
 * Die Suchseite. Ohne Eingabe zeigt sie drei Pillen: „Zuletzt geöffnet“
 * (Startpille, nach Tagen), „Am häufigsten“ (meistgeöffnet) und „Zuletzt
 * gesucht“ (die gemerkten Begriffe); mit Eingabe die Treffer. Die Zeilen
 * lassen sich auch bei offener Tastatur direkt antippen — ob getippt oder
 * gescrollt wurde, entscheidet src/features/search/search-tap.js.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/search/search.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * mostOpenedCount   -> wie viele Zeilen die Pille „Am häufigsten“ zeigt
 * recentOpenedCount -> wie viele geöffnete Seiten die Pille „Zuletzt geöffnet“ zeigt
 * searchTabs        -> Beschriftung und Reihenfolge der drei Pillen unter der Überschrift
 * emptySearches / emptyOpened / emptyHits -> die drei Platzhalter der Seite
 *
 * Schriftgrößen stehen in styles/search.css (--search-meta-size), der
 * Platzhalter steht in styles/empty-state.css.
 */

import { events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { historyDayHeading, shortOpenTime } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { noteSearch } from "../../data/opens.js";
import { state, ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { isViewActive } from "../../ui/views.js";
import { knownOpens, mostOpened, searchHits } from "./search-data.js";
import { initSearchTap } from "./search-tap.js";

const mostOpenedCount = 15;
const recentOpenedCount = 15;

/* Die drei Platzhalter. Angelegt wird hier nichts, deshalb ohne Pille. */
const emptySearches = {
  icon: "search",
  accent: "var(--cal-accent)",
  title: "Noch nichts gesucht",
  text: "Deine letzten Suchbegriffe stehen hier und lassen sich mit einem Tipp wiederholen.",
};

const emptyOpened = {
  icon: "history",
  accent: "var(--xp-line)",
  title: "Noch nichts geöffnet",
  text: "Was du oft aufmachst, findest du hier ohne Umweg wieder.",
};

const emptyHits = {
  icon: "search",
  accent: "var(--prio-spaeter)",
  title: "Keine Treffer",
};

/* Treffer im Titel hervorheben; der Rest bleibt abgesichert. */
function markHit(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const needle = escapeHtml(query);
  const at = safe.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return safe;
  return `${safe.slice(0, at)}<mark class="search-hit">${safe.slice(at, at + needle.length)}</mark>${safe.slice(at + needle.length)}`;
}

/* Eine Ergebniszeile. Das `data-`Attribut sagt, was sie öffnet. */
function resultRow(item, meta, query = "") {
  const attr =
    item.kind === "entry"
      ? `data-open-entry="${item.id}"`
      : item.kind === "workspace"
        ? `data-open-workspace="${item.id}"`
        : `data-open-overview="${item.id}"`;
  return `
    <button class="search-row" type="button" ${attr}>
      ${icon(item.icon)}
      <div class="search-copy">
        <p class="search-title">${markHit(item.title, query)}</p>
        <p class="search-meta">${escapeHtml(meta)}</p>
      </div>
      ${icon("chevron", "chevron")}
    </button>
  `;
}

/* Eine Zeile je gemerktem Suchbegriff. */
function queryRow(query) {
  return `
    <button class="search-row search-row-query" type="button" data-search-query="${escapeHtml(query)}">
      ${icon("search")}
      <div class="search-copy"><p class="search-title">${escapeHtml(query)}</p></div>
    </button>
  `;
}

/* Treffer zum eingegebenen Begriff. */
function renderHits() {
  const hits = searchHits(ui.searchQuery);
  dom.searchResults.innerHTML =
    `<h1 class="screen-title">Suchen</h1>` +
    (hits.length
      ? `
        <div class="section-head"><h2>Ergebnisse</h2></div>
        <div class="workspace-list">${hits
          .map((item) => resultRow(item, item.note ? `${item.label} · ${item.note}` : item.label, ui.searchQuery))
          .join("")}</div>
      `
      : emptyState({ ...emptyHits, text: `Zu „${ui.searchQuery}“ gibt es nichts. Versuch ein kürzeres Wort.` }));
}

/* Zuletzt geöffnet, nach Tagen gruppiert, damit „Heute“ und „Gestern“ getrennt stehen. */
function recentGroups() {
  const recent = knownOpens()
    .sort((a, b) => b.open.ts - a.open.ts)
    .slice(0, recentOpenedCount);

  const groups = [];
  recent.forEach(({ open, item }) => {
    const heading = historyDayHeading(open.ts);
    const row = resultRow(item, `${item.label} · ${shortOpenTime(open.ts)}`);
    const group = groups.find((entry) => entry.heading === heading);
    if (group) group.rows.push(row);
    else groups.push({ heading, rows: [row] });
  });
  return groups;
}

/* Die drei Pillen unter der Überschrift; wie auf der Seite eines Eintrags.
   Die erste ist die, auf der man beim Öffnen der Suche landet. */
const searchTabs = [
  { id: "recent", label: "Zuletzt geöffnet" },
  { id: "most", label: "Am häufigsten" },
  { id: "searched", label: "Zuletzt gesucht" },
];

function tabsMarkup() {
  return `<div class="tab-pills page-pills">${searchTabs
    .map(
      (tab) =>
        `<button class="tab-pill${tab.id === ui.searchTab ? " is-active" : ""}" type="button" data-search-tab="${tab.id}">${tab.label}</button>`
    )
    .join("")}</div>`;
}

/* Pille „Zuletzt geöffnet“: die zuletzt geöffneten Seiten nach Tagen. */
function recentTabMarkup() {
  const groups = recentGroups();
  if (!groups.length) return emptyState(emptyOpened);
  return groups
    .map(
      (group) =>
        `<h3 class="date-label">${escapeHtml(group.heading)}</h3><div class="workspace-list">${group.rows.join("")}</div>`
    )
    .join("");
}

/* Pille „Am häufigsten“: die meistgeöffneten Seiten mit ihrer Anzahl. */
function mostTabMarkup() {
  const rows = mostOpened()
    .slice(0, mostOpenedCount)
    .map(({ open, item }) => resultRow(item, `${item.label} · ${open.count}× geöffnet`))
    .join("");
  return rows ? `<div class="workspace-list">${rows}</div>` : emptyState(emptyOpened);
}

/* Pille „Zuletzt gesucht“: alle gemerkten Suchbegriffe, der neueste oben. */
function searchedTabMarkup() {
  return state.recentSearches.length
    ? `<div class="workspace-list">${state.recentSearches.map(queryRow).join("")}</div>`
    : emptyState(emptySearches);
}

const tabMarkup = { recent: recentTabMarkup, most: mostTabMarkup, searched: searchedTabMarkup };

/* Die Übersicht ohne Eingabe: Überschrift, Pillen, darunter die gewählte Liste. */
function renderOverviewLists() {
  const markup = tabMarkup[ui.searchTab] || recentTabMarkup;
  dom.searchResults.innerHTML = `<h1 class="screen-title">Suchen</h1>` + tabsMarkup() + markup();
}

/** Pille wählen und die Übersicht neu zeichnen. */
function selectTab(id) {
  if (ui.searchTab === id) return;
  ui.searchTab = id;
  renderOverviewLists();
}

/** Die Suchseite passend zum Zustand zeichnen. */
export function renderSearch() {
  if (ui.searchQuery) {
    renderHits();
    return;
  }
  /* Ältere Verlaufseinträge (#/suchen/gesucht, #/suchen/haeufig) zeigen
     heute einfach die passende Pille. */
  if (ui.searchList) {
    ui.searchTab = ui.searchList === "searches" ? "searched" : "most";
    ui.searchList = null;
  }
  renderOverviewLists();
}

/* Klicks auf der Suchseite, die nicht schon list-clicks.js erledigt. */
function onViewClick(event) {
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

  /* Waagerecht wischen wechselt die Pille — nur auf der Übersicht, wo es Pillen gibt. */
  initPillSwipe(el("view-search"), {
    order: searchTabs.map((tab) => tab.id),
    current: () => ui.searchTab,
    select: selectTab,
    enabled: () => !ui.searchQuery && !ui.searchList,
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
