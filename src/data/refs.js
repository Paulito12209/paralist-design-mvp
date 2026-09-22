/*
 * Verweise auf Ablageorte. Ein Eintrag liegt an genau einem Ort:
 * im Eingang (null), in einem Arbeitsbereich ("w:3") oder in einem
 * Projekt ("e:17" — die Nummer des Projekt-Eintrags).
 *
 * Warum Text statt Nummer: Arbeitsbereiche und Einträge haben getrennte
 * Nummernkreise; die Nummer 3 allein sagt nicht, ob der Arbeitsbereich 3 oder
 * das Projekt 3 gemeint ist. Das Kürzel davor macht es eindeutig und der Text
 * lässt sich direkt als Schlüssel in Tabellen benutzen.
 * Pfad: src/data/refs.js
 *
 * Keine anpassbaren visuellen Werte.
 */

const WORKSPACE = "w";
const ENTRY = "e";

/** Verweis auf einen Arbeitsbereich. */
export function workspaceRef(id) {
  return `${WORKSPACE}:${id}`;
}

/** Verweis auf einen Eintrag (nur Projekte können Ablageort sein). */
export function entryRef(id) {
  return `${ENTRY}:${id}`;
}

/** Zeigt der Verweis auf einen Arbeitsbereich? */
export function isWorkspaceRef(ref) {
  return typeof ref === "string" && ref.startsWith(`${WORKSPACE}:`);
}

/** Zeigt der Verweis auf einen Eintrag? */
export function isEntryRef(ref) {
  return typeof ref === "string" && ref.startsWith(`${ENTRY}:`);
}

/** Die Nummer hinter dem Kürzel, oder null für den Eingang. */
export function refId(ref) {
  if (!isWorkspaceRef(ref) && !isEntryRef(ref)) return null;
  const id = Number(ref.slice(2));
  return Number.isFinite(id) ? id : null;
}

/**
 * Ältere Speicherstände auf die heutige Form bringen: dort stand die nackte
 * Nummer des Arbeitsbereichs, oder „o3” für die frühere Projekte-Karte.
 * Alles, was sich nicht deuten lässt, landet im Eingang.
 */
export function normalizeRef(value) {
  if (value === null || value === undefined || value === "") return null;
  if (isWorkspaceRef(value) || isEntryRef(value)) return refId(value) === null ? null : value;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? workspaceRef(number) : null;
}
