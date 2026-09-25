/*
 * Das Auswahl-Blatt von unten: „Verknüpfen mit“, „Typ wählen“, Seitenmenüs.
 * Jede Option ist { label, icon, onSelect } plus optional active/danger/split/gap,
 * `stay` (das Blatt bleibt nach dem Antippen offen, z.B. zum An-/Abwählen),
 * `pair` (die Option rutscht ganz nach unten in eine Zeile neben die andere
 * `pair`-Option — so stehen Archivieren und Löschen nebeneinander) und
 * `heading` (keine Option, sondern eine Überschrift, die die Liste in
 * Abschnitte teilt — „Verknüpfen mit“ trennt damit Ablageorte und Einträge).
 * Für „Details“ gibt es zwei reine Anzeige-Zeilen: `lead` (der volle Titel,
 * groß und ungekürzt) und `detail` (Bezeichnung oben, Wert darunter); „Typ
 * ändern“ nutzt dazu `note` (ein Satz in normaler Schrift, z.B. was beim
 * Umwandeln mit den verknüpften Einträgen passiert).
 * Pfad: src/ui/sheet.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen und Abstände stehen in
 * styles/overlays.css (Klassen .sheet, .sheet-option).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { closeCtxMenu } from "./ctx-menu.js";
import { bindModalPull } from "./modal-pull.js";

let actions = [];
/* Je Option: bleibt das Blatt nach dem Antippen offen? (für An-/Abwählen) */
let stays = [];

function optionMarkup(option, index) {
  /* Eine Überschrift ist kein Knopf: ohne data-sheet lässt sie sich nicht
     antippen und rutscht im Klick-Empfänger unten auch nie dazwischen. */
  if (option.heading) return `<p class="sheet-heading">${escapeHtml(option.label)}</p>`;
  if (option.lead) return `<p class="sheet-lead">${escapeHtml(option.label)}</p>`;
  if (option.note) return `<p class="sheet-note">${escapeHtml(option.label)}</p>`;
  if (option.detail) {
    return `<div class="sheet-detail"><span class="sheet-detail-label">${escapeHtml(option.label)}</span><span class="sheet-detail-value">${escapeHtml(option.value)}</span></div>`;
  }

  const classes = ["sheet-option"];
  if (option.active) classes.push("is-active");
  if (option.danger) classes.push("is-danger");
  /* split: setzt eine Trennlinie über die Option; gap: lässt etwas Luft darüber */
  if (option.split) classes.push("is-split");
  if (option.gap) classes.push("is-gap");
  /* pair: halbe Breite, damit zwei Optionen nebeneinander in eine Zeile passen */
  if (option.pair) classes.push("is-pair");
  return `
    <button class="${classes.join(" ")}" type="button" data-sheet="${index}">
      ${icon(option.icon)}
      <span>${escapeHtml(option.label)}</span>
    </button>
  `;
}

/* Erst die gewöhnlichen Optionen untereinander, darunter die `pair`-Optionen
   gemeinsam in einer Zeile. */
function sheetMarkup(options) {
  const marks = options.map(optionMarkup);
  const rest = options.map((option, index) => (option.pair ? "" : marks[index])).join("");
  const paired = options.map((option, index) => (option.pair ? marks[index] : "")).join("");
  return paired ? `${rest}<div class="sheet-pair">${paired}</div>` : rest;
}

/** Blatt mit Titel und Optionen öffnen. */
export function openSheet(title, options) {
  closeCtxMenu();
  dom.sheetTitle.textContent = title;
  dom.sheetOptions.innerHTML = sheetMarkup(options);
  actions = options.map((option) => option.onSelect);
  stays = options.map((option) => Boolean(option.stay));
  dom.sheet.hidden = false;
}

/** Blatt schließen. */
export function closeSheet() {
  dom.sheet.hidden = true;
  actions = [];
  stays = [];
}

/** Klicks im Blatt: Option ausführen, Klick daneben schließt. Ziehen schließt es auch. */
export function initSheet() {
  bindModalPull(dom.sheet, closeSheet);

  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — schließt sich das
     Blatt. Sonst bliebe es über der neuen Seite liegen und seine Aktionen
     bezögen sich noch auf die verlassene. */
  on(events.viewWillChange, closeSheet);

  dom.sheet.addEventListener("click", (event) => {
    const option = event.target.closest("[data-sheet]");
    if (!option) {
      if (event.target === dom.sheet) closeSheet();
      return;
    }
    const index = Number(option.dataset.sheet);
    const run = actions[index];
    if (!stays[index]) closeSheet();
    if (run) run();
  });
}
