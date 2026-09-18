/*
 * Die Seite eines Eintrags: Titel, Text, Anhänge und das Menü oben rechts.
 * Bei einer Zeichnung steht statt des Textes die Zeichenfläche.
 * Pfad: src/features/entry/entry.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen stehen in styles/entry.css
 * (--entry-title-size, --entry-body-size).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { deleteEntry, moveEntry, toggleFavorite } from "../../data/mutations.js";
import { findEntry, parentName } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";
import { archiveEntry } from "../../data/xp.js";
import { mediaCell } from "../../ui/media-cell.js";
import { openParentPicker } from "../../ui/pickers.js";
import { restoreFrom } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";

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

/** Die Seite mit dem Eintrag füllen, der gerade offen ist. */
function renderEntry() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;

  dom.entryTitle.value = entry.title;
  dom.entryBody.value = entry.body || "";
  dom.entryCrumb.textContent = parentName(entry.parent);
  renderAttachments(entry);

  /* Zeichnungen zeigen statt des Textes die Zeichenfläche. */
  const isDrawing = entry.type === "zeichnung";
  dom.entryBody.hidden = isDrawing;
  dom.drawPad.hidden = !isDrawing;
  if (isDrawing) load("drawing").then((module) => module.openDrawing(entry));
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
      onSelect: () =>
        openParentPicker("Verknüpfen mit", entry.parent, (parent) => {
          moveEntry(entry, parent);
          dom.entryCrumb.textContent = parentName(parent);
        }),
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

/** Felder, Menü und Zurück-Pfeil der Eintragsseite anmelden. */
export function initEntry() {
  bindTextField(dom.entryTitle, "title");
  bindTextField(dom.entryBody, "body");

  dom.entryMenu.addEventListener("click", openEntryMenu);
  dom.entryBack.addEventListener("click", (event) => {
    event.preventDefault();
    history.back();
  });

  on(events.viewOpened, (name) => {
    if (name === "entry") renderEntry();
  });

  /* Wird der offene Eintrag anderswo gelöscht, gibt es hier nichts mehr zu zeigen. */
  on(events.dataChanged, () => {
    if (!dom.entryAttachments.hidden && !findEntry(ui.currentEntryId)) {
      dom.entryAttachments.hidden = true;
    }
  });
}
