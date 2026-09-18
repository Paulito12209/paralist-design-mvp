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
  deleteEntry,
  deleteWorkspace,
  selectTab,
  toggleFavorite,
} from "../data/mutations.js";
import { findEntry } from "../data/queries.js";
import { saveState, state } from "../data/state.js";
import { archiveEntry } from "../data/xp.js";
import { cancelHold, consumeClickBlock } from "./long-press.js";
import { openPlacesPicker } from "./pickers.js";
import { openEntry, openTarget } from "./router.js";
import { closeSwipes, isSwipedOpen } from "./swipe.js";
import { toggleGroup } from "./groups.js";

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

/* Der Wisch-Knopf einer Zeile: Favorit, Archivieren, Verknüpfen, Löschen. */
function handleSwipeAction(action) {
  const kind = action.dataset.swipe;
  const wrap = action.closest(".swipe");

  if (kind === "delete-workspace") {
    deleteWorkspace(wrap.dataset.workspace);
    return;
  }

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
  if (kind === "favorite") {
    toggleFavorite(entry);
    return;
  }
  openPlacesPicker(entry);
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

  const groupHead = event.target.closest("[data-toggle-group]");
  if (groupHead) {
    toggleGroup(groupHead);
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
  if (row.dataset.openEntry) openEntry(row.dataset.openEntry);
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
    }
  });
}
