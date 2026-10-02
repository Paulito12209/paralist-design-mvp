/*
 * Die Werkzeugzeile über den Sammlungen in der Android-Fassung — Eingang,
 * Favoriten, Ressourcen, Lesezeichen, Arbeitsbereiche und im Archiv selbst:
 * links „Archiv (n)“ (im Archiv entfällt es), rechts Sortieren, Filtern und Ansicht.
 * Sortieren und Filtern öffnen gleich ihr Blatt, Ansicht holt die Karte „Ansicht“
 * herauf (src/features/overview/collection-panel.js). Gebaut wie die Zeile über
 * Projekten und Aufgaben (src/ui/list-head.js).
 *
 * Die Zeile steht im Inhalt der Unterseite: direkt unter den Reitern, wo es
 * welche gibt (Ressourcen, Archiv, Arbeitsbereiche), sonst ganz oben unter dem
 * Titel. Eingefügt wird sie von einem Beobachter, sobald sich der Inhalt ändert
 * — Ressourcen, Lesezeichen, Archiv und Arbeitsbereiche zeichnen ihren Inhalt
 * selbst und auch bei jedem Reiterwechsel neu, ohne dass die Seite davon
 * erfährt. Der Beobachter schaut nur auf die direkten Kinder des Inhalts und
 * fügt nichts ein, wenn die Zeile schon dasteht.
 * Die Zeile gibt es in jeder Fassung im Dokument und sie ist nur in der
 * Android-Fassung zu sehen (styles/android-card.css).
 * Pfad: src/features/overview/page-list-head.js
 *
 * Keine anpassbaren visuellen Werte in dieser Datei. Beschriftung und Symbole:
 * src/ui/list-head.js; Maße: styles/android-card.css; welche Pille das Archiv
 * öffnet: src/data/archive-context.js.
 */

import { dom, el } from "../../core/dom.js";
import { archivedForView, archivePillForKind } from "../../data/archive-context.js";
import { collectionFilterSections } from "../../data/collection-filters.js";
import { sortableCollections } from "../../data/collection-sorts.js";
import { ui } from "../../data/state.js";
import { handleListHeadClick, listHeadMarkup } from "../../ui/list-head.js";
import { openViewPanel } from "../../ui/view-panel.js";
import { isViewActive } from "../../ui/views.js";
import { collectionFilterChips, openCollectionFilter } from "./collection-filter.js";
import { openCollectionSort } from "./collection-panel.js";

/* Die offene Sammlung (Eingang: ohne Art) — oder null auf jeder anderen Seite. */
function openKind() {
  const page = isViewActive("page") ? ui.currentPage : null;
  if (!page || page.isWorkspace) return null;
  const kind = page.kind || "inbox";
  return sortableCollections.includes(kind) ? kind : null;
}

/*
 * Die Zeile als HTML. `plain`: keine Reiter darüber, die Zeile steht unter dem Titel.
 * Im Archiv selbst gibt es keinen „Archiv“-Knopf, nur Sortieren und Filtern.
 */
function headMarkup(kind, plain) {
  const pill = kind === "archive" ? null : archivePillForKind(kind);
  return listHeadMarkup({
    archive: pill ? { pill, count: archivedForView("page", ui.currentPage).length } : null,
    filter: (collectionFilterSections[kind] || []).length > 0,
    filtering: collectionFilterChips(kind).length > 0,
    plain,
  });
}

/* Die Zeile einfügen, wenn der Inhalt neu gezeichnet wurde und sie fehlt. */
function mountHead() {
  const kind = openKind();
  const body = dom.pageBody;
  if (!kind || body.querySelector(":scope > .project-card-head")) return;
  const tabs = body.querySelector(":scope > .tab-pills-row, :scope > .tab-pills");
  if (tabs) tabs.insertAdjacentHTML("afterend", headMarkup(kind, false));
  else body.insertAdjacentHTML("afterbegin", headMarkup(kind, true));
}

/** Zeile anmelden: sie erscheint mit jedem neu gezeichneten Inhalt, ihre Symbole öffnen ihr Blatt. */
export function initPageListHead() {
  el("view-page").addEventListener("click", (event) => {
    const kind = openKind();
    if (!kind) return;
    handleListHeadClick(event, {
      sort: () => openCollectionSort(kind),
      filter: () => openCollectionFilter(kind),
      view: openViewPanel,
    });
  });
  /* childList ohne subtree: nur das Ersetzen des ganzen Inhalts zählt, nicht jede Zeile darin */
  new MutationObserver(mountHead).observe(dom.pageBody, { childList: true });
}
