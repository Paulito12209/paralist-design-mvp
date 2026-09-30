/*
 * Das Blatt „Sortieren“ nach dem Muster von Google Drive: oben „Sortieren
 * nach“ mit einem Haken an der gewählten Option, darunter
 * „Sortierungsrichtung“ mit zwei Zeilen, deren Wortlaut die Option selbst
 * liefert — „A bis Z“ / „Z bis A“, „Neueste zuerst“ / „Älteste zuerst“.
 * Jede Option hat beide Richtungen. Das Blatt bleibt offen, bis man es
 * zuzieht oder daneben tippt; jede Wahl zeichnet es mit dem neuen Stand neu.
 * Einen eigenen Titel hat das Blatt nicht — „Sortieren nach“ sagt schon alles,
 * ein „Sortieren“ darüber wäre doppelt.
 *
 * Eine Option ist { id, label, icon, up, down, asc }: `up` ist der Wortlaut
 * für aufsteigend, `down` für absteigend, `asc` die natürliche Richtung —
 * die gilt, sobald man zu dieser Option wechselt, und steht oben.
 * Pfad: src/ui/sort-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * byHeading / dirHeading -> die beiden Zwischenüberschriften im Blatt
 * upIcon / downIcon      -> Icon vor der aufsteigenden bzw. absteigenden Richtung
 *
 * Aussehen: styles/overlays.css (Klassen .sheet-heading, .sheet-option).
 */

import { openSheet } from "./sheet.js";

const byHeading = "Sortieren nach";
const dirHeading = "Sortierungsrichtung";
const upIcon = "arrow-up";
const downIcon = "arrow-down";

/* Die gewählte Option; eine unbekannte (alter Speicherstand) gilt als die erste. */
function optionOf(options, sort) {
  return options.find((option) => option.id === sort) || options[0];
}

/** Kurzform für die Zeile in einer Karte: „Name · A bis Z“. */
export function sortSummary(options, sort, asc) {
  const option = optionOf(options, sort);
  return `${option.label} · ${asc ? option.up : option.down}`;
}

/**
 * Das Blatt öffnen.
 * @param options  die Optionen wie oben beschrieben
 * @param sort     id der gewählten Option
 * @param asc      true = aufsteigend
 * @param onChange (sort, asc) — speichert die Wahl; das Blatt zeichnet sich danach selbst neu
 */
export function openSortSheet({ options, sort, asc, onChange }) {
  const current = optionOf(options, sort);
  const choose = (nextSort, nextAsc) => {
    onChange(nextSort, nextAsc);
    openSortSheet({ options, sort: nextSort, asc: nextAsc, onChange });
  };

  const byRows = options.map((option) => ({
    label: option.label,
    icon: option.icon,
    active: option.id === current.id,
    stay: true,
    /* Beim Wechsel gilt die natürliche Richtung der neuen Option: Namen von A,
       Daten vom neuesten an — wie in Google Drive. */
    onSelect: () => choose(option.id, option.id === current.id ? asc : option.asc ?? asc),
  }));

  const natural = current.asc ?? true;
  const dirRows = [natural, !natural].map((dirAsc) => ({
    label: dirAsc ? current.up : current.down,
    icon: dirAsc ? upIcon : downIcon,
    active: dirAsc === asc,
    stay: true,
    onSelect: () => choose(current.id, dirAsc),
  }));

  openSheet("", [
    { heading: true, label: byHeading },
    ...byRows,
    { heading: true, label: dirHeading },
    ...dirRows,
  ]);
}
