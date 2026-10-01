/*
 * Die Medien-Seite: Filter-Pillen oben, darunter das Kachelraster nach Monaten.
 * Waagerecht wischen wechselt die Pille (src/ui/pill-swipe.js). Am Desktop
 * kommen rechts Raster | Liste und die Kachelgröße dazu (media-desk.js).
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
import { dom, el } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { groupByMonth } from "../../core/format.js";
import { mediaFilters } from "../../data/config.js";
import { findEntry, mediaEntries, mediaKindOf } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { mediaCell } from "../../ui/media-cell.js";
import { initPillSwipe, revealActive } from "../../ui/pill-swipe.js";
import { tabGlyph } from "../../ui/tab-glyph.js";
import { onDeskChange } from "../../ui/desk-mode.js";
import { isViewActive } from "../../ui/views.js";
import { isMediaList, mediaListMarkup, mountMediaTools, renderMediaTools } from "./media-desk.js";
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
          ${tabGlyph("media", filter.icon)}${filter.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("");
}

/* Das Raster: neueste zuerst, nach Monat gruppiert. */
function renderGrid() {
  const active = state.prefs.media.filter;
  const items = filtered(active);

  if (!items.length) {
    dom.mediaBody.innerHTML = emptyState({
      ...(emptyArt[active] || emptyArt.recent),
      action: emptyAction,
      data: 'data-media-pick="import"',
    });
    return;
  }

  /* Am Desktop wahlweise als Liste (media-desk.js) — gruppiert wird genauso. */
  const list = isMediaList();
  dom.mediaBody.innerHTML = groupByMonth(items)
    .map(
      (group) =>
        `<h2 class="media-month">${group.heading}</h2>${
          list ? mediaListMarkup(group.items) : `<div class="media-grid">${group.items.map(mediaCell).join("")}</div>`
        }`
    )
    .join("");
}

/*
 * Eine Kachel im Raster zeigt die Datei selbst, statt die Eintragsseite zu
 * öffnen. Der Klick wird deshalb abgefangen, bevor ihn die allgemeine
 * Listen-Behandlung (src/ui/list-clicks.js) sieht.
 */
function onCellClick(event) {
  const cell = event.target.closest("[data-open-entry]");
  if (!cell) return;
  const entry = findEntry(cell.dataset.openEntry);
  if (!entry) return;
  event.stopPropagation();
  event.preventDefault();
  /* Geblättert wird durch genau die Kacheln, die gerade im Raster stehen */
  const list = [...dom.mediaBody.querySelectorAll("[data-open-entry]")].map((item) => item.dataset.openEntry);
  load("viewer").then((module) => module.openViewer(entry, list));
}

/** Die ganze Seite neu zeichnen. */
export function renderMedia() {
  renderFilters();
  renderMediaTools();
  renderGrid();
}

/* Eine Filter-Pille wählen — per Tipp oder Wischen. */
function selectFilter(id) {
  state.prefs.media.filter = id;
  saveState();
  renderMedia();
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  dom.mediaFilters.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-media-filter]");
    if (pill) selectFilter(pill.dataset.mediaFilter);
  });

  initPillSwipe(el("view-media"), {
    order: mediaFilters.map((filter) => filter.id),
    current: () => state.prefs.media.filter,
    select: selectFilter,
  });

  /* true: vor der allgemeinen Listen-Behandlung, die sonst die Eintragsseite öffnet */
  dom.mediaBody.addEventListener("click", onCellClick, true);

  initMediaImport(dom.mediaActions);
  mountMediaTools(renderMedia);
  /* Über die Breitengrenze gezogen: Liste wird Raster und umgekehrt. */
  onDeskChange(() => {
    if (isViewActive("media")) renderMedia();
  });
  bindMediaPicks(dom.mediaBody);

  on(events.viewOpened, (name) => {
    if (name === "media") renderMedia();
  });
  on(events.dataChanged, () => {
    if (isViewActive("media")) renderMedia();
  });
  /* Zweites Antippen von „Medien“ unten, die Seite steht schon oben: zurück
     auf die erste Pille „Zuletzt erstellt“, die Pillenleiste rollt mit. */
  on(events.tabReselected, (tab) => {
    if (tab !== "media") return;
    if (state.prefs.media.filter !== mediaFilters[0].id) selectFilter(mediaFilters[0].id);
    revealActive(el("view-media"));
  });

  /* Wurde die Seite schon geöffnet, bevor dieses Modul fertig geladen war: jetzt zeichnen. */
  if (isViewActive("media")) renderMedia();
}

init();
