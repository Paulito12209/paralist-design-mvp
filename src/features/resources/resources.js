/*
 * Die Ressourcen-Seite hinter der Übersichtskarte: Filter-Pillen wie auf der
 * Medien-Seite, darunter Listen je Monat statt Kacheln.
 * Pfad: src/features/resources/resources.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyArt[*] -> Icon und Farbe des Platzhalters je Filter-Pille
 * emptyAction -> Beschriftung der Pille, mit der man eine Ressource anlegt
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
  own: {
    icon: "doc",
    accent: "var(--cal-accent)",
    title: "Noch nichts Eigenes",
    text: "Ein Eintrag ohne gewählten Typ wird zum Dokument und steht dann hier.",
  },
  drawings: {
    icon: "scribble",
    accent: "var(--prio-irgendwann)",
    title: "Noch keine Zeichnungen",
    text: "Skizzen von der Zeichenfläche landen hier.",
  },
};

/* Die Pille unter dem Platzhalter legt eine Ressource an (ein Dokument). */
const emptyAction = { label: "Ressource anlegen", pick: "ressourcen" };

/** Die Ressourcen einer Filter-Pille. */
function filtered(filter) {
  const all = resourceEntries();
  if (filter === "notes") return all.filter((entry) => entry.type === "notiz");
  if (filter === "own") return all.filter((entry) => entry.type === "dokument");
  if (filter === "drawings") return all.filter((entry) => entry.type === "zeichnung");
  return all;
}

/** Pillen und Listen in die Unterseite zeichnen. */
export function renderResources() {
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
    : emptyState({ ...(emptyArt[active] || emptyArt.all), action: emptyAction });

  dom.pageBody.innerHTML = `<div class="tab-pills resource-filters">${pills}</div>${body}`;
}
