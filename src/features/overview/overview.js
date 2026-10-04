/*
 * Die Karten oben auf der Startseite. Links die vier festen — Eingang,
 * Favoriten, Arbeitsbereiche, Ressourcen —, rechts daneben eine zweite Seite mit vier
 * weiteren (src/data/collections.js, moreCards): Lesezeichen, Archiv und
 * zwei Karten, die noch „Demnächst verfügbar“ sind. Man schiebt sie waagerecht herein; auf der
 * Übersicht sieht man zuerst nur die vier festen. Die Linie unter den Karten
 * ist halb gefüllt und zeigt, welche Seite gerade steht — beim Wischen wandert
 * die gefüllte Hälfte mit.
 * Pfad: src/features/overview/overview.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * narrowLimit      -> bis zu wie vielen sichtbaren Karten die zweite Seite nur eine Spalte
 *                     breit ist (2 = Lesezeichen und Archiv allein stehen bündig am rechten Rand;
 *                     kommen die „Demnächst“-Karten zurück, wird sie wieder zwei Spalten breit)
 * androidMoreOrder -> Reihenfolge der zweiten Kartenseite in beiden Android-Fassungen,
 *                     wie im Raster: oben links, oben rechts, unten links, unten rechts
 *                     (die anderen Fassungen folgen moreCards in src/data/collections.js)
 *
 * Größe, Rundung und Icon-Farben stehen in
 * styles/overview.css (Klassen .overview-card, .card-title, .card-icon-*),
 * das Schieben und die abgeschalteten Karten in styles/overview-more.css.
 * Die Zahl neben dem Titel steht erst ab einem Eintrag da — eine „0“ wird
 * gar nicht erst gezeigt.
 */

import { on, events } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { bookmarkTotal } from "../../data/bookmarks.js";
import { moreCards, SOON_LABEL } from "../../data/collections.js";
import { overviewPages } from "../../data/config.js";
import { archivedEntries, archivedWorkspaces, pageCount } from "../../data/queries.js";
import { isViewActive } from "../../ui/views.js";

/* Android und Android (Experiment): Lesezeichen und Archiv stehen übereinander links,
   die zwei „Demnächst“-Karten rechts daneben — so schauen sie neben Favoriten und
   Ressourcen als Peek hervor. */
const androidMoreOrder = ["bookmarks", "people", "archive", "plans"];

const narrowLimit = 2;

/* Die Karten der zweiten Seite in der Reihenfolge der gezeigten Fassung; ausgeblendete fehlen. */
function orderedMoreCards() {
  const cards =
    document.documentElement.dataset.mobileOs !== "android"
      ? moreCards
      : androidMoreOrder.map((id) => moreCards.find((card) => card.id === id)).filter(Boolean);
  return cards.filter((card) => !card.hidden);
}

/* Die Karten mit eigenem farbigem Icon; alle anderen bleiben grau. */
const coloredIcons = {
  inbox: "card-icon-inbox",
  layers: "card-icon-layers",
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

/* Was die Karten der zweiten Seite öffnen und zählen — und wie ihr Icon gefärbt ist. */
const moreTargets = {
  bookmarks: { data: 'data-open-bookmarks="1"', tint: "card-icon-bookmark", count: bookmarkTotal },
  archive: {
    data: 'data-open-archive="all"',
    tint: "card-icon-archive",
    count: () => archivedWorkspaces().length + archivedEntries().length,
  },
};

/* Eine Karte der zweiten Seite. Abgeschaltete Karten tragen ein „i“ neben dem
   Namen und das Schildchen oben rechts; die anderen zählen, was darin liegt. */
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
  const target = moreTargets[card.id];
  const count = target.count();
  return `
    <button class="overview-card" type="button" ${target.data} aria-label="${card.title}, ${count} Einträge">
      ${icon(card.icon, `card-icon ${target.tint}`)}
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
  const more = orderedMoreCards();
  const narrow = more.length <= narrowLimit ? " overview-page-narrow" : "";
  dom.overviewGrid.innerHTML = `
    <div class="overview-page">${first}</div>
    <div class="overview-page${narrow}">${more.map(moreCardMarkup).join("")}</div>
  `;
  dom.overviewGrid.scrollLeft = scrolled;
}

/*
 * Die gefüllte Hälfte der Seitenlinie so weit schieben, wie die Karten
 * geschoben sind (0 = erste Seite, 1 = zweite). Nur einmal je Bild, damit
 * schnelles Wischen nicht öfter rechnet, als der Bildschirm zeichnet.
 */
let pagerFrame = 0;
function syncPager() {
  if (pagerFrame) return;
  pagerFrame = requestAnimationFrame(() => {
    pagerFrame = 0;
    const grid = dom.overviewGrid;
    const range = grid.scrollWidth - grid.clientWidth;
    const progress = range > 0 ? Math.min(1, Math.max(0, grid.scrollLeft / range)) : 0;
    el("overview-pager").style.setProperty("--pager-progress", progress.toFixed(3));
  });
}

/** Die Karten anmelden: sie frischen sich auf, wenn sich Daten ändern. */
export function initOverview() {
  dom.overviewGrid.addEventListener("scroll", syncPager, { passive: true });
  on(events.dataChanged, () => {
    if (isViewActive("home")) renderOverview();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderOverview();
  });
  /* Zweites Antippen von „Übersicht“ unten: die Karten zurück auf die erste
     Seite mit Eingang, Favoriten, Arbeitsbereiche und Ressourcen. */
  on(events.tabReselected, (tab) => {
    if (tab === "home") dom.overviewGrid.scrollTo({ left: 0, behavior: "smooth" });
  });
}
