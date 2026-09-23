/*
 * Die Unterseite hinter einer Übersichtskarte oder einem Arbeitsbereich:
 * Kopfzeile mit Zurück-Pfeil, darunter der große Titel und der Inhalt. Suche
 * und Optionen-Menü bleiben verborgen, bis man die Liste nach unten
 * scrollt — wie bei einer Playlist in Spotify. Ein Arbeitsbereich zeigt
 * dagegen wie eine Eintragsseite gleich mittig seine Kategorie und das Menü.
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
import { dom } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { load } from "../../core/lazy.js";
import {
  clearFavorites,
  deleteEntriesOf,
  deleteWorkspace,
  toggleFavorite,
} from "../../data/mutations.js";
import { workspaceDetails } from "../../data/details.js";
import { findWorkspace, inboxEntries, projectEntries } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { openDetails } from "../../ui/details.js";
import { bindHeadTitle, setHeadTitle } from "../../ui/head-title.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { goBack, restoreFrom, showSearch } from "../../ui/router.js";
import { emptyState } from "../../ui/empty-state.js";
import { entryRow, workspaceRow } from "../../ui/rows.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";
import { archiveMarkup } from "./archive.js";
import { isWritingNotes, renderWorkspacePage } from "./workspace-page.js";
import { beginRenameWorkspaceTitle, initWorkspaceTitle, setupWorkspaceTitle } from "./workspace-title.js";
import { commitStaleWorkspaceName, focusWorkspaceName } from "./workspaces.js";

/* Sammlungen: dort gibt es nichts zu löschen oder zu markieren, also kein Menü. */
const collectionsWithoutMenu = ["resources", "projects", "archive"];

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
 * nur, indem man eine vorhandene Zeile markiert.
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
  projects: {
    icon: "rocket",
    accent: "var(--prio-jetzt)",
    title: "Noch keine Projekte",
    text: "Ein Projekt bündelt Aufgaben, Notizen und Termine an einem Ort.",
    action: { label: "Projekt anlegen" },
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

/* Favoriten-Karte: erst die markierten Arbeitsbereiche, dann die markierten Einträge. */
function renderFavorites() {
  commitStaleWorkspaceName();
  const spaces = state.workspaces.filter((workspace) => workspace.favorite && !workspace.archived);
  const entries = state.entries.filter((entry) => entry.favorite && !entry.archived);
  const canEdit = isViewActive("page");

  dom.pageBody.innerHTML =
    spaces.length || entries.length
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
  else if (page.kind === "archive") dom.pageBody.innerHTML = archiveMarkup();
  else if (page.kind === "projects") dom.pageBody.innerHTML = listMarkup(projectEntries(), emptyStates.projects);
  else if (page.kind === "resources") load("resources").then((module) => module.renderResources());
  else if (page.isWorkspace) renderWorkspacePage(page);
  else dom.pageBody.innerHTML = listMarkup(inboxEntries(), emptyStates.inbox);
}

/* Suche und Optionen ein-/ausblenden, je nachdem wie weit die Liste gescrollt ist. */
function updatePageHeadScroll() {
  if (!isViewActive("page")) return;
  dom.pageHead.classList.toggle("is-scrolled", dom.content.scrollTop > HEADER_REVEAL_PX);
}

/** Kopfzeile und Inhalt der Unterseite aufbauen. */
function renderPage() {
  const page = ui.currentPage;
  if (!page) return;
  const jump = titleSwitches[page.kind];
  if (jump) {
    dom.pageTitle.innerHTML = `${escapeHtml(page.title)}<button class="title-switch" type="button" data-title-switch="${jump.target}">${jump.label}</button>`;
  } else {
    dom.pageTitle.textContent = page.title;
  }
  /* Auf einem Arbeitsbereich ist der Titel selbst das Namensfeld. */
  setupWorkspaceTitle(page);
  setHeadTitle(dom.pageHead, page.isWorkspace ? page.title : "", "Arbeitsbereich");
  dom.pageMenuBtn.hidden = collectionsWithoutMenu.includes(page.kind);
  /* Ein Arbeitsbereich sieht aus wie eine Eintragsseite: Kategorie und Menü
     stehen von Anfang an oben, statt nach dem Scrollen der Suche zu weichen. */
  dom.pageCrumb.hidden = !page.isWorkspace;
  dom.pageCrumb.textContent = page.isWorkspace ? WORKSPACE_CRUMB : "";
  dom.pageHead.classList.toggle("is-pinned", Boolean(page.isWorkspace));
  renderPageBody();
}

/* Das Seitenmenü hängt davon ab, was die Seite ist. */
function openPageMenu() {
  const page = ui.currentPage;
  if (!page) return;

  if (page.kind === "favorites") {
    openSheet(page.title, [
      { label: "Alle Favoriten entfernen", icon: "star-outline", onSelect: clearFavorites },
    ]);
    return;
  }

  const options = [];
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
  }

  options.push({
    label: "Alle Einträge löschen",
    icon: "trash",
    danger: true,
    onSelect: () => deleteEntriesOf(page.parent),
  });

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
  dom.pageMenuBtn.addEventListener("click", openPageMenu);
  initWorkspaceTitle();
  /* Erst die Suchseite zeigen: dort ist die allgemeine Kopfzeile mit dem
     echten Suchfeld wieder da, und ein verstecktes Feld nimmt keinen Fokus an. */
  dom.pageSearchBtn.addEventListener("click", () => {
    showSearch();
    dom.searchInput.focus();
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
    /* Nicht mitten ins Tippen hinein neu zeichnen: der Text ist schon gemerkt. */
    if (isViewActive("page") && !isWritingNotes()) renderPageBody();
  });
}
