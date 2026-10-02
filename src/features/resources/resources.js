/*
 * Die Ressourcen-Seite hinter der Übersichtskarte: Filter-Pillen wie auf der
 * Medien-Seite, darunter Listen je Monat statt Kacheln. Waagerecht wischen
 * wechselt die Pille (src/ui/pill-swipe.js). Wird erst beim ersten Öffnen
 * nachgeladen.
 * Pfad: src/features/resources/resources.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyArt[*] -> Icon, Farbe und Text des Platzhalters je Filter-Pille
 * emptyLabels -> Beschriftung der Anlege-Pille je Filter-Pille
 *
 * Aussehen der Pillen und Monatsüberschriften steht in styles/media.css
 * (Klassen .resource-filters, .media-month), das des Platzhalters in
 * styles/empty-state.css.
 */

import { dom, el } from "../../core/dom.js";
import { groupByMonth } from "../../core/format.js";
import { filterCollectionEntries } from "../../data/collection-filters.js";
import { collectionSort, sortCollectionEntries } from "../../data/collection-sorts.js";
import { resourceFilters, resourceFilterTypes } from "../../data/config.js";
import { createEntryInline } from "../../data/mutations-inline.js";
import { resourceEntries } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { filterEmptyState } from "../../ui/filter-empty.js";
import { addInlineList, openEntryRow, reopenIn } from "../../ui/inline-add.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { entryRow } from "../../ui/rows.js";
import { tabGlyph } from "../../ui/tab-glyph.js";
import { isViewActive } from "../../ui/views.js";

/* Platzhalter je Filter-Pille: Icon und Farbe passen zu dem, was fehlt. */
const emptyArt = {
  all: {
    icon: "cube",
    accent: "var(--xp-done)",
    title: "Noch keine Ressourcen",
    text: "Ressourcen sind Themen und Material, das dir später nützen kann — egal, wo es liegt.",
  },
  notes: {
    icon: "note",
    accent: "var(--prio-next)",
    title: "Noch keine Notizen",
    text: "Ein kurzer Gedanke, der nicht verloren gehen soll.",
  },
  drawings: {
    icon: "scribble",
    accent: "var(--prio-irgendwann)",
    title: "Noch keine Zeichnungen",
    text: "Skizzen von der Zeichenfläche landen hier.",
  },
  own: {
    icon: "doc",
    accent: "var(--cal-accent)",
    title: "Noch nichts Eigenes",
    text: "Ein Eintrag ohne gewählten Typ wird zum Dokument und steht dann hier.",
  },
};

/*
 * Beschriftung der Pille unter dem Platzhalter. Sie nennt genau das, was die
 * gerade aktive Pille oben anlegt — welchen Typ das ist, steht in
 * resourceFilterTypes in src/data/config.js. Ein `pick` gibt sie deshalb nicht
 * mit: das Eingabefeld liest den Filter selbst.
 */
const emptyLabels = {
  all: "Dokument anlegen",
  notes: "Notiz anlegen",
  drawings: "Zeichnung anlegen",
  own: "Dokument anlegen",
};

/** Die Ressourcen einer Filter-Pille — ohne `raw` auch nach den Filtern der Karte „Ansicht“. */
function filtered(filter, raw = false) {
  const all = raw ? resourceEntries() : filterCollectionEntries("resources", resourceEntries());
  if (filter === "notes") return all.filter((entry) => entry.type === "notiz");
  if (filter === "drawings") return all.filter((entry) => entry.type === "zeichnung");
  if (filter === "own") return all.filter((entry) => entry.type === "dokument");
  return all;
}

/** Pillen und Listen in die Unterseite zeichnen. */
export function renderResources() {
  /* Dass der gespeicherte Filter noch existiert, prüft adoptPrefs in src/data/state.js. */
  const active = state.prefs.resources.filter;
  const pills = resourceFilters
    .map((filter) => {
      const count = filtered(filter.id).length;
      const mark = filter.id === active ? " is-active" : "";
      return `
        <button class="tab-pill${mark}" type="button" data-resource-filter="${filter.id}">
          ${tabGlyph("resources", filter.icon)}${filter.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("");

  const list = sortCollectionEntries("resources", filtered(active));
  /* Monatsüberschriften nur, solange nach dem Anlegen sortiert ist — sonst
     stünde derselbe Monat mehrmals zwischen den Zeilen. */
  const byMonth = collectionSort("resources").sort === "erstellt";
  const rows = (items) => `<div class="workspace-list" data-reorder="resources">${items.map((entry) => entryRow(entry)).join("")}</div>`;
  let body = emptyState({
    ...(emptyArt[active] || emptyArt.all),
    action: { label: emptyLabels[active] || emptyLabels.all },
  });
  if (!list.length && filtered(active, true).length) body = filterEmptyState();
  else if (list.length && !byMonth) body = rows(list);
  else if (list.length) {
    body = groupByMonth(list)
      .map((group) => `<h2 class="media-month">${group.heading}</h2>${rows(group.items)}`)
      .join("");
  }

  /* Die Leiste wird mit ersetzt: ihre Rollstellung mitnehmen, sonst springt sie
     bei jedem Wechsel an den Anfang zurück. */
  const scrolled = dom.pageBody.querySelector(".resource-filters")?.scrollLeft || 0;
  dom.pageBody.innerHTML = `<div class="tab-pills resource-filters">${pills}</div>${body}`;
  dom.pageBody.querySelector(".resource-filters").scrollLeft = scrolled;
}

/** Eine Filter-Pille wählen — per Tipp (src/ui/list-clicks.js) oder Wischen. */
export function selectResourceFilter(id) {
  state.prefs.resources.filter = id;
  saveState();
  renderResources();
}

/* Beim Laden des Moduls einmal anmelden. Die Ansicht teilen sich alle
   Unterseiten der Übersicht: Wischen gilt nur, solange die Ressourcen offen sind. */
initPillSwipe(el("view-page"), {
  order: resourceFilters.map((filter) => filter.id),
  current: () => state.prefs.resources.filter,
  select: selectResourceFilter,
  enabled: () => isViewActive("page") && ui.currentPage?.kind === "resources",
});

/* Tipp unter die letzte Zeile (Android): legt den Typ der aktiven Pille an.
   Bei Monatsüberschriften stehen mehrere Listen untereinander — dann zählt die ganze Seite. */
const inlineList = {
  area() {
    if (!isViewActive("page") || ui.currentPage?.kind !== "resources") return null;
    const lists = dom.pageBody.querySelectorAll(":scope > .workspace-list");
    if (lists.length > 1) return dom.pageBody;
    return lists[0] || null;
  },
  open(area) {
    const type = resourceFilterTypes[state.prefs.resources.filter] || resourceFilterTypes.all;
    openEntryRow(area, {
      type,
      onCommit: (title) => createEntryInline({ title, type }),
      reopen: () => reopenIn(inlineList),
    });
  },
};
addInlineList(inlineList);
