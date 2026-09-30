/*
 * Die Bedienung zum Filtern und Sortieren auf der Suchseite:
 * - Art-Pillen unter dem Titel (Alle 24 · Aufgaben 8 · …)
 * - Zeile mit der Trefferzahl und rechts zwei Pillen: „Sortieren“ zeigt die
 *   gewählte Sortierung mit einem Pfeil für die Richtung (↑ aufsteigend,
 *   ↓ absteigend, wie in Google Drive) — der volle Wortlaut „Neueste zuerst“
 *   passt bei 375px nicht daneben —, „Filter“ die Zahl der gefilterten Abschnitte
 * - Chips für jede gesetzte Eingrenzung: ein Tipp auf den Namen öffnet deren
 *   Unterseite im Filter-Blatt, × nimmt sie weg
 * - Sortieren ist das gemeinsame Blatt mit zwei Rollen „Wonach“ und
 *   „Reihenfolge“ (src/ui/sort-sheet.js), Filtern das gemeinsame Blatt mit
 *   Übersicht und Unterseiten (src/ui/filter-sheet.js) — wie auf der
 *   Aufgaben-Seite. Jede Wahl wirkt sofort, die Treffer ziehen dahinter mit.
 * Was die Wahl bewirkt, rechnet search-refine.js.
 * Pfad: src/features/search/search-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * words    -> Beschriftungen: Pillen, Trefferzahl, Blatt-Titel, Chips
 * sections -> Name und Icon der vier Filter-Abschnitte
 * scopes   -> die beiden Werte von „Suchen in“
 * doneWays -> die beiden Werte von „Erledigte“
 *
 * Aussehen: styles/search-refine.css; die Blätter selbst in
 * styles/sort-wheels.css und styles/filter-sheet.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { parentName, placeOptionsFor } from "../../data/queries.js";
import { openFilterSheet } from "../../ui/filter-sheet.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";
import { defaultRefine, isSorted, naturalAsc, refinePeriods, refineSorts } from "./search-refine.js";

const words = {
  sortPill: "Sortieren",
  filterPill: "Filter",
  filterTitle: "Filtern",
  anywhere: "Überall",
  chipTitleOnly: "Nur Titel",
  chipHideDone: "Ohne Erledigte",
  hits: "Treffer",
  removeAria: "entfernen",
};

const sections = {
  place: { label: "Ort", icon: "folder" },
  period: { label: "Bearbeitet", icon: "clock" },
  scope: { label: "Suchen in", icon: "search" },
  done: { label: "Erledigte", icon: "check-circle" },
};

const scopes = [
  { id: "all", label: "Titel und Inhalt", icon: "note" },
  { id: "title", label: "Nur Titel", icon: "text" },
];

const doneWays = [
  { id: "show", label: "Zeigen", icon: "check-circle" },
  { id: "hide", label: "Ausblenden", icon: "circle" },
];

/** Die Art-Pillen; `active` ist die gewählte Art. */
export function kindPillsMarkup(pills, active) {
  return `<div class="tab-pills page-pills search-kinds">${pills
    .map(
      (pill) =>
        `<button class="tab-pill${pill.id === active ? " is-active" : ""}" type="button" data-search-kind="${pill.id}">${escapeHtml(pill.label)}<span class="search-kind-count">${pill.count}</span></button>`
    )
    .join("")}</div>`;
}

/* Die Richtung der Sortierung; ein alter Stand ohne `asc` gilt als natürliche Richtung. */
function ascOf(refine) {
  return refine.asc ?? naturalAsc(refine.sort);
}

/* Name des gewählten Orts für Chip und Übersicht. */
function placeLabel(refine) {
  return refine.place === undefined ? words.anywhere : parentName(refine.place);
}

/* Die gesetzten Eingrenzungen: [{ id, label }] — id ist zugleich die Unterseite im Blatt. */
function limits(refine) {
  const period = refinePeriods.find((item) => item.id === refine.period);
  const list = [];
  if (refine.place !== undefined) list.push({ id: "place", label: placeLabel(refine) });
  if (period && period.chip) list.push({ id: "period", label: period.chip });
  if (refine.titleOnly) list.push({ id: "scope", label: words.chipTitleOnly });
  if (!refine.showDone) list.push({ id: "done", label: words.chipHideDone });
  return list;
}

/**
 * Trefferzahl links, rechts „Sortieren“ und „Filter“. Weicht etwas von der
 * Vorgabe ab, steht die Pille in Schriftfarbe mit blauem Rand; „Filter“
 * trägt dann die Zahl der gefilterten Abschnitte.
 */
export function countRowMarkup(total, refine) {
  const sorted = isSorted(refine);
  const count = limits(refine).length;
  const option = refineSorts.find((item) => item.id === refine.sort) || refineSorts[0];
  const arrow = sorted ? icon(ascOf(refine) ? "arrow-up" : "arrow-down", "search-tool-dir") : "";
  return `
    <div class="search-count-row">
      <span class="search-count">${total} ${words.hits}</span>
      <div class="search-tools">
        <button class="search-tool${sorted ? " is-on" : ""}" type="button" data-search-sort aria-label="${escapeHtml(`${words.sortPill}: ${sortSummary(refineSorts, refine.sort, ascOf(refine))}`)}">
          ${icon("sort")}<span class="search-tool-text">${escapeHtml(sorted ? option.label : words.sortPill)}</span>${arrow}
        </button>
        <button class="search-tool${count ? " is-on" : ""}" type="button" data-search-filter>
          ${icon("sliders")}<span class="search-tool-text">${words.filterPill}</span>${count ? `<span class="search-tool-count">${count}</span>` : ""}
        </button>
      </div>
    </div>`;
}

/** Ein Chip je gesetzter Eingrenzung; ohne Eingrenzung nichts. Zwei Knöpfe nebeneinander, kein Knopf im Knopf. */
export function chipsMarkup(refine) {
  const chips = limits(refine);
  if (!chips.length) return "";
  return `<div class="search-chips">${chips
    .map(
      (chip) =>
        `<span class="search-chip">
          <button class="search-chip-label" type="button" data-search-chip-open="${chip.id}">${escapeHtml(chip.label)}</button>
          <button class="search-chip-remove" type="button" data-search-chip="${chip.id}" aria-label="${escapeHtml(`${chip.label} ${words.removeAria}`)}">${icon("close")}</button>
        </span>`
    )
    .join("")}</div>`;
}

/* Welches Feld im Stand zu welchem Abschnitt gehört. */
const fieldOf = { place: "place", period: "period", scope: "titleOnly", done: "showDone" };

/** Eine Eingrenzung über ihren Chip zurücknehmen. */
export function clearChip(refine, id) {
  const field = fieldOf[id];
  refine[field] = defaultRefine()[field];
}

/** Nur die Eingrenzungen zurücknehmen; Art und Sortierung bleiben. */
export function clearLimits(refine) {
  Object.keys(fieldOf).forEach((id) => clearChip(refine, id));
}

/** Blatt „Sortieren“: links wonach, rechts die Richtung — wie auf der Aufgaben-Seite. */
export function openSearchSort(refine, redraw) {
  openSortSheet({
    options: refineSorts,
    sort: refine.sort,
    asc: ascOf(refine),
    onChange: (sort, asc) => {
      refine.sort = sort;
      refine.asc = asc;
      redraw();
    },
  });
}

/* Ein Abschnitt mit Einfachwahl: `values` [{ id, label, icon }], `current` die gewählte id. */
function singleSection(id, values, current, apply, redrawSheet) {
  const chosen = values.find((value) => value.id === current) || values[0];
  return {
    id,
    ...sections[id],
    summary: chosen.label,
    active: chosen !== values[0],
    items: values.map((value) => ({ ...value, active: value === chosen })),
    onToggle: (valueId) => {
      if (valueId === chosen.id) return;
      apply(valueId);
      redrawSheet();
    },
  };
}

/**
 * Blatt „Filtern“: Übersicht mit Ort, Zeitraum der Bearbeitung, Suchen in
 * und Erledigte; je Abschnitt eine Unterseite. Die erste Zeile jeder
 * Unterseite ist die Vorgabe — alles andere zählt als Filter.
 * @param page id der Unterseite, die gleich offen sein soll (Chip) — sonst weggelassen
 */
export function openSearchFilter(refine, redraw, page) {
  const again = () => {
    redraw();
    openSearchFilter(refine, redraw);
  };
  /* Orte bekommen ihre Stelle als id — Verweise sind Objekte und taugen nicht zum Vergleichen im Blatt */
  const places = [{ ref: undefined, label: words.anywhere, icon: "layers" }, ...placeOptionsFor()];
  const placeIndex = Math.max(0, places.findIndex((option) => option.ref === refine.place));
  const list = [
    singleSection(
      "place",
      places.map((option, index) => ({ id: String(index), label: option.label, icon: option.icon })),
      String(placeIndex),
      (id) => (refine.place = places[Number(id)].ref),
      again
    ),
    singleSection(
      "period",
      refinePeriods.map((period) => ({ id: period.id, label: period.label, icon: "clock" })),
      refine.period,
      (id) => (refine.period = id),
      again
    ),
    singleSection("scope", scopes, refine.titleOnly ? "title" : "all", (id) => (refine.titleOnly = id === "title"), again),
    singleSection("done", doneWays, refine.showDone ? "show" : "hide", (id) => (refine.showDone = id === "show"), again),
  ];
  openFilterSheet({
    title: words.filterTitle,
    sections: list,
    resetActive: limits(refine).length > 0,
    onReset: () => {
      clearLimits(refine);
      again();
    },
    page,
  });
}
