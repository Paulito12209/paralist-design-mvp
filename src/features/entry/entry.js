/*
 * Die Seite eines Eintrags: Titel, zwei Pillen „Inhalt“ und „Verknüpfte
 * Einträge“ (wie auf der Seite eines Arbeitsbereichs; waagerecht wischen
 * wechselt zwischen ihnen), und das Menü oben rechts. Bei einer Zeichnung steht im Inhalt die Zeichenfläche statt des
 * Textes.
 *
 * Bei einer Aufgabe steht mittig in der Kopfzeile „Aufgabe: Offen | Jetzt“;
 * ein Tipp darauf öffnet das Blatt mit Status und Dringlichkeit
 * (src/ui/task-status.js) — egal, von wo aus man die Aufgabe geöffnet hat.
 * Bei jedem anderen Eintrag ist die Kategorie („Notiz“) eine Pille, die das
 * Blatt „Typ ändern“ öffnet (src/ui/type-menu.js); nur eine Zeichnung und
 * ein Medium bleiben, was sie sind.
 *
 * Unter der zweiten Pille steht bei einem Projekt sein INHALT — was dort
 * abgelegt ist. Bei jedem anderen Eintrag stehen dort die VERKNÜPFTEN
 * Einträge: die Verbindung gilt auf beiden Seiten, keiner der beiden ist dem
 * anderen untergeordnet (src/data/links.js).
 *
 * Unter „Inhalt“ startet ein Tipp in die freie Fläche unter dem Text das
 * Schreiben am Textende; bei offener Tastatur schließt ein Tipp nur sie
 * (src/ui/write-tap.js).
 * Pfad: src/features/entry/entry.js
 *
 * Keine anpassbaren visuellen Werte: Schriftgrößen stehen in styles/entry.css
 * (--entry-title-size, --entry-body-size).
 */

import { events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { load } from "../../core/lazy.js";
import { canChangeType } from "../../data/convert.js";
import { entryTypeName } from "../../data/details.js";
import { linkedEntries } from "../../data/links.js";
import { entriesOf, findEntry, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { groupedListMarkup, linkedListMarkup } from "../../ui/groups.js";
import { scheduleSave, ui } from "../../data/state.js";
import { entryMenuOptions } from "../../ui/entry-menu.js";
import { initEntryTitle, showEntryTitle } from "./entry-title.js";
import { bindHeadTitle, setHeadTitle } from "../../ui/head-title.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { goBack, restoreFrom } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";
import { openTaskSheet, taskCrumbMarkup } from "../../ui/task-status.js";
import { openTypeSheet, typeCrumbMarkup } from "../../ui/type-menu.js";
import { isViewActive } from "../../ui/views.js";
import { addWritePage } from "../../ui/write-tap.js";

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

/* Mitte der Kopfzeile: die Kategorie, bei einer Aufgabe dazu Status und
   Dringlichkeit zum Antippen — sonst die Kategorie selbst als Pille. */
function renderCrumb(entry) {
  const name = entryTypeName(entry);
  if (entry.type === "aufgabe") dom.entryCrumb.innerHTML = taskCrumbMarkup(entry, name);
  else if (canChangeType(entry)) dom.entryCrumb.innerHTML = typeCrumbMarkup(name);
  else dom.entryCrumb.textContent = name;
}

/* Der graue Untertitel des kleinen Kopfzeilen-Titels nennt den Typ — nach
   einem Typwechsel muss er mitziehen, ohne den Titel zu verstecken. */
function syncHeadSub(entry) {
  const sub = el("entry-head").querySelector(".head-title-sub");
  if (sub) sub.textContent = entryTypeName(entry);
}

/** Die Seite mit dem Eintrag füllen, der gerade offen ist. */
function renderEntry() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;

  showEntryTitle(entry);
  dom.entryBody.value = entry.body || "";
  /* Mittig die Kategorie, nicht der Ort: der Zurück-Pfeil führt dorthin, wo
     man zuletzt war — nicht zwingend an den Ort des Eintrags. */
  renderCrumb(entry);
  setHeadTitle(el("entry-head"), entry.title || "Ohne Titel", entryTypeName(entry));

  /* Zeichnungen zeigen statt des Textes die Zeichenfläche. */
  const isDrawing = entry.type === "zeichnung";
  dom.entryBody.hidden = isDrawing;
  dom.drawPad.hidden = !isDrawing;
  if (isDrawing) load("drawing").then((module) => module.openDrawing(entry));
  renderLinks(entry);
  renderEntryPills(entry);
}

/* Das Menü oben rechts auf der Eintragsseite — dieselben Aktionen wie beim
   gedrückt Halten einer Zeile (src/ui/entry-menu.js), hier als Blatt. */
function openEntryMenu() {
  const entry = findEntry(ui.currentEntryId);
  if (!entry) return;
  const options = entryMenuOptions(entry, {
    onPage: true,
    afterRemove: () => restoreFrom(ui.sourceView),
  });
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
  initEntryTitle();
  bindTextField(dom.entryBody, "body");
  bindHeadTitle(el("entry-head"), dom.entryTitle, () => isViewActive("entry"));

  const selectPill = (id) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    /* Der Text verschwindet gleich: vorher den Cursor herausnehmen, sonst
       bliebe die Tastatur für ein unsichtbares Feld offen. */
    if (id !== "notes") dom.entryBody.blur();
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

  /* Ein Tipp in die freie Fläche unter dem Text schreibt weiter; bei offener
     Tastatur schließt ein Tipp nur sie. Eine Zeichnung hat kein Textfeld. */
  addWritePage({
    view: "entry",
    field: () => (ui.entryPill === "notes" && !dom.entryBody.hidden ? dom.entryBody : null),
  });

  /* „Aufgabe: Offen | Jetzt“ in der Kopfzeile öffnet Status und Dringlichkeit,
     die Pille „Notiz“ das Blatt „Typ ändern“ */
  dom.entryCrumb.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    if (event.target.closest("[data-task-sheet]")) openTaskSheet(entry);
    else if (event.target.closest("[data-type-sheet]")) openTypeSheet({ entry });
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
    /* Verknüpfungen können sich im offenen Blatt gerade ändern, der Typ auch */
    renderCrumb(entry);
    syncHeadSub(entry);
    renderLinks(entry);
    renderEntryPills(entry);
  });
}
