/*
 * Das Markup des Filter-Blatts (src/ui/filter-sheet.js) — hier wird nur
 * HTML gebaut, keine Ereignisse. Zwei Ebenen:
 *
 * - Übersicht: je Abschnitt (Ort, Status, Dringlichkeit …) eine Zeile mit
 *   Icon, Name, Zusammenfassung rechts und Chevron; darunter „Alle Filter
 *   zurücksetzen“, das nur blau ist, wenn es etwas zurückzusetzen gibt.
 * - Unterseite eines Abschnitts: der Name zentriert über dem Inhalt — dieselbe
 *   Überschrift wie auf einer Unterseite der Einstellungen —, darunter bei
 *   Mehrfachwahl das Segment „ist | ist nicht“, dann die Werte: Icon links
 *   (in seiner Farbe, wenn gewählt), Name, ⓘ, Haken rechts. Unter der Liste
 *   ein Satz, was die Wahl bewirkt („Zeigt alle Aufgaben außer …“).
 *
 * Pfad: src/ui/filter-sheet-markup.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * modeLabels -> Wortlaut der beiden Segment-Knöpfe („ist“, „ist nicht“); ein Abschnitt kann eigene
 *                mitbringen (modeLabels im Abschnitt, z.B. „enthält“)
 *
 * Aussehen: styles/filter-sheet.css; die zentrierte Überschrift der
 * Unterseite kommt aus styles/settings.css (.settings-detail-title).
 */

import { escapeHtml, icon } from "../core/html.js";

const modeLabels = { is: "ist", not: "ist nicht" };

/* ---------- Übersicht ---------- */

/* Eine Zeile je Abschnitt; gefilterte Abschnitte stehen in Schriftfarbe */
function sectionRow(section) {
  const on = section.active ? " is-on" : "";
  return `
    <button class="filter-row${on}" type="button" data-filter-page="${escapeHtml(section.id)}">
      ${icon(section.icon, "filter-row-icon")}
      <span class="filter-row-label">${escapeHtml(section.label)}</span>
      <span class="filter-row-value">${escapeHtml(section.summary)}</span>
      ${icon("chevron", "filter-row-chevron")}
    </button>`;
}

/**
 * Die Übersicht: alle Abschnitte untereinander, darunter „Zurücksetzen“.
 * @param sections   [{ id, label, icon, summary, active }]
 * @param resetLabel Aufschrift des Zurücksetzen-Knopfs
 * @param resetOn    gibt es etwas zurückzusetzen? (sonst bleibt der Knopf grau)
 */
export function overviewMarkup(sections, resetLabel, resetOn) {
  return `
    <div class="filter-list" role="list">${sections.map(sectionRow).join("")}</div>
    <button class="filter-reset${resetOn ? " is-active" : ""}" type="button" data-filter-reset${resetOn ? "" : " disabled"}>${escapeHtml(resetLabel)}</button>`;
}

/* ---------- Unterseite ---------- */

/* Kein Knopf im Knopf: das ⓘ ist ein span, den der Klick-Empfänger zuerst prüft */
function infoMarkup(item, index) {
  if (!item.info) return "";
  return `<span class="sheet-info" role="button" tabindex="0" data-filter-info="${index}" aria-label="Was heißt „${escapeHtml(item.label)}“?">${icon("info")}</span>`;
}

/* Ein Wert: Icon links, Name, ⓘ, Haken rechts (unsichtbar, aber mit Platz, wenn abgewählt) */
function itemMarkup(item, index) {
  const on = item.active ? " is-on" : "";
  /* --item-color: Farbe des Icons, wenn der Wert gewählt ist (Status- bzw. Dringlichkeitsfarbe) */
  const color = item.color ? ` style="--item-color:${item.color}"` : "";
  return `
    <button class="filter-item${on}" type="button" data-filter-item="${index}" aria-pressed="${Boolean(item.active)}"${color}>
      ${icon(item.icon, "filter-icon")}
      <span class="filter-label"><span class="filter-name">${escapeHtml(item.label)}</span>${infoMarkup(item, index)}</span>
      ${icon("check", "filter-check")}
    </button>`;
}

/* Das Segment „ist | ist nicht“ — nur bei Mehrfachwahl */
function modeMarkup(section) {
  if (!section.mode) return "";
  const words = section.modeLabels || modeLabels;
  const button = (id) =>
    `<button class="filter-mode-btn${section.mode === id ? " is-on" : ""}" type="button" data-filter-mode="${id}" aria-pressed="${section.mode === id}">${escapeHtml(words[id])}</button>`;
  return `<div class="filter-mode" role="group" aria-label="${escapeHtml(section.label)}">${button("is")}${button("not")}</div>`;
}

/**
 * Die Unterseite eines Abschnitts.
 * @param section { label, mode?, modeLabels?, items: [{ label, icon, color?, active, info? }], note? }
 */
export function pageMarkup(section) {
  return `
    <h3 class="settings-detail-title">${escapeHtml(section.label)}</h3>
    ${modeMarkup(section)}
    <div class="filter-list" role="group" aria-label="${escapeHtml(section.label)}">${section.items.map(itemMarkup).join("")}</div>
    ${section.note ? `<p class="filter-note">${escapeHtml(section.note)}</p>` : ""}`;
}
