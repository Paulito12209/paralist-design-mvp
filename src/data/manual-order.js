/*
 * Die eigene Reihenfolge einer Liste — das, was beim Verschieben einer Zeile
 * entsteht (src/ui/row-reorder.js). Jede Liste hat einen Schlüssel („Scope“):
 * eine Sammlung heißt wie ihre Art („inbox“, „favorites“, „resources“,
 * „workspaces“), eine Gruppe im Arbeitsbereich oder Projekt „g:“ plus ihr
 * Gruppenschlüssel. Gemerkt wird je Scope die Liste der Zeilen-Ids,
 * z.B. { inbox: ["e:12", "e:3", "w:2"] } — „e:“ für Einträge, „w:“ für
 * Arbeitsbereiche, damit gleiche Zahlen nicht verwechselt werden.
 *
 * Wer in einer Sammlung „Eigene Reihenfolge“ gewählt hat, sortiert danach
 * (src/data/collection-sorts.js); Gruppen im Arbeitsbereich folgen ihr immer,
 * sobald eine gemerkt ist. Pfad: src/data/manual-order.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * Keine anpassbaren visuellen Werte. Neue Zeilen, die in der gemerkten Liste
 * noch fehlen, stehen in einer Sammlung vorn (wie „Neueste zuerst“ sonst) und in einer Gruppe hinten
 * (wie ein neuer Eintrag sonst).
 */

import { saveState, state } from "./state.js";

/** Die Id einer Zeile in der gemerkten Liste: kind ist „e“ (Eintrag) oder „w“ (Arbeitsbereich). */
export function rowKey(kind, id) {
  return `${kind}:${id}`;
}

/** Die gemerkte Liste eines Scopes; leer, wenn es keine gibt. */
export function manualIds(scope) {
  const saved = state.prefs.manualOrders?.[scope];
  return Array.isArray(saved) ? saved : [];
}

/**
 * Eine Zahl je Zeile für den Vergleich: ihre Stelle in der gemerkten Liste,
 * -1 für Zeilen, die dort noch fehlen (die kommen dann ganz nach vorn).
 * Liefert eine Funktion, damit die Liste nur einmal durchsucht wird.
 */
export function manualRank(scope, kind) {
  const places = new Map(manualIds(scope).map((key, index) => [key, index]));
  return (item) => places.get(rowKey(kind, item.id)) ?? -1;
}

/**
 * Eine Liste in die gemerkte Reihenfolge bringen. Fehlende Zeilen bleiben
 * hinten in ihrer bisherigen Reihenfolge — so wie ein neuer Eintrag sonst
 * ans Ende der Gruppe käme. Ohne gemerkte Liste bleibt alles, wie es ist.
 */
export function orderByManual(scope, items, kind = "e") {
  const places = new Map(manualIds(scope).map((key, index) => [key, index]));
  if (!places.size) return items;
  const place = (item) => places.get(rowKey(kind, item.id)) ?? Infinity;
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (place(a.item) === place(b.item) ? a.index - b.index : place(a.item) - place(b.item)))
    .map(({ item }) => item);
}

/**
 * Die neue Reihenfolge merken. `shownKeys` sind die sichtbaren Zeilen von
 * oben nach unten; was die Filter gerade ausblenden, bleibt dahinter erhalten.
 */
export function saveManualOrder(scope, shownKeys) {
  const rest = manualIds(scope).filter((key) => !shownKeys.includes(key));
  state.prefs.manualOrders = { ...state.prefs.manualOrders, [scope]: [...shownKeys, ...rest] };
  saveState();
}
