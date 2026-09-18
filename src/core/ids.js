/*
 * Vergleiche und neue Nummern für Tabs, Arbeitsbereiche und Einträge.
 * IDs kommen teils als Zahl, teils als Text aus dem Speicher oder aus
 * `data-`Attributen — deshalb wird immer über Text verglichen.
 * Pfad: src/core/ids.js
 *
 * Keine anpassbaren visuellen Werte.
 */

/** Zeigen zwei Ablageort-Angaben auf denselben Ort? `null` und "" gelten als Inbox. */
export function sameParent(a, b) {
  return String(a ?? "") === String(b ?? "");
}

/** Zeigen zwei IDs auf dasselbe Element, auch wenn eine davon Text ist? */
export function sameId(a, b) {
  return String(a) === String(b);
}

/** Nächste freie Nummer in einer Liste mit `id`-Feld. */
export function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}
