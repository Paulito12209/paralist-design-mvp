/*
 * Die Gruppen der Such-Palette am Desktop (src/shell/search-palette.js).
 * Ohne Suchwort stehen dort die drei Listen, die am Handy Pillen der
 * Suchseite sind: „Zuletzt geöffnet“, „Am häufigsten“, „Zuletzt gesucht“.
 * Mit Suchwort die Treffer nach Art: Einträge, Aufgaben, Termine,
 * Arbeitsbereiche. Die Palette holt diese Datei über load("search") — sie
 * liegt in src/shell/ und darf keinen Bereich direkt importieren.
 * Pfad: src/features/search/search-palette-data.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * hitsPerGroup  -> wie viele Treffer je Gruppe die Palette zeigt; der Rest
 *                  steht auf der Suchseite hinter „Alle Ergebnisse anzeigen“
 * listLength    -> wie viele Zeilen jede der drei Listen ohne Suchwort zeigt
 * hitGroups     -> Überschrift und Reihenfolge der Treffer-Gruppen
 */

import { shortDay, shortOpenTime } from "../../core/format.js";
import { entryDay, entryTime, findEntry } from "../../data/queries.js";
import { state } from "../../data/state.js";
import { knownOpens, matchingItems, mostOpened } from "./search-data.js";

const hitsPerGroup = 4;
const listLength = 5;

/* Welche Treffer in welche Gruppe fallen. Übersichtskarten (Eingang,
   Favoriten …) zählen zu den Einträgen: sie sind Orte wie die Sammlungen. */
const hitGroups = [
  { id: "entries", title: "Einträge", takes: (item) => item.kind !== "workspace" && item.type !== "aufgabe" && item.type !== "termin" },
  { id: "tasks", title: "Aufgaben", takes: (item) => item.type === "aufgabe" },
  { id: "events", title: "Termine", takes: (item) => item.type === "termin" },
  { id: "workspaces", title: "Arbeitsbereiche", takes: (item) => item.kind === "workspace" },
];

/* Die kleine Angabe rechts: bei Aufgaben das Fälligkeitsdatum, bei Terminen
   Tag und Uhrzeit, sonst Art und Ablageort. */
function metaOf(item) {
  if (item.kind === "entry" && (item.type === "aufgabe" || item.type === "termin")) {
    const entry = findEntry(item.id);
    if (item.type === "termin" && entry) return [shortDay(entryDay(entry)), entryTime(entry)].filter(Boolean).join(" · ");
    if (entry?.date) return shortDay(entry.date);
  }
  return item.note ? `${item.label} · ${item.note}` : item.label;
}

/* Ein gemerkter Suchbegriff als Zeile: ein Klick setzt ihn ins Feld. */
function queryItem(query) {
  return { kind: "query", id: query, title: query, icon: "search", meta: "Suche" };
}

/* Die drei Listen der leeren Palette; leere Listen fallen weg. */
function emptyGroups() {
  const recent = knownOpens()
    .sort((a, b) => b.open.ts - a.open.ts)
    .slice(0, listLength)
    .map(({ open, item }) => ({ ...item, meta: `${item.label} · ${shortOpenTime(open.ts)}` }));
  /* Was schon unter „Zuletzt geöffnet“ steht, muss nicht noch einmal kommen. */
  const shown = new Set(recent.map((item) => `${item.kind}:${item.id}`));
  const most = mostOpened()
    .filter(({ item }) => !shown.has(`${item.kind}:${item.id}`))
    .slice(0, listLength)
    .map(({ open, item }) => ({ ...item, meta: `${open.count}× geöffnet` }));
  const searched = state.recentSearches.slice(0, listLength).map(queryItem);
  return [
    { id: "recent", title: "Zuletzt geöffnet", items: recent },
    { id: "most", title: "Am häufigsten", items: most },
    { id: "searched", title: "Zuletzt gesucht", items: searched },
  ].filter((group) => group.items.length);
}

/**
 * Die Gruppen der Palette zu einem Suchwort.
 * @returns {{ groups: { id, title, items }[], total: number }} `total` zählt
 *   alle Treffer, auch die, die in der Palette keinen Platz mehr haben.
 */
export function paletteGroups(query) {
  const text = String(query || "").trim();
  if (!text) return { groups: emptyGroups(), total: 0 };
  const hits = matchingItems(text);
  const groups = hitGroups
    .map((group) => ({
      id: group.id,
      title: group.title,
      items: hits.filter(group.takes).slice(0, hitsPerGroup).map((item) => ({ ...item, meta: metaOf(item) })),
    }))
    .filter((group) => group.items.length);
  return { groups, total: hits.length };
}
