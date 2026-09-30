/*
 * Bausteine der Seitenleiste am Desktop: das feste Gerüst (Knopf „Neu“,
 * Sammlungen, Projekte, Fuß) und die Teile, die sich mit den Daten ändern
 * (je Projekt-Ansicht eine Gruppe mit ihren Projekten und der Fuß mit dem
 * Konto). Hier steht nur Markup und was gerade gewählt ist — was ein Klick
 * auslöst, entscheidet src/shell/desk-nav.js.
 * Pfad: src/shell/desk-nav-parts.js
 *
 * Keine anpassbaren visuellen Werte: welche Sammlung welche Taste und Farbe
 * hat, steht in src/ui/desk-links.js; Aussehen, Abstände und Größen stehen
 * in styles/desk-nav.css, der Fuß in styles/desk-nav-foot.css und die
 * Tasten-Schilder in styles/desk-kbd.css.
 */

import { formatNumber } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { sameId } from "../core/ids.js";
import { account } from "../data/account.js";
import { overviewPages } from "../data/config.js";
import { projectViewLabel, visibleProjects } from "../data/project-views.js";
import { entriesOf, findEntry } from "../data/queries.js";
import { entryRef } from "../data/refs.js";
import { state, ui } from "../data/state.js";
import { currentView } from "../ui/views.js";
import { chordKey, collectionLinks, pageLinks, soonLinks, withCommand } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";

function newButtonMarkup() {
  return `
    <button class="desk-nav-new" type="button" data-nav-new="1" aria-keyshortcuts="N">
      ${icon("plus", "desk-nav-new-icon")}
      <span>Neu</span>
      ${keyCap("N", " desk-kbd-inverse")}
    </button>`;
}

function headMarkup(title, tool = "") {
  return `<div class="desk-nav-head"><h2 class="desk-nav-heading">${title}</h2>${tool}</div>`;
}

/* Überschrift „Projekte ↗“: öffnet die Seite Projekte, wie am Handy. */
function projectsHeadMarkup(tool) {
  return `
    <div class="desk-nav-head">
      <h2 class="desk-nav-heading"><button class="desk-nav-heading-link" type="button" data-nav-projects="1" aria-label="Alle Projekte öffnen">Projekte${icon("arrow-up-right")}</button></h2>
      ${tool}
    </div>`;
}

/*
 * Eine Sammlung: Icon in ihrer Farbe, Name, beim Eingang die Zahl direkt am
 * Namen, rechts das Kürzel. Name und Zahl teilen sich eine Spalte — so stehen
 * alle Kürzel untereinander, egal ob eine Zeile eine Zahl hat.
 */
function collectionRowMarkup(link) {
  const quiet = link.quiet ? " is-quiet" : "";
  const counted = link.id === "1" ? '<span class="desk-nav-count" hidden></span>' : "";
  return `
    <button class="desk-nav-row${quiet}" type="button" data-nav-collection="${link.id}" aria-keyshortcuts="${chordKey} ${link.key}">
      ${icon(link.icon, `desk-nav-icon desk-nav-tone desk-nav-icon-${link.tone}`)}
      <span class="desk-nav-label"><span class="desk-nav-text">${escapeHtml(link.title)}</span>${counted}</span>
      ${keyCap(`${chordKey} ${link.key}`)}
    </button>`;
}

/* Was noch kommt: blass, ohne Klick, mit „Bald“ statt Kürzel. */
function soonRowMarkup(card) {
  return `
    <div class="desk-nav-row is-soon" aria-disabled="true">
      ${icon(card.icon, "desk-nav-icon")}
      <span class="desk-nav-text">${escapeHtml(card.title)}</span>
      <span class="desk-soon">Bald</span>
    </div>`;
}

/*
 * Die Sammlungen: alle, die es schon gibt, offen — auch das Archiv. Nur was
 * noch kommt (Personen, Pläne), steht unter „Mehr anzeigen“; die Leiste
 * bleibt so kurz und ruhig. Auf- und zugeklappt wird in src/shell/desk-nav.js.
 */
function collectionsMarkup() {
  return `
    <section class="desk-nav-group" aria-label="Sammlungen">
      ${headMarkup("Sammlungen")}
      <div class="desk-nav-list">
        ${collectionLinks.filter((link) => link.nav !== false).map(collectionRowMarkup).join("")}
        <div class="desk-nav-more" id="desk-nav-more" hidden>${soonLinks.map(soonRowMarkup).join("")}</div>
        <button class="desk-nav-row desk-nav-more-toggle" type="button" data-nav-more="1" aria-expanded="false" aria-controls="desk-nav-more">
          ${icon("chevron", "desk-nav-icon desk-nav-more-chevron")}
          <span class="desk-nav-text">Mehr anzeigen</span>
        </button>
      </div>
    </section>`;
}

/* Die Gruppen der Ansichten bleiben hier leer; renderDeskNav() füllt sie. */
function projectsMarkup() {
  const addView = `
    <button class="desk-nav-tool" type="button" data-nav-add-view="1" aria-label="Neue Ansicht anlegen" title="Neue Ansicht anlegen">${icon("plus")}</button>`;
  return `
    <section class="desk-nav-group" aria-label="Projekte">
      ${projectsHeadMarkup(addView)}
      <div data-nav-slot="views"></div>
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
      <div class="desk-nav-block" style="--i: 2">${projectsMarkup()}</div>
    </div>
    <div class="desk-nav-block desk-nav-foot" style="--i: 3" data-nav-slot="foot"></div>`;
}

/* Ein Projekt: sein Icon (eigenes oder die Rakete), Titel, Stern bei Favorit, Zahl der Einträge. */
function projectRowMarkup(project, activeId) {
  const chosen = sameId(project.id, activeId);
  const label = escapeHtml(project.title || "Projekt");
  const count = entriesOf(entryRef(project.id)).length;
  const star = project.favorite ? icon("star", "desk-nav-star") : "";
  /* title: lange Namen enden mit „…“ — beim Überfahren steht der ganze Name da */
  return `
    <button class="desk-nav-row desk-nav-space${chosen ? " is-active" : ""}" type="button" data-open-entry="${project.id}" title="${label}"${chosen ? ' aria-current="page"' : ""}>
      ${icon(project.icon || "rocket", "desk-nav-icon desk-nav-icon-space")}
      <span class="desk-nav-label"><span class="desk-nav-text">${label}</span>${star}</span>
      ${count ? `<span class="desk-nav-count">${formatNumber(count)}</span>` : ""}
    </button>`;
}

/*
 * Eine Ansicht als Gruppe: Kopf zum Auf- und Zuklappen (Rechtsklick: Menü der
 * Ansicht — der Kopf trägt dafür data-project-view), Rakete mit Plus für ein
 * neues Projekt in dieser Ansicht, darunter ihre Projekte. Zugeklappt zeigt
 * der Kopf, wie viele Projekte darin stehen.
 */
function viewGroupMarkup(view, closedIds, activeId) {
  const id = String(view.id);
  const closed = closedIds.includes(id);
  const name = escapeHtml(projectViewLabel(view));
  const projects = visibleProjects(view);
  const list = projects.length
    ? projects.map((project) => projectRowMarkup(project, activeId)).join("")
    : '<p class="desk-nav-empty">Keine Projekte</p>';
  const listId = `desk-view-group-${id}`;
  return `
    <div class="desk-nav-tabgroup${closed ? " is-closed" : ""}">
      <div class="desk-nav-tabhead">
        <button class="desk-nav-tabtoggle" type="button" data-nav-view-toggle="${id}" data-project-view="${id}" aria-expanded="${!closed}" aria-controls="${listId}">
          ${icon("chevron", "desk-nav-chevron")}
          <span class="desk-nav-text">${name}</span>
          ${closed && projects.length ? `<span class="desk-nav-count">${formatNumber(projects.length)}</span>` : ""}
        </button>
        <button class="desk-nav-tool" type="button" data-nav-add-project="${id}" aria-label="Projekt in „${name}“ anlegen" title="Projekt anlegen">${icon("rocket-plus")}</button>
      </div>
      <div class="desk-nav-list" id="${listId}"${closed ? " hidden" : ""}>${list}</div>
    </div>`;
}

/** Alle Ansichten als Gruppen, „Alle“ zuerst; `closedIds` sind die zugeklappten, `activeId` das offene Projekt. */
export function viewGroupsMarkup(closedIds, activeId) {
  return state.projectViews.map((view) => viewGroupMarkup(view, closedIds, activeId)).join("");
}

/* Das runde Bild: Foto, sonst die Initialen auf dem Verlauf des Profils. */
function avatarMarkup(photo) {
  return photo ? `<img class="desk-foot-photo" src="${photo}" alt="">` : escapeHtml(account.initials);
}

/*
 * Der Fuß: das Konto mit Zahnrad, öffnet Profil und Einstellungen. Die Stufe
 * steht oben rechts in der Reiterzeile (src/shell/desk-head.js).
 */
export function footMarkup(photo) {
  return `
    <button class="desk-nav-row desk-foot-row" type="button" data-nav-profile="1" aria-label="Profil und Einstellungen" aria-keyshortcuts="Meta+Comma">
      <span class="desk-foot-avatar" aria-hidden="true">${avatarMarkup(photo)}</span>
      <span class="desk-foot-copy"><span class="desk-foot-title">${escapeHtml(account.name)}</span><span class="desk-foot-hint">${escapeHtml(account.plan)}</span></span>
      ${icon("settings", "desk-foot-gear")}
      ${keyCap(withCommand(","))}
    </button>`;
}

/* Welche Sammlung zeigt die offene Unterseite? Der Eingang hat keine Art und
   keinen Ablageort; Lesezeichen, Archiv und Projekte haben ihre eigene Art. */
function collectionOf(page) {
  if (page.isWorkspace) return null;
  if (page.kind === "bookmarks" || page.kind === "archive" || page.kind === "projects") return page.kind;
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
 * project    -> Nummer des offenen Eintrags, wenn er ein Projekt ist
 * In der Suche ist nichts gewählt.
 */
export function activeTargets() {
  const view = currentView();
  const page = view === "page" ? ui.currentPage : null;
  const entry = view === "entry" ? findEntry(ui.currentEntryId) : null;
  return {
    tab: pageLinks.some((link) => link.tab === view) ? view : null,
    collection: page ? collectionOf(page) : null,
    workspace: page && page.isWorkspace ? page.workspaceId : null,
    project: entry && entry.type === "projekt" ? entry.id : null,
  };
}
