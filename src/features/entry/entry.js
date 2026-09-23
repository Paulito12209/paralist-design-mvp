/*
 * Die Seite eines Eintrags: Titel, zwei Pillen „Inhalt“ und „Verknüpfte
 * Einträge“ (wie auf der Seite eines Arbeitsbereichs; waagerecht wischen
 * wechselt zwischen ihnen), und das Menü oben rechts. Bei einer Zeichnung steht im Inhalt die Zeichenfläche statt des
 * Textes.
 *
 * Unter der zweiten Pille steht bei einem Projekt sein INHALT — was dort
 * abgelegt ist. Bei jedem anderen Eintrag stehen dort die VERKNÜPFTEN
 * Einträge: die Verbindung gilt auf beiden Seiten, keiner der beiden ist dem
 * anderen untergeordnet (src/data/links.js).
 * Pfad: src/features/entry/entry.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen stehen in styles/entry.css
 * (--entry-title-size, --entry-body-size).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { entryCategoryName, entryDetails, entryTypeName } from "../../data/details.js";
import { linkedEntries } from "../../data/links.js";
import { deleteEntry, toggleFavorite } from "../../data/mutations.js";
import { entriesOf, findEntry, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { groupedListMarkup, linkedListMarkup } from "../../ui/groups.js";
import { scheduleSave, ui } from "../../data/state.js";
import { archiveEntry } from "../../data/xp.js";
import { openDetails } from "../../ui/details.js";
import { bindHeadTitle, setHeadTitle } from "../../ui/head-title.js";
import { openLinkPicker } from "../../ui/pickers.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { goBack, restoreFrom } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";

/* Die beiden Pillen; die zweite trägt die Anzahl dessen, was darunter steht.
   Kein Icon: es wird nie mehr als diese zwei geben, das Wort allein reicht. */
const entryPills = [
  { id: "notes", label: "Inhalt" },
  { id: "links", label: "Verknüpfte Einträge" },
];

/** Die Zahl auf der zweiten Pille: bei einem Projekt sein Inhalt, sonst die Verknüpfungen. */
function entryLinksCount(entry) {
  return isContainer(entry) ? entriesOf(entryRef(entry.id)).length : linkedEntries(entry).length;
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

/* Ein Projekt zeigt, was darin liegt; jeder andere Eintrag, womit er verknüpft ist. */
function renderLinks(entry) {
  dom.entryLinks.innerHTML = isContainer(entry)
    ? groupedListMarkup(entryRef(entry.id))
    : linkedListMarkup(entry);
}

/** Die Seite mit dem Eintrag füllen, der gerade offen ist. */
function renderEntry() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;

  dom.entryTitle.value = entry.title;
  dom.entryBody.value = entry.body || "";
  /* Mittig die Kategorie, nicht der Ort: der Zurück-Pfeil führt dorthin, wo
     man zuletzt war — nicht zwingend an den Ort des Eintrags. */
  dom.entryCrumb.textContent = entryCategoryName(entry);
  setHeadTitle(el("entry-head"), entry.title || "Ohne Titel", entryTypeName(entry));

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
      onSelect: () => openLinkPicker(entry),
    },
    {
      label: "Details",
      icon: "info",
      onSelect: () => openDetails(entry.title || "Ohne Titel", entryDetails(entry)),
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
  bindHeadTitle(el("entry-head"), dom.entryTitle, () => isViewActive("entry"));
  /* Beim Umbenennen den kleinen Titel oben mitziehen */
  dom.entryTitle.addEventListener("input", () => {
    const small = el("entry-head").querySelector(".head-title-main");
    small.textContent = dom.entryTitle.value || "Ohne Titel";
  });

  const selectPill = (id) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    ui.entryPill = id;
    renderEntryPills(entry);
  };

  dom.entryPills.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-entry-pill]");
    if (pill) selectPill(pill.dataset.entryPill);
  });

  /* Waagerecht wischen irgendwo auf der Seite wechselt ebenfalls die Pille. */
  initPillSwipe(el("view-entry"), {
    order: entryPills.map((pill) => pill.id),
    current: () => ui.entryPill,
    select: selectPill,
  });

  dom.entryMenu.addEventListener("click", openEntryMenu);
  dom.entryBack.addEventListener("click", (event) => {
    event.preventDefault();
    goBack();
  });

  on(events.viewOpened, (name) => {
    if (name === "entry") renderEntry();
  });

  /* Inhalt und Verknüpfungen können sich ändern, während die Seite offen ist. */
  on(events.dataChanged, () => {
    if (!isViewActive("entry")) return;
    const entry = findEntry(ui.currentEntryId);
    if (!entry) {
      dom.entryLinks.innerHTML = "";
      return;
    }
    /* Verknüpfungen können sich im offenen Blatt gerade ändern */
    renderLinks(entry);
    renderEntryPills(entry);
  });
}
