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
  moveWorkspaceToTab,
  restoreFromArchive,
  selectTab,
  toggleFavorite,
} from "../data/mutations.js";
import { findEntry, findWorkspace, tabLabel } from "../data/queries.js";
import { saveState, state } from "../data/state.js";
import { archiveEntry } from "../data/xp.js";
import { openCtxMenu } from "./ctx-menu.js";
import { openEntryCtxMenu } from "./entry-menu.js";
import { cancelHold, consumeClickBlock } from "./long-press.js";
import { openLinkPicker } from "./pickers.js";
import { openArchive, openEntryOrFile, openTarget, showTab } from "./router.js";
import { closeSwipes, isSwipedOpen } from "./swipe.js";
import { showToast } from "./toast.js";
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

/* Auswahl der Tabs neben dem Verschieben-Knopf. Der eigene Tab trägt den
   Haken, damit man sieht, wo der Arbeitsbereich gerade liegt. Danach ist er
   aus der Liste verschwunden — die Meldung sagt wohin und springt auf Wunsch mit. */
function openMoveWorkspaceMenu(anchor, workspace) {
  openCtxMenu(
    anchor,
    state.tabs.map((tab) => ({
      label: tabLabel(tab),
      icon: "folder",
      active: sameId(tab.id, workspace.tab),
      onSelect: () => {
        if (sameId(tab.id, workspace.tab)) return;
        moveWorkspaceToTab(workspace, tab.id);
        showToast({
          icon: "folder-move",
          title: `Nach „${tabLabel(tab)}“ verschoben`,
          accent: "var(--move-color)",
          action: { label: "Zeigen", onSelect: () => selectTab(tab.id) },
        });
      },
    }))
  );
}

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

/* Der Wisch-Knopf einer Zeile — links Favorit und Verknüpfen (beim
   Arbeitsbereich: in einen anderen Tab), rechts Archivieren
   und Löschen. Welcher es ist, sagt data-swipe, nicht die Seite. */
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
  openLinkPicker(entry);
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

  /* Der runde Haken vor einer Aufgabe — in jeder Liste und auf der Seite der
     Aufgabe selbst. Eine aufgewischte Zeile schiebt sich dabei erst zu. */
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

  if (event.target.closest("[data-open-archive]")) {
    openArchive();
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
    state.prefs.resources.filter = resourcePill.dataset.resourceFilter;
    saveState();
    load("resources").then((module) => module.renderResources());
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

  const row = event.target.closest("[data-open-entry], [data-open-workspace]");
  if (!row) return;
  /* Eine aufgewischte Zeile schiebt sich beim Antippen erst wieder zu */
  if (isSwipedOpen(row)) {
    closeSwipes();
    return;
  }
  /* Ein Medium geht als Datei auf, nicht als Seite — man will das Foto sehen. */
  if (row.dataset.openEntry) openEntryOrFile(row.dataset.openEntry);
  else openTarget("workspace", row.dataset.openWorkspace);
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
    if (workspaceBtn) {
      event.preventDefault();
      cancelHold();
      menus.openWorkspaceMenu(workspaceBtn);
      return;
    }
    const entryBtn = event.target.closest(".entry-row[data-open-entry]");
    if (entryBtn) {
      event.preventDefault();
      cancelHold();
      openEntryCtxMenu(entryBtn);
    }
  });
}
