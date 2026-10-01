/*
 * Die Knöpfe rechts neben den Pillen einer Eintragsseite — für jeden Typ
 * (Notiz, Aufgabe, Termin, Projekt, …). Aussehen, Kopieren und Filter sind
 * derselbe Baustein wie auf der Seite eines Arbeitsbereichs
 * (src/ui/page-tools.js); hier steht nur, was einen Eintrag betrifft:
 * welche Gruppen unter der zweiten Pille stehen und was das Plus tut —
 * im Projekt einen Eintrag darin anlegen, sonst neu anlegen oder verknüpfen.
 * Unter „Inhalt“ steht rechts neben „Kopieren“ der Info-Knopf: er öffnet die
 * Angaben als Blatt von unten (entry-details-sheet.js). Zu sehen ist er nur
 * in der Android-Fassung, die dafür keine Karte „Details“ zeigt — das
 * entscheidet styles/android-entry.css.
 * Pfad: src/features/entry/entry-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * infoLabel -> Vorlesetext und Hinweis des Info-Knopfs
 *
 * Aussehen: siehe src/ui/page-tools.js und styles/entry.css (Klasse .page-tool).
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { groupedLinks } from "../../data/links.js";
import { findEntry, groupedEntriesOf, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { ui } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { activeFilter, openFilterMenu, pageToolsMarkup, registerCopySource } from "../../ui/page-tools.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { isDetailsSheetOpen, openDetailsSheet } from "./entry-details-sheet.js";

const infoLabel = "Details";

/* Zeichnet die Liste neu, wenn der Filter wechselt; kommt aus entry.js. */
let rerender = () => {};

/* Schlüssel dieser Seite für den Filter — getrennt von den Arbeitsbereichen. */
function filterKey(entry) {
  return `e:${entry.id}`;
}

/* Die Gruppen unter der zweiten Pille: Inhalt eines Projekts oder Verknüpfungen. */
function linkGroups(entry) {
  return isContainer(entry) ? groupedEntriesOf(entryRef(entry.id)) : groupedLinks(entry);
}

/** Der gefilterte Typ dieses Eintrags; leer, wenn alles zu sehen ist. */
export function linkFilterFor(entry) {
  return activeFilter(filterKey(entry), linkGroups(entry));
}

/** Die Knöpfe passend zur gewählten Pille zeichnen. */
export function renderEntryTools(entry) {
  const copyLabel = entry.type === "zeichnung" ? "Bild" : "Seite";
  const info =
    ui.entryPill === "notes"
      ? `<button class="page-tool entry-info-btn" type="button" data-entry-info aria-label="${infoLabel}" title="${infoLabel}" aria-expanded="${isDetailsSheetOpen()}">${icon("info")}</button>`
      : "";
  dom.entryTools.innerHTML = pageToolsMarkup(ui.entryPill, filterKey(entry), linkGroups(entry), copyLabel) + info;
}

/* In einem Projekt entsteht der neue Eintrag darin — dafür reicht ein Tipp.
   Sonst gibt es zwei Wege: neu anlegen (gleich verknüpft) oder Bestehendes
   verknüpfen — „Verknüpfen“ heißt wie in der Leiste über der Navigation,
   dort öffnet das Ketten-Symbol dasselbe Blatt. */
function addLinked(button, entry) {
  if (isContainer(entry)) {
    emit(events.createRequested);
    return;
  }
  openCtxMenu(button, [
    { label: "Neuer Eintrag", icon: "plus-circle", onSelect: () => emit(events.createRequested) },
    { label: "Verknüpfen", icon: "link", onSelect: () => openLinkSheet(entry) },
  ]);
}

/**
 * Filter und Plus anmelden, dazu was der Kopier-Knopf hier kopiert.
 * @param options.rerender zeichnet die Liste nach einem Filterwechsel neu
 */
export function initEntryTools(options) {
  rerender = options.rerender;
  registerCopySource("entry", () => findEntry(ui.currentEntryId));

  dom.entryTools.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    const filterBtn = event.target.closest("[data-link-filter]");
    if (filterBtn) {
      openFilterMenu(filterBtn, filterKey(entry), linkGroups(entry), () => rerender(entry));
      return;
    }
    if (event.target.closest("[data-entry-info]")) {
      openDetailsSheet(entry);
      return;
    }
    const add = event.target.closest("[data-link-add]");
    if (add) addLinked(add, entry);
  });
}
