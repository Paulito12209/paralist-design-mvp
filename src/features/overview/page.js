/*
 * Die Unterseite hinter einer Übersichtskarte oder einem Arbeitsbereich:
 * Kopfzeile mit Zurück-Pfeil, darunter der große Titel und der Inhalt. Suche
 * und Optionen-Menü bleiben verborgen, bis man die Liste nach unten
 * scrollt — wie bei einer Playlist in Spotify. Ein Arbeitsbereich zeigt
 * dagegen wie eine Eintragsseite gleich mittig seine Kategorie und das Menü —
 * und kann wie sie ein Cover in seiner Farbe bekommen (src/ui/page-cover.js).
 * Pfad: src/features/overview/page.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * HEADER_REVEAL_PX -> ab wie viel Scrollweg Suche und Optionen erscheinen
 * WORKSPACE_CRUMB  -> die graue Kategorie mitten in der Kopfzeile eines Arbeitsbereichs
 *
 * Sonst keine anpassbaren visuellen Werte: Kopfzeile und Liste stehen in
 * styles/rows.css (Klassen .page-head, .page-body).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { load } from "../../core/lazy.js";
import {
  archiveWorkspace,
  clearFavorites,
  deleteEntriesOf,
  deleteWorkspace,
  restoreFromArchive,
  setCover,
  toggleFavorite,
} from "../../data/mutations.js";
import { filterCollectionEntries, filterCollectionWorkspaces } from "../../data/collection-filters.js";
import { sortCollectionEntries, sortCollectionWorkspaces } from "../../data/collection-sorts.js";
import { workspaceDetails } from "../../data/details.js";
import { searchKeyboardOn } from "../../data/search-keyboard.js";
import { findWorkspace, inboxEntries, workspaceColor } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { openDetails } from "../../ui/details.js";
import { bindHeadTitle, setHeadTitle } from "../../ui/head-title.js";
import { registerCover, renderCover } from "../../ui/page-cover.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { mountPath, pageSteps, renderPath } from "../../ui/page-path.js";
import { goBack, restoreFrom, showSearch } from "../../ui/router.js";
import { emptyState } from "../../ui/empty-state.js";
import { filterEmptyState } from "../../ui/filter-empty.js";
import { entryRow, workspaceRow } from "../../ui/rows.js";
import { openSheet } from "../../ui/sheet.js";
import { openTypeChangeSheet, typeChangeAction, typeCrumbMarkup } from "../../ui/type-menu.js";
import { isViewActive } from "../../ui/views.js";
import { initArchive, renderArchive } from "./archive.js";
import { initCollectionPanel } from "./collection-panel.js";
import { pageHeroOptions, renderPageHero } from "./page-hero.js";
import { renderProjectsPage } from "./projects.js";
import { initWorkspaceCollection, renderWorkspaceCollection } from "./workspace-collection.js";
import { isWritingNotes, renderWorkspacePage } from "./workspace-page.js";
import { beginRenameWorkspaceTitle, initWorkspaceTitle, setupWorkspaceTitle } from "./workspace-title.js";
import { commitStaleWorkspaceName, focusWorkspaceName } from "./workspaces.js";

/* Sammlungen, in denen es nichts zu löschen gibt: ihr Menü bietet nur die Wahl des Kopfes. */
const collectionsWithoutDelete = ["resources", "projects", "archive", "workspaces", "bookmarks"];

/*
 * Seiten, die neben ihrem Titel noch einen grauen Zweittitel zeigen: ein Tippen
 * darauf springt in den verwandten Bereich. Farbe: --title-alt in tokens.css.
 */
const titleSwitches = {
  resources: { label: "Medien", target: "media" },
};

/* Ab wie viel Scrollweg Suche und Optionen in der Kopfzeile erscheinen. */
const HEADER_REVEAL_PX = 4;
/* Die Kategorie, nicht der Ort: der Zurück-Pfeil führt dorthin, wo man zuletzt war. */
const WORKSPACE_CRUMB = "Arbeitsbereich";

/*
 * Was eine leere Seite zeigt: Emblem in der Farbe der Karte, ein Satz dazu und
 * die Pille zum Anlegen. Favoriten bekommen keine Pille — ein Favorit entsteht
 * nur, indem man eine vorhandene Zeile markiert. Die leere Projektliste steht
 * in src/features/overview/projects.js — Übersicht und Seite Projekte teilen sie.
 */
const emptyStates = {
  inbox: {
    icon: "inbox",
    accent: "var(--cal-accent)",
    title: "Noch nichts im Eingang",
    text: "Leg hier Einträge ab — Notizen, Aufgaben, Termine. Alles, was du nirgends ablegst, sammelt sich hier.",
    /* Ohne `pick`: die Seite schlägt ohnehin eine Notiz vor (proposedType). */
    action: { label: "Eintrag hinzufügen" },
  },
  favorites: {
    icon: "star",
    accent: "var(--prio-next)",
    title: "Noch keine Favoriten",
    text: "Wisch eine Zeile nach rechts und tippe auf den Stern, dann steht sie hier.",
  },
};

function listMarkup(entries, empty) {
  return entries.length
    ? `<div class="workspace-list">${entries.map((entry) => entryRow(entry)).join("")}</div>`
    : emptyState(empty);
}

/* Der Eingang: gefiltert und sortiert. Blenden die Filter alles aus, sagt
   die Seite das, statt „Noch nichts im Eingang“ zu behaupten. */
function renderInbox() {
  const all = inboxEntries();
  const shown = sortCollectionEntries("inbox", filterCollectionEntries("inbox", all));
  dom.pageBody.innerHTML = all.length && !shown.length ? filterEmptyState() : listMarkup(shown, emptyStates.inbox);
}

/* Favoriten-Karte: erst die markierten Arbeitsbereiche, dann die markierten Einträge. */
function renderFavorites() {
  commitStaleWorkspaceName();
  const allSpaces = state.workspaces.filter((workspace) => workspace.favorite && !workspace.archived);
  const allEntries = state.entries.filter((entry) => entry.favorite && !entry.archived);
  const spaces = sortCollectionWorkspaces("favorites", filterCollectionWorkspaces("favorites", allSpaces));
  const entries = sortCollectionEntries("favorites", filterCollectionEntries("favorites", allEntries));
  const canEdit = isViewActive("page");
  const filteredAway = !spaces.length && !entries.length && (allSpaces.length || allEntries.length);

  dom.pageBody.innerHTML = filteredAway
    ? filterEmptyState()
    : spaces.length || entries.length
      ? `<div class="workspace-list">${spaces
          .map((workspace) => workspaceRow(workspace, canEdit))
          .join("")}${entries.map((entry) => entryRow(entry)).join("")}</div>`
      : emptyState(emptyStates.favorites);

  if (canEdit) focusWorkspaceName();
}

/** Den Inhalt der offenen Unterseite zeichnen. */
export function renderPageBody() {
  const page = ui.currentPage;
  if (!page) return;

  if (page.kind === "favorites") renderFavorites();
  else if (page.kind === "archive") renderArchive();
  else if (page.kind === "workspaces") renderWorkspaceCollection();
  else if (page.kind === "projects") renderProjectsPage();
  else if (page.kind === "resources") load("resources").then((module) => module.renderResources());
  else if (page.kind === "bookmarks") load("bookmarks").then((module) => module.renderBookmarks());
  else if (page.isWorkspace) renderWorkspacePage(page);
  else renderInbox();
}

/* Das Cover gibt es nur auf einem Arbeitsbereich, nie auf den Sammlungen
   derselben Ansicht — dort wird es beim Wechsel wieder abgeschaltet. */
function renderWorkspaceCover() {
  const page = ui.currentPage;
  const workspace = page && page.isWorkspace ? findWorkspace(page.workspaceId) : null;
  renderCover(el("view-page"), { on: Boolean(workspace && workspace.cover), color: workspaceColor() });
}

/* Suche und Optionen ein-/ausblenden, je nachdem wie weit die Liste gescrollt ist. */
function updatePageHeadScroll() {
  if (!isViewActive("page")) return;
  dom.pageHead.classList.toggle("is-scrolled", dom.content.scrollTop > HEADER_REVEAL_PX);
}

/* Der Pfad oben links in der Kopfzeile am Desktop (src/ui/page-path.js), angelegt in initPage. */
let path = null;

/** Kopfzeile und Inhalt der Unterseite aufbauen. */
function renderPage() {
  const page = ui.currentPage;
  if (!page) return;
  renderPath(path, pageSteps(page));
  const jump = titleSwitches[page.kind];
  if (jump) {
    dom.pageTitle.innerHTML = `${escapeHtml(page.title)}<button class="title-switch" type="button" data-title-switch="${jump.target}">${jump.label}</button>`;
  } else {
    dom.pageTitle.textContent = page.title;
  }
  /* Auf einem Arbeitsbereich ist der Titel selbst das Namensfeld. */
  setupWorkspaceTitle(page);
  setHeadTitle(dom.pageHead, page.isWorkspace ? page.title : "", "Arbeitsbereich");
  /* Jede Sammlung hat oben rechts ihr Menü, mindestens für die Wahl des Kopfes */
  dom.pageMenuBtn.hidden = false;
  dom.pageHead.classList.toggle("is-menu-shown", !page.isWorkspace);
  renderPageHero(page);
  /* Ein Arbeitsbereich sieht aus wie eine Eintragsseite: Kategorie und Menü
     stehen von Anfang an oben, statt nach dem Scrollen der Suche zu weichen. */
  dom.pageCrumb.hidden = !page.isWorkspace;
  /* Die Kategorie ist eine Pille: ein Tipp öffnet „Typ ändern“ (src/ui/type-menu.js). */
  dom.pageCrumb.innerHTML = page.isWorkspace ? typeCrumbMarkup(WORKSPACE_CRUMB) : "";
  dom.pageHead.classList.toggle("is-pinned", Boolean(page.isWorkspace));
  renderPageBody();
  /* Nach dem Inhalt: das Cover misst die Pillen, die gerade erst entstanden sind */
  renderWorkspaceCover();
}

/* Das Seitenmenü hängt davon ab, was die Seite ist. */
function openPageMenu() {
  const page = ui.currentPage;
  if (!page) return;

  const heroOptions = pageHeroOptions(page, () => renderPageHero(ui.currentPage));
  if (page.kind === "favorites") {
    openSheet(page.title, [
      ...heroOptions,
      { label: "Alle Favoriten entfernen", icon: "star-outline", onSelect: clearFavorites },
    ]);
    return;
  }

  const options = [...heroOptions];
  const workspace = page.isWorkspace ? findWorkspace(page.workspaceId) : null;

  if (workspace) {
    options.push({ label: "Umbenennen", icon: "pencil", onSelect: beginRenameWorkspaceTitle });
    options.push({
      label: "Details",
      icon: "info",
      onSelect: () => openDetails(workspace.name, workspaceDetails(workspace)),
    });
    options.push({
      label: workspace.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: workspace.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(workspace),
    });
    /* Wie auf einer Eintragsseite: Cover und Icon nebeneinander im Menü */
    options.push({
      label: workspace.cover ? "Cover entfernen" : "Cover hinzufügen",
      icon: "image",
      onSelect: () => setCover(workspace, !workspace.cover),
    });
    options.push(
      iconPickerAction(workspace.icon, (name) => {
        workspace.icon = name;
        saveState();
        /* Das Icon steht nicht auf dieser Seite, sondern in den Listen der
           Übersicht und der Seitenleiste: die frischen sich bei der Meldung
           selbst auf, diese Seite zeichnet dabei ihren Inhalt neu. */
        emit(events.dataChanged);
      })
    );
    options.push(typeChangeAction({ workspace }));
    /* Wie im Menü seiner Zeile: Archivieren verlässt die Seite (er steht in
       keiner Liste mehr), Zurückholen aus dem Archiv lässt sie offen. */
    options.push(
      workspace.archived
        ? { label: "Zurückholen", icon: "history", onSelect: () => restoreFromArchive(workspace) }
        : {
            label: "Archivieren",
            icon: "archive",
            onSelect: () => {
              archiveWorkspace(workspace.id);
              restoreFrom(ui.sourceView);
            },
          }
    );
  }

  if (!collectionsWithoutDelete.includes(page.kind)) {
    options.push({
      label: "Alle Einträge löschen",
      icon: "trash",
      danger: true,
      onSelect: () => deleteEntriesOf(page.parent),
    });
  }

  if (workspace) {
    options.push({
      label: "Arbeitsbereich löschen",
      icon: "trash",
      danger: true,
      onSelect: () => {
        deleteWorkspace(workspace.id);
        restoreFrom(ui.sourceView);
      },
    });
  }

  openSheet(page.title, options);
}

/** Seitenmenü, Suche, Zurück-Pfeil und Auffrischen anmelden. */
export function initPage() {
  path = mountPath(dom.pageHead);
  dom.pageMenuBtn.addEventListener("click", openPageMenu);
  dom.pageCrumb.addEventListener("click", (event) => {
    const page = ui.currentPage;
    const workspace = page && page.isWorkspace ? findWorkspace(page.workspaceId) : null;
    if (workspace && event.target.closest("[data-type-sheet]")) openTypeChangeSheet({ workspace });
  });
  initWorkspaceTitle();
  /* Das Cover endet an den Pillen eines Arbeitsbereichs; die Sammlungen haben keine */
  registerCover(el("view-page"), {
    title: dom.pageTitle,
    row: () => (ui.currentPage && ui.currentPage.isWorkspace ? dom.pageBody.querySelector(".page-pills-row") : null),
  });
  initArchive();
  initWorkspaceCollection();
  initCollectionPanel();
  /* Erst die Suchseite zeigen: dort ist die allgemeine Kopfzeile mit dem
     echten Suchfeld wieder da, und ein verstecktes Feld nimmt keinen Fokus an. */
  dom.pageSearchBtn.addEventListener("click", () => {
    showSearch();
    /* Tastatur nur, wenn sie beim Öffnen gleich kommen soll (App-Einstellungen) */
    if (searchKeyboardOn()) dom.searchInput.focus();
  });
  dom.content.addEventListener("scroll", updatePageHeadScroll, { passive: true });
  bindHeadTitle(dom.pageHead, dom.pageTitle, () => isViewActive("page"));

  dom.backBtn.addEventListener("click", (event) => {
    event.preventDefault();
    goBack();
  });

  on(events.viewOpened, (name) => {
    if (name !== "page") return;
    /* Jede neu geöffnete Unterseite startet oben, mit verborgener Suche und Optionen. */
    dom.content.scrollTop = 0;
    dom.pageHead.classList.remove("is-scrolled");
    renderPage();
  });
  on(events.dataChanged, () => {
    if (!isViewActive("page")) return;
    /* Nicht mitten ins Tippen hinein neu zeichnen: der Text ist schon gemerkt. */
    if (!isWritingNotes()) renderPageBody();
    renderWorkspaceCover();
  });
}
