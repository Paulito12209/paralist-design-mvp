/*
 * Zwei Auswahl-Blätter, die an mehreren Stellen gebraucht werden:
 * Ablageort wählen und Icon wählen.
 * Pfad: src/ui/pickers.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/overlays.css.
 */

import { sameParent } from "../core/ids.js";
import { presetIcons } from "../data/config.js";
import { parentOptionsFor } from "../data/queries.js";
import { openSheet } from "./sheet.js";

/**
 * „Ablegen in“ / „Verknüpfen mit“: Inbox, jeder Arbeitsbereich, jedes Projekt.
 * @param entry der Eintrag, um den es geht — ein Projekt bekommt keine Projekte angeboten.
 */
export function openParentPicker(title, current, onPick, entry = null) {
  openSheet(
    title,
    parentOptionsFor(entry).map((option) => ({
      label: option.label,
      icon: option.icon,
      active: sameParent(current, option.ref),
      onSelect: () => onPick(option.ref),
    }))
  );
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
