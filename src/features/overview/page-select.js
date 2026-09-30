/*
 * Der Auswahlmodus auf allen Sammlungen und Ablageorten der Unterseite:
 * Eingang, Favoriten, Ressourcen, Archiv, Arbeitsbereiche, Lesezeichen,
 * Projekte und die Seite eines Arbeitsbereichs. Was jede Auswahl kann,
 * steht in src/ui/selection.js; hier, was die Unterseite dazugibt:
 *
 * - Die Seiten zeichnen ihre Zeilen selbst, jede auf ihre Art. Statt jede
 *   davon anzufassen, bekommt jede gezeichnete Zeile hier ihren Schlüssel
 *   („e:12“ Eintrag, „w:3“ Arbeitsbereich) und im Modus ihren Kreis — ein
 *   Beobachter merkt, wann der Inhalt neu gezeichnet wurde. Lesezeichen
 *   lassen sich nur wählen, wenn sie ein eigener Eintrag sind; eine Karte in
 *   einer Notiz gehört zu dieser Notiz.
 * - „Auswählen“ oben im Menü einer Zeile (Eintrag und Arbeitsbereich).
 * - Über der Liste die Zählzeile; Pillen, „Arbeitsbereich hinzufügen“ und
 *   „Zum Archiv“ treten solange zurück.
 * - Unten eine Leiste je Art der Seite (src/features/overview/page-select-actions.js).
 *
 * Die Auswahl endet bei jedem Wechsel der Seite — auch zwischen zwei Sammlungen.
 * Pfad: src/features/overview/page-select.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * selectLabel -> Beschriftung von „Auswählen“ im Menü einer Zeile
 * selectIcon  -> Icon davor
 * ROWS        -> welche Zeilen wählbar sind
 *
 * Aussehen: styles/tasks-select.css.
 */

import { dom } from "../../core/dom.js";
import { findEntry, findWorkspace } from "../../data/queries.js";
import { addEntryMenuLead } from "../../ui/entry-menu.js";
import { selectRowMarkup, updateSelectRow } from "../../ui/select-bar.js";
import { createSelection } from "../../ui/selection.js";
import { initPageActions, updatePageBar } from "./page-select-actions.js";

const selectLabel = "Auswählen";
const selectIcon = "checklist";
const ROWS = ".swipe[data-entry], .swipe[data-workspace], .bookmark-row[data-bookmark-own]";

/* Jede neu geöffnete Seite beendet die Auswahl — auch der Weg von einer Sammlung zur nächsten. */
const selection = createSelection({ host: () => dom.pageBody, view: "page", leaveOn: () => true });

/* Die Zählzeile über der Liste; entsteht in initPageSelect. */
let countRow = null;

/** Die gewählten Einträge und Arbeitsbereiche — was es nicht mehr gibt, fällt weg. */
export function pickedItems() {
  const keys = selection.keys();
  return {
    entries: keys.filter((key) => key.startsWith("e:")).map((key) => findEntry(key.slice(2))).filter(Boolean),
    spaces: keys.filter((key) => key.startsWith("w:")).map((key) => findWorkspace(key.slice(2))).filter(Boolean),
  };
}

/* Schlüssel und (im Modus) Kreis an jede wählbare Zeile — einmal je Zeichnen. */
function decorate() {
  dom.pageBody.querySelectorAll(ROWS).forEach((row) => {
    const key = row.dataset.workspace ? `w:${row.dataset.workspace}` : `e:${row.dataset.entry || row.dataset.openEntry}`;
    row.dataset.pickRow = key;
    if (!selection.isOn() || row.querySelector(".task-pick")) return;
    (row.querySelector(".swipe-body") || row).insertAdjacentHTML("afterbegin", selection.mark(key));
  });
}

/* Nach jedem Tipp: Zählzeile und Leiste. */
function onSync(on) {
  countRow.hidden = !on;
  updatePageBar(on, selection.count());
  if (!on) return;
  updateSelectRow(countRow, { count: selection.count(), allPicked: selection.allRowsPicked() });
}

/** „Auswählen“ für eine Zeile der Unterseite — oder nichts, wenn sie hier nicht wählbar ist. */
export function pageSelectLead(row) {
  const key = row.closest("#page-body") && row.closest("[data-pick-row]")?.dataset.pickRow;
  return key ? [{ label: selectLabel, icon: selectIcon, onSelect: () => selection.enter(key) }] : [];
}

/**
 * Einmal beim Start der Unterseite anmelden.
 * @param redraw zeichnet den Inhalt der Unterseite neu (renderPageBody aus page.js)
 */
export function initPageSelect(redraw) {
  countRow = document.createElement("div");
  countRow.className = "page-select-row";
  countRow.hidden = true;
  countRow.innerHTML = selectRowMarkup();
  countRow.addEventListener("click", (event) => {
    if (event.target.closest("[data-select-exit]")) selection.exit();
    else if (event.target.closest("[data-select-all]")) selection.toggleAll();
  });
  dom.pageBody.before(countRow);

  selection.listen({ redraw, onSync });
  initPageActions({ exit: () => selection.exit(), settle: () => selection.settle(), picked: pickedItems });
  addEntryMenuLead((entry, row) => pageSelectLead(row));

  /* Die Seiten ersetzen ihren Inhalt als Ganzes: danach Schlüssel und Kreise setzen */
  new MutationObserver(() => {
    decorate();
    selection.afterRender();
  }).observe(dom.pageBody, { childList: true });
  /* Vor src/ui/list-clicks.js: im Modus wählt ein Tipp, statt zu öffnen */
  dom.pageBody.addEventListener("click", (event) => selection.handleClick(event));
}
