/*
 * Die Medien-Seite: Filter-Pillen oben, darunter das Kachelraster nach Monaten.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/media/media.js
 *
 * Keine anpassbaren visuellen Werte: Fugen, Kachelgröße und Monatsüberschrift
 * stehen in styles/media.css (--media-gap, --media-month-size).
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { groupByMonth } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { mediaFilters } from "../../data/config.js";
import { mediaEntries, mediaKindOf } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { mediaCell } from "../../ui/media-cell.js";
import { isViewActive } from "../../ui/views.js";
import { initMediaImport } from "./media-import.js";

/** Die Medien einer Filter-Pille. „recent“ zeigt alles. */
function filtered(filter) {
  const all = mediaEntries();
  if (filter === "recent") return all;
  return all.filter((entry) => mediaKindOf(entry) === filter);
}

/* Die Pillen oben, jede mit der Anzahl dahinter. */
function renderFilters() {
  dom.mediaFilters.innerHTML = mediaFilters
    .map((filter) => {
      const count = filtered(filter.id).length;
      const active = filter.id === state.prefs.media.filter ? " is-active" : "";
      return `
        <button class="tab-pill media-filter${active}" type="button" data-media-filter="${filter.id}">
          ${icon(filter.icon, "tab-pill-icon")}${filter.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("");
}

/* Das Raster: neueste zuerst, nach Monat gruppiert. */
function renderGrid() {
  const active = state.prefs.media.filter;
  const list = filtered(active);
  const filter = mediaFilters.find((item) => item.id === active) || mediaFilters[0];

  if (!list.length) {
    dom.mediaBody.innerHTML = `<p class="empty-note">${filter.empty}</p>`;
    return;
  }

  dom.mediaBody.innerHTML = groupByMonth(list)
    .map(
      (group) =>
        `<h2 class="media-month">${group.heading}</h2><div class="media-grid">${group.items.map(mediaCell).join("")}</div>`
    )
    .join("");
}

/** Die ganze Seite neu zeichnen. */
export function renderMedia() {
  renderFilters();
  renderGrid();
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  dom.mediaFilters.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-media-filter]");
    if (!pill) return;
    state.prefs.media.filter = pill.dataset.mediaFilter;
    saveState();
    renderMedia();
  });

  initMediaImport(dom.mediaActions);

  on(events.viewOpened, (name) => {
    if (name === "media") renderMedia();
  });
  on(events.dataChanged, () => {
    if (isViewActive("media")) renderMedia();
  });

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("media")) renderMedia();
}

init();
