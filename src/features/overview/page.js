/*
 * Die Unterseite hinter einer Übersichtskarte oder einem Arbeitsbereich:
 * Kopfzeile mit Titel, darunter die Liste, oben rechts das Seitenmenü.
 * Pfad: src/features/overview/page.js
 *
 * Keine anpassbaren visuellen Werte: Kopfzeile und Liste stehen in
 * styles/rows.css (Klassen .page-head, .page-body).
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { sameParent } from "../../core/ids.js";
import { load } from "../../core/lazy.js";
import {
  clearFavorites,
  deleteEntriesOf,
  deleteWorkspace,
  toggleFavorite,
} from "../../data/mutations.js";
import { entriesOf, findWorkspace } from "../../data/queries.js";
import { saveState, state, ui } from "../../data/state.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { restoreFrom } from "../../ui/router.js";
import { entryRow, workspaceRow } from "../../ui/rows.js";
import { openSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";
import { focusWorkspaceName } from "./workspaces.js";

/* Favoriten-Karte: erst die markierten Arbeitsbereiche, dann die markierten Einträge. */
function renderFavorites() {
  const spaces = state.workspaces.filter((workspace) => workspace.favorite);
  const entries = state.entries.filter((entry) => entry.favorite && !entry.archived);
  const canEdit = isViewActive("page");

  dom.pageBody.innerHTML =
    spaces.length || entries.length
      ? `<div class="workspace-list">${spaces
          .map((workspace) => workspaceRow(workspace, canEdit))
          .join("")}${entries.map((entry) => entryRow(entry)).join("")}</div>`
      : `<p class="empty-note">Noch keine Favoriten.</p>`;

  if (canEdit) focusWorkspaceName();
}

/** Den Inhalt der offenen Unterseite zeichnen. */
export function renderPageBody() {
  const page = ui.currentPage;
  if (!page) return;

  if (page.kind === "favorites") {
    renderFavorites();
    return;
  }
  if (page.kind === "resources") {
    load("resources").then((module) => module.renderResources());
    return;
  }

  const list = entriesOf(page.parent);
  dom.pageBody.innerHTML = list.length
    ? `<div class="workspace-list">${list.map((entry) => entryRow(entry)).join("")}</div>`
    : `<p class="empty-note">Noch keine Einträge.</p>`;
}

/** Kopfzeile und Liste der Unterseite aufbauen. */
function renderPage() {
  const page = ui.currentPage;
  if (!page) return;
  dom.pageTitle.textContent = page.title;
  /* Ressourcen sind nur eine Sammlung: dort gibt es nichts zu löschen oder zu markieren. */
  dom.pageMenuBtn.hidden = page.kind === "resources";
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
  const workspace = page.isWorkspace
    ? state.workspaces.find((item) => sameParent(item.id, page.parent))
    : null;

  if (workspace) {
    options.push({
      label: workspace.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: workspace.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(workspace),
    });
    options.push(
      iconPickerAction(workspace.icon, (name) => {
        workspace.icon = name;
        saveState();
        renderPage();
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

/** Seitenmenü, Zurück-Pfeil und Auffrischen anmelden. */
export function initPage() {
  dom.pageMenuBtn.addEventListener("click", openPageMenu);

  dom.backBtn.addEventListener("click", (event) => {
    event.preventDefault();
    restoreFrom(ui.sourceView);
  });

  on(events.viewOpened, (name) => {
    if (name === "page") renderPage();
  });
  on(events.dataChanged, () => {
    if (isViewActive("page")) renderPageBody();
  });
}
