/*
 * Die Karten oben auf der Startseite. Links die vier festen — Eingang,
 * Favoriten, Projekte, Ressourcen —, rechts daneben eine zweite Seite mit vier
 * weiteren (src/data/collections.js, moreCards): Archiv und drei Karten, die
 * noch „Demnächst verfügbar“ sind. Man schiebt sie waagerecht herein; die
 * zweite Seite schaut am rechten Rand ein Stück hervor, damit man sie findet.
 * Pfad: src/features/overview/overview.js
 *
 * Keine anpassbaren visuellen Werte: Größe, Rundung und Icon-Farben stehen in
 * styles/overview.css (Klassen .overview-card, .card-title, .card-icon-*),
 * das Schieben und die abgeschalteten Karten in styles/overview-more.css.
 * Die Zahl neben dem Titel steht erst ab einem Eintrag da — eine „0“ wird
 * gar nicht erst gezeigt.
 */

import { on, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { moreCards, SOON_LABEL } from "../../data/collections.js";
import { overviewPages } from "../../data/config.js";
import { archivedEntries, archivedWorkspaces, pageCount } from "../../data/queries.js";
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

/* Eine Karte der zweiten Seite. Abgeschaltete Karten tragen ein „i“ neben dem
   Namen und das Schildchen oben rechts; das Archiv zählt, was darin liegt. */
function moreCardMarkup(card) {
  if (card.soon) {
    return `
      <button class="overview-card is-soon" type="button" disabled aria-label="${card.title}, ${SOON_LABEL}">
        <span class="card-soon">${SOON_LABEL}</span>
        ${icon(card.icon, "card-icon")}
        <span class="card-label">
          <span class="card-title">${card.title}</span>
          ${icon("info", "card-info")}
        </span>
      </button>
    `;
  }
  const count = archivedWorkspaces().length + archivedEntries().length;
  return `
    <button class="overview-card" type="button" data-open-archive="all" aria-label="${card.title}, ${count} Einträge">
      ${icon(card.icon, "card-icon card-icon-archive")}
      <span class="card-label">
        <span class="card-title">${card.title}</span>
        ${count ? `<span class="card-count">${count}</span>` : ""}
      </span>
    </button>
  `;
}

/** Die Karten neu zeichnen. */
export function renderOverview() {
  const first = Object.entries(overviewPages)
    .map(([id, page]) => cardMarkup(id, page))
    .join("");
  /* Beim Auffrischen die Schiebestellung halten: wer gerade die zweite Seite
     sieht, soll nicht zur ersten zurückspringen. */
  const scrolled = dom.overviewGrid.scrollLeft;
  dom.overviewGrid.innerHTML = `
    <div class="overview-page">${first}</div>
    <div class="overview-page">${moreCards.map(moreCardMarkup).join("")}</div>
  `;
  dom.overviewGrid.scrollLeft = scrolled;
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
