/*
 * „Android (Xool-DB)“: die Kacheln oben auf der Übersicht — wie in der Xool-App
 * genau vier, die Ablagen nach PARA: Projekte, Arbeitsbereiche, Ressourcen und
 * Archiv. Eingang, Favoriten, Lesezeichen & Co. stehen dort als Listen unter
 * den Reitern „Markiert · Listen“ (src/features/overview/home-xool.js). Ein
 * Tipp öffnet die Seite der Kachel; die Zahl daneben steht erst ab einem Eintrag.
 * Pfad: src/features/overview/overview-xool.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tiles -> die vier Kacheln von links oben nach rechts unten: Name, Icon,
 *          Farbklasse, was ein Tipp öffnet (data-Attribut für src/ui/list-clicks.js)
 *          und woher die Zahl kommt
 *
 * Farben der Icons: styles/overview.css (--inbox-icon-color & Co.) und
 * styles/android-xool-overview.css (Rakete).
 */

import { archivedEntries, archivedWorkspaces, pageCount, projectEntries } from "../../data/queries.js";
import { archivePage, overviewPages } from "../../data/config.js";
import { projectsPage } from "../../data/collections.js";

const tiles = [
  { title: projectsPage.title, icon: "rocket", tint: "card-icon-project", open: 'data-open-projects="1"', count: () => projectEntries().length },
  { title: overviewPages[3].title, icon: "layers", tint: "card-icon-layers", open: 'data-open-overview="3"', count: () => pageCount(overviewPages[3]) },
  { title: overviewPages[4].title, icon: "cube", tint: "card-icon-cube", open: 'data-open-overview="4"', count: () => pageCount(overviewPages[4]) },
  { title: archivePage.title, icon: "archive", tint: "card-icon-archive", open: 'data-open-archive="all"', count: () => archivedWorkspaces().length + archivedEntries().length },
];

/** Die vier Kacheln als eine Seite des Rasters. */
export function xoolTilesMarkup(icon) {
  const cards = tiles
    .map((tile) => {
      const count = tile.count();
      return `
    <button class="overview-card" type="button" ${tile.open} aria-label="${tile.title}, ${count} Einträge">
      ${icon(tile.icon, `card-icon ${tile.tint}`)}
      <span class="card-label">
        <span class="card-title">${tile.title}</span>
        ${count ? `<span class="card-count">${count}</span>` : ""}
      </span>
    </button>`;
    })
    .join("");
  return `<div class="overview-page">${cards}</div>`;
}
