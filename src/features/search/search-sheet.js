/*
 * Die Bedienung zum Filtern und Sortieren auf der Suchseite:
 * - Art-Pillen unter dem Titel (Alle 24 · Aufgaben 8 · …)
 * - Zeile mit der Trefferzahl und rechts der Sortier-Pille; weicht etwas von
 *   der Vorgabe ab, trägt die Pille einen Punkt
 * - Chips für jede gesetzte Eingrenzung, × nimmt sie wieder weg
 * - das Blatt „Sortieren und filtern“: oben die Sortierung, darunter Ort,
 *   Zeitraum und zwei Schalter. Jede Wahl wirkt sofort, das Blatt bleibt
 *   offen, bis man es zuzieht; Ort und Zeitraum öffnen ein eigenes Blatt und
 *   führen danach zurück.
 * Was die Wahl bewirkt, rechnet search-refine.js.
 * Pfad: src/features/search/search-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * words -> alle Beschriftungen: Blatt-Titel, Abschnitte, Zeilen, Chips,
 *          Trefferzahl
 *
 * Aussehen: styles/search-refine.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { parentName, placeOptionsFor } from "../../data/queries.js";
import { openSheet } from "../../ui/sheet.js";
import { defaultRefine, isRefined, refinePeriods, refineSorts } from "./search-refine.js";

const words = {
  sheetTitle: "Sortieren und filtern",
  sortHeading: "Sortieren",
  limitHeading: "Eingrenzen",
  place: "Ort",
  anywhere: "Überall",
  period: "Zeitraum",
  titleOnly: "Nur im Titel",
  showDone: "Erledigte zeigen",
  reset: "Zurücksetzen",
  chipTitleOnly: "Nur Titel",
  chipHideDone: "Ohne Erledigte",
  hits: "Treffer",
  sortAria: "Sortieren und filtern",
  removeAria: "entfernen",
};

/** Die Art-Pillen; `active` ist die gewählte Art. */
export function kindPillsMarkup(pills, active) {
  return `<div class="tab-pills page-pills search-kinds">${pills
    .map(
      (pill) =>
        `<button class="tab-pill${pill.id === active ? " is-active" : ""}" type="button" data-search-kind="${pill.id}">${escapeHtml(pill.label)}<span class="search-kind-count">${pill.count}</span></button>`
    )
    .join("")}</div>`;
}

/** Trefferzahl links, Sortier-Pille rechts. */
export function countRowMarkup(total, refine) {
  const sort = refineSorts.find((item) => item.id === refine.sort) || refineSorts[0];
  const dot = isRefined(refine) ? `<span class="search-sort-dot"></span>` : "";
  return `
    <div class="search-count-row">
      <span class="search-count">${total} ${words.hits}</span>
      <button class="search-sort" type="button" data-search-refine aria-label="${words.sortAria}">
        ${icon("sort")}<span>${escapeHtml(sort.short)}</span>${dot}
      </button>
    </div>`;
}

/* Name des gewählten Orts für Chip und Blatt. */
function placeLabel(refine) {
  return refine.place === undefined ? words.anywhere : parentName(refine.place);
}

/** Ein Chip je gesetzter Eingrenzung; ohne Eingrenzung nichts. */
export function chipsMarkup(refine) {
  const period = refinePeriods.find((item) => item.id === refine.period);
  const chips = [];
  if (refine.place !== undefined) chips.push({ id: "place", label: placeLabel(refine) });
  if (period && period.chip) chips.push({ id: "period", label: period.chip });
  if (refine.titleOnly) chips.push({ id: "titleOnly", label: words.chipTitleOnly });
  if (!refine.showDone) chips.push({ id: "showDone", label: words.chipHideDone });
  if (!chips.length) return "";
  return `<div class="search-chips">${chips
    .map(
      (chip) =>
        `<button class="search-chip" type="button" data-search-chip="${chip.id}" aria-label="${escapeHtml(`${chip.label} ${words.removeAria}`)}">
          <span>${escapeHtml(chip.label)}</span>${icon("close")}
        </button>`
    )
    .join("")}</div>`;
}

/** Eine Eingrenzung über ihren Chip zurücknehmen. */
export function clearChip(refine, id) {
  const base = defaultRefine();
  refine[id] = base[id];
}

/** Nur die Eingrenzungen zurücknehmen; Art und Sortierung bleiben (Knopf unter dem Platzhalter). */
export function clearLimits(refine) {
  ["place", "period", "titleOnly", "showDone"].forEach((id) => clearChip(refine, id));
}

/** Alles im Blatt auf die Vorgabe; die gewählte Art bleibt. */
function resetRefine(refine) {
  Object.assign(refine, { ...defaultRefine(), type: refine.type });
}

/*
 * Ein Unterblatt (Ort, Zeitraum): die Wahl setzt den Wert, zeichnet die
 * Seite neu und führt zurück ins Hauptblatt.
 */
function openChoiceSheet(title, choices, refine, redraw) {
  openSheet(
    title,
    choices.map((choice) => ({
      label: choice.label,
      icon: choice.icon,
      active: choice.active,
      onSelect: () => {
        choice.apply();
        redraw();
        openRefineSheet(refine, redraw);
      },
    }))
  );
}

function openPlaceSheet(refine, redraw) {
  const everywhere = { ref: undefined, label: words.anywhere, icon: "layers" };
  const choices = [everywhere, ...placeOptionsFor()].map((option) => ({
    label: option.label,
    icon: option.icon,
    active: refine.place === option.ref,
    apply: () => {
      refine.place = option.ref;
    },
  }));
  openChoiceSheet(words.place, choices, refine, redraw);
}

function openPeriodSheet(refine, redraw) {
  const choices = refinePeriods.map((period) => ({
    label: period.label,
    icon: "clock",
    active: refine.period === period.id,
    apply: () => {
      refine.period = period.id;
    },
  }));
  openChoiceSheet(words.period, choices, refine, redraw);
}

/**
 * Das Hauptblatt. `redraw` zeichnet die Suchseite neu; danach öffnet sich das
 * Blatt mit dem neuen Stand (Haken, Werte) an derselben Stelle wieder.
 */
export function openRefineSheet(refine, redraw) {
  const change = (apply) => () => {
    apply();
    redraw();
    openRefineSheet(refine, redraw);
  };
  const period = refinePeriods.find((item) => item.id === refine.period) || refinePeriods[0];
  const options = [
    { heading: true, label: words.sortHeading },
    ...refineSorts.map((sort) => ({
      label: sort.label,
      icon: sort.icon,
      active: refine.sort === sort.id,
      stay: true,
      onSelect: change(() => {
        refine.sort = sort.id;
      }),
    })),
    { heading: true, label: words.limitHeading },
    {
      label: `${words.place}: ${placeLabel(refine)}`,
      icon: "folder",
      onSelect: () => openPlaceSheet(refine, redraw),
    },
    {
      label: `${words.period}: ${period.label}`,
      icon: "clock",
      onSelect: () => openPeriodSheet(refine, redraw),
    },
    {
      label: words.titleOnly,
      icon: "text",
      active: refine.titleOnly,
      stay: true,
      onSelect: change(() => {
        refine.titleOnly = !refine.titleOnly;
      }),
    },
    {
      label: words.showDone,
      icon: "check-circle",
      active: refine.showDone,
      stay: true,
      onSelect: change(() => {
        refine.showDone = !refine.showDone;
      }),
    },
  ];
  if (isRefined(refine)) {
    options.push({ label: words.reset, icon: "undo", split: true, stay: true, onSelect: change(() => resetRefine(refine)) });
  }
  openSheet(words.sheetTitle, options);
}
