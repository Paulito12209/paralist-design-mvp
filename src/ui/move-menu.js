/*
 * Einen Arbeitsbereich unter einen anderen Tab legen: die kleine Auswahl der
 * Tabs, erreichbar über den violetten Wisch-Knopf und über das Menü beim
 * gedrückt Halten. Beide Wege teilen sich diese Datei, damit sie gleich bleiben.
 * Pfad: src/ui/move-menu.js
 *
 * Keine anpassbaren visuellen Werte: die Farbe des Knopfes und des Icons in
 * der Meldung ist --move-color (styles/tokens.css).
 */

import { sameId } from "../core/ids.js";
import { moveWorkspaceToTab, selectTab } from "../data/mutations.js";
import { tabLabel } from "../data/queries.js";
import { state } from "../data/state.js";
import { openCtxMenu } from "./ctx-menu.js";
import { showToast } from "./toast.js";

/* Nur mit mindestens zwei Tabs gibt es ein Ziel. */
export function canMoveWorkspace() {
  return state.tabs.length > 1;
}

/**
 * Auswahl der Tabs neben `anchor`. Der eigene Tab trägt den Haken, damit man
 * sieht, wo der Arbeitsbereich gerade liegt. Danach ist er aus der Liste
 * verschwunden — die Meldung sagt wohin und springt auf Wunsch mit.
 */
export function openMoveWorkspaceMenu(anchor, workspace) {
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

/** Der Menüpunkt dazu; `null`, solange es nur einen Tab gibt. */
export function moveWorkspaceAction(anchor, workspace) {
  if (!canMoveWorkspace()) return null;
  return {
    label: "In anderen Tab verschieben",
    icon: "folder-move",
    onSelect: () => openMoveWorkspaceMenu(anchor, workspace),
  };
}
