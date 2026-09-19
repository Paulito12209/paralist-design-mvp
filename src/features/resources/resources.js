/*
 * Die Ressourcen-Seite hinter der Übersichtskarte: Filter-Pillen wie auf der
 * Medien-Seite, darunter Listen je Monat statt Kacheln.
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

import { dom } from "../../core/dom.js";
import { groupByMonth } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { resourceFilters } from "../../data/config.js";
import { resourceEntries } from "../../data/queries.js";
import { state } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { entryRow } from "../../ui/rows.js";

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

/*
 * Welche Pille gilt gerade? Ältere Stände können hier noch „media“ stehen
 * haben — diese Pille gibt es nicht mehr, dafür führt der graue Zweittitel
 * „Medien“ in den eigenen Reiter. Unbekanntes fällt auf „Alle“ zurück.
 */
function activeFilter() {
  const saved = state.prefs.resources.filter;
  return resourceFilters.some((filter) => filter.id === saved) ? saved : resourceFilters[0].id;
}

/** Pillen und Listen in die Unterseite zeichnen. */
export function renderResources() {
  const active = activeFilter();
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

  dom.pageBody.innerHTML = `<div class="tab-pills resource-filters">${pills}</div>${body}`;
}
