/*
 * Der Platzhalter, wenn die Filter einer Sammlung alles ausblenden: statt
 * einer leeren Seite ein Satz, dass nichts passt, und eine Pille „Filter
 * zurücksetzen“. Die Pille trägt data-collection-reset; den Tipp behandelt
 * src/features/overview/collection-panel.js.
 * Pfad: src/ui/filter-empty.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * noMatch -> Emblem, Farbe, Überschrift, Satz und Pille des Platzhalters
 *
 * Aussehen: styles/empty-state.css.
 */

import { emptyState } from "./empty-state.js";

const noMatch = {
  icon: "sliders",
  accent: "var(--muted)",
  title: "Kein Eintrag passt zu den Filtern",
  text: "Lockere einen Filter in der Karte „Ansicht“ oder setz alle zurück.",
  action: { label: "Filter zurücksetzen", icon: "close" },
  data: 'data-collection-reset="1"',
};

/** Der Platzhalter als HTML. */
export function filterEmptyState() {
  return emptyState(noMatch);
}
