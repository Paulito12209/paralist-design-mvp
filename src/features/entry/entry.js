/*
 * Die Seite eines Eintrags: Titel, zwei Pillen „Inhalt“ und „Verknüpfte
 * Seiten“ (auf der Seite eines Arbeitsbereichs heißt die zweite Pille weiter
 * „Verknüpfte Inhalte“), und das Menü oben rechts. Bei einer Zeichnung steht
 * im Inhalt die Zeichenfläche statt des Textes.
 * Pfad: src/features/entry/entry.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen stehen in styles/entry.css
 * (--entry-title-size, --entry-body-size).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { deleteEntry, toggleFavorite } from "../../data/mutations.js";
import { entriesOf, findEntry, placesLabel } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { groupedListMarkup } from "../../ui/groups.js";
import { scheduleSave, ui } from "../../data/state.js";
import { archiveEntry } from "../../data/xp.js";
import { mediaCell } from "../../ui/media-cell.js";
import { openPlacesPicker } from "../../ui/pickers.js";
import { restoreFrom } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";

/* Die beiden Pillen; die zweite trägt die Anzahl der Anhänge und dessen,
   was im Eintrag liegt (bei einem Projekt). Kein Icon: es wird nie mehr als
   diese zwei geben, das Wort allein reicht. */
const entryPills = [
  { id: "notes", label: "Inhalt" },
  { id: "links", label: "Verknüpfte Seiten" },
];

/** Anhänge und Verknüpftes zusammen, für die Zahl auf der zweiten Pille. */
function entryLinksCount(entry) {
  const attachments = (entry.attachments || []).filter((id) => {
    const item = findEntry(id);
    return item && !item.archived;
  });
  return attachments.length + entriesOf(entryRef(entry.id)).length;
}

/** Pillen neu zeichnen und die passende Fläche darunter zeigen. */
function renderEntryPills(entry) {
  const count = entryLinksCount(entry);
  dom.entryPills.innerHTML = entryPills
    .map(
      (pill) => `
        <button class="tab-pill${pill.id === ui.entryPill ? " is-active" : ""}" type="button" data-entry-pill="${pill.id}">
          ${pill.label}${pill.id === "links" && count ? `<span class="media-count">${count}</span>` : ""}
        </button>`
    )
    .join("");
  dom.entryPanelNotes.hidden = ui.entryPill !== "notes";
  dom.entryPanelLinks.hidden = ui.entryPill !== "links";
}

/** Die Anhänge eines Eintrags als Kachelraster. */
function renderAttachments(entry) {
  const list = (entry.attachments || [])
    .map((id) => findEntry(id))
    .filter((item) => item && !item.archived);
  dom.entryAttachments.hidden = !list.length;
  dom.entryAttachments.innerHTML = list.length
    ? `<div class="media-grid">${list.map(mediaCell).join("")}</div>`
    : "";
}

/* Was in diesem Eintrag liegt, z.B. bei einem Projekt Aufgaben und Notizen. */
function renderLinks(entry) {
  dom.entryLinks.innerHTML = groupedListMarkup(entryRef(entry.id));
}

/** Die Seite mit dem Eintrag füllen, der gerade offen ist. */
function renderEntry() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;

  dom.entryTitle.value = entry.title;
  dom.entryBody.value = entry.body || "";
  dom.entryCrumb.textContent = placesLabel(entry);
  renderAttachments(entry);

  /* Zeichnungen zeigen statt des Textes die Zeichenfläche. */
  const isDrawing = entry.type === "zeichnung";
  dom.entryBody.hidden = isDrawing;
  dom.drawPad.hidden = !isDrawing;
  if (isDrawing) load("drawing").then((module) => module.openDrawing(entry));
  renderLinks(entry);
  renderEntryPills(entry);
}

/* Das Menü oben rechts auf der Eintragsseite. */
function openEntryMenu() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;

  const options = [
    {
      label: entry.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: entry.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(entry),
    },
    {
      label: "Verknüpfen",
      icon: "link",
      onSelect: () => openPlacesPicker(entry),
    },
  ];

  if (entry.type === "zeichnung") {
    options.push({
      label: "Zeichnung leeren",
      icon: "eraser",
      onSelect: () => load("drawing").then((module) => module.clearDrawing()),
    });
  }

  options.push(
    {
      label: "Archivieren",
      icon: "archive",
      onSelect: () => {
        archiveEntry(entry);
        emit(events.dataChanged);
        restoreFrom(ui.sourceView);
      },
    },
    {
      label: "Eintrag löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        deleteEntry(entry.id);
        restoreFrom(ui.sourceView);
      },
    }
  );

  openSheet(entry.title || "Eintrag", options);
}

/* Tippen speichert erst kurz nach dem letzten Buchstaben, nicht bei jedem Zeichen. */
function bindTextField(field, key) {
  field.addEventListener("input", () => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    entry[key] = field.value;
    scheduleSave();
  });
}

/** Felder, Pillen, Menü und Zurück-Pfeil der Eintragsseite anmelden. */
export function initEntry() {
  bindTextField(dom.entryTitle, "title");
  bindTextField(dom.entryBody, "body");

  dom.entryPills.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-entry-pill]");
    if (!pill) return;
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    ui.entryPill = pill.dataset.entryPill;
    renderEntryPills(entry);
  });

  dom.entryMenu.addEventListener("click", openEntryMenu);
  dom.entryBack.addEventListener("click", (event) => {
    event.preventDefault();
    history.back();
  });

  on(events.viewOpened, (name) => {
    if (name === "entry") renderEntry();
  });

  /* Was in einem Projekt liegt, kann sich ändern, während es offen ist. */
  on(events.dataChanged, () => {
    if (!isViewActive("entry")) return;
    const entry = findEntry(ui.currentEntryId);
    if (!entry) {
      dom.entryAttachments.hidden = true;
      dom.entryLinks.innerHTML = "";
      return;
    }
    /* Die Orte können sich im offenen Blatt „Verknüpfen mit“ gerade ändern */
    dom.entryCrumb.textContent = placesLabel(entry);
    renderAttachments(entry);
    renderLinks(entry);
    renderEntryPills(entry);
  });
}
