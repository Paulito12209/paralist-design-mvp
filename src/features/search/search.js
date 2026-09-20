/*
 * Die Suchseite. Ohne Eingabe zeigt sie die Merklisten (zuletzt gesucht, am
 * häufigsten geöffnet, zuletzt geöffnet), mit Eingabe die Treffer.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/search/search.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * topOpenedCount / recentOpenedCount -> wie viele Zeilen die Übersicht zeigt
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
import { showSearch } from "../../ui/router.js";
import { isViewActive } from "../../ui/views.js";
import { knownOpens, mostOpened, searchHits } from "./search-data.js";

const topOpenedCount = 3;
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

/* Kopfzeile der Unterseiten: Zurück-Pfeil und Titel wie bei einem Arbeitsbereich. */
function listHead(title) {
  return `
    <div class="page-head">
      <button class="back-btn" type="button" data-search-back aria-label="Zurück">${icon("back")}</button>
      <h1 class="screen-title page-title">${escapeHtml(title)}</h1>
    </div>
  `;
}

/* Eigene Seite: entweder alles Gesuchte oder alles Geöffnete. */
function renderSubList() {
  if (ui.searchList === "searches") {
    dom.searchResults.innerHTML =
      listHead("Zuletzt gesucht") +
      (state.recentSearches.length
        ? `<div class="workspace-list">${state.recentSearches.map(queryRow).join("")}</div>`
        : emptyState(emptySearches));
    return;
  }

  const rows = mostOpened();
  dom.searchResults.innerHTML =
    listHead("Am häufigsten geöffnet") +
    (rows.length
      ? `<div class="workspace-list">${rows
          .map(({ open, item }) => resultRow(item, `${item.label} · ${open.count}× geöffnet`))
          .join("")}</div>`
      : emptyState(emptyOpened));
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

/* Die Übersicht: nur die Spitze jeder Liste, der Pfeil rechts führt auf die volle Liste. */
function renderOverviewLists() {
  const latestSearch = state.recentSearches[0];
  const most = mostOpened()
    .slice(0, topOpenedCount)
    .map(({ open, item }) => resultRow(item, `${item.label} · ${open.count}× geöffnet`))
    .join("");
  const groups = recentGroups();

  dom.searchResults.innerHTML = `
    <h1 class="screen-title">Suchen</h1>
    <div class="section-head">
      <h2>Zuletzt gesucht</h2>
      <button class="section-more" type="button" data-search-list="searches" aria-label="Alle anzeigen">${icon("chevron", "chevron")}</button>
    </div>
    ${latestSearch ? `<div class="workspace-list">${queryRow(latestSearch)}</div>` : emptyState({ ...emptySearches, compact: true, art: false })}
    <div class="section-head">
      <h2>Am häufigsten geöffnet</h2>
      <button class="section-more" type="button" data-search-list="most" aria-label="Alle anzeigen">${icon("chevron", "chevron")}</button>
    </div>
    ${most ? `<div class="workspace-list">${most}</div>` : emptyState({ ...emptyOpened, compact: true, art: false })}
    <div class="section-head"><h2>Zuletzt geöffnet</h2></div>
    ${
      groups.length
        ? groups
            .map(
              (group) =>
                `<h3 class="date-label">${escapeHtml(group.heading)}</h3><div class="workspace-list">${group.rows.join("")}</div>`
            )
            .join("")
        : emptyState({ ...emptyOpened, compact: true, art: false })
    }
  `;
}

/** Die Suchseite passend zum Zustand zeichnen. */
export function renderSearch() {
  if (ui.searchQuery) {
    renderHits();
    return;
  }
  if (ui.searchList) {
    renderSubList();
    return;
  }
  renderOverviewLists();
}

/* Wird verbraucht, sobald der folgende Klick nur die Tastatur zugemacht hat. */
let suppressNextClick = false;

/*
 * Solange die Tastatur offen ist, schließt ein Tippen in der Liste sie nur —
 * ohne den angetippten Eintrag zu öffnen. Das muss schon bei `mousedown`
 * passieren: sonst holt sich der angetippte Knopf zuerst selbst den Fokus,
 * das Suchfeld verliert ihn dadurch von allein, und der Klick käme mit
 * bereits zugeklappter Tastatur an — die Zeile würde also doch aufgehen.
 */
function onViewPointerDown(event) {
  if (!ui.searchTyping) return;
  event.preventDefault();
  suppressNextClick = true;
  dom.searchInput.blur();
}

/* Klicks auf der Suchseite, die nicht schon list-clicks.js erledigt. */
function onViewClick(event) {
  if (suppressNextClick) {
    suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const more = event.target.closest("[data-search-list]");
  if (more) {
    showSearch(false, more.dataset.searchList);
    return;
  }
  if (event.target.closest("[data-search-back]")) {
    history.back();
    return;
  }

  const query = event.target.closest("[data-search-query]");
  if (query) {
    dom.searchInput.value = query.dataset.searchQuery;
    ui.searchQuery = dom.searchInput.value;
    ui.searchList = null;
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
  el("view-search").addEventListener("mousedown", onViewPointerDown);
  el("view-search").addEventListener("click", onViewClick);

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
