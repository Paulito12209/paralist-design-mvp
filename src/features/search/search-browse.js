/*
 * Die drei Reiter der Suche ohne Eingabe: „Zuletzt geöffnet“ (Startreiter,
 * nach Tagen), „Am häufigsten“ (meistgeöffnet) und „Zuletzt gesucht“ (die
 * gemerkten Begriffe). Die ersten beiden lassen sich wie die Treffer sortieren
 * und filtern (Ort, Bearbeitet, Erledigte); jeder merkt sich seine Wahl, bis
 * die App neu lädt. „Zuletzt gesucht“ zeigt nur die Anzahl — dort gibt es
 * nichts zu sortieren oder zu filtern.
 * Pfad: src/features/search/search-browse.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * mostOpenedCount   -> wie viele Zeilen der Reiter „Am häufigsten“ zeigt
 * recentOpenedCount -> wie viele geöffnete Seiten der Reiter „Zuletzt geöffnet“ zeigt
 * searchTabs        -> Beschriftung und Reihenfolge der drei Reiter
 * oftenSort         -> Sortierung nach Häufigkeit: Name, Icon, Wortlaut beider Richtungen
 * browseSorts       -> welche Sortierungen jeder Reiter anbietet; die erste ist die Vorgabe
 * emptySearches / emptyOpened -> die Platzhalter der Reiter
 *
 * Wie die Zeilen aussehen, steht in styles/search.css, der Platzhalter in
 * styles/empty-state.css.
 */

import { historyDayHeading, shortOpenTime } from "../../core/format.js";
import { escapeHtml } from "../../core/html.js";
import { state } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { knownOpens, mostOpened } from "./search-data.js";
import { defaultRefine, editedTs, passesLimits, refineSorts } from "./search-refine.js";
import { queryRow, resultRow } from "./search-rows.js";
import { countRowMarkup, countText, words } from "./search-sheet.js";

const mostOpenedCount = 15;
const recentOpenedCount = 15;

/* Die erste ist die, auf der man beim Öffnen der Suche landet. */
export const searchTabs = [
  { id: "recent", label: "Zuletzt geöffnet" },
  { id: "most", label: "Am häufigsten" },
  { id: "searched", label: "Zuletzt gesucht" },
];

/* Die Platzhalter. Angelegt wird hier nichts, deshalb ohne Pille. */
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

const oftenSort = { id: "haeufig", label: "Häufigkeit", icon: "trend", up: "Seltenste zuerst", down: "Häufigste zuerst", asc: false };
const sortById = (id) => refineSorts.find((sort) => sort.id === id);

const browseSorts = {
  recent: [sortById("geoeffnet"), sortById("bearbeitet"), sortById("titel")],
  most: [oftenSort, sortById("geoeffnet"), sortById("bearbeitet"), sortById("titel")],
};

/* Die Wahl je Reiter; entsteht beim ersten Zeichnen. */
const refines = {};

/** Sortierung und Filter des Reiters — null bei „Zuletzt gesucht“. */
export function browseRefine(tab) {
  const sorts = browseSorts[tab];
  if (!sorts) return null;
  refines[tab] ||= { ...defaultRefine(), sort: sorts[0].id, asc: sorts[0].asc };
  return refines[tab];
}

/** Die Sortierungen des Reiters für das Blatt. */
export function browseSortsOf(tab) {
  return browseSorts[tab];
}

/* Wonach verglichen wird; Titel vergleicht nach Alphabet. */
const sortKeys = {
  geoeffnet: ({ open }) => open.ts,
  haeufig: ({ open }) => open.count,
  bearbeitet: ({ item }) => editedTs(item),
};

/* Merkposten aufsteigend sortieren und in der gewählten Richtung zurückgeben. */
function sortRows(rows, refine) {
  const key = sortKeys[refine.sort];
  const sorted = [...rows].sort((a, b) => (key ? key(a) - key(b) : a.item.title.localeCompare(b.item.title, "de")));
  return refine.asc ? sorted : sorted.reverse();
}

/* Nach Tagen gruppiert, damit „Heute“ und „Gestern“ getrennt stehen. */
function dayGroupsMarkup(rows) {
  const groups = [];
  rows.forEach(({ open, item }) => {
    const heading = historyDayHeading(open.ts);
    const row = resultRow(item, `${item.label} · ${shortOpenTime(open.ts)}`);
    const group = groups.find((entry) => entry.heading === heading);
    if (group) group.rows.push(row);
    else groups.push({ heading, rows: [row] });
  });
  return groups
    .map((group) => `<h3 class="date-label">${escapeHtml(group.heading)}</h3><div class="workspace-list">${group.rows.join("")}</div>`)
    .join("");
}

/* Die Zeilen eines der beiden Reiter mit geöffneten Seiten; nach Datum des
   Öffnens sortiert stehen sie unter Tagesmarken. */
function openedMarkup(tab, rows, refine) {
  if (refine.sort === "geoeffnet") return dayGroupsMarkup(rows);
  const meta = ({ open, item }) => (tab === "most" ? `${item.label} · ${open.count}× geöffnet` : `${item.label} · ${shortOpenTime(open.ts)}`);
  return `<div class="workspace-list">${rows.map((row) => resultRow(row.item, meta(row))).join("")}</div>`;
}

/* Die Merkposten eines Reiters, gefiltert und gekürzt — gekürzt wird in seiner
   eigenen Reihenfolge, sortiert erst danach. */
function openedRows(tab, refine) {
  const source = tab === "most" ? mostOpened() : knownOpens().sort((a, b) => b.open.ts - a.open.ts);
  const all = source.slice(0, tab === "most" ? mostOpenedCount : recentOpenedCount);
  const kept = source.filter(({ item }) => passesLimits(item, refine)).slice(0, all.length);
  return { all, rows: sortRows(kept, refine) };
}

/**
 * Was der Reiter zeichnet: die Zeile mit der Anzahl (und Sortieren/Filtern)
 * und die Liste darunter. `limitedEmpty(refine)` liefert den Platzhalter,
 * wenn die Filter alles ausblenden.
 */
export function browseMarkup(tab, limitedEmpty) {
  if (tab === "searched") {
    const list = state.recentSearches;
    return {
      count: countRowMarkup(countText(list.length, words.queryOne, words.queryMany)),
      list: list.length ? `<div class="workspace-list">${list.map(queryRow).join("")}</div>` : emptyState(emptySearches),
    };
  }
  const refine = browseRefine(tab);
  const { all, rows } = openedRows(tab, refine);
  const list = rows.length ? openedMarkup(tab, rows, refine) : all.length ? limitedEmpty(refine) : emptyState(emptyOpened);
  return {
    count: countRowMarkup(countText(rows.length, words.entryOne, words.entryMany), refine, browseSorts[tab]),
    list,
  };
}
