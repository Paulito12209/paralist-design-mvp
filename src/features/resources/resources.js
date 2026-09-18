/*
 * Die Ressourcen-Seite hinter der Übersichtskarte: Filter-Pillen wie auf der
 * Medien-Seite, darunter Listen je Monat statt Kacheln.
 * Pfad: src/features/resources/resources.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/media.css
 * (Klassen .resource-filters, .media-month).
 */

import { dom } from "../../core/dom.js";
import { groupByMonth } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { resourceFilters } from "../../data/config.js";
import { mediaKindOf, resourceEntries } from "../../data/queries.js";
import { state } from "../../data/state.js";
import { entryRow } from "../../ui/rows.js";

/** Die Ressourcen einer Filter-Pille. */
function filtered(filter) {
  const all = resourceEntries();
  if (filter === "all") return all;
  if (filter === "own") return all.filter((entry) => entry.type !== "medien");
  return all.filter((entry) => entry.type === "medien" && mediaKindOf(entry) === filter);
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
  const filter = resourceFilters.find((item) => item.id === active) || resourceFilters[0];
  const body = list.length
    ? groupByMonth(list)
        .map(
          (group) =>
            `<h2 class="media-month">${group.heading}</h2><div class="workspace-list">${group.items
              .map((entry) => entryRow(entry))
              .join("")}</div>`
        )
        .join("")
    : `<p class="empty-note">${filter.empty}</p>`;

  dom.pageBody.innerHTML = `<div class="tab-pills resource-filters">${pills}</div>${body}`;
}
