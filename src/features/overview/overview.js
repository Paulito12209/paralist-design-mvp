/*
 * Die vier Karten oben auf der Startseite: Eingang, Favoriten, Projekte, Ressourcen.
 * Pfad: src/features/overview/overview.js
 *
 * Keine anpassbaren visuellen Werte: Größe, Rundung und Icon-Farben stehen in
 * styles/overview.css (Klassen .overview-card, .card-title, .card-icon-*).
 * Die Zahl neben dem Titel steht erst ab einem Eintrag da — eine „0“ wird
 * gar nicht erst gezeigt.
 */

import { on, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { overviewPages } from "../../data/config.js";
import { pageCount } from "../../data/queries.js";
import { isViewActive } from "../../ui/views.js";

/* Vier Karten haben ein eigenes farbiges Icon; alle anderen bleiben grau. */
const coloredIcons = {
  inbox: "card-icon-inbox",
  rocket: "card-icon-rocket",
  cube: "card-icon-cube",
  star: "card-icon-star",
  "star-outline": "card-icon-star",
};

function cardMarkup(id, page) {
  const iconName = page.icon || "placeholder";
  const iconClass = `card-icon${coloredIcons[iconName] ? ` ${coloredIcons[iconName]}` : ""}`;
  const count = pageCount(page);
  return `
    <button class="overview-card" type="button" data-open-overview="${id}" aria-label="${page.title}, ${count} Einträge">
      ${icon(iconName, iconClass)}
      <span class="card-label">
        <span class="card-title">${page.title}</span>
        ${count ? `<span class="card-count">${count}</span>` : ""}
      </span>
    </button>
  `;
}

/** Die Karten neu zeichnen. */
export function renderOverview() {
  dom.overviewGrid.innerHTML = Object.entries(overviewPages)
    .map(([id, page]) => cardMarkup(id, page))
    .join("");
}

/** Die Karten anmelden: sie frischen sich auf, wenn sich Daten ändern. */
export function initOverview() {
  on(events.dataChanged, () => {
    if (isViewActive("home")) renderOverview();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderOverview();
  });
}
