/*
 * Filtern und Sortieren der Treffer auf der Suchseite — reine Rechnerei ohne
 * Seite. Der gewählte Stand liegt in `ui.searchRefine` (src/data/state.js)
 * und fällt bei jeder neuen Suche auf die Vorgabe zurück: Sortierung
 * „Relevanz“, alle Arten, keine Eingrenzung.
 *
 * - Art: die Pillen unter dem Titel (Alle, Aufgaben, Notizen …) mit Anzahl
 * - Sortieren: Relevanz (wie die Palette), zuletzt bearbeitet, zuletzt
 *   geöffnet, Titel — jede in beide Richtungen (Blatt src/ui/sort-sheet.js)
 * - Eingrenzen: Ort, Zeitraum der letzten Bearbeitung, nur im Titel suchen,
 *   Erledigte zeigen. Ort und Zeitraum gibt es nur bei Einträgen — ist eins
 *   davon gesetzt, fallen Arbeitsbereiche und Übersichtskarten heraus.
 * Pfad: src/features/search/search-refine.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * maxHits        -> wie viele Treffer die Ergebnisliste höchstens zeigt
 * refineSorts    -> Sortierungen: Name, Icon, Wortlaut beider Richtungen
 *                   (up = aufsteigend, down = absteigend), natürliche Richtung
 * refinePeriods  -> Zeiträume: Name im Blatt, Wort auf dem Chip, Tage zurück
 *                   (0 = nur heute)
 * extraKinds     -> Namen der Pillen für Arbeitsbereiche und Übersichtskarten
 */

import { startOfDay } from "../../core/dates.js";
import { sameId } from "../../core/ids.js";
import { typeOrder, typePlurals } from "../../data/config.js";
import { isTaskDone } from "../../data/config-tasks.js";
import { hasPlace } from "../../data/queries.js";
import { isEntryRef, refId } from "../../data/refs.js";
import { state } from "../../data/state.js";
import { matchingItems } from "./search-data.js";

const maxHits = 30;
const dayMs = 24 * 60 * 60 * 1000;

export const refineSorts = [
  { id: "relevanz", label: "Relevanz", icon: "search", up: "Beste zuerst", down: "Beste zuletzt", asc: true },
  { id: "bearbeitet", label: "Bearbeitet", icon: "pencil", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geoeffnet", label: "Geöffnet", icon: "history", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "titel", label: "Titel", icon: "text", up: "A bis Z", down: "Z bis A", asc: true },
];

/* Die natürliche Richtung einer Sortierung — so steht sie nach dem Wechsel. */
export function naturalAsc(sort) {
  return (refineSorts.find((item) => item.id === sort) || refineSorts[0]).asc;
}

export const refinePeriods = [
  { id: "any", label: "Beliebig", chip: "", days: null },
  { id: "today", label: "Heute", chip: "Heute", days: 0 },
  { id: "week", label: "Letzte 7 Tage", chip: "7 Tage", days: 7 },
  { id: "month", label: "Letzte 30 Tage", chip: "30 Tage", days: 30 },
];

/* Pillen für Treffer, die keine Einträge sind; die Einträge nutzen typePlurals. */
const extraKinds = [
  { id: "workspace", label: "Arbeitsbereiche" },
  { id: "overview", label: "Übersicht" },
];

/** Die Vorgabe. `place`: undefined = überall, null = Eingang, sonst ein Verweis. `asc`: Richtung der Sortierung. */
export function defaultRefine() {
  return { type: "all", sort: "relevanz", asc: true, place: undefined, period: "any", titleOnly: false, showDone: true };
}

/** Grenzt irgendetwas die Treffer ein (ohne die Art-Pille)? */
export function hasLimits(refine) {
  return refine.place !== undefined || refine.period !== "any" || refine.titleOnly || !refine.showDone;
}

/** Weicht die Sortierung von der Vorgabe ab (Relevanz, beste zuerst)? */
export function isSorted(refine) {
  return refine.sort !== "relevanz" || refine.asc === false;
}

/* Zu welcher Pille ein Treffer gehört. */
function kindOf(item) {
  return item.kind === "entry" ? item.type : item.kind;
}

/* Zuletzt bearbeitet; ohne Bearbeitung zählt das Anlegen. */
function editedTs(item) {
  return item.entry ? item.entry.editedAt || item.entry.createdAt || 0 : 0;
}

/* Liegt der Eintrag am Ort — abgelegt oder mit dem Projekt verknüpft? */
function inPlace(entry, place) {
  if (hasPlace(entry, place)) return true;
  return Boolean(place) && isEntryRef(place) && (entry.links || []).some((id) => sameId(id, refId(place)));
}

/* Die Eingrenzungen aus dem Blatt, ohne die Art. */
function passesLimits(item, refine) {
  const period = refinePeriods.find((row) => row.id === refine.period);
  const needsEntry = refine.place !== undefined || (period && period.days !== null);
  if (needsEntry && !item.entry) return false;
  if (!refine.showDone && item.entry && item.type === "aufgabe" && isTaskDone(item.entry)) return false;
  if (refine.place !== undefined && !inPlace(item.entry, refine.place)) return false;
  if (period && period.days !== null) {
    const since = period.days === 0 ? startOfDay(Date.now()) : Date.now() - period.days * dayMs;
    if (editedTs(item) < since) return false;
  }
  return true;
}

/* Aufsteigend sortieren; „Relevanz“ lässt die Reihenfolge aus matchingItems stehen (beste zuerst). */
function sortAscending(list, sort) {
  if (sort === "bearbeitet") return [...list].sort((a, b) => editedTs(a) - editedTs(b));
  if (sort === "titel") return [...list].sort((a, b) => a.title.localeCompare(b.title, "de"));
  if (sort === "geoeffnet") {
    const opened = new Map(state.opens.map((open) => [open.key, open.ts]));
    const ts = (item) => opened.get(`${item.kind}:${item.id}`) || 0;
    return [...list].sort((a, b) => ts(a) - ts(b));
  }
  return list;
}

/* Sortieren in der gewählten Richtung; ein alter Stand ohne `asc` gilt als natürliche Richtung. */
function sortItems(list, refine) {
  const asc = refine.asc ?? naturalAsc(refine.sort);
  const sorted = sortAscending(list, refine.sort);
  return asc ? sorted : [...sorted].reverse();
}

/* Die Art-Pillen: „Alle“ und jede Art mit Treffern, in fester Reihenfolge. */
function kindPills(list) {
  const counts = new Map();
  list.forEach((item) => counts.set(kindOf(item), (counts.get(kindOf(item)) || 0) + 1));
  const kinds = [...typeOrder.map((id) => ({ id, label: typePlurals[id] || id })), ...extraKinds];
  return [
    { id: "all", label: "Alle", count: list.length },
    ...kinds.filter((kind) => counts.has(kind.id)).map((kind) => ({ ...kind, count: counts.get(kind.id) })),
  ];
}

/**
 * Alles, was die Suchseite zeichnet: die Art-Pillen, die Treffer der gewählten
 * Art (höchstens maxHits) und ob es ohne die Eingrenzungen etwas gegeben hätte.
 * Hat die gewählte Art keine Treffer mehr, springt sie auf „Alle“ zurück.
 */
export function refinedHits(query, refine) {
  const matches = matchingItems(query, { titleOnly: refine.titleOnly });
  const limited = matches.filter((item) => passesLimits(item, refine));
  const pills = kindPills(limited);
  if (!pills.some((pill) => pill.id === refine.type)) refine.type = "all";
  const shown = refine.type === "all" ? limited : limited.filter((item) => kindOf(item) === refine.type);
  const unlimited = hasLimits(refine) ? matchingItems(query).length : limited.length;
  return {
    pills,
    total: shown.length,
    hits: sortItems(shown, refine).slice(0, maxHits),
    hiddenByLimits: !limited.length && unlimited > 0,
  };
}
