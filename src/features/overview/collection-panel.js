/*
 * Die Karte „Ansicht“ über der Navigation auf den Sammlungen Eingang,
 * Favoriten, Ressourcen, Archiv, Arbeitsbereiche und Lesezeichen — dieselbe
 * Karte wie unter den Projekten und auf der Aufgaben-Seite
 * (src/ui/view-panel.js). Zwei Zeilen:
 *
 * - Sortieren: die Wahl („Erstellt · Neueste zuerst“); ein Tipp öffnet das
 *   Blatt „Sortieren“ (src/ui/sort-sheet.js, src/data/collection-sorts.js)
 * - Filter: rechts „Keine“ oder die Zahl der gefilterten Abschnitte, darunter
 *   je Abschnitt ein Chip; ein Tipp auf die Zeile öffnet das Blatt „Filter“
 *   (src/features/overview/collection-filter.js), ein Tipp auf einen Chip
 *   gleich dessen Unterseite
 *
 * Jede Sammlung merkt sich ihre eigene Wahl. Es gibt eine Karte für alle
 * Sammlungen: sie zeigt stets die Wahl der gerade offenen. Blenden die
 * Filter alles aus, zeigt die Liste den Platzhalter aus src/ui/filter-empty.js;
 * dessen Pille „Filter zurücksetzen“ wird hier behandelt.
 * Pfad: src/features/overview/collection-panel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * panelTitle -> Überschrift der Karte
 * sortLabel  -> Beschriftung der Zeile „Sortieren“
 * filterLabel -> Beschriftung der Zeile „Filter“
 * noFilter   -> was rechts in der Zeile „Filter“ steht, solange nichts gefiltert ist
 *
 * Aussehen, Lage und wann die Karte sichtbar ist (Klasse is-collection am body):
 * styles/tasks-settings.css; wo die Liste darüber endet: styles/view-end.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { resetCollectionFilter } from "../../data/collection-filters.js";
import {
  collectionSort,
  collectionSortOptions,
  setCollectionSort,
  sortableCollections,
} from "../../data/collection-sorts.js";
import { ui } from "../../data/state.js";
import { filterChipsMarkup } from "../../ui/filter-chips.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";
import { createViewPanel } from "../../ui/view-panel.js";
import { isViewActive } from "../../ui/views.js";
import { collectionFilterChips, openCollectionFilter } from "./collection-filter.js";

const panelTitle = "Ansicht";
const sortLabel = "Sortieren";
const filterLabel = "Filter";
const noFilter = "Keine";

/* Die Karte; angelegt in initCollectionPanel(). */
let panel = null;

/* Die offene Sammlung mit Karte — oder null auf jeder anderen Seite. */
function openCollection() {
  const page = isViewActive("page") ? ui.currentPage : null;
  if (!page || page.isWorkspace) return null;
  /* Der Eingang hat als einzige Sammlung keine Art (overviewPages in src/data/config.js). */
  const kind = page.kind || "inbox";
  return sortableCollections.includes(kind) ? kind : null;
}

function panelMarkup(kind) {
  const { sort, asc } = collectionSort(kind);
  const chips = collectionFilterChips(kind);
  return `
    <div class="details-list tasks-settings">
      <button class="details-row is-editable" type="button" data-settings="sort">
        <span class="details-row-label">${sortLabel}</span><span class="details-row-value">${escapeHtml(sortSummary(collectionSortOptions(kind), sort, asc))}</span>
      </button>
      <button class="details-row is-editable" type="button" data-settings="filter">
        <span class="details-row-label">${filterLabel}</span><span class="details-row-value">${chips.length || noFilter}</span>
      </button>
      ${filterChipsMarkup(chips)}
    </div>`;
}

/* Sichtbar schalten und mit der Wahl der offenen Sammlung füllen. */
function syncPanel() {
  const kind = openCollection();
  document.body.classList.toggle("is-collection", Boolean(kind));
  if (kind) panel.setContent(panelMarkup(kind));
}

/** Das Blatt „Sortieren“ einer Sammlung — Zeile „Sortieren“ der Karte und Symbol der Werkzeugzeile öffnen dasselbe. */
export function openCollectionSort(kind) {
  const { sort, asc } = collectionSort(kind);
  openSortSheet({
    options: collectionSortOptions(kind),
    sort,
    asc,
    onChange: (nextSort, nextAsc) => setCollectionSort(kind, nextSort, nextAsc),
  });
}

function handleClick(event) {
  const kind = openCollection();
  const button = kind && event.target.closest("[data-settings]");
  if (!button) return;
  if (button.dataset.settings === "filter") {
    /* Ein Chip öffnet gleich seine Unterseite, die Zeile die Übersicht */
    openCollectionFilter(kind, button.dataset.value || null);
    return;
  }
  if (button.dataset.settings === "sort") openCollectionSort(kind);
}

/** Karte anlegen und bei jedem Seitenwechsel und jeder Änderung abgleichen. */
export function initCollectionPanel() {
  panel = createViewPanel({ title: panelTitle, className: "collection-panel", onClick: handleClick });
  on(events.viewOpened, syncPanel);
  on(events.dataChanged, syncPanel);
  /* Die Pille im Platzhalter „Kein Eintrag passt zu den Filtern“ */
  dom.pageBody.addEventListener("click", (event) => {
    const kind = openCollection();
    if (kind && event.target.closest("[data-collection-reset]")) resetCollectionFilter(kind);
  });
}
