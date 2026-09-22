/*
 * Bausteine der Seitenleiste am Desktop: das feste Gerüst (Hauptseiten,
 * Knopf „Neu anlegen“, Sammlungen, Arbeitsbereiche, Tipp-Karte) und die
 * beiden Teile, die sich mit den Daten ändern (Tab-Pillen und die Zeilen der
 * Arbeitsbereiche). Hier steht nur Markup und welche Zeile gerade gewählt
 * ist — was ein Klick auslöst, entscheidet src/shell/desk-nav.js.
 * Pfad: src/shell/desk-nav-parts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pageLinks       -> welche Hauptseiten oben in der Leiste stehen: Icon, Name,
 *                    Taste und welche Zahl rechts daneben erscheint. Die Tasten
 *                    sind zugleich die Tastenkürzel: src/shell/desk.js liest
 *                    sie von hier, Schild und Kürzel stimmen so immer überein.
 * collectionTones -> welche Sammlung ihr Icon in welcher Farbe zeigt (die
 *                    Farben selbst stehen in styles/desk-nav.css)
 * tipKeys         -> die Zeilen der Tipp-Karte am Ende: Taste und was sie tut
 *
 * Aussehen, Abstände und Größen stehen in styles/desk-nav.css, die der
 * Tasten-Schilder und der Tipp-Karte in styles/desk-nav-tip.css.
 */

import { formatNumber } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { sameId } from "../core/ids.js";
import { overviewPages } from "../data/config.js";
import { entriesOf, tabWorkspaces, workspaceIcon, workspaceLabel } from "../data/queries.js";
import { workspaceRef } from "../data/refs.js";
import { state, ui } from "../data/state.js";
import { currentView } from "../ui/views.js";

/* Die vier Hauptseiten. `count` holt die Zahl rechts aus deskStats(),
   `spoken` sagt sie für Vorlesehilfen als ganzen Satz. */
export const pageLinks = [
  { tab: "home", label: "Übersicht", icon: "grid", key: "1" },
  {
    tab: "calendar",
    label: "Kalender",
    icon: "calendar",
    key: "2",
    count: (stats) => stats.today,
    spoken: (value) => (value === 1 ? "1 Termin heute" : `${value} Termine heute`),
  },
  {
    tab: "tasks",
    label: "Aufgaben",
    icon: "checklist",
    key: "3",
    count: (stats) => stats.openTasks,
    spoken: (value) => (value === 1 ? "1 offene Aufgabe" : `${value} offene Aufgaben`),
  },
  { tab: "media", label: "Medien", icon: "photos", key: "4" },
];

/* Dieselbe Zuordnung wie auf den Karten der Übersicht
   (src/features/overview/overview.js): vier Icons tragen eine eigene Farbe. */
const collectionTones = {
  inbox: "inbox",
  star: "star",
  "star-outline": "star",
  rocket: "project",
  cube: "resource",
};

/* „N“ und „/“ stehen zweimal in der App: hier als Hinweis und in
   src/shell/desk.js, wo sie wirklich etwas tun. Die Spanne der Seiten-Tasten
   kommt aus pageLinks und ist ein einziges Schild („1–4“) — so hat jede Zeile
   genau ein Schild, und die Beschreibungen stehen bündig untereinander. */
const tipKeys = [
  { key: "N", label: "Neu anlegen" },
  { key: "/", label: "Suchen" },
  { key: `${pageLinks[0].key}–${pageLinks.at(-1).key}`, label: "Seiten wechseln" },
];

/*
 * kbd: eine Taste der Tastatur. An Knöpfen für Vorlesehilfen ausgeblendet —
 * dort sagt aria-keyshortcuts schon dasselbe, sonst hörte man die Taste
 * doppelt. In der Tipp-Karte ist die Taste selbst der Inhalt: `spoken` lässt
 * sie dort hörbar.
 */
function kbd(key, extraClass = "", spoken = false) {
  const classes = extraClass ? `desk-nav-kbd ${extraClass}` : "desk-nav-kbd";
  return `<kbd class="${classes}"${spoken ? "" : ' aria-hidden="true"'}>${escapeHtml(key)}</kbd>`;
}

function pageRowMarkup(link) {
  return `
    <button class="desk-nav-row desk-nav-page" type="button" data-nav-page="${link.tab}" aria-keyshortcuts="${link.key}">
      ${icon(link.icon, "desk-nav-icon")}
      <span class="desk-nav-text">${link.label}</span>
      <span class="desk-nav-count" hidden></span>
      ${kbd(link.key, "desk-nav-hint")}
    </button>`;
}

/*
 * nav: die vier Hauptseiten sind die Navigation der App. Die Leiste unten
 * ist am Desktop ausgeblendet — so finden Vorlesehilfen sie trotzdem als
 * eigenen Bereich, direkt in der Seitenleiste.
 */
function pagesMarkup() {
  return `<nav class="desk-nav-pages" aria-label="Hauptseiten">${pageLinks.map(pageRowMarkup).join("")}</nav>`;
}

function newButtonMarkup() {
  return `
    <button class="desk-nav-new" type="button" data-nav-new="1" aria-keyshortcuts="N">
      ${icon("plus", "desk-nav-new-icon")}
      <span>Neu anlegen</span>
      ${kbd("N", "desk-nav-kbd-inverse")}
    </button>`;
}

function collectionRowMarkup([id, page]) {
  const tone = collectionTones[page.icon];
  const iconClass = tone ? `desk-nav-icon desk-nav-tone desk-nav-icon-${tone}` : "desk-nav-icon";
  return `
    <button class="desk-nav-row" type="button" data-nav-overview="${id}">
      ${icon(page.icon || "placeholder", iconClass)}
      <span class="desk-nav-text">${escapeHtml(page.title)}</span>
      <span class="desk-nav-badge" hidden></span>
    </button>`;
}

function headMarkup(title, tool = "") {
  return `<div class="desk-nav-head"><h2 class="desk-nav-heading">${title}</h2>${tool}</div>`;
}

function collectionsMarkup() {
  return `
    <section class="desk-nav-group">
      ${headMarkup("Sammlungen")}
      <div class="desk-nav-list">${Object.entries(overviewPages).map(collectionRowMarkup).join("")}</div>
    </section>`;
}

/* Tab-Pillen und Zeilen bleiben hier leer; renderDeskNav() füllt sie. */
function spacesMarkup() {
  const addButton = `
    <button class="desk-nav-tool" type="button" data-nav-add-workspace="1" aria-label="Arbeitsbereich hinzufügen" title="Arbeitsbereich hinzufügen">
      ${icon("folder-plus")}
    </button>`;
  return `
    <section class="desk-nav-group">
      ${headMarkup("Arbeitsbereiche", addButton)}
      <div class="desk-nav-tabs" data-nav-slot="tabs" role="group" aria-label="Tabs der Arbeitsbereiche"></div>
      <div class="desk-nav-list" data-nav-slot="spaces"></div>
    </section>`;
}

/*
 * Die Tipp-Karte in ihrem eigenen Block am Ende der Leiste. Der Block trägt
 * data-nav-slot und `hidden`: Weggeklickt verschwindet er samt seinem Abstand.
 * Der Schließen-Knopf ist ein gewöhnlicher runder Knopf der Leiste
 * (desk-nav-tool) — Größe, Überfahren und Fokus-Ring wie beim Ordner-Plus.
 */
function tipMarkup(order, hidden) {
  const lines = tipKeys.map(({ key, label }) => `<li>${kbd(key, "", true)}<span>${label}</span></li>`).join("");
  return `
    <div class="desk-nav-block desk-nav-foot" data-nav-slot="tip" style="--i: ${order}"${hidden ? " hidden" : ""}>
      <section class="desk-tip" aria-label="Tipp: Tastenkürzel">
        <div class="desk-tip-head">
          <span class="desk-tip-pill">Tipp</span>
          <p class="desk-tip-title">Tastenkürzel</p>
          <button class="desk-nav-tool desk-tip-close" type="button" data-tip-close="1" aria-label="Tipp ausblenden">${icon("close")}</button>
        </div>
        <ul class="desk-tip-keys">${lines}</ul>
      </section>
    </div>`;
}

/**
 * Das ganze Gerüst der Leiste. Jeder Block bekommt seine Nummer (--i), damit
 * er beim ersten Zeigen ein wenig nach dem vorigen auftaucht.
 * @param tipHidden true, wenn die Tipp-Karte schon einmal weggeklickt wurde.
 */
export function skeletonMarkup(tipHidden) {
  const blocks = [pagesMarkup(), newButtonMarkup(), collectionsMarkup(), spacesMarkup()];
  const scroll = blocks
    .map((html, index) => `<div class="desk-nav-block" style="--i: ${index}">${html}</div>`)
    .join("");
  /* Die Tipp-Karte rollt als letzter Block mit: bei hohem Fenster ruht sie
     unten, bei niedrigem folgt sie den Arbeitsbereichen, statt sie zu verdecken. */
  return `<div class="desk-nav-scroll">${scroll}${tipMarkup(blocks.length, tipHidden)}</div>`;
}

/** Die Tab-Pillen: Name wie auf der Übersicht, der gewählte Tab gefüllt. */
export function tabsMarkup() {
  return state.tabs
    .map((tab) => {
      const chosen = sameId(tab.id, state.activeTabId);
      const label = tab.name || tab.placeholder || "Tab";
      const glyph = tab.icon ? icon(tab.icon) : "";
      return `<button class="desk-nav-tab${chosen ? " is-active" : ""}" type="button" data-nav-tab-id="${tab.id}" aria-pressed="${chosen}">${glyph}<span>${escapeHtml(label)}</span></button>`;
    })
    .join("");
}

function spaceRowMarkup(workspace, activeId) {
  const chosen = sameId(workspace.id, activeId);
  const label = escapeHtml(workspaceLabel(workspace));
  const count = entriesOf(workspaceRef(workspace.id)).length;
  const star = workspace.favorite ? icon("star", "desk-nav-star") : "";
  /* title: lange Namen enden mit „…“ — beim Überfahren steht der ganze Name da */
  return `
    <button class="desk-nav-row${chosen ? " is-active" : ""}" type="button" data-open-workspace="${workspace.id}" title="${label}"${chosen ? ' aria-current="page"' : ""}>
      ${icon(workspaceIcon(workspace), "desk-nav-icon desk-nav-icon-space")}
      <span class="desk-nav-label"><span class="desk-nav-text">${label}</span>${star}</span>
      ${count ? `<span class="desk-nav-count">${formatNumber(count)}</span>` : ""}
    </button>`;
}

/** Die Arbeitsbereiche des gewählten Tabs; `activeId` ist der gerade offene. */
export function workspaceRowsMarkup(activeId) {
  const spaces = tabWorkspaces();
  if (!spaces.length) return '<p class="desk-nav-empty">Noch keine Arbeitsbereiche</p>';
  return spaces.map((workspace) => spaceRowMarkup(workspace, activeId)).join("");
}

/* Welche Sammlung zeigt die offene Unterseite? Der Eingang hat keine Art und
   keinen Ablageort; das Archiv hat die Art „archive“ und zählt nicht mit. */
function collectionOf(page) {
  if (page.isWorkspace) return null;
  const match = Object.entries(overviewPages).find(([, item]) =>
    item.kind ? item.kind === page.kind : !page.kind && page.parent === null
  );
  return match ? match[0] : null;
}

/**
 * Was in der Leiste gerade als gewählt gilt:
 * tab        -> Hauptseite, wenn eine davon offen ist
 * collection -> Nummer der offenen Sammlung (1–4)
 * workspace  -> Nummer des offenen Arbeitsbereichs
 * Auf einem Eintrag und in der Suche ist nichts gewählt.
 */
export function activeTargets() {
  const view = currentView();
  const page = view === "page" ? ui.currentPage : null;
  return {
    tab: pageLinks.some((link) => link.tab === view) ? view : null,
    collection: page ? collectionOf(page) : null,
    workspace: page && page.isWorkspace ? page.workspaceId : null,
  };
}
