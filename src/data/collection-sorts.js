/*
 * Wonach sich die Sammlungen sortieren lassen — Eingang, Favoriten,
 * Ressourcen, Archiv, Arbeitsbereiche und Lesezeichen. Jede Sammlung merkt
 * sich ihre Wahl in state.prefs.collectionSorts, z.B.
 * { inbox: { sort: "name", asc: true } }; fehlt sie oder ist sie ungültig
 * (alter Speicherstand), gilt die Vorgabe der Sammlung. Die Projekte haben
 * eigene Ansichten mit eigener Sortierung (src/data/project-views.js), nutzen
 * aber denselben Vergleich (sortEntries).
 * Pfad: src/data/collection-sorts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * entrySorts      -> wonach sich Einträge sortieren lassen, samt Wortlaut beider Richtungen
 * workspaceSorts  -> dasselbe für die Seite Arbeitsbereiche
 * manualKinds     -> die Sammlungen, die „Eigene Reihenfolge“ anbieten (Wortlaut: manualSort in
 *                   src/data/config.js; entsteht durch Verschieben einer Zeile, src/data/manual-order.js)
 * collectionSortDefaults -> womit jede Sammlung startet: Sortierung und Richtung
 *                   (asc: true = aufsteigend, also Älteste zuerst bzw. A bis Z)
 */

import { emit, events } from "../core/bus.js";
import { manualSort } from "./config.js";
import { openStats } from "./opens.js";
import { entriesOf, workspaceLabel } from "./queries.js";
import { manualRank } from "./manual-order.js";
import { workspaceRef } from "./refs.js";
import { saveState, state } from "./state.js";

/* „Eigene Reihenfolge“: kommt in die Auswahl der Sammlungen, in denen sich Zeilen verschieben lassen. */
export const manualId = manualSort.id;
export const manualKinds = ["inbox", "favorites", "resources", "workspaces"];

export const entrySorts = [
  { id: "erstellt", label: "Erstellt", icon: "plus-circle", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geaendert", label: "Zuletzt geändert", icon: "pencil", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geoeffnet", label: "Zuletzt geöffnet", icon: "history", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "name", label: "Name", icon: "text", up: "A bis Z", down: "Z bis A", asc: true },
  manualSort,
];

export const workspaceSorts = [
  { id: "erstellt", label: "Erstellt", icon: "plus-circle", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "geoeffnet", label: "Zuletzt geöffnet", icon: "history", up: "Älteste zuerst", down: "Neueste zuerst", asc: false },
  { id: "name", label: "Name", icon: "text", up: "A bis Z", down: "Z bis A", asc: true },
  { id: "eintraege", label: "Einträge", icon: "list", up: "Wenigste zuerst", down: "Meiste zuerst", asc: false },
  manualSort,
];

/* Vorgaben so, wie die Listen bisher standen: Arbeitsbereiche und Archiv in
   der Reihenfolge des Anlegens, alles andere Neuestes oben. */
export const collectionSortDefaults = {
  inbox: { sort: "erstellt", asc: false },
  favorites: { sort: "erstellt", asc: false },
  resources: { sort: "erstellt", asc: false },
  archive: { sort: "erstellt", asc: true },
  workspaces: { sort: "erstellt", asc: true },
  bookmarks: { sort: "erstellt", asc: false },
};

/** Sammlungen mit Karte „Ansicht“ — die Schlüssel der Vorgaben. */
export const sortableCollections = Object.keys(collectionSortDefaults);

/** Die Sortier-Optionen einer Sammlung. */
export function collectionSortOptions(kind) {
  const options = kind === "workspaces" ? workspaceSorts : entrySorts;
  return manualKinds.includes(kind) ? options : options.filter((option) => option.id !== manualId);
}

/** Die gültige Wahl einer Sammlung: { sort, asc }. */
export function collectionSort(kind) {
  const fallback = collectionSortDefaults[kind] || collectionSortDefaults.inbox;
  const saved = state.prefs.collectionSorts?.[kind];
  const known = saved && collectionSortOptions(kind).some((option) => option.id === saved.sort);
  if (!known) return { ...fallback };
  return { sort: saved.sort, asc: typeof saved.asc === "boolean" ? saved.asc : fallback.asc };
}

/** Die Wahl einer Sammlung ändern, speichern und die Liste auffrischen. */
export function setCollectionSort(kind, sort, asc) {
  state.prefs.collectionSorts = { ...state.prefs.collectionSorts, [kind]: { sort, asc } };
  saveState();
  emit(events.dataChanged);
}

/* ---------- Vergleichen ---------- */

function byText(a, b) {
  return String(a).localeCompare(String(b), "de", { sensitivity: "base", numeric: true });
}

/* Wann ein Eintrag zuletzt geöffnet wurde; nie geöffnet zählt die letzte Änderung. */
function entryOpenedAt(entry) {
  return openStats("entry", entry.id)?.ts || entry.editedAt || entry.createdAt || 0;
}

/* Je Sortierart der Zahlenwert eines Eintrags; „name“ vergleicht Text. */
const entryKeys = {
  erstellt: (entry) => entry.createdAt || 0,
  geaendert: (entry) => entry.editedAt || entry.createdAt || 0,
  geoeffnet: entryOpenedAt,
};

/*
 * Eine Liste sortieren; bei Gleichstand entscheidet der Name.
 * `keys` liefert je Sortierart den Zahlenwert, `nameOf` den Text für „name“.
 * Die Werte werden einmal je Element berechnet, nicht in jedem Vergleich.
 */
function sortList(list, sortId, asc, keys, nameOf) {
  const sign = asc ? 1 : -1;
  const names = new Map(list.map((item) => [item, nameOf(item)]));
  const byName = (a, b) => byText(names.get(a), names.get(b));
  const key = keys[sortId];
  if (!key) return [...list].sort((a, b) => sign * byName(a, b));
  const values = new Map(list.map((item) => [item, key(item)]));
  return [...list].sort((a, b) => sign * (values.get(a) - values.get(b)) || byName(a, b));
}

/**
 * Einträge sortieren. `extraKeys` ergänzt eigene Sortierarten (die Projekte
 * zählen ihre Einträge), `nameOf` den Text, falls nicht der Titel zählt.
 */
export function sortEntries(list, sortId, asc, extraKeys = {}, nameOf = (entry) => entry.title || "") {
  return sortList(list, sortId, asc, { ...entryKeys, ...extraKeys }, nameOf);
}

/* Je Sortierart der Zahlenwert eines Arbeitsbereichs. */
const workspaceKeys = {
  erstellt: (workspace) => workspace.createdAt || 0,
  geoeffnet: (workspace) => openStats("workspace", workspace.id)?.ts || workspace.createdAt || 0,
  eintraege: (workspace) => entriesOf(workspaceRef(workspace.id)).length,
};

/** Arbeitsbereiche sortieren. */
export function sortWorkspaces(list, sortId, asc, extraKeys = {}) {
  return sortList(list, sortId, asc, { ...workspaceKeys, ...extraKeys }, workspaceLabel);
}

/** Einträge einer Sammlung nach ihrer Wahl sortieren. */
export function sortCollectionEntries(kind, list) {
  const { sort, asc } = collectionSort(kind);
  return sortEntries(list, sort, asc, { [manualId]: manualRank(kind, "e") });
}

/**
 * Elemente, die an einem Eintrag hängen (die Lesezeichen: Eintrag plus Karte),
 * nach der Wahl einer Sammlung sortieren. `entryOf` liefert den Eintrag, nach
 * dessen Zeiten sortiert wird, `nameOf` den angezeigten Namen.
 */
export function sortCollectionItems(kind, list, entryOf, nameOf) {
  const { sort, asc } = collectionSort(kind);
  const keys = Object.fromEntries(Object.entries(entryKeys).map(([id, key]) => [id, (item) => key(entryOf(item))]));
  return sortList(list, sort, asc, keys, nameOf);
}

/** Arbeitsbereiche einer Sammlung nach ihrer Wahl sortieren — auf den Seiten
    ohne eigene Arbeitsbereich-Sortierung (Favoriten, Archiv) gilt, was die
    Einträge vorgeben, soweit es passt; sonst nach Erstellt. */
export function sortCollectionWorkspaces(kind, list) {
  const { sort, asc } = collectionSort(kind);
  const fits = workspaceSorts.some((option) => option.id === sort);
  return sortWorkspaces(list, fits ? sort : "erstellt", asc, { [manualId]: manualRank(kind, "w") });
}
