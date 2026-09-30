/*
 * Die Karte „Ansicht“ über der Navigation auf den Sammlungen Eingang,
 * Favoriten, Ressourcen, Archiv, Arbeitsbereiche und Lesezeichen — dieselbe
 * Karte wie unter den Projekten und auf der Aufgaben-Seite
 * (src/ui/view-panel.js). Sie trägt die Zeile „Sortieren“ mit der Wahl
 * („Erstellt · Neueste zuerst“); ein Tipp öffnet das Blatt „Sortieren“
 * (src/ui/sort-sheet.js). Jede Sammlung merkt sich ihre eigene Wahl
 * (src/data/collection-sorts.js). Es gibt eine Karte für alle Sammlungen:
 * sie zeigt stets die Wahl der gerade offenen.
 * Pfad: src/features/overview/collection-panel.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * panelTitle -> Überschrift der Karte
 * sortLabel  -> Beschriftung der Zeile „Sortieren“
 *
 * Aussehen, Lage und wann die Karte sichtbar ist (Klasse is-collection am body):
 * styles/tasks-settings.css; wo die Liste darüber endet: styles/view-end.css.
 */

import { events, on } from "../../core/bus.js";
import { escapeHtml } from "../../core/html.js";
import {
  collectionSort,
  collectionSortOptions,
  setCollectionSort,
  sortableCollections,
} from "../../data/collection-sorts.js";
import { ui } from "../../data/state.js";
import { openSortSheet, sortSummary } from "../../ui/sort-sheet.js";
import { createViewPanel } from "../../ui/view-panel.js";
import { isViewActive } from "../../ui/views.js";

const panelTitle = "Ansicht";
const sortLabel = "Sortieren";

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
  return `
    <div class="details-list tasks-settings">
      <button class="details-row is-editable" type="button" data-settings="sort">
        <span class="details-row-label">${sortLabel}</span><span class="details-row-value">${escapeHtml(sortSummary(collectionSortOptions(kind), sort, asc))}</span>
      </button>
    </div>`;
}

/* Sichtbar schalten und mit der Wahl der offenen Sammlung füllen. */
function syncPanel() {
  const kind = openCollection();
  document.body.classList.toggle("is-collection", Boolean(kind));
  if (kind) panel.setContent(panelMarkup(kind));
}

function handleClick(event) {
  const kind = openCollection();
  if (!kind || !event.target.closest("[data-settings='sort']")) return;
  const { sort, asc } = collectionSort(kind);
  openSortSheet({
    options: collectionSortOptions(kind),
    sort,
    asc,
    onChange: (nextSort, nextAsc) => setCollectionSort(kind, nextSort, nextAsc),
  });
}

/** Karte anlegen und bei jedem Seitenwechsel und jeder Änderung abgleichen. */
export function initCollectionPanel() {
  panel = createViewPanel({ title: panelTitle, className: "collection-panel", onClick: handleClick });
  on(events.viewOpened, syncPanel);
  on(events.dataChanged, syncPanel);
}
