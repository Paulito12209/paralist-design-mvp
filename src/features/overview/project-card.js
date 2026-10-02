/*
 * Android-Fassung: die Werkzeugzeile über den Projekten, gebaut wie der Kopf
 * einer Liste in Google Tasks. Links der Text-Knopf „Archiv“ — steht immer,
 * damit die Zeile nie leer wirkt; liegen Projekte im Archiv, folgt ihre Zahl
 * in Klammern („Archiv (2)“). Ein Tipp öffnet das Archiv mit der Pille
 * Projekte (data-open-archive, src/ui/list-clicks.js). Rechts Sortieren und,
 * außer bei „Alle“ (dort lässt sich nichts filtern), Filtern. Filtern holt
 * das Blatt „Ansicht“ herauf: darin stehen Ort, Nur Favoriten und Projekte
 * wählen (src/features/overview/project-settings.js). Umbenennen, Löschen &
 * Co. einer Ansicht gibt es beim Halten ihres Reiters.
 * Die Zeile steht in jeder Fassung im Dokument und ist nur in der
 * Android-Fassung zu sehen (styles/android-card.css).
 * Pfad: src/features/overview/project-card.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * archiveLabel -> Beschriftung des Text-Knopfs; die Zahl der archivierten Projekte steht in Klammern dahinter
 * toolLabels   -> Vorlesetexte und Hinweise der zwei Symbole rechts
 */

import { icon } from "../../core/html.js";
import { archivedEntries } from "../../data/queries.js";
import { openViewPanel } from "../../ui/view-panel.js";
import { openProjectSort } from "./project-settings.js";

const archiveLabel = "Archiv";
const toolLabels = { sort: "Sortieren", filter: "Filtern" };

/* Siebt die Ansicht etwas aus? Dann steht das Filter-Symbol in der Akzentfarbe. */
function isFiltering(view) {
  return view.ids.length > 0 || view.place !== "alle" || Boolean(view.favoritesOnly);
}

function tool(name, iconName, active = false) {
  return `
    <button class="project-card-tool${active ? " is-active" : ""}" type="button" data-card-tool="${name}"
      aria-label="${toolLabels[name]}" title="${toolLabels[name]}">${icon(iconName)}</button>`;
}

/* „Archiv (2)“ wie „Erledigt (2)“ in Google Tasks; ohne Archiviertes nur „Archiv“. */
function archiveButton() {
  const count = archivedEntries().filter((entry) => entry.type === "projekt").length;
  const label = count ? `${archiveLabel} (${count})` : archiveLabel;
  return `
    <button class="project-card-archive" type="button" data-open-archive="projekt">
      ${icon("archive")}<span>${label}</span>
    </button>`;
}

/** Die Werkzeugzeile für die gewählte Ansicht. */
export function projectCardHead(view) {
  const filter = view.fixed ? "" : tool("filter", "filter", isFiltering(view));
  return `
    <div class="project-card-head">
      ${archiveButton()}
      <div class="project-card-tools">${tool("sort", "swap-vert")}${filter}</div>
    </div>`;
}

/** Klicks auf Sortieren und Filtern; „Archiv (n)“ erledigt src/ui/list-clicks.js. */
export function handleProjectCardClick(event, view) {
  const button = event.target.closest("[data-card-tool]");
  if (!button) return;
  if (button.dataset.cardTool === "sort") openProjectSort(view);
  else openViewPanel();
}
