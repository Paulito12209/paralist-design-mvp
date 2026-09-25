/*
 * Die Knöpfe rechts neben den Pillen einer Eintragsseite. Sie wechseln mit
 * der Pille — links wählt man die Ansicht, rechts handelt man darin:
 *
 * - unter „Inhalt“ der Kopier-Knopf: Antippen kopiert die ganze Seite als
 *   Markdown, Gedrückthalten (oder Rechtsklick) fragt „Seite“ oder „Titel“,
 * - unter „Verknüpfte Einträge“ Filter und Plus: der Filter zeigt nur einen
 *   Typ, das Plus legt einen neuen Eintrag an (im Projekt darin, sonst
 *   verknüpft) oder verknüpft einen bestehenden.
 *
 * Wird es eng, kürzt die Pille „Verknüpfte Einträge“ ihr Wort mit „…“ —
 * die Knöpfe hier bleiben immer ganz sichtbar (styles/entry.css).
 * Pfad: src/features/entry/entry-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * COPIED_MS -> wie lange der Kopier-Knopf nach dem Kopieren einen Haken zeigt
 *
 * Aussehen steht in styles/entry.css (Klasse .page-tool, Maße in tokens.css:
 * --page-tool-size, --page-tool-icon, --page-tool-gap).
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { groupedLinks } from "../../data/links.js";
import { findEntry, groupedEntriesOf, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { ui } from "../../data/state.js";
import { copyEntry, copyOptions } from "../../ui/copy-page.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { cancelHold } from "../../ui/long-press.js";
import { openLinkPicker } from "../../ui/pickers.js";

/* Lang genug, um den Haken zu sehen, kurz genug für ein zweites Kopieren. */
const COPIED_MS = 1500;

/* Gewählter Typ im Filter, nur für den Eintrag, auf dem er gesetzt wurde.
   Jedes Öffnen einer Seite beginnt wieder mit „Alle“ (resetLinkFilter) —
   sonst fehlten beim nächsten Besuch Einträge, ohne dass man den Grund sieht. */
const filter = { id: null, type: "" };
let copiedTimer = 0;
/* Zeichnet die Liste neu, wenn der Filter wechselt; kommt aus entry.js. */
let rerender = () => {};

/* Die Gruppen unter der zweiten Pille: Inhalt eines Projekts oder Verknüpfungen. */
function linkGroups(entry) {
  return isContainer(entry) ? groupedEntriesOf(entryRef(entry.id)) : groupedLinks(entry);
}

/** Filter zurück auf „Alle“ — beim Öffnen einer Eintragsseite. */
export function resetLinkFilter() {
  filter.id = null;
  filter.type = "";
}

/** Der gefilterte Typ dieses Eintrags; leer, wenn alles zu sehen ist.
    Ist die Gruppe inzwischen leer (Eintrag gelöscht), gilt wieder „Alle“. */
export function linkFilterFor(entry) {
  if (filter.id !== entry.id || !filter.type) return "";
  return linkGroups(entry).some((group) => group.type === filter.type) ? filter.type : "";
}

/* Ein runder Knopf ohne Rahmen, wie die Werkzeuge über anderen Listen. */
function toolButton(name, label, data, extra = "") {
  return `<button class="page-tool${extra}" type="button" ${data} aria-label="${label}" title="${label}">${icon(name)}</button>`;
}

/** Die Knöpfe passend zur gewählten Pille zeichnen. */
export function renderEntryTools(entry) {
  clearTimeout(copiedTimer);
  if (ui.entryPill === "notes") {
    dom.entryTools.innerHTML = toolButton("copy", "Seite kopieren — gedrückt halten für nur den Titel", "data-copy-page");
    return;
  }
  const active = linkFilterFor(entry);
  /* Bei nur einer Gruppe gibt es nichts zu filtern — der Knopf bleibt stehen,
     damit nichts springt, lässt sich aber nicht drücken. */
  const useless = !active && linkGroups(entry).length < 2;
  dom.entryTools.innerHTML =
    toolButton("sliders", active ? "Filter aktiv" : "Filtern", `data-link-filter${useless ? " disabled" : ""}`, active ? " is-active" : "") +
    toolButton("plus", "Hinzufügen", "data-link-add");
}

/* Kurz einen Haken statt des Blattes zeigen — die Bestätigung direkt am Finger. */
function showCopied(button) {
  button.innerHTML = icon("check");
  button.classList.add("is-done");
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    button.innerHTML = icon("copy");
    button.classList.remove("is-done");
  }, COPIED_MS);
}

/** Auswahl „Seite“ oder „Titel“ neben dem Kopier-Knopf — nach Gedrückthalten oder Rechtsklick. */
export function openCopyChoice(anchor) {
  const entry = findEntry(ui.currentEntryId);
  if (entry) openCtxMenu(anchor, copyOptions(entry));
}

/* „Alle“ oder genau ein Typ; ein Haken zeigt, was gerade gilt. */
function openFilterMenu(button, entry) {
  const current = linkFilterFor(entry);
  const choose = (type) => () => {
    filter.id = entry.id;
    filter.type = type;
    rerender(entry);
  };
  openCtxMenu(button, [
    { label: "Alle", icon: "layers", active: !current, onSelect: choose("") },
    ...linkGroups(entry).map((group) => ({
      label: group.label,
      icon: group.icon,
      active: current === group.type,
      onSelect: choose(group.type),
    })),
  ]);
}

/* In einem Projekt entsteht der neue Eintrag darin — dafür reicht ein Tipp.
   Sonst gibt es zwei Wege: neu anlegen (gleich verknüpft) oder Bestehendes verknüpfen —
   „Verknüpfen“ heißt wie im Menü oben rechts, dort öffnet es dieselbe Auswahl. */
function addLinked(button, entry) {
  if (isContainer(entry)) {
    emit(events.createRequested);
    return;
  }
  openCtxMenu(button, [
    { label: "Neuer Eintrag", icon: "plus-circle", onSelect: () => emit(events.createRequested) },
    { label: "Verknüpfen", icon: "link", onSelect: () => openLinkPicker(entry) },
  ]);
}

/**
 * Klicks auf die Knöpfe anmelden. Das Gedrückthalten des Kopier-Knopfs
 * startet src/ui/swipe.js wie bei allen Zeilen; geöffnet wird dann
 * `openCopyChoice` (angemeldet in src/main.js).
 * @param options.rerender zeichnet die Liste nach einem Filterwechsel neu
 */
export function initEntryTools(options) {
  rerender = options.rerender;
  const tools = dom.entryTools;

  tools.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    const copy = event.target.closest("[data-copy-page]");
    if (copy) {
      copyEntry(entry, "page").then((done) => done && copy.isConnected && showCopied(copy));
      return;
    }
    const filterBtn = event.target.closest("[data-link-filter]");
    if (filterBtn) {
      openFilterMenu(filterBtn, entry);
      return;
    }
    const add = event.target.closest("[data-link-add]");
    if (add) addLinked(add, entry);
  });

  /* Rechtsklick mit der Maus — und das lange Drücken auf Android, das hier
     ebenfalls „contextmenu“ auslöst. Der Halte-Timer wird verworfen, sonst
     ginge die Auswahl beim Loslassen ein zweites Mal auf. */
  tools.addEventListener("contextmenu", (event) => {
    const copy = event.target.closest("[data-copy-page]");
    if (!copy) return;
    event.preventDefault();
    cancelHold();
    openCopyChoice(copy);
  });
}
