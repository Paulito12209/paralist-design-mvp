/*
 * Zwei Auswahl-Blätter, die an mehreren Stellen gebraucht werden:
 * Ablageort wählen und Icon wählen.
 * Pfad: src/ui/pickers.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/overlays.css.
 */

import { sameParent } from "../core/ids.js";
import { overviewPages, presetIcons } from "../data/config.js";
import { state } from "../data/state.js";
import { workspaceIcon } from "../data/queries.js";
import { openSheet } from "./sheet.js";

/**
 * „Ablegen in“ / „Verknüpfen mit“: alle Übersichtskarten, die ein echter
 * Ablageort sind, und alle Arbeitsbereiche.
 */
export function openParentPicker(title, current, onPick) {
  const pages = Object.values(overviewPages)
    /* Sammlungen wie Favoriten und Ressourcen sind kein Ablageort */
    .filter((page) => !page.kind)
    .map((page) => ({
      label: page.title,
      icon: page.icon || "placeholder",
      active: sameParent(current, page.parent),
      onSelect: () => onPick(page.parent),
    }));

  const workspaces = state.workspaces.map((workspace) => ({
    label: workspace.name,
    icon: workspaceIcon(workspace),
    active: sameParent(current, workspace.id),
    onSelect: () => onPick(workspace.id),
  }));

  openSheet(title, [...pages, ...workspaces]);
}

/** „Icon wählen“ für Tabs und Arbeitsbereiche. Ein leerer Name entfernt das Icon. */
export function openIconPicker(current, onPick) {
  const options = presetIcons.map((item) => ({
    label: item.label,
    icon: item.id,
    active: current === item.id,
    onSelect: () => onPick(item.id),
  }));
  if (current) {
    options.push({ label: "Icon entfernen", icon: "close", split: true, onSelect: () => onPick("") });
  }
  openSheet("Icon wählen", options);
}

/** Die Menü-Option, die den Icon-Wähler öffnet. */
export function iconPickerAction(current, apply) {
  return {
    label: current ? "Icon bearbeiten" : "Icon hinzufügen",
    icon: current || "smile",
    onSelect: () => openIconPicker(current, apply),
  };
}
