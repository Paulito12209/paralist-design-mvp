/*
 * Die Suche der „OG Version“ ohne Eingabe, nach GlobalSearchOverlay und
 * SearchDetailPages (Organi7er): große Überschrift „Suchen“, eine Glas-Gruppe
 * mit „Zuletzt gesucht“, „Am häufigsten geöffnet“ und den drei meistgeöffneten
 * Seiten, darunter „Zuletzt geöffnet“ nach Tagen. Die beiden Zeilen der Gruppe
 * öffnen je eine eigene Unterseite (#/suchen/gesucht, #/suchen/haeufig).
 * In den anderen Fassungen bleiben die Reiter von search-browse.js.
 * Pfad: src/features/search/search-og.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * previewCount -> wie viele der meistgeöffneten Seiten unter den zwei Zeilen stehen (3)
 * recentCount  -> wie viele zuletzt geöffnete Seiten unter „Zuletzt geöffnet“ stehen
 * subPages     -> Titel, Symbol und Platzhalter der beiden Unterseiten
 *
 * Aussehen (Gruppe, Kacheln, Karten): styles/og-search.css und styles/og-search-start.css.
 */

import { MS_PER_DAY, sameDay } from "../../core/dates.js";
import { escapeHtml, icon } from "../../core/html.js";
import { state } from "../../data/state.js";
import { isMobileOs } from "../../ui/platform.js";
import { emptyState } from "../../ui/empty-state.js";
import { knownOpens, mostOpened } from "./search-data.js";
import { resultRow } from "./search-rows.js";

/* Tag und Monat mit Jahr, z.B. „23. Nov. 2026“ */
const openedDate = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" });

const previewCount = 3;
const recentCount = 40;

const subPages = {
  searches: {
    title: "Zuletzt gesucht",
    icon: "history",
    empty: { icon: "history", accent: "var(--og-tint)", title: "Noch nichts gesucht", text: "Deine zuletzt gesuchten Begriffe stehen hier." },
  },
  most: {
    title: "Am häufigsten geöffnet",
    icon: "chart-column",
    empty: { icon: "chart-column", accent: "var(--og-tint)", title: "Noch nichts geöffnet", text: "Sobald du Seiten öffnest, stehen die häufigsten hier." },
  },
};

const noteEmpty = { icon: "search", accent: "var(--og-tint)", title: "Noch keine Einträge", text: "Neu erstellte Seiten erscheinen hier." };

/** Gilt die „OG Version“ am Handy? Nur dann zeichnet die Suche diese Ansicht. */
export function isOgSearch() {
  return isMobileOs("ios") && document.documentElement.dataset.mobileVariant === "og" && window.innerWidth < 1024;
}

/* Titel, Art und Zusatz einer Zeile: „Aufgabe · 80× geöffnet“ */
function openedMeta(row) {
  return `${row.item.label} · ${row.open.count}× geöffnet`;
}

/* Eine Zeile in der Gruppe: Kachel in der Farbe der Art, Titel, darunter die Einordnung. */
function compactRow({ item, open }) {
  const attr =
    item.kind === "entry" ? `data-open-entry="${item.id}"` : `data-open-workspace="${item.id}"`;
  return `
    <button class="og-sgroup-row og-sgroup-page" type="button" data-kind="${item.type || item.kind}" ${attr}>
      <span class="og-search-tile">${icon(item.icon)}</span>
      <span class="search-copy">
        <span class="search-title">${escapeHtml(item.title)}</span>
        <span class="search-meta">${escapeHtml(openedMeta({ item, open }))}</span>
      </span>
    </button>`;
}

/* Eine Zeile mit Pfeil, die eine Unterseite öffnet. */
function linkRow(id) {
  const page = subPages[id];
  return `
    <button class="og-sgroup-row og-sgroup-link" type="button" data-og-search-sub="${id}">
      ${icon(page.icon)}
      <span class="search-title">${escapeHtml(page.title)}</span>
      ${icon("chevron", "chevron")}
    </button>`;
}

/* Die Karte eines zuletzt geöffneten Eintrags: Art · in Ort · Datum des Öffnens. */
function recentCard({ item, open }) {
  const place = item.note ? `in ${item.note}` : "";
  const meta = [item.label, place, openedDate.format(new Date(open.ts))].filter(Boolean).join(" · ");
  return resultRow(item, meta);
}

/* Wie in der App: Heute, Gestern, alles andere heißt „Früher“ */
function dayHeading(ts) {
  const now = Date.now();
  if (sameDay(ts, now)) return "Heute";
  return sameDay(ts, now - MS_PER_DAY) ? "Gestern" : "Früher";
}

/* Nach Tagen gruppiert, damit „Heute“ und „Gestern“ getrennt stehen. */
function recentGroups(rows) {
  const groups = [];
  rows.forEach((row) => {
    const heading = dayHeading(row.open.ts);
    const found = groups.find((group) => group.heading === heading);
    if (found) found.cards.push(recentCard(row));
    else groups.push({ heading, cards: [recentCard(row)] });
  });
  return groups
    .map((group) => `<h3 class="date-label">${escapeHtml(group.heading)}</h3><div class="workspace-list">${group.cards.join("")}</div>`)
    .join("");
}

/**
 * Die Startseite der Suche: Überschrift, Gruppe, „Zuletzt geöffnet“.
 */
export function ogStartMarkup() {
  const frequent = mostOpened().slice(0, previewCount);
  const recent = knownOpens()
    .sort((a, b) => b.open.ts - a.open.ts)
    .slice(0, recentCount);
  const group = [linkRow("searches"), linkRow("most"), ...frequent.map(compactRow)].join("");
  const list = recent.length ? recentGroups(recent) : emptyState(noteEmpty);
  return (
    `<h1 class="screen-title">Suchen</h1>` +
    `<div class="og-sgroup">${group}</div>` +
    `<h2 class="og-search-recent">Zuletzt geöffnet</h2>` +
    `<div class="search-list">${list}</div>`
  );
}

/* Gemerkte Suchbegriffe als Zeilen einer Gruppe; ein Tipp sucht sie erneut. */
function termRows() {
  const rows = state.recentSearches.map(
    (term) => `
    <button class="og-sgroup-row og-sgroup-term" type="button" data-search-query="${escapeHtml(term)}">
      ${icon("search")}
      <span class="search-title">${escapeHtml(term)}</span>
    </button>`
  );
  return rows.join("");
}

/**
 * Eine Unterseite hinter den Zeilen der Gruppe: Kopf mit Zurück, Titel und —
 * beim Verlauf — „Löschen“, darunter die Gruppe.
 * @param id "searches" oder "most"
 */
export function ogSubMarkup(id) {
  const page = subPages[id];
  const rows = id === "most" ? mostOpened() : [];
  const filled = id === "most" ? rows.length > 0 : state.recentSearches.length > 0;
  const clear = id === "searches" && filled ? `<button class="og-sub-clear" type="button" data-og-search-clear>Löschen</button>` : "";
  const body = !filled
    ? emptyState(page.empty)
    : `<div class="og-sgroup">${id === "most" ? rows.map(compactRow).join("") : termRows()}</div>`;
  return (
    `<div class="og-sub og-sub-${id}">` +
    `<div class="og-sub-head"><button class="og-sub-back" type="button" data-og-search-back aria-label="Zurück">${icon("back")}</button>` +
    `<h1 class="og-sub-title">${escapeHtml(page.title)}</h1>${clear}</div>` +
    `<div class="search-list">${body}</div></div>`
  );
}
