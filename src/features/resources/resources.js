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
import { icon } from "../../core/html.js";
import { resourceFilters } from "../../data/config.js";
import { resourceEntries } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { entryRow } from "../../ui/rows.js";
import { isViewActive } from "../../ui/views.js";

/* Platzhalter je Filter-Pille: Icon und Farbe passen zu dem, was fehlt. */
const emptyArt = {
  all: {
    icon: "cube",
    accent: "var(--xp-done)",
    title: "Noch keine Ressourcen",
    text: "Notizen, eigene Dokumente und Zeichnungen sammeln sich hier — egal, wo sie liegen.",
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

/** Die Ressourcen einer Filter-Pille. */
function filtered(filter) {
  const all = resourceEntries();
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
          ${icon(filter.icon, "tab-pill-icon")}${filter.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("");

  const list = filtered(active);
  const body = list.length
    ? groupByMonth(list)
        .map(
          (group) =>
            `<h2 class="media-month">${group.heading}</h2><div class="workspace-list">${group.items
              .map((entry) => entryRow(entry))
              .join("")}</div>`
        )
        .join("")
    : emptyState({
        ...(emptyArt[active] || emptyArt.all),
        action: { label: emptyLabels[active] || emptyLabels.all },
      });

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
