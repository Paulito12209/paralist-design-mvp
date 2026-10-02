/*
 * Das Filter-Blatt: ein Blatt von unten wie „Sortieren“ (Titel mit ✕, unten
 * „Fertig“), aber mit zwei Ebenen wie die Einstellungen. Die Übersicht
 * zeigt je Abschnitt eine Zeile (Ort, Status, Dringlichkeit …); ein Tipp
 * öffnet dessen Unterseite im selben Blatt, oben links steht dann der
 * Zurück-Pfeil neben dem Titel — genau wie auf einer Unterseite der
 * Einstellungen. Eine Unterseite lässt sich auch direkt öffnen (ein Tipp auf
 * einen Chip in der Karte „Ansicht“).
 *
 * Mit `chips: true` zeigt die Android-Fassung (Material 3) stattdessen alle
 * Abschnitte als Chips auf einer Seite (src/ui/filter-sheet-chips.js): oben
 * rechts „Zurücksetzen“, unten statt „Fertig“ die Zahl der Treffer
 * (`doneText`). iOS und Desktop behalten Übersicht und Unterseiten.
 *
 * Das Blatt hält keinen eigenen Filterstand: nach jeder Wahl ruft der
 * Aufrufer openFilterSheet mit dem neuen Stand erneut auf, das Blatt bleibt
 * offen, merkt sich die offene Unterseite und zeichnet sich neu.
 *
 * Ein Abschnitt ist { id, label, icon, summary, active, mode?, onMode?,
 * items, onToggle(id), note? }: `summary` steht rechts in der Übersicht,
 * `active` sagt, ob darin gefiltert wird, `mode` ist "is" oder "not" (nur
 * bei Mehrfachwahl; dann gibt es das Segment und `onMode(mode)`, `modeLabels`
 * tauscht dessen Wörter aus), `items` sind [{ id, label, icon, color?,
 * active, info?: { title, text }, entry?, action? }] — `entry` ist ein
 * gewählter Eintrag (Eingabe-Chip), `action` ein Knopf statt eines Werts —,
 * `chipIcons` zeigt im Chip-Blatt vor jedem Wert sein Icon, `note` ein Satz
 * unter der Liste. Mehrfachwahl-Abschnitte können für das Chip-Blatt eigene
 * `chipItems`, `chipToggle(id)` und `chipMode(mode)` mitbringen
 * (src/ui/filter-multi.js). Das Markup baut src/ui/filter-sheet-markup.js,
 * das der Chips src/ui/filter-sheet-chips.js.
 * Pfad: src/ui/filter-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * doneLabel  -> Aufschrift des Knopfs unten
 * resetLabel -> Aufschrift von „Alle Filter zurücksetzen“ in der Übersicht
 * topResetLabel -> Aufschrift von „Zurücksetzen“ oben rechts im Chip-Blatt
 *
 * Aussehen: Blatt und „Fertig“ teilen sich die Stile mit „Sortieren“
 * (styles/calendar.css, styles/overlays.css); Zeilen, Segment, Haken und
 * Hinweis stehen in styles/filter-sheet.css, die Chips in
 * styles/android-filter-sheet.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { chipsMarkup } from "./filter-sheet-chips.js";
import { overviewMarkup, pageMarkup } from "./filter-sheet-markup.js";
import { openInfoDialog } from "./info-dialog.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";
import { isMobileOs } from "./platform.js";

const doneLabel = "Fertig";
const resetLabel = "Alle Filter zurücksetzen";
const topResetLabel = "Zurücksetzen";

let root = null;
/* Das offene Blatt, wie es openFilterSheet bekommen hat — oder null */
let open = null;
/* id der offenen Unterseite — null ist die Übersicht */
let pageId = null;

/* Der Abschnitt der offenen Unterseite; null in der Übersicht oder wenn es ihn nicht mehr gibt */
function currentSection() {
  return (pageId && open.sections.find((section) => section.id === pageId)) || null;
}

/* Zeigt das Blatt gerade alle Abschnitte als Chips? Nur auf Wunsch des Aufrufers und in der Android-Fassung. */
function usesChips() {
  return Boolean(open && open.chips) && isMobileOs("android");
}

/* Kopf und Inhalt neu zeichnen; die Rolllage des Inhalts bleibt beim Neuzeichnen stehen */
function render() {
  const chips = usesChips();
  if (chips) pageId = null;
  const section = currentSection();
  if (pageId && !section) pageId = null;
  const body = root.querySelector(".modal-body");
  const scroll = body.scrollTop;
  const reset = root.querySelector("[data-filter-top-reset]");
  root.querySelector(".filter-modal").classList.toggle("is-chips", chips);
  root.querySelector(".modal-head").classList.toggle("is-back", Boolean(section));
  root.querySelector("[data-filter-back]").hidden = !section;
  root.querySelector("#filter-modal-title").textContent = open.title;
  reset.hidden = !chips;
  reset.disabled = !open.resetActive;
  root.querySelector(".date-done").textContent = chips && open.doneText ? open.doneText : doneLabel;
  root.querySelector(".filter-content").innerHTML = chips
    ? chipsMarkup(open.sections)
    : section
      ? pageMarkup(section)
      : overviewMarkup(open.sections, resetLabel, open.resetActive);
  body.scrollTop = scroll;
}

/** Das Blatt schließen. */
export function closeFilterSheet() {
  if (!root || root.hidden) return;
  root.hidden = true;
  open = null;
  pageId = null;
  clearModalPull(root);
}

/* Auf eine Unterseite wechseln oder zurück; der Inhalt beginnt dort oben */
function goTo(id) {
  pageId = id;
  render();
  root.querySelector(".modal-body").scrollTop = 0;
}

/* Im Chip-Blatt gilt, wenn der Abschnitt sie mitbringt, die eigene Fassung von Werten, Tipp und Segment
   (angetippt ist nur, was filtert); sonst die der Übersicht und Unterseiten */
function itemsOf(section) {
  return usesChips() && section.chipItems ? section.chipItems : section.items;
}
function toggleOf(section) {
  return usesChips() && section.chipToggle ? section.chipToggle : section.onToggle;
}
function modeOf(section) {
  return usesChips() && section.chipMode ? section.chipMode : section.onMode;
}

function onClick(event) {
  const target = event.target;
  if (target === root || target.closest("[data-filter-close]")) {
    closeFilterSheet();
    return;
  }
  if (!open) return;
  if (target.closest("[data-filter-back]")) {
    goTo(null);
    return;
  }
  const row = target.closest("[data-filter-page]");
  if (row) {
    goTo(row.dataset.filterPage);
    return;
  }
  if (target.closest("[data-filter-reset]")) {
    if (open.resetActive) open.onReset();
    return;
  }
  /* Im Chip-Blatt trägt jeder Knopf die Nummer seines Abschnitts, sonst gilt die offene Unterseite */
  const holder = target.closest("[data-filter-section]");
  const section = holder ? open.sections[Number(holder.dataset.filterSection)] : currentSection();
  if (!section) return;
  const info = target.closest("[data-filter-info]");
  if (info) {
    const item = itemsOf(section)[Number(info.dataset.filterInfo)];
    openInfoDialog(item.info.title, item.info.text);
    return;
  }
  const mode = target.closest("[data-filter-mode]");
  if (mode) {
    if (mode.dataset.filterMode !== section.mode) modeOf(section)(mode.dataset.filterMode);
    return;
  }
  const item = target.closest("[data-filter-item]");
  if (item) toggleOf(section)(itemsOf(section)[Number(item.dataset.filterItem)].id);
}

/* Das Blatt einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "modal-backdrop date-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="modal date-modal filter-modal" role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
      <header class="modal-head">
        <div class="modal-grip"></div>
        <button class="modal-back" type="button" data-filter-back aria-label="Zurück zur Übersicht" hidden>${icon("back")}</button>
        <h2 id="filter-modal-title"></h2>
        <button class="filter-top-reset" type="button" data-filter-reset data-filter-top-reset hidden>${escapeHtml(topResetLabel)}</button>
        <button class="modal-close" type="button" data-filter-close aria-label="Schließen">${icon("close")}</button>
      </header>
      <div class="modal-body date-body">
        <div class="filter-content"></div>
        <button class="date-done" type="button" data-filter-close>${escapeHtml(doneLabel)}</button>
      </div>
    </div>`;
  dom.device.appendChild(root);
  root.addEventListener("click", onClick);
  bindModalPull(root, closeFilterSheet);
  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — geht das Blatt zu. */
  on(events.viewWillChange, closeFilterSheet);
}

/**
 * Das Blatt öffnen oder mit neuem Stand neu zeichnen.
 * @param title       Überschrift, z.B. „Filtern“
 * @param sections    Abschnitte wie oben beschrieben
 * @param resetActive gibt es etwas zurückzusetzen?
 * @param onReset     setzt alle Filter zurück
 * @param chips       Chip-Blatt statt Übersicht und Unterseiten, wo es die Fassung kennt (Android)
 * @param doneText    Aufschrift des Knopfs unten im Chip-Blatt, z.B. „7 Aufgaben anzeigen“
 * @param page        id der Unterseite, die gleich offen sein soll; null für
 *                    die Übersicht; weggelassen: beim Öffnen die Übersicht,
 *                    beim Neuzeichnen bleibt die offene Seite
 */
export function openFilterSheet({ title, sections, resetActive = false, onReset = () => {}, page, chips = false, doneText = "" }) {
  if (!root) build();
  const opening = root.hidden;
  open = { title, sections, resetActive, onReset, chips, doneText };
  if (page !== undefined) pageId = page;
  else if (opening) pageId = null;
  if (opening) clearModalPull(root);
  root.hidden = false;
  render();
}
