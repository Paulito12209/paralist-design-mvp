/*
 * Bausteine der Seitenleiste am Desktop: das feste Gerüst (Icon-Zeile der
 * Seiten, Knopf „Neu“, Kopf „Liste“, die rollende Liste, „Archiviert“, Fuß)
 * und die Frage, was gerade gewählt ist. Icon-Zeile, Liste und Fuß füllen
 * src/shell/desk-pages.js, src/shell/desk-list.js und src/shell/desk-foot.js;
 * was ein Klick auslöst, entscheidet src/shell/desk-nav.js.
 * Pfad: src/shell/desk-nav-parts.js
 *
 * Keine anpassbaren visuellen Werte: welche Liste welche Taste und Farbe hat,
 * steht in src/ui/desk-links.js; Aussehen, Abstände und Größen stehen in
 * styles/desk-nav.css, der Kopf „Liste“ in styles/desk-nav-list.css, die
 * Icon-Zeile in styles/desk-nav-pages.css, der Fuß in styles/desk-nav-foot.css
 * und die Tasten-Schilder in styles/desk-kbd.css.
 */

import { icon } from "../core/html.js";
import { findEntry } from "../data/queries.js";
import { ui } from "../data/state.js";
import { currentView } from "../ui/views.js";
import { pageLinks } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";

function newButtonMarkup() {
  return `
    <button class="desk-nav-new" type="button" data-nav-new="1" aria-keyshortcuts="N">
      ${icon("plus", "desk-nav-new-icon")}
      <span>Neu</span>
      ${keyCap("N", " desk-kbd-inverse")}
    </button>`;
}

/**
 * Das feste Gerüst: oben die Icon-Zeile der Seiten, „Neu“ und der Kopf
 * „Liste“ (samt Menü), in der Mitte die rollende Liste, darunter fest
 * „Archiviert“, unten der Fuß. Jeder Block bekommt seine Nummer (--i), damit
 * er beim ersten Zeigen ein wenig nach dem vorigen auftaucht.
 */
export function skeletonMarkup() {
  return `
    <div class="desk-nav-block desk-nav-top" style="--i: 0">
      <nav class="desk-nav-pages" data-nav-slot="pages" aria-label="Seiten"></nav>
      ${newButtonMarkup()}
      <div class="desk-nav-listhead" data-nav-slot="list-head"></div>
    </div>
    <div class="desk-nav-scroll desk-nav-block" style="--i: 1" data-nav-zone="list">
      <nav class="desk-nav-list" data-nav-slot="list" aria-label="Liste"></nav>
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
