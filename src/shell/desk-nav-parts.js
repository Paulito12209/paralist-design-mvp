/*
 * Bausteine der Seitenleiste am Desktop: das feste Gerüst (die vier Kacheln
 * der Seiten, die Zeile „Suchen“ mit dem Stift für „Neuer Eintrag“, die
 * Trennlinie darunter, der Kopf der Liste,
 * die rollende Liste, „Archiviert“, Fuß) und die Frage, was gerade gewählt
 * ist. Kacheln, Liste und Fuß füllen src/shell/desk-pages.js,
 * src/shell/desk-list.js und src/shell/desk-foot.js; was ein Klick auslöst,
 * entscheidet src/shell/desk-nav.js.
 * Pfad: src/shell/desk-nav-parts.js
 *
 * Keine anpassbaren visuellen Werte: welche Liste welche Taste und Farbe hat,
 * steht in src/ui/desk-links.js; Aussehen, Abstände und Größen stehen in
 * styles/desk-nav.css (Zeile „Suchen“), der Kopf der Liste in
 * styles/desk-nav-list.css, die Kacheln in styles/desk-nav-pages.css, der Fuß
 * in styles/desk-nav-foot.css und die Tasten-Schilder in styles/desk-kbd.css.
 */

import { icon } from "../core/html.js";
import { findEntry } from "../data/queries.js";
import { ui } from "../data/state.js";
import { currentView } from "../ui/views.js";
import { pageLinks, spokenKeys, withCommand } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";

/*
 * „Suchen ⌘K“ über die ganze Breite bis zum Stift (öffnet die Palette), rechts
 * daneben der Stift „Neuer Eintrag“: legt an, was die Seite vorschlägt — meist
 * eine Notiz, wie „N“; der Typ lässt sich im Eingabefeld jederzeit ändern,
 * darum heißt er neutral. Wie in T3 Code ist die Zeile ruhig; erst beim
 * Überfahren bekommt die Suche eine Fläche. Darunter trennt eine feine Linie
 * den oberen Teil von der Liste, wie in Raycast.
 */
function searchRowMarkup() {
  const searchKeys = withCommand("K");
  return `
    <div class="desk-nav-search-row">
      <button class="desk-nav-search" type="button" data-nav-search="1" aria-keyshortcuts="${spokenKeys(searchKeys)}">
        ${icon("search", "desk-nav-search-icon")}
        <span class="desk-nav-search-text">Suchen</span>
        ${keyCap(searchKeys)}
      </button>
      <button class="desk-nav-new desk-hint-host desk-hint-end" type="button" data-nav-new="1" aria-label="Neuer Eintrag" aria-keyshortcuts="N">
        ${icon("note")}
        <span class="desk-page-hint" aria-hidden="true">Neuer Eintrag ${keyCap("N", " desk-kbd-inverse")}</span>
      </button>
    </div>
    <hr class="desk-nav-divider" />`;
}

/**
 * Das feste Gerüst: oben die vier Kacheln der Seiten, „Suchen“ mit dem Stift,
 * die Trennlinie und der Kopf der Liste (samt Menü), in der Mitte die rollende Liste,
 * darunter fest „Archiviert“, unten der Fuß. Jeder Block bekommt seine Nummer
 * (--i), damit er beim ersten Zeigen ein wenig nach dem vorigen auftaucht.
 */
export function skeletonMarkup() {
  return `
    <div class="desk-nav-block desk-nav-top" style="--i: 0">
      <nav class="desk-nav-pages" data-nav-slot="pages" aria-label="Seiten"></nav>
      ${searchRowMarkup()}
      <div class="desk-nav-listhead" data-nav-slot="list-head"></div>
    </div>
    <div class="desk-nav-scroll desk-nav-block" style="--i: 1" data-nav-zone="list">
      <nav class="desk-nav-list" id="desk-nav-list" data-nav-slot="list" aria-label="Liste"></nav>
    </div>
    <section class="desk-nav-archive desk-nav-block" style="--i: 2" data-nav-slot="archive" aria-label="Archiviert" hidden></section>
    <div class="desk-nav-block desk-nav-foot" style="--i: 3" data-nav-slot="foot"></div>`;
}

/*
 * Welche Liste zeigt die offene Unterseite? Der Eingang hat keine Art und
 * keinen Ablageort; Lesezeichen, Archiv und Projekte haben ihre eigene Art.
 * Die Kennungen sind die aus listLinks (src/ui/desk-links.js).
 */
function listOfPage(page) {
  if (page.isWorkspace) return null;
  if (page.kind === "bookmarks" || page.kind === "archive" || page.kind === "projects" || page.kind === "workspaces" || page.kind === "resources") return page.kind;
  return !page.kind && page.parent === null ? "inbox" : null;
}

/* Die Seiten Aufgaben und Kalender zählen als Liste Aufgaben bzw. Termine. */
const listOfTab = { tasks: "tasks", calendar: "events" };

/**
 * Was in der Leiste gerade als gewählt gilt:
 * tab        -> Reiter, wenn einer davon offen ist
 * collection -> Kennung der Liste, deren Seite offen ist (wie in listLinks)
 * workspace  -> Nummer des offenen Arbeitsbereichs
 * entry      -> Nummer des offenen Eintrags
 * In der Suche ist nichts gewählt.
 */
export function activeTargets() {
  const view = currentView();
  const page = view === "page" ? ui.currentPage : null;
  const entry = view === "entry" ? findEntry(ui.currentEntryId) : null;
  return {
    tab: pageLinks.some((link) => link.tab === view) ? view : null,
    collection: page ? listOfPage(page) : listOfTab[view] || null,
    workspace: page && page.isWorkspace ? page.workspaceId : null,
    entry: entry ? entry.id : null,
  };
}
