/*
 * Ein Klick-Empfänger für alle Listen. Statt an jeder Zeile einen eigenen
 * Zuhörer zu haben, hört dieser einmal auf dem ganzen Inhaltsbereich und
 * entscheidet nach dem `data-`Attribut, was gemeint war. Das bleibt auch bei
 * hunderten Zeilen schnell.
 * Pfad: src/ui/list-clicks.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { emit, events } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { sameId } from "../core/ids.js";
import {
  addTab,
  addWorkspace,
  archiveWorkspace,
  deleteEntry,
  deleteWorkspace,
  restoreFromArchive,
  selectTab,
  toggleFavorite,
} from "../data/mutations.js";
import { findEntry, findWorkspace } from "../data/queries.js";
import { state } from "../data/state.js";
import { archiveEntry } from "../data/xp.js";
import { openEntryCtxMenu } from "./entry-menu.js";
import { cancelHold, consumeClickBlock } from "./long-press.js";
import { openMoveWorkspaceMenu } from "./move-menu.js";
import { openLinkSheet } from "./link-sheet.js";
import {
  openArchive,
  openBookmarks,
  openEntryOrFile,
  openProjectsPage,
  openTarget,
  openWorkspacesPage,
  showTab,
} from "./router.js";
import { hasRowMore } from "./rows.js";
import { closeSwipes, isSwipedOpen } from "./swipe.js";
import { toggleGroup } from "./groups.js";
import { toggleTaskFromCheck } from "./task-status.js";

/*
 * Umbenennen und die beiden Kontextmenüs gehören zu den Seiten, nicht hierher.
 * src/main.js gibt sie beim Start herein — so muss diese Datei keinen Bereich
 * kennen und die Importe zeigen weiter nur nach unten.
 */
let menus = {
  openTabMenu: () => {},
  openWorkspaceMenu: () => {},
  beginRenameTab: () => {},
  /* übernimmt ein noch offenes Namensfeld eines Arbeitsbereichs */
  finishWorkspaceName: () => {},
};

/* Die Knöpfe einer Arbeitsbereichs-Zeile. Sie stehen getrennt, weil ein
   Arbeitsbereich kein Eintrag ist und deshalb nicht in findEntry() auftaucht. */
function handleWorkspaceAction(kind, id, button) {
  if (kind === "delete-workspace") {
    deleteWorkspace(id);
    return true;
  }
  if (kind === "archive-workspace") {
    archiveWorkspace(id);
    return true;
  }
  if (kind === "favorite-workspace" || kind === "restore-workspace" || kind === "move-workspace") {
    const workspace = findWorkspace(id);
    if (!workspace) return true;
    if (kind === "move-workspace") openMoveWorkspaceMenu(button, workspace);
    else if (kind === "favorite-workspace") toggleFavorite(workspace);
    else restoreFromArchive(workspace);
    return true;
  }
  return false;
}

/* Der Wisch-Knopf einer Zeile — links Verknüpfen und Favorit bzw. bei einer
   Aufgabe Abhaken (beim Arbeitsbereich: Favorit und in einen anderen Tab),
   rechts Archivieren und Löschen. Welcher es ist, sagt data-swipe, nicht die Seite. */
function handleSwipeAction(action) {
  const kind = action.dataset.swipe;
  const wrap = action.closest(".swipe");

  if (handleWorkspaceAction(kind, wrap.dataset.workspace, action)) return;

  const entry = findEntry(wrap.dataset.entry);
  if (!entry) return;

  if (kind === "delete") {
    deleteEntry(entry.id);
    return;
  }
  if (kind === "archive") {
    archiveEntry(entry);
    emit(events.dataChanged);
    return;
  }
  if (kind === "restore") {
    restoreFromArchive(entry);
    return;
  }
  if (kind === "favorite") {
    toggleFavorite(entry);
    return;
  }
  if (kind === "done") {
    toggleTaskFromCheck(entry.id);
    return;
  }
  openLinkSheet(entry);
}

/* Favorit einer Zeile umschalten — Eintrag oder Arbeitsbereich, je nach Zeile. */
function toggleRowFavorite(row) {
  const item = row.dataset.openEntry ? findEntry(row.dataset.openEntry) : findWorkspace(row.dataset.openWorkspace);
  if (item) toggleFavorite(item);
}

/* Eine Tab-Pille: der aktive Tab öffnet das Umbenennen, ein anderer wird gewählt. */
function handleTabPill(pill) {
  const id = Number(pill.dataset.tabId);
  if (sameId(id, state.activeTabId)) menus.beginRenameTab(id);
  else selectTab(id);
}

function onClick(event) {
  /* Ein Tipp irgendwohin außer ins Namensfeld selbst übernimmt den Namen —
     so bekommt ein neuer Arbeitsbereich seinen Vorgabenamen, sobald man weitermacht. */
  if (!event.target.closest("#workspace-name-input")) menus.finishWorkspaceName();

  const action = event.target.closest(".swipe-action");
  if (action) {
    handleSwipeAction(action);
    return;
  }

  /* Der runde Haken vor einer Aufgabe — nur noch auf der Aufgaben-Seite
     (Liste und Board). Eine aufgewischte Zeile schiebt sich dabei erst zu. */
  const check = event.target.closest("[data-task-done]");
  if (check) {
    if (isSwipedOpen(check)) closeSwipes();
    else toggleTaskFromCheck(check.dataset.taskDone);
    return;
  }

  const groupHead = event.target.closest("[data-toggle-group]");
  if (groupHead) {
    toggleGroup(groupHead);
    return;
  }

  /* Die Pille im Platzhalter einer leeren Liste: Eingabefeld mit passendem Typ. */
  const emptyAdd = event.target.closest("[data-empty-add]");
  if (emptyAdd) {
    emit(events.createRequested, emptyAdd.dataset.emptyAdd);
    return;
  }

  const overviewCard = event.target.closest("[data-open-overview]");
  if (overviewCard) {
    openTarget("overview", overviewCard.dataset.openOverview);
    return;
  }

  if (event.target.closest("[data-add-workspace]")) {
    addWorkspace();
    return;
  }

  /* Der Wert sagt, welche Pille im Archiv gewählt ist: „Zum Archiv“ unter
     den Arbeitsbereichen öffnet deren Pille, die Karte „Alle“. */
  const archiveBtn = event.target.closest("[data-open-archive]");
  if (archiveBtn) {
    openArchive(archiveBtn.dataset.openArchive);
    return;
  }

  if (event.target.closest("[data-open-bookmarks]")) {
    openBookmarks();
    return;
  }

  /* Pfeil neben „Arbeitsbereiche“: die Seite zeigt den gewählten Tab. */
  if (event.target.closest("[data-open-workspaces]")) {
    openWorkspacesPage();
    return;
  }

  /* „Projekte ↗“ auf der Übersicht: die Seite zeigt die gewählte Ansicht. */
  if (event.target.closest("[data-open-projects]")) {
    openProjectsPage();
    return;
  }

  /* Der graue Zweittitel: „Medien“ neben „Ressourcen“ und umgekehrt. */
  const titleSwitch = event.target.closest("[data-title-switch]");
  if (titleSwitch) {
    const target = titleSwitch.dataset.titleSwitch;
    if (target === "resources") openTarget("overview", "4");
    else showTab(target);
    return;
  }

  const resourcePill = event.target.closest("[data-resource-filter]");
  if (resourcePill) {
    const id = resourcePill.dataset.resourceFilter;
    load("resources").then((module) => module.selectResourceFilter(id));
    return;
  }

  const tabPill = event.target.closest("[data-tab-id]");
  if (tabPill) {
    handleTabPill(tabPill);
    return;
  }

  if (event.target.closest("[data-tab-add]")) {
    addTab();
    return;
  }

  /* Die drei Punkte rechts (Android): dasselbe Menü, das sonst beim gedrückt Halten aufging,
     direkt unter den Punkten. */
  const more = event.target.closest("[data-row-more]");
  if (more) {
    if (isSwipedOpen(more)) closeSwipes();
    else openRowMenu(more.closest("[data-open-entry], [data-open-workspace]"), more);
    return;
  }

  /* Das Icon vor dem Titel schaltet Favorit um, statt die Zeile zu öffnen. */
  const glyph = event.target.closest("[data-fav-toggle]");
  if (glyph) {
    if (isSwipedOpen(glyph)) closeSwipes();
    else toggleRowFavorite(glyph.closest("[data-open-entry], [data-open-workspace]"));
    return;
  }

  const row = event.target.closest("[data-open-entry], [data-open-workspace]");
  if (!row) return;
  /* Eine aufgewischte Zeile schiebt sich beim Antippen erst wieder zu */
  if (isSwipedOpen(row)) {
    closeSwipes();
    return;
  }
  /* Ein Medium geht als Datei auf, nicht als Seite — man will das Foto sehen. */
  if (row.dataset.openEntry) openEntryOrFile(row.dataset.openEntry, linkedMediaIds(row));
  else openTarget("workspace", row.dataset.openWorkspace);
}

/* Das Menü einer Eintrags- oder Arbeitsbereichs-Zeile, am Anker geöffnet. */
function openRowMenu(row, anchor) {
  if (!row) return;
  if (row.dataset.openEntry) openEntryCtxMenu(row, anchor);
  else menus.openWorkspaceMenu(row, anchor);
}

/* Eine Kachel unter „Verknüpfte Einträge“: die Dateiansicht blättert nur durch
   die Medien desselben Eintrags (alle Kachelreihen der Gruppe „Medien“), nicht
   durch alle Medien der App. Eine Zeile ohne solche Gruppe blättert nicht. */
function linkedMediaIds(row) {
  const group = row.closest(".media-kinds");
  if (!group) return null;
  return [...group.querySelectorAll(".media-cell[data-open-entry]")].map((cell) => cell.dataset.openEntry);
}

/**
 * Klicks und Rechtsklicks in den Listen aktivieren. Wird einmal beim Start aufgerufen.
 * @param handlers { openTabMenu, openWorkspaceMenu, beginRenameTab, finishWorkspaceName } aus den Seiten.
 */
export function initListClicks(handlers) {
  menus = { ...menus, ...handlers };

  const { content } = dom;

  /* Nach einem gedrückt Halten kommt noch ein Klick: der darf nichts öffnen. */
  content.addEventListener(
    "click",
    (event) => {
      if (!consumeClickBlock()) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  content.addEventListener("click", onClick);

  /* Rechtsklick mit der Maus öffnet dasselbe Menü wie das gedrückt Halten. */
  content.addEventListener("contextmenu", (event) => {
    const tabPill = event.target.closest("[data-tab-id]");
    if (tabPill) {
      event.preventDefault();
      cancelHold();
      menus.openTabMenu(tabPill);
      return;
    }
    const workspaceBtn = event.target.closest("[data-open-workspace]");
    /* Zeilen mit drei Punkten (Android): gedrückt Halten verschiebt, das Menü liegt hinter den Punkten.
       Auch am Handy löst langes Drücken dieses Ereignis aus — es darf das Menü nicht trotzdem öffnen,
       und das Halten läuft weiter, damit die Zeile sich gleich anhebt. */
    if (hasRowMore(workspaceBtn || event.target.closest("[data-open-entry]"))) {
      event.preventDefault();
      return;
    }
    if (workspaceBtn) {
      event.preventDefault();
      cancelHold();
      menus.openWorkspaceMenu(workspaceBtn);
      return;
    }
    const entryBtn = event.target.closest(".entry-row[data-open-entry], .bookmark-row[data-bookmark-own], [data-board-row]");
    if (entryBtn && !event.target.closest("[data-grip]")) {
      event.preventDefault();
      cancelHold();
      openEntryCtxMenu(entryBtn);
    }
  });
}
