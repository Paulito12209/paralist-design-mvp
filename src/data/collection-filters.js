/*
 * Die Filter der Sammlungen — Eingang, Favoriten, Ressourcen, Archiv,
 * Arbeitsbereiche und Lesezeichen. Was die Pillen oben schon trennen
 * (Notizen, Videos, Projekte …), steht hier nicht noch einmal: der Filter
 * sagt „wo“ und „wann“. Jede Sammlung hat ihre eigenen Abschnitte
 * (collectionFilterSections) und merkt sich ihren Stand in
 * state.prefs.collectionFilters, z.B. { inbox: { period: "week" } };
 * was fehlt oder ungültig ist, fällt auf die Vorgabe zurück.
 *
 * - type:   Mehrfachwahl mit „ist | ist nicht“ wie Status auf der
 *           Aufgaben-Seite: typeHidden sind die ausgeblendeten Typen,
 *           typeNot sagt nur, welche Seite die Haken trägt
 * - place:  „alle“, „inbox“ (ohne Ort) oder ein Verweis wie „w:3“
 * - site:   „alle“ oder eine Website wie „youtube.com“ (nur Lesezeichen)
 * - period, done, art, favorites, content: Einfachwahl, erste Option = Vorgabe
 *
 * Arbeitsbereiche haben weder Typ noch Ort noch Bearbeitungszeit: sobald
 * einer dieser Filter greift, fallen sie auf Favoriten und im Archiv heraus
 * (wie in der Suche).
 * Pfad: src/data/collection-filters.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * collectionFilterSections -> welche Abschnitte jede Sammlung im Blatt zeigt, in dieser Reihenfolge
 * choiceOptions            -> die Werte der Einfachwahl-Abschnitte: Name, Icon, Wort auf dem Chip
 *                             (period: Tage zurück, 0 = nur heute)
 */

import { emit, events } from "../core/bus.js";
import { startOfDay } from "../core/dates.js";
import { bookmarkItems } from "./bookmarks.js";
import { isTaskDone } from "./config-tasks.js";
import { hostOf } from "./link-kinds.js";
import { archivedEntries, entriesOf, hasPlace, inboxEntries, resourceEntries } from "./queries.js";
import { workspaceRef } from "./refs.js";
import { saveState, state } from "./state.js";

const dayMs = 24 * 60 * 60 * 1000;

export const collectionFilterSections = {
  inbox: ["type", "period", "done"],
  favorites: ["art", "type", "place"],
  resources: ["place", "period"],
  archive: ["place", "period"],
  workspaces: ["favorites", "content"],
  bookmarks: ["place", "site"],
};

export const choiceOptions = {
  period: [
    { id: "any", label: "Immer", icon: "history", chip: "", days: null },
    { id: "today", label: "Heute", icon: "calendar", chip: "Heute bearbeitet", days: 0 },
    { id: "week", label: "Letzte 7 Tage", icon: "calendar", chip: "Letzte 7 Tage", days: 7 },
    { id: "month", label: "Letzte 30 Tage", icon: "calendar", chip: "Letzte 30 Tage", days: 30 },
  ],
  done: [
    { id: "show", label: "Zeigen", icon: "check-circle", chip: "" },
    { id: "hide", label: "Ausblenden", icon: "circle", chip: "Ohne Erledigte" },
  ],
  art: [
    { id: "all", label: "Alles", icon: "layers", chip: "" },
    { id: "workspaces", label: "Nur Arbeitsbereiche", icon: "folder", chip: "Nur Arbeitsbereiche" },
    { id: "entries", label: "Nur Einträge", icon: "note", chip: "Nur Einträge" },
  ],
  favorites: [
    { id: "all", label: "Alle", icon: "layers", chip: "" },
    { id: "only", label: "Nur Favoriten", icon: "star", chip: "Nur Favoriten" },
  ],
  content: [
    { id: "all", label: "Alle", icon: "layers", chip: "" },
    { id: "filled", label: "Mit Einträgen", icon: "list", chip: "Mit Einträgen" },
    { id: "empty", label: "Leer", icon: "folder", chip: "Leer" },
  ],
};

/** Womit jede Sammlung startet: nichts gefiltert. */
export function defaultCollectionFilter() {
  return { typeHidden: [], typeNot: false, place: "alle", site: "alle", period: "any", done: "show", art: "all", favorites: "all", content: "all" };
}

/** Der gültige Stand einer Sammlung — jede Angabe geprüft. */
export function collectionFilter(kind) {
  const base = defaultCollectionFilter();
  const saved = state.prefs.collectionFilters?.[kind];
  if (!saved || typeof saved !== "object") return base;
  const text = (value, fallback) => (typeof value === "string" && value ? value : fallback);
  const choice = (id) => (choiceOptions[id].some((option) => option.id === saved[id]) ? saved[id] : base[id]);
  return {
    typeHidden: Array.isArray(saved.typeHidden) ? saved.typeHidden.filter((id) => typeof id === "string") : [],
    typeNot: saved.typeNot === true,
    place: text(saved.place, base.place),
    site: text(saved.site, base.site),
    period: choice("period"),
    done: choice("done"),
    art: choice("art"),
    favorites: choice("favorites"),
    content: choice("content"),
  };
}

/** Einen Teil des Stands ändern, speichern und die Liste auffrischen. */
export function updateCollectionFilter(kind, changes) {
  const next = { ...collectionFilter(kind), ...changes };
  state.prefs.collectionFilters = { ...state.prefs.collectionFilters, [kind]: next };
  saveState();
  emit(events.dataChanged);
}

/** Alle Filter einer Sammlung zurücksetzen. */
export function resetCollectionFilter(kind) {
  const rest = { ...state.prefs.collectionFilters };
  delete rest[kind];
  state.prefs.collectionFilters = rest;
  saveState();
  emit(events.dataChanged);
}

/* ---------- Welche Abschnitte gerade filtern ---------- */

/** Filtert dieser Abschnitt? `f` ist der Stand aus collectionFilter. */
export function sectionActive(f, id) {
  if (id === "type") return f.typeHidden.length > 0;
  if (id === "place" || id === "site") return f[id] !== "alle";
  return f[id] !== choiceOptions[id][0].id;
}

/** Die gefilterten Abschnitte einer Sammlung, in der Reihenfolge des Blatts. */
export function activeSections(kind) {
  const f = collectionFilter(kind);
  return (collectionFilterSections[kind] || []).filter((id) => sectionActive(f, id));
}

/* ---------- Was durchkommt ---------- */

/* Bearbeitet innerhalb des Zeitraums? Ohne Bearbeitung zählt das Anlegen. */
function inPeriod(entry, periodId) {
  const period = choiceOptions.period.find((option) => option.id === periodId);
  if (!period || period.days === null) return true;
  const since = period.days === 0 ? startOfDay(Date.now()) : Date.now() - period.days * dayMs;
  return (entry.editedAt || entry.createdAt || 0) >= since;
}

/* Liegt der Eintrag am Ort — „inbox“ heißt: nirgends abgelegt. */
function inPlace(entry, place) {
  if (place === "alle") return true;
  return hasPlace(entry, place === "inbox" ? null : place);
}

/* Nur die Abschnitte, die die Sammlung auch zeigt — ein alter Stand aus
   einer anderen Sammlung darf nichts verstecken, was man nicht abschalten kann. */
function sectionsOf(kind) {
  const f = collectionFilter(kind);
  const shown = collectionFilterSections[kind] || [];
  const on = (id) => shown.includes(id) && sectionActive(f, id);
  return { f, on };
}

/** Einträge einer Sammlung filtern. */
export function filterCollectionEntries(kind, list) {
  const { f, on } = sectionsOf(kind);
  if (on("art") && f.art === "workspaces") return [];
  return list.filter(
    (entry) =>
      (!on("type") || !f.typeHidden.includes(entry.type)) &&
      (!on("place") || inPlace(entry, f.place)) &&
      (!on("period") || inPeriod(entry, f.period)) &&
      (!on("done") || !(entry.type === "aufgabe" && isTaskDone(entry)))
  );
}

/** Arbeitsbereiche einer Sammlung filtern. */
export function filterCollectionWorkspaces(kind, list) {
  const { f, on } = sectionsOf(kind);
  /* Typ, Ort und Zeitraum kennt ein Arbeitsbereich nicht: dann fällt er heraus */
  if (on("type") || on("place") || on("period") || (on("art") && f.art === "entries")) return [];
  return list.filter((workspace) => {
    if (on("favorites") && !workspace.favorite) return false;
    if (!on("content")) return true;
    const filled = entriesOf(workspaceRef(workspace.id)).length > 0;
    return f.content === "filled" ? filled : !filled;
  });
}

/** Lesezeichen ({ entry, block }) filtern: Ort des Eintrags, Website des Links. */
export function filterBookmarkItems(list) {
  const { f, on } = sectionsOf("bookmarks");
  return list.filter(
    (item) =>
      (!on("place") || inPlace(item.entry, f.place)) &&
      (!on("site") || (item.block.url && hostOf(item.block.url) === f.site))
  );
}

/* ---------- Woraus das Blatt seine Werte nimmt ---------- */

/** Alle Einträge, aus denen die Sammlung wählt — ungefiltert, für die Werte im Blatt. */
export function collectionPool(kind) {
  if (kind === "inbox") return inboxEntries();
  if (kind === "favorites") return state.entries.filter((entry) => entry.favorite && !entry.archived);
  if (kind === "resources") return resourceEntries();
  if (kind === "archive") return archivedEntries();
  if (kind === "bookmarks") return bookmarkItems(null).map((item) => item.entry);
  return [];
}

/** Die Websites der Lesezeichen, nach Namen. */
export function bookmarkSites() {
  const hosts = new Set(bookmarkItems(null).filter((item) => item.block.url).map((item) => hostOf(item.block.url)));
  return [...hosts].sort((a, b) => a.localeCompare(b, "de"));
}
