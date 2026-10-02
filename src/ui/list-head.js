/*
 * Die Werkzeugzeile über einer Liste in der Android-Fassung, gebaut wie der
 * Kopf einer Liste in Google Tasks: links der Text-Knopf „Archiv“ — mit der
 * Zahl der archivierten Dinge in Klammern, sobald es welche gibt („Archiv (2)“) —,
 * rechts Sortieren und, wo sich etwas filtern lässt, Filtern (in der Akzentfarbe,
 * sobald die Liste aussiebt). Ein Tipp auf „Archiv“ öffnet das Archiv mit der
 * passenden Pille (data-open-archive, src/ui/list-clicks.js). Was Sortieren und
 * Filtern tun, bestimmt die Seite (Projekte, Aufgaben, Sammlungen); hier
 * stehen nur Markup und Klick-Zuordnung.
 * Die Zeile steht in jeder Fassung im Dokument und ist nur in der
 * Android-Fassung zu sehen (styles/android-card.css, Klassen project-card-*
 * — sie gelten für jede Werkzeugzeile, nicht nur für die Projekte).
 * Pfad: src/ui/list-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * archiveLabel -> Beschriftung des Text-Knopfs; die Zahl steht in Klammern dahinter
 * toolLabels   -> Vorlesetexte und Hinweise der zwei Symbole rechts
 * toolIcons    -> welches Symbol Sortieren und Filtern tragen
 *
 * Maße und Farben: styles/android-card.css, Werte in styles/tokens-android.css.
 */

import { icon } from "../core/html.js";

const archiveLabel = "Archiv";
const toolLabels = { sort: "Sortieren", filter: "Filtern" };
const toolIcons = { sort: "swap-vert", filter: "filter" };

function tool(name, active = false) {
  return `
    <button class="project-card-tool${active ? " is-active" : ""}" type="button" data-card-tool="${name}"
      aria-label="${toolLabels[name]}" title="${toolLabels[name]}">${icon(toolIcons[name])}</button>`;
}

/* „Archiv (2)“ wie „Erledigt (2)“ in Google Tasks; ohne Archiviertes nur „Archiv“. */
function archiveButton({ pill, count }) {
  const label = count ? `${archiveLabel} (${count})` : archiveLabel;
  return `
    <button class="project-card-archive" type="button" data-open-archive="${pill}">
      ${icon("archive")}<span>${label}</span>
    </button>`;
}

/**
 * Die Werkzeugzeile.
 * `archive`: { pill, count } — oder null, wo es keinen Archiv-Knopf gibt (im Archiv selbst).
 * `filter`: gibt es ein Filter-Symbol? `filtering`: siebt die Liste gerade aus?
 * `plain`: nichts steht über der Zeile (keine Reiter) — dann rückt sie nicht unter eine Reiterlinie.
 */
export function listHeadMarkup({ archive = null, filter = true, filtering = false, plain = false }) {
  return `
    <div class="project-card-head${plain ? " is-plain" : ""}">
      ${archive ? archiveButton(archive) : ""}
      <div class="project-card-tools">${tool("sort")}${filter ? tool("filter", filtering) : ""}</div>
    </div>`;
}

/**
 * Klick auf eines der zwei Symbole: ruft `sort` bzw. `filter` auf.
 * Gibt true zurück, wenn der Klick ein Symbol der Zeile traf.
 */
export function handleListHeadClick(event, { sort, filter }) {
  const button = event.target.closest("[data-card-tool]");
  if (!button) return false;
  if (button.dataset.cardTool === "sort") sort();
  else filter();
  return true;
}
