/*
 * Die Werkzeugzeile über einer Liste in der Android-Fassung, gebaut wie der
 * Kopf einer Liste in Google Tasks: links der Text-Knopf „Archiv“ — mit der
 * Zahl der archivierten Dinge in Klammern, sobald es welche gibt („Archiv (2)“) —,
 * Hat die Ansicht aktive Einträge und reicht die Seite ihre Zahl herein
 * (Projekte, Aufgaben), wird der Knopf kurz — nur Icon und Archiv-Zahl — und
 * rechts daneben steht hinter einer feinen Linie „4 Einträge“. Das Wort
 * „Archiv“ steht also nur, solange die Ansicht leer ist: so lernt man, wohin
 * der Knopf führt, und sieht später sofort, wie viel in der Ansicht liegt —
 * auch im Board, wo die vollen Spalten erst weiter rechts stehen.
 * rechts drei Symbole: Sortieren, Filtern (in der Akzentfarbe, sobald die Liste
 * aussiebt) und Ansicht (Regler-Symbol, öffnet das Blatt mit allen Einstellungen
 * der Ansicht — später auch Layout wie Kanban-Board). Sortieren und Filtern öffnen
 * gleich ihr eigenes Blatt. Filtern und Ansicht gibt es nur, wo sich etwas
 * einstellen lässt (nicht auf der festen Ansicht „Alle“). Ein Tipp auf „Archiv“ öffnet das Archiv mit der
 * passenden Pille (data-open-archive, src/ui/list-clicks.js). Was Sortieren und
 * Filtern tun, bestimmt die Seite (Projekte, Aufgaben, Sammlungen); hier
 * stehen nur Markup und Klick-Zuordnung.
 * Im Archiv steht an derselben Stelle der Knopf „Aktive Projekte (2)“ — das
 * Gegenstück, das zur Liste der aktiven Dinge zurückführt (data-open-active).
 * Die Zeile steht in jeder Fassung im Dokument und ist nur in der
 * Android-Fassung zu sehen (styles/android-card.css, Klassen project-card-*
 * — sie gelten für jede Werkzeugzeile, nicht nur für die Projekte).
 * Pfad: src/ui/list-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * archiveLabel -> Beschriftung des Text-Knopfs; die Zahl steht in Klammern dahinter
 * entryWords   -> „Eintrag“ / „Einträge“ hinter der Zahl der aktiven Einträge
 * toolLabels   -> Vorlesetexte und Hinweise der drei Symbole rechts
 * toolIcons    -> welches Symbol Sortieren, Filtern und Ansicht tragen
 *
 * Maße und Farben: styles/android-card.css, Werte in styles/tokens-android.css.
 */

import { icon } from "../core/html.js";

const archiveLabel = "Archiv";
const entryWords = { one: "Eintrag", many: "Einträge" };
const toolLabels = { sort: "Sortieren", filter: "Filtern", view: "Ansicht" };
const toolIcons = { sort: "swap-vert", filter: "filter", view: "tune" };

function tool(name, active = false) {
  return `
    <button class="project-card-tool${active ? " is-active" : ""}" type="button" data-card-tool="${name}"
      aria-label="${toolLabels[name]}" title="${toolLabels[name]}">${icon(toolIcons[name])}</button>`;
}

/* „Archiv (2)“ wie „Erledigt (2)“ in Google Tasks; ohne Archiviertes nur „Archiv“.
   Mit aktiven Einträgen (`entries` > 0) kurz: Icon und Zahl, dahinter Linie und „4 Einträge“. */
function archiveButton({ pill, count, entries = 0 }) {
  const full = count ? `${archiveLabel} (${count})` : archiveLabel;
  if (!entries) {
    return `
    <button class="project-card-archive" type="button" data-open-archive="${pill}">
      ${icon("archive")}<span>${full}</span>
    </button>`;
  }
  const words = `${entries} ${entries === 1 ? entryWords.one : entryWords.many}`;
  return `
    <button class="project-card-archive is-short" type="button" data-open-archive="${pill}" aria-label="${full}" title="${full}">
      ${icon("archive")}${count ? `<span>${count}</span>` : ""}
    </button><span class="project-card-divider" aria-hidden="true"></span><span class="project-card-count">${words}</span>`;
}

/* Im Archiv an derselben Stelle: „Aktive Projekte (2)“ führt zur Liste zurück (data-open-active). */
function activeButton({ pill, label, icon: glyph, count }) {
  return `
    <button class="project-card-archive" type="button" data-open-active="${pill}">
      ${icon(glyph)}<span>${count ? `${label} (${count})` : label}</span>
    </button>`;
}

/**
 * Die Werkzeugzeile.
 * `archive`: { pill, count, entries } — oder null, wo es keinen Archiv-Knopf gibt (im Archiv selbst).
 *   `entries`: Zahl der aktiven Einträge der Ansicht; fehlt sie, bleibt es bei „Archiv (n)“.
 * `active`: { pill, label, icon, count } — der Knopf „Aktive …“ im Archiv, sonst null.
 * `filter`: gibt es ein Filter-Symbol? `filtering`: siebt die Liste gerade aus?
 * `view`: gibt es das Symbol „Ansicht“ (Regler)?
 * `plain`: nichts steht über der Zeile (keine Reiter) — dann rückt sie nicht unter eine Reiterlinie.
 */
export function listHeadMarkup({ archive = null, active = null, filter = true, filtering = false, view = true, plain = false }) {
  return `
    <div class="project-card-head${plain ? " is-plain" : ""}">
      ${archive ? archiveButton(archive) : ""}${active ? activeButton(active) : ""}
      <div class="project-card-tools">${tool("sort")}${filter ? tool("filter", filtering) : ""}${view ? tool("view") : ""}</div>
    </div>`;
}

/**
 * Klick auf eines der Symbole: ruft `sort`, `filter` bzw. `view` auf.
 * Gibt true zurück, wenn der Klick ein Symbol der Zeile traf.
 */
export function handleListHeadClick(event, { sort, filter, view }) {
  const button = event.target.closest("[data-card-tool]");
  if (!button) return false;
  const actions = { sort, filter, view };
  actions[button.dataset.cardTool]();
  return true;
}
