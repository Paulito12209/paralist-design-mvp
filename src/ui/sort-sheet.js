/*
 * Das Blatt „Sortieren“ mit zwei Rollen nebeneinander, gebaut wie das Blatt
 * „Woche“ im Kalender: links „Wonach“ (Erstellt, Fällig, Titel …), rechts
 * „Reihenfolge“ mit den beiden Richtungen, deren Wortlaut die linke Wahl
 * liefert — „A bis Z“ / „Z bis A“, „Älteste zuerst“ / „Neueste zuerst“.
 * Jede Rolle wählt sofort, die Liste dahinter zieht mit; „Fertig“ schließt.
 *
 * Eine Option ist { id, label, icon, up, down, asc }: `up` ist der Wortlaut
 * für aufsteigend, `down` für absteigend, `asc` die natürliche Richtung —
 * die gilt, sobald man links zu dieser Option wechselt, und steht rechts oben.
 * Pfad: src/ui/sort-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title        -> Überschrift des Blatts
 * byHeading    -> Überschrift über der linken Rolle
 * dirHeading   -> Überschrift über der rechten Rolle
 * doneLabel    -> Aufschrift des Knopfs unten
 *
 * Wie lange nach dem Rollen gewartet wird, bis die Auswahl gilt, steht in
 * src/ui/wheel.js (settleMs) — gemeinsam mit „Typ ändern“.
 *
 * Aussehen: Rollen, Band und „Fertig“ teilen sich die Stile mit dem Blatt
 * „Woche“ (styles/calendar.css, --date-wheel-h, --date-wheel-item-h); was
 * nur hier gilt — Spalten, Überschriften, Schrift —, steht in
 * styles/sort-wheels.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";
import { fillWheel, markWheel, scrollWheelTo, watchWheel } from "./wheel.js";

const title = "Sortieren";
const byHeading = "Wonach";
const dirHeading = "Reihenfolge";
const doneLabel = "Fertig";

let root = null;
/* Das offene Blatt: { options, sort, asc, onChange } */
let open = null;

/* Die gewählte Option; eine unbekannte (alter Speicherstand) gilt als die erste. */
function optionOf(options, sort) {
  return options.find((option) => option.id === sort) || options[0];
}

/** Kurzform für die Zeile in einer Karte: „Name · A bis Z“. */
export function sortSummary(options, sort, asc) {
  const option = optionOf(options, sort);
  return `${option.label} · ${asc ? option.up : option.down}`;
}

/* Die natürliche Richtung einer Option steht rechts oben. */
function naturalOf(option) {
  return option.asc ?? true;
}

/* Die Einträge einer Rolle als Text. */
function labelsOf(unit) {
  if (unit === "by") return open.options.map((option) => option.label);
  const current = optionOf(open.options, open.sort);
  const natural = naturalOf(current);
  return [natural, !natural].map((dirAsc) => (dirAsc ? current.up : current.down));
}

/* Welcher Eintrag der Rolle gerade gewählt ist. */
function indexOf(unit) {
  if (unit === "by") return open.options.indexOf(optionOf(open.options, open.sort));
  return open.asc === naturalOf(optionOf(open.options, open.sort)) ? 0 : 1;
}

function wheelOf(unit) {
  return root.querySelector(`[data-unit="${unit}"]`);
}

/* Eine Rolle neu füllen und an ihre Auswahl setzen. */
function renderWheel(unit) {
  fillWheel(wheelOf(unit), labelsOf(unit).map(escapeHtml), indexOf(unit));
}

/*
 * Eine Wahl übernehmen. Links gewechselt gilt rechts die natürliche Richtung
 * der neuen Option — Namen von A, Daten vom neuesten an, wie in Google Drive;
 * die rechte Rolle bekommt dazu ihren neuen Wortlaut.
 */
function choose(unit, index) {
  if (index === indexOf(unit)) return;
  if (unit === "by") {
    const option = open.options[index];
    open.sort = option.id;
    open.asc = naturalOf(option);
  } else {
    const natural = naturalOf(optionOf(open.options, open.sort));
    open.asc = index === 0 ? natural : !natural;
  }
  open.onChange(open.sort, open.asc);
  markWheel(wheelOf(unit), index);
  if (unit === "by") renderWheel("dir");
}

/* Ein Tipp auf einen Eintrag rollt ihn in die Mitte und wählt ihn. */
function onWheelsClick(event) {
  const item = event.target.closest("[data-index]");
  if (!item) return;
  const unit = item.closest(".date-wheel").dataset.unit;
  choose(unit, Number(item.dataset.index));
  scrollWheelTo(wheelOf(unit), indexOf(unit), true);
}

/** Das Blatt schließen. */
export function closeSortSheet() {
  if (!root || root.hidden) return;
  root.hidden = true;
  open = null;
  clearModalPull(root);
}

/* Das Blatt einmal bauen und an das Gerät hängen; index.html bleibt unberührt. */
function build() {
  root = document.createElement("div");
  root.className = "modal-backdrop date-backdrop";
  root.hidden = true;
  root.innerHTML = `
    <div class="modal date-modal sort-modal" role="dialog" aria-modal="true" aria-labelledby="sort-modal-title">
      <header class="modal-head">
        <div class="modal-grip"></div>
        <h2 id="sort-modal-title">${escapeHtml(title)}</h2>
        <button class="modal-close" type="button" data-sort-close aria-label="Schließen">${icon("close")}</button>
      </header>
      <div class="modal-body date-body">
        <div class="sort-wheel-heads" aria-hidden="true"><span>${escapeHtml(byHeading)}</span><span>${escapeHtml(dirHeading)}</span></div>
        <div class="date-wheels sort-wheels">
          <div class="date-wheel" data-unit="by" aria-label="${escapeHtml(byHeading)}"></div>
          <div class="date-wheel" data-unit="dir" aria-label="${escapeHtml(dirHeading)}"></div>
        </div>
        <button class="date-done" type="button" data-sort-close>${escapeHtml(doneLabel)}</button>
      </div>
    </div>`;
  dom.device.appendChild(root);

  root.addEventListener("click", (event) => {
    if (event.target === root || event.target.closest("[data-sort-close]")) closeSortSheet();
  });
  root.querySelector(".sort-wheels").addEventListener("click", onWheelsClick);
  /* Kommt eine Rolle zur Ruhe, gilt der Eintrag in der Mitte. */
  ["by", "dir"].forEach((unit) => {
    watchWheel(wheelOf(unit), (index) => {
      if (open) choose(unit, index);
    });
  });
  bindModalPull(root, closeSortSheet);
  /* Beim Wechsel der Ansicht — auch durch Browser-Zurück — geht das Blatt zu. */
  on(events.viewWillChange, closeSortSheet);
}

/**
 * Das Blatt öffnen.
 * @param options  die Optionen wie oben beschrieben
 * @param sort     id der gewählten Option
 * @param asc      true = aufsteigend
 * @param onChange (sort, asc) — speichert die Wahl; die Liste dahinter zeichnet sich selbst neu
 */
export function openSortSheet({ options, sort, asc, onChange }) {
  if (!root) build();
  open = { options, sort: optionOf(options, sort).id, asc, onChange };
  clearModalPull(root);
  /* Erst sichtbar machen: eine versteckte Rolle lässt sich nicht verschieben. */
  root.hidden = false;
  renderWheel("by");
  renderWheel("dir");
}
