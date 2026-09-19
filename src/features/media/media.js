/*
 * Die Medien-Seite: Filter-Pillen oben, darunter das Kachelraster nach Monaten.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/media/media.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyArt[*]  -> Icon, Farbe und Texte des Platzhalters je Filter-Pille
 * emptyAction  -> Beschriftung der Pille, mit der man Dateien hinzufügt
 *
 * Fugen, Kachelgröße und Monatsüberschrift stehen in styles/media.css
 * (--media-gap, --media-month-size), der Platzhalter in styles/empty-state.css.
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { groupByMonth } from "../../core/format.js";
import { icon } from "../../core/html.js";
import { mediaFilters } from "../../data/config.js";
import { mediaEntries, mediaKindOf } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { mediaCell } from "../../ui/media-cell.js";
import { isViewActive } from "../../ui/views.js";
import { bindMediaPicks, initMediaImport } from "./media-import.js";

/* Platzhalter je Filter-Pille: Icon und Farbe passen zu der fehlenden Art. */
const emptyArt = {
  recent: {
    icon: "photos",
    accent: "var(--xp-line)",
    title: "Noch keine Medien",
    text: "Fotos, Videos, Aufnahmen und Dateien sammeln sich hier nach Monaten.",
  },
  image: {
    icon: "image",
    accent: "var(--xp-done)",
    title: "Noch keine Bilder",
    text: "Nimm ein Foto auf oder importiere eines vom Gerät.",
  },
  video: {
    icon: "video",
    accent: "var(--prio-irgendwann)",
    title: "Noch keine Videos",
    text: "Aufgenommene und importierte Videos stehen hier.",
  },
  audio: {
    icon: "mic",
    accent: "var(--prio-jetzt)",
    title: "Noch keine Aufnahmen",
    text: "Sprachnotizen und Tonaufnahmen sammeln sich hier.",
  },
  doc: {
    icon: "doc",
    accent: "var(--cal-accent)",
    title: "Noch keine Dokumente",
    text: "Importierte Dateien wie PDFs stehen hier.",
  },
};

/* Die Pille unter dem Platzhalter öffnet dieselbe Dateiauswahl wie der Knopf „Importieren“. */
const emptyAction = { label: "Medien hinzufügen" };

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

  if (!list.length) {
    dom.mediaBody.innerHTML = emptyState({
      ...(emptyArt[active] || emptyArt.recent),
      action: emptyAction,
      data: 'data-media-pick="import"',
    });
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
  bindMediaPicks(dom.mediaBody);

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
