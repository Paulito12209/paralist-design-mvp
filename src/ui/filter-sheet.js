/*
 * Ein Filter-Blatt, gebaut wie das Blatt „Sortieren“ (src/ui/sort-sheet.js):
 * Titel mit ✕ oben, darunter zwei Spalten nebeneinander mit je einer kleinen
 * Überschrift, unten „Fertig“. Anders als dort sind die Spalten keine Rollen,
 * sondern Mehrfachwahl: jede Zeile schaltet ein und aus, gewählte Zeilen
 * tragen das Band in der Pillenfarbe und einen Haken am äußeren Rand. Die
 * linke Spalte steht rechtsbündig, die rechte linksbündig — wie beim
 * Sortieren treffen sich beide in der Mitte.
 *
 * Optional steht darüber eine Zeile „Ort“ mit Pillen (Einfachwahl), die
 * waagerecht rollt, wenn es viele Orte gibt.
 *
 * Eine Spalte ist { heading, items, onToggle(id) }, ein Eintrag
 * { id, label, icon, color?, active, info?: { title, text } }. Der Ort ist
 * { heading, options: [{ id, label, icon }], chosen, onPick(id) } oder null.
 * Nach jeder Wahl ruft der Aufrufer openFilterSheet mit dem neuen Stand
 * erneut auf — das Blatt bleibt offen und zeichnet sich neu.
 * Pfad: src/ui/filter-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * doneLabel -> Aufschrift des Knopfs unten
 *
 * Aussehen: Blatt, Überschriften und „Fertig“ teilen sich die Stile mit
 * „Sortieren“ (styles/calendar.css, styles/sort-wheels.css); Spalten, Band,
 * Haken und Ort-Pillen stehen in styles/filter-sheet.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { openInfoDialog } from "./info-dialog.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";

const doneLabel = "Fertig";

let root = null;
/* Das offene Blatt, wie es openFilterSheet bekommen hat — oder null */
let open = null;

/* Kein Knopf im Knopf: das ⓘ ist ein span, den der Klick-Empfänger zuerst prüft */
function infoMarkup(item, col, index) {
  if (!item.info) return "";
  return `<span class="sheet-info" role="button" tabindex="0" data-filter-info="${col}:${index}" aria-label="Was heißt „${escapeHtml(item.label)}“?">${icon("info")}</span>`;
}

/* Eine Zeile: Haken außen, Name, ⓘ, Icon zur Mitte hin. Die Reihenfolge im
   Markup ist immer gleich; die linke Spalte dreht sie per CSS um. */
function itemMarkup(item, col, index) {
  const on = item.active ? " is-on" : "";
  /* --item-color: Farbe des Icons, wenn die Zeile gewählt ist (Status- bzw. Dringlichkeitsfarbe) */
  const color = item.color ? ` style="--item-color:${item.color}"` : "";
  return `
    <button class="filter-item${on}" type="button" data-filter-item="${col}:${index}" aria-pressed="${Boolean(item.active)}"${color}>
      ${icon("check", "filter-check")}
      <span class="filter-label"><span class="filter-name">${escapeHtml(item.label)}</span>${infoMarkup(item, col, index)}</span>
      ${icon(item.icon, "filter-icon")}
    </button>`;
}

function columnMarkup(column, col) {
  return `<div class="filter-col" role="group" aria-label="${escapeHtml(column.heading)}">${column.items
    .map((item, index) => itemMarkup(item, col, index))
    .join("")}</div>`;
}

function placeMarkup(place) {
  if (!place) return "";
  const pill = (option) => {
    const on = option.id === place.chosen;
    return `<button class="tab-pill${on ? " is-active" : ""}" type="button" data-filter-place="${escapeHtml(option.id)}" aria-pressed="${on}">${icon(option.icon, "tab-pill-icon")}${escapeHtml(option.label)}</button>`;
  };
  return `
    <p class="filter-place-head">${escapeHtml(place.heading)}</p>
    <div class="filter-place" role="group" aria-label="${escapeHtml(place.heading)}">${place.options.map(pill).join("")}</div>`;
}

/* Den Inhalt neu zeichnen; die Ort-Pillen behalten ihre waagerechte Lage. */
function render() {
  const body = root.querySelector(".filter-content");
  const scroll = body.querySelector(".filter-place")?.scrollLeft || 0;
  root.querySelector("#filter-modal-title").textContent = open.title;
  body.innerHTML = `
    ${placeMarkup(open.place)}
    <div class="sort-wheel-heads" aria-hidden="true">${open.columns.map((column) => `<span>${escapeHtml(column.heading)}</span>`).join("")}</div>
    <div class="filter-cols">${open.columns.map(columnMarkup).join("")}</div>`;
  const pills = body.querySelector(".filter-place");
  if (pills) pills.scrollLeft = scroll;
}

/** Das Blatt schließen. */
export function closeFilterSheet() {
  if (!root || root.hidden) return;
  root.hidden = true;
  open = null;
  clearModalPull(root);
}

/* „Spalte:Zeile“ aus einem data-Attribut in den Eintrag übersetzen */
function itemAt(key) {
  const [col, index] = key.split(":").map(Number);
  return { column: open.columns[col], item: open.columns[col].items[index] };
}

function onClick(event) {
  if (event.target === root || event.target.closest("[data-filter-close]")) {
    closeFilterSheet();
    return;
  }
  if (!open) return;
  const info = event.target.closest("[data-filter-info]");
  if (info) {
    const { item } = itemAt(info.dataset.filterInfo);
    openInfoDialog(item.info.title, item.info.text);
    return;
  }
  const row = event.target.closest("[data-filter-item]");
  if (row) {
    const { column, item } = itemAt(row.dataset.filterItem);
    column.onToggle(item.id);
    return;
  }
  const pill = event.target.closest("[data-filter-place]");
  if (pill && pill.dataset.filterPlace !== open.place.chosen) open.place.onPick(pill.dataset.filterPlace);
}

/* Das Blatt einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "modal-backdrop date-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="modal date-modal sort-modal filter-modal" role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
      <header class="modal-head">
        <div class="modal-grip"></div>
        <h2 id="filter-modal-title"></h2>
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
 * @param title   Überschrift, z.B. „Filtern“
 * @param place   Zeile „Ort“ wie oben beschrieben — oder null
 * @param columns genau zwei Spalten wie oben beschrieben
 */
export function openFilterSheet({ title, place = null, columns }) {
  if (!root) build();
  const opening = root.hidden;
  open = { title, place, columns };
  if (opening) clearModalPull(root);
  root.hidden = false;
  render();
}
