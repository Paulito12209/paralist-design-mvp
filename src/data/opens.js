/*
 * Zwei Merklisten für die Suchseite: „opens“ zählt, was wie oft und wann
 * zuletzt geöffnet wurde, „recentSearches“ merkt die getippten Begriffe.
 * Pfad: src/data/opens.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxRecentSearches -> wie viele Suchbegriffe gemerkt werden
 */

import { saveState, state } from "./state.js";

const maxRecentSearches = 8;

/**
 * Merkt, dass etwas geöffnet wurde. `kind` ist "entry" (Aufgabe, Notiz,
 * Projekt, …) oder "workspace". Sammlungen und die Reiter unten (Kalender,
 * Aufgaben, Medien) werden bewusst nicht gezählt — sie sind nur Wege dorthin.
 */
export function noteOpen(kind, id) {
  const key = `${kind}:${id}`;
  const found = state.opens.find((item) => item.key === key);
  if (found) {
    found.count += 1;
    found.ts = Date.now();
  } else {
    state.opens.push({ key, kind, id: String(id), count: 1, ts: Date.now() });
  }
  saveState();
}

/**
 * Ein Merkposten wandert auf ein anderes Ding — wenn aus einem Eintrag ein
 * Arbeitsbereich wird oder umgekehrt (src/data/convert.js). Gab es unter dem
 * neuen Schlüssel schon einen Posten (Nummern gelöschter Arbeitsbereiche
 * werden neu vergeben), werden beide zu einem zusammengelegt — sonst stünde
 * dasselbe Ding zweimal unter „Zuletzt geöffnet“.
 */
export function moveOpen(fromKey, kind, id) {
  const open = state.opens.find((item) => item.key === fromKey);
  if (!open) return;
  const toKey = `${kind}:${id}`;
  const stale = state.opens.find((item) => item.key === toKey);
  if (stale) {
    open.count += stale.count;
    open.ts = Math.max(open.ts, stale.ts);
    state.opens = state.opens.filter((item) => item !== stale);
  }
  open.key = toKey;
  open.kind = kind;
  open.id = String(id);
}

/** Merkt einen Suchbegriff; der neueste steht vorn, Wiederholungen rutschen nach oben. */
export function noteSearch(query) {
  const text = String(query || "").trim();
  if (!text) return;
  state.recentSearches = [
    text,
    ...state.recentSearches.filter((item) => item.toLowerCase() !== text.toLowerCase()),
  ].slice(0, maxRecentSearches);
  saveState();
}

/**
 * Nachschlagetabelle „kind:id“ → Anzahl. Einmal bauen und dann oft fragen,
 * damit die Suche nicht für jeden Treffer die ganze Liste durchläuft.
 */
export function openCounts() {
  const counts = new Map();
  state.opens.forEach((item) => counts.set(item.key, item.count));
  return counts;
}
