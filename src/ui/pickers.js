/*
 * Zwei Auswahl-Blätter, die an mehreren Stellen gebraucht werden: einen
 * Ablageort wählen (Eingabefeld) und ein Icon wählen. Das Verknüpfen eines
 * Eintrags hat sein eigenes Blatt mit Tabs (src/ui/link-sheet.js).
 * Pfad: src/ui/pickers.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/overlays.css.
 */

import { sameParent } from "../core/ids.js";
import { iconGroups } from "../data/icon-sets.js";
import { placeOptionsFor } from "../data/queries.js";
import { openSheet } from "./sheet.js";

/**
 * „Ablegen in“ für das Eingabefeld: genau ein Ort, das Blatt schließt beim
 * Antippen.
 * @param draftType Typ des Entwurfs. Ein Projekt bekommt so nur
 *   Arbeitsbereiche angeboten — ein Projekt in einem Projekt gibt es nicht.
 * @param lead optional eine Option ganz oben, abgesetzt über den Orten — das
 *   Eingabefeld bietet dort den Eintrag an, von dessen Seite es kommt. Ist
 *   sie gewählt (`active`), leuchtet darunter kein Ort: gewählt ist dann der
 *   Eintrag, nicht sein Ort.
 */
export function openPlacePicker(title, current, onPick, draftType = null, lead = null) {
  const places = placeOptionsFor(draftType ? { type: draftType } : null).map((option, index) => ({
    label: option.label,
    icon: option.icon,
    active: !lead?.active && sameParent(current, option.ref),
    /* Trennlinie zwischen dem Eintrag oben und den Orten */
    split: Boolean(lead) && index === 0,
    onSelect: () => onPick(option.ref),
  }));
  openSheet(title, lead ? [lead, ...places] : places);
}

/**
 * „Icon wählen“ für Einträge, Tabs und Arbeitsbereiche: die Gruppen aus
 * src/data/icon-sets.js als Kachel-Raster mit Überschrift; das gewählte Icon
 * ist hervorgehoben. Ein leerer Name entfernt das Icon.
 */
export function openIconPicker(current, onPick) {
  const options = iconGroups.flatMap((group) => [
    { heading: true, label: group.label },
    ...group.icons.map((item) => ({
      label: item.label,
      icon: item.id,
      tile: true,
      active: current === item.id,
      onSelect: () => onPick(item.id),
    })),
  ]);
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
