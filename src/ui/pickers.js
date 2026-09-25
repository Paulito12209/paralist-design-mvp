/*
 * Drei Auswahl-Blätter, die an mehreren Stellen gebraucht werden:
 * einen Ablageort wählen (Eingabefeld), auf der Seite eines Eintrags
 * verknüpfen, und ein Icon wählen.
 * Pfad: src/ui/pickers.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/overlays.css.
 */

import { dom } from "../core/dom.js";
import { sameParent } from "../core/ids.js";
import { presetIcons, typeIcon, typeLabel } from "../data/config.js";
import { canLink, isLinked, linkOptionsFor } from "../data/links.js";
import { clearPlaces, togglePlace, toggleLink } from "../data/mutations.js";
import { hasPlace, placeOptionsFor } from "../data/queries.js";
import { entryRef } from "../data/refs.js";
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

/* Die Ablageorte im oberen Abschnitt: „Eingang” nimmt alle Orte weg. */
function placeOptions(entry, render) {
  const places = entry.places || [];
  return placeOptionsFor(entry).map((option) => ({
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
}

/*
 * Die Einträge im unteren Abschnitt. Für einen gewöhnlichen Eintrag ist das
 * die beidseitige Verknüpfung. Auf der Seite eines Projekts bedeutet dasselbe
 * Anhaken das Umgekehrte: ein Projekt lässt sich nicht verknüpfen, es nimmt
 * auf — die angehakte Aufgabe bekommt dieses Projekt als Ablageort.
 */
function entryOptions(entry, render) {
  const takesIn = !canLink(entry);
  return linkOptionsFor(entry).map((other) => ({
    label: other.title || typeLabel(other.type),
    icon: typeIcon(other.type),
    active: takesIn ? hasPlace(other, entryRef(entry.id)) : isLinked(entry, other),
    stay: true,
    onSelect: () => {
      if (takesIn) togglePlace(other, entryRef(entry.id));
      else toggleLink(entry, other);
      render();
    },
  }));
}

/**
 * „Verknüpfen mit” auf der Seite eines Eintrags: ein Blatt, zwei Abschnitte.
 * Oben der Ablageort — wo der Eintrag liegt, Eingang, Arbeitsbereich oder
 * Projekt. Unten die Einträge, mit denen er verbunden ist; diese Verbindung
 * gilt in beide Richtungen (src/data/links.js).
 *
 * Das Blatt bleibt beim Antippen offen, damit man mehreres nacheinander an-
 * und abwählen kann. Wie weit die Liste gescrollt ist, wird dabei gemerkt:
 * sonst spränge sie bei jedem Haken zurück nach oben.
 */
export function openLinkPicker(entry) {
  const render = () => {
    const scrolled = dom.sheet.hidden ? 0 : dom.sheetOptions.scrollTop;
    const takesIn = !canLink(entry);
    const entries = entryOptions(entry, render);
    const options = [{ heading: true, label: "Ablageort" }, ...placeOptions(entry, render)];

    if (entries.length) {
      options.push({ heading: true, label: takesIn ? "Einträge aufnehmen" : "Einträge" });
      options.push(...entries);
    }

    options.push({ label: "Fertig", icon: "check", split: true, onSelect: () => {} });
    openSheet("Verknüpfen mit", options);
    dom.sheetOptions.scrollTop = scrolled;
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
