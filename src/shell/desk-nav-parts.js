/*
 * Bausteine der Seitenleiste am Desktop: das feste Gerüst (Knopf „Neu“,
 * Sammlungen, Arbeitsbereiche, Fuß) und die Teile, die sich mit den Daten
 * ändern (die Tab-Gruppen mit ihren Arbeitsbereichen und der Fuß mit Stufe und
 * Konto). Hier steht nur Markup und was gerade gewählt ist — was ein Klick
 * auslöst, entscheidet src/shell/desk-nav.js.
 * Pfad: src/shell/desk-nav-parts.js
 *
 * Keine anpassbaren visuellen Werte: welche Sammlung welche Taste und Farbe
 * hat, steht in src/shell/desk-links.js; Aussehen, Abstände und Größen stehen
 * in styles/desk-nav.css, der Fuß in styles/desk-nav-foot.css und die
 * Tasten-Schilder in styles/desk-kbd.css.
 */

import { formatNumber } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { sameId } from "../core/ids.js";
import { account } from "../data/account.js";
import { overviewPages } from "../data/config.js";
import { entriesOf, workspaceIcon, workspaceLabel, workspacesOfTab } from "../data/queries.js";
import { workspaceRef } from "../data/refs.js";
import { state, ui } from "../data/state.js";
import { levelInfo, totalXp } from "../data/xp.js";
import { currentView } from "../ui/views.js";
import { chordKey, collectionLinks, pageLinks, soonLinks, withCommand } from "./desk-links.js";

/* kbd: eine Taste der Tastatur. Für Vorlesehilfen ausgeblendet — dort sagt
   aria-keyshortcuts am Knopf schon dasselbe. */
function kbd(key, extraClass = "") {
  return `<kbd class="desk-kbd${extraClass}" aria-hidden="true">${escapeHtml(key)}</kbd>`;
}

function newButtonMarkup() {
  return `
    <button class="desk-nav-new" type="button" data-nav-new="1" aria-keyshortcuts="N">
      ${icon("plus", "desk-nav-new-icon")}
      <span>Neu</span>
      ${kbd("N", " desk-kbd-inverse")}
    </button>`;
}

function headMarkup(title, tool = "") {
  return `<div class="desk-nav-head"><h2 class="desk-nav-heading">${title}</h2>${tool}</div>`;
}

/* Eine Sammlung: Icon in ihrer Farbe, Name, beim Eingang die Zahl, dann das Kürzel. */
function collectionRowMarkup(link) {
  const quiet = link.quiet ? " is-quiet" : "";
  const counted = link.id === "1" ? '<span class="desk-nav-count" hidden></span>' : "";
  return `
    <button class="desk-nav-row${quiet}" type="button" data-nav-collection="${link.id}" aria-keyshortcuts="${chordKey} ${link.key}">
      ${icon(link.icon, `desk-nav-icon desk-nav-tone desk-nav-icon-${link.tone}`)}
      <span class="desk-nav-text">${escapeHtml(link.title)}</span>
      ${counted}
      ${kbd(`${chordKey} ${link.key}`)}
    </button>`;
}

/* Was noch kommt: blass, ohne Klick, mit „Bald“ statt Kürzel. */
function soonRowMarkup(card) {
  return `
    <div class="desk-nav-row is-soon" aria-disabled="true">
      ${icon(card.icon, "desk-nav-icon")}
      <span class="desk-nav-text">${escapeHtml(card.title)}</span>
      <span class="desk-kbd desk-kbd-soon">Bald</span>
    </div>`;
}

function collectionsMarkup() {
  return `
    <section class="desk-nav-group" aria-label="Sammlungen">
      ${headMarkup("Sammlungen")}
      <div class="desk-nav-list">${collectionLinks.map(collectionRowMarkup).join("")}${soonLinks.map(soonRowMarkup).join("")}</div>
    </section>`;
}

/* Die Tab-Gruppen bleiben hier leer; renderDeskNav() füllt sie. */
function spacesMarkup() {
  const addTab = `
    <button class="desk-nav-tool desk-nav-tool-text" type="button" data-nav-add-tab="1" title="Neuen Tab anlegen">
      ${icon("plus")}<span>Tab</span>
    </button>`;
  return `
    <section class="desk-nav-group" aria-label="Arbeitsbereiche">
      ${headMarkup("Arbeitsbereiche", addTab)}
      <div data-nav-slot="spaces"></div>
    </section>`;
}

/**
 * Das feste Gerüst: oben „Neu“, in der Mitte die rollende Liste, unten der
 * Fuß. Jeder Block bekommt seine Nummer (--i), damit er beim ersten Zeigen ein
 * wenig nach dem vorigen auftaucht.
 */
export function skeletonMarkup() {
  return `
    <div class="desk-nav-block desk-nav-top" style="--i: 0">${newButtonMarkup()}</div>
    <div class="desk-nav-scroll">
      <div class="desk-nav-block" style="--i: 1">${collectionsMarkup()}</div>
      <div class="desk-nav-block" style="--i: 2">${spacesMarkup()}</div>
    </div>
    <div class="desk-nav-block desk-nav-foot" style="--i: 3" data-nav-slot="foot"></div>`;
}

function spaceRowMarkup(workspace, activeId) {
  const chosen = sameId(workspace.id, activeId);
  const label = escapeHtml(workspaceLabel(workspace));
  const count = entriesOf(workspaceRef(workspace.id)).length;
  const star = workspace.favorite ? icon("star", "desk-nav-star") : "";
  /* title: lange Namen enden mit „…“ — beim Überfahren steht der ganze Name da */
  return `
    <button class="desk-nav-row desk-nav-space${chosen ? " is-active" : ""}" type="button" data-open-workspace="${workspace.id}" title="${label}"${chosen ? ' aria-current="page"' : ""}>
      ${icon(workspaceIcon(workspace), "desk-nav-icon desk-nav-icon-space")}
      <span class="desk-nav-label"><span class="desk-nav-text">${label}</span>${star}</span>
      ${count ? `<span class="desk-nav-count">${formatNumber(count)}</span>` : ""}
    </button>`;
}

/*
 * Eine Tab-Gruppe: Kopf zum Auf- und Zuklappen (Rechtsklick: Menü des Tabs),
 * Plus für einen neuen Arbeitsbereich darin, darunter die Arbeitsbereiche.
 * Zugeklappt zeigt der Kopf, wie viele darin liegen.
 */
function tabGroupMarkup(tab, closedIds, activeId) {
  const id = String(tab.id);
  const closed = closedIds.includes(id);
  const name = escapeHtml(tab.name || tab.placeholder || "Tab");
  const spaces = workspacesOfTab(tab.id);
  const list = spaces.length
    ? spaces.map((workspace) => spaceRowMarkup(workspace, activeId)).join("")
    : '<p class="desk-nav-empty">Noch keine Arbeitsbereiche</p>';
  const listId = `desk-tab-group-${id}`;
  return `
    <div class="desk-nav-tabgroup${closed ? " is-closed" : ""}">
      <div class="desk-nav-tabhead">
        <button class="desk-nav-tabtoggle" type="button" data-nav-tab-toggle="${id}" data-tab-id="${id}" aria-expanded="${!closed}" aria-controls="${listId}">
          ${icon("chevron", "desk-nav-chevron")}
          <span class="desk-nav-text">${name}</span>
          ${closed && spaces.length ? `<span class="desk-nav-count">${formatNumber(spaces.length)}</span>` : ""}
        </button>
        <button class="desk-nav-tool" type="button" data-nav-add-workspace="${id}" aria-label="Arbeitsbereich in „${name}“ anlegen" title="Arbeitsbereich anlegen">${icon("plus")}</button>
      </div>
      <div class="desk-nav-list" id="${listId}"${closed ? " hidden" : ""}>${list}</div>
    </div>`;
}

/** Alle Tabs als Gruppen; `closedIds` sind die zugeklappten, `activeId` der offene Arbeitsbereich. */
export function tabGroupsMarkup(closedIds, activeId) {
  return state.tabs.map((tab) => tabGroupMarkup(tab, closedIds, activeId)).join("");
}

/* Das runde Bild: Foto, sonst die Initialen auf dem Verlauf des Profils. */
function avatarMarkup(photo) {
  return photo ? `<img class="desk-foot-photo" src="${photo}" alt="">` : escapeHtml(account.initials);
}

/** Der Fuß: Stufe mit Ring, darunter Konto mit Zahnrad — beides öffnet sein Blatt. */
export function footMarkup(photo) {
  const xp = totalXp();
  const info = levelInfo(xp);
  const missing = Math.max(0, info.to - xp);
  return `
    <button class="desk-nav-row desk-foot-row" type="button" data-nav-level="1" aria-label="Stufe ${info.level}, noch ${formatNumber(missing)} XP bis Stufe ${info.level + 1}. Fortschritt öffnen">
      <span class="desk-foot-ring" style="--progress: ${info.progress.toFixed(3)}" aria-hidden="true"><span>${info.level}</span></span>
      <span class="desk-foot-copy"><span class="desk-foot-title">Stufe ${info.level}</span><span class="desk-foot-hint">${formatNumber(missing)} XP bis Stufe ${info.level + 1}</span></span>
    </button>
    <button class="desk-nav-row desk-foot-row" type="button" data-nav-profile="1" aria-label="Profil und Einstellungen" aria-keyshortcuts="Meta+Comma">
      <span class="desk-foot-avatar" aria-hidden="true">${avatarMarkup(photo)}</span>
      <span class="desk-foot-copy"><span class="desk-foot-title">${escapeHtml(account.name)}</span><span class="desk-foot-hint">${escapeHtml(account.plan)}</span></span>
      ${icon("settings", "desk-foot-gear")}
      ${kbd(withCommand(","))}
    </button>`;
}

/* Welche Sammlung zeigt die offene Unterseite? Der Eingang hat keine Art und
   keinen Ablageort; Lesezeichen und Archiv haben ihre eigene Art. */
function collectionOf(page) {
  if (page.isWorkspace) return null;
  if (page.kind === "bookmarks" || page.kind === "archive") return page.kind;
  const match = Object.entries(overviewPages).find(([, item]) =>
    item.kind ? item.kind === page.kind : !page.kind && page.parent === null
  );
  return match ? match[0] : null;
}

/**
 * Was in der Leiste gerade als gewählt gilt:
 * tab        -> Reiter, wenn einer davon offen ist
 * collection -> id der offenen Sammlung (wie in collectionLinks)
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
