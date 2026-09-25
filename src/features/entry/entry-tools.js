/*
 * Die Knöpfe rechts neben den Pillen einer Eintragsseite — für jeden Typ
 * (Notiz, Aufgabe, Termin, Projekt, …). Aussehen, Kopieren und Filter sind
 * derselbe Baustein wie auf der Seite eines Arbeitsbereichs
 * (src/ui/page-tools.js); hier steht nur, was einen Eintrag betrifft:
 * welche Gruppen unter der zweiten Pille stehen und was das Plus tut —
 * im Projekt einen Eintrag darin anlegen, sonst neu anlegen oder verknüpfen.
 * Pfad: src/features/entry/entry-tools.js
 *
 * Keine anpassbaren visuellen Werte: siehe src/ui/page-tools.js und
 * styles/entry.css (Klasse .page-tool).
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { groupedLinks } from "../../data/links.js";
import { findEntry, groupedEntriesOf, isContainer } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { ui } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { activeFilter, openFilterMenu, pageToolsMarkup, registerCopySource } from "../../ui/page-tools.js";
import { openLinkPicker } from "../../ui/pickers.js";

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
  dom.entryTools.innerHTML = pageToolsMarkup(ui.entryPill, filterKey(entry), linkGroups(entry));
}

/* In einem Projekt entsteht der neue Eintrag darin — dafür reicht ein Tipp.
   Sonst gibt es zwei Wege: neu anlegen (gleich verknüpft) oder Bestehendes
   verknüpfen — „Verknüpfen“ heißt wie im Menü oben rechts, dort öffnet es
   dieselbe Auswahl. */
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
    const add = event.target.closest("[data-link-add]");
    if (add) addLinked(add, entry);
  });
}
