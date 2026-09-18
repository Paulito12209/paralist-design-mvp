/*
 * Drei Auswahl-Blätter, die an mehreren Stellen gebraucht werden:
 * einen Ablageort wählen (Eingabefeld), die Orte eines Eintrags an- und
 * abwählen (Verknüpfen), und ein Icon wählen.
 * Pfad: src/ui/pickers.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/overlays.css.
 */

import { sameParent } from "../core/ids.js";
import { presetIcons } from "../data/config.js";
import { clearPlaces, togglePlace } from "../data/mutations.js";
import { placeOptionsFor } from "../data/queries.js";
import { openSheet } from "./sheet.js";

/** „Ablegen in“ für das Eingabefeld: genau ein Ort, das Blatt schließt beim Antippen. */
export function openPlacePicker(title, current, onPick) {
  openSheet(
    title,
    placeOptionsFor().map((option) => ({
      label: option.label,
      icon: option.icon,
      active: sameParent(current, option.ref),
      onSelect: () => onPick(option.ref),
    }))
  );
}

/**
 * „Verknüpfen mit“ für einen Eintrag: jeder Ort lässt sich an- und abwählen,
 * das Blatt bleibt dabei offen. „Inbox“ nimmt alle Orte weg. Ein Projekt
 * bekommt nur Arbeitsbereiche angeboten, nie andere Projekte.
 */
export function openPlacesPicker(entry) {
  const render = () => {
    const places = entry.places || [];
    const options = placeOptionsFor(entry).map((option) => ({
      label: option.label,
      icon: option.icon,
      active: option.ref === null ? places.length === 0 : places.includes(option.ref),
      stay: true,
      onSelect: () => {
        if (option.ref === null) clearPlaces(entry);
        else togglePlace(entry, option.ref);
        render();
      },
    }));
    options.push({ label: "Fertig", icon: "check", split: true, onSelect: () => {} });
    openSheet("Verknüpfen mit", options);
  };
  render();
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
