/*
 * Das Markup des Filter-Blatts als Chips (Android-Fassung, Material 3) —
 * der Gegenentwurf zu Übersicht und Unterseiten in src/ui/filter-sheet-markup.js.
 * Alle Abschnitte stehen auf einer Seite untereinander: die Überschrift mit
 * dem Segment rechts („ist | ist nicht“), darunter die Werte als Chips, dann
 * der Satz, was die Wahl bewirkt. Es gibt dort keine Unterseiten.
 *
 * Drei Arten von Chips (Material 3):
 * - Filter-Chip: ein Wert; gewählt mit Haken und getönt
 * - Eingabe-Chip (`item.entry`): ein bestimmter Eintrag mit ✕ — ein Tipp entfernt ihn
 * - Hilfs-Chip (`item.action`): „＋ Eintrag wählen“, gestrichelt — öffnet eine Auswahl
 * Zeigt ein Abschnitt `chipIcons`, steht vor jedem ungewählten Chip sein Icon.
 * Pfad: src/ui/filter-sheet-chips.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * modeLabels -> Wortlaut der beiden Segment-Knöpfe („ist“, „ist nicht“); ein Abschnitt kann eigene mitbringen
 *
 * Aussehen: styles/android-filter-sheet.css.
 */

import { escapeHtml, icon } from "../core/html.js";

const modeLabels = { is: "ist", not: "ist nicht" };

/* Kein Knopf im Knopf: das ⓘ ist ein span, den der Klick-Empfänger zuerst prüft */
function infoMarkup(item, at) {
  if (!item.info) return "";
  return `<span class="sheet-info" role="button" tabindex="0" data-filter-section="${at.section}" data-filter-info="${at.item}" aria-label="Was heißt „${escapeHtml(item.label)}“?">${icon("info")}</span>`;
}

/* Vor dem Namen: der Haken, wenn gewählt, sonst — wenn der Abschnitt es will — das Icon */
function leadMarkup(item, section) {
  if (item.entry || item.action) return icon(item.icon, "fc-icon");
  if (item.active) return icon("check", "fc-icon");
  return section.chipIcons ? icon(item.icon, "fc-icon") : "";
}

function chipMarkup(item, section, at) {
  const kind = item.entry ? " is-entry" : item.action ? " is-action" : "";
  const on = item.active ? " is-on" : "";
  /* --item-color: Farbe des Icons, wenn der Wert gewählt ist (Status- bzw. Dringlichkeitsfarbe) */
  const color = item.color ? ` style="--item-color:${item.color}"` : "";
  const pressed = item.action ? "" : ` aria-pressed="${Boolean(item.active)}"`;
  const remove = item.entry ? icon("close", "fc-icon fc-remove") : "";
  return `<button class="fc-chip${kind}${on}" type="button" data-filter-section="${at.section}" data-filter-item="${at.item}"${pressed}${color}>${leadMarkup(item, section)}<span class="fc-name">${escapeHtml(item.label)}</span>${infoMarkup(item, at)}${remove}</button>`;
}

/* Das Segment rechts neben der Überschrift — nur bei Mehrfachwahl */
function modeMarkup(section, index) {
  if (!section.mode) return "";
  const words = section.modeLabels || modeLabels;
  const button = (id) =>
    `<button class="fc-mode-btn${section.mode === id ? " is-on" : ""}" type="button" data-filter-section="${index}" data-filter-mode="${id}" aria-pressed="${section.mode === id}">${section.mode === id ? icon("check", "fc-mode-check") : ""}${escapeHtml(words[id])}</button>`;
  return `<div class="fc-mode" role="group" aria-label="${escapeHtml(section.label)}">${button("is")}${button("not")}</div>`;
}

function sectionMarkup(section, index) {
  const chips = (section.chipItems || section.items).map((item, at) => chipMarkup(item, section, { section: index, item: at })).join("");
  return `
    <section class="fc-section">
      <div class="fc-head"><h3 class="fc-title">${escapeHtml(section.label)}</h3>${modeMarkup(section, index)}</div>
      <div class="fc-chips" role="group" aria-label="${escapeHtml(section.label)}">${chips}</div>
      ${section.note ? `<p class="fc-note">${escapeHtml(section.note)}</p>` : ""}
    </section>`;
}

/**
 * Alle Abschnitte als Chips auf einer Seite.
 * @param sections wie bei src/ui/filter-sheet.js, dazu je Wert optional `entry` und `action`
 */
export function chipsMarkup(sections) {
  return sections.map(sectionMarkup).join("");
}
