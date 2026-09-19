/*
 * Fragen an die Daten: Welche Einträge liegen wo, wie viele sind es,
 * wie heißt ein Ablageort. Diese Datei ändert nie etwas — sie liest nur.
 *
 * Das Modell in einem Satz: Arbeitsbereiche stehen ganz oben, darin liegen
 * Projekte, in Projekten alles andere. Jeder Eintrag hat eine Liste von
 * Ablageorten (`places`, Verweise aus refs.js) und erscheint an jedem davon —
 * so kann ein Projekt zugleich bei Marketing und bei Design liegen. Eine leere
 * Liste heißt Inbox.
 * Pfad: src/data/queries.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dayKey, timeKey } from "../core/dates.js";
import { sameId } from "../core/ids.js";
import {
  containerTypes,
  isTaskDone,
  overviewPages,
  resourceTypes,
  taskGroupings,
  taskPriorities,
  typeIcon,
  typeOrder,
  typePlurals,
  xpItems,
} from "./config.js";
import { entryRef, isEntryRef, isWorkspaceRef, refId, workspaceRef } from "./refs.js";
import { state } from "./state.js";

/** Einen Eintrag nach ID finden, egal ob die ID als Zahl oder Text kommt. */
export function findEntry(id) {
  return state.entries.find((entry) => sameId(entry.id, id)) || null;
}

/** Einen Arbeitsbereich nach ID finden. */
export function findWorkspace(id) {
  return state.workspaces.find((workspace) => sameId(workspace.id, id)) || null;
}

/** Anzeigename eines Arbeitsbereichs; leer heißt: der Vorgabename gilt. */
export function workspaceLabel(workspace) {
  return workspace.name || workspace.placeholder || "Arbeitsbereich";
}

/** Kann dieser Eintrag selbst Einträge aufnehmen? */
export function isContainer(entry) {
  return Boolean(entry && containerTypes.includes(entry.type));
}

/** Liegt der Eintrag an diesem Ort? `null` fragt nach der Inbox (nirgends abgelegt). */
export function hasPlace(entry, ref) {
  const places = entry.places || [];
  return ref ? places.includes(ref) : places.length === 0;
}

/** Alle Orte eines Eintrags als Text, z.B. „Marketing · Design“; ohne Ort „Inbox“. */
export function placesLabel(entry) {
  const places = entry.places || [];
  return places.length ? places.map(parentName).join(" · ") : overviewPages[1].title;
}

/** Anzeigename eines Ablageorts — Inbox, Arbeitsbereich oder Projekt. */
export function parentName(ref) {
  if (!ref) return overviewPages[1].title;
  if (isWorkspaceRef(ref)) {
    const workspace = findWorkspace(refId(ref));
    return workspace ? workspaceLabel(workspace) : overviewPages[1].title;
  }
  const project = isEntryRef(ref) ? findEntry(refId(ref)) : null;
  return project ? project.title || "Projekt" : overviewPages[1].title;
}

/** Icon eines Ablageorts, passend zu parentName. */
export function parentIcon(ref) {
  if (!ref) return overviewPages[1].icon;
  if (isWorkspaceRef(ref)) {
    const workspace = findWorkspace(refId(ref));
    return workspace ? workspaceIcon(workspace) : overviewPages[1].icon;
  }
  return typeIcon("projekt");
}

/** Sichtbare Einträge eines Ablageorts (Archiviertes bleibt draußen). */
export function entriesOf(ref) {
  return state.entries.filter((entry) => !entry.archived && hasPlace(entry, ref));
}

/**
 * Die Einträge eines Ablageorts nach Typ gruppiert, in der Ordnung aus
 * config.js: [{ type, label, icon, items }] — nur Gruppen mit Inhalt.
 */
export function groupedEntriesOf(ref) {
  const list = entriesOf(ref);
  return typeOrder
    .map((type) => ({
      type,
      label: typePlurals[type] || type,
      icon: typeIcon(type),
      items: list.filter((entry) => entry.type === type),
    }))
    .filter((group) => group.items.length);
}

/** Alle Projekte, egal wo sie liegen — die Projekte-Karte. */
export function projectEntries() {
  return state.entries.filter((entry) => entry.type === "projekt" && !entry.archived);
}

/**
 * Alle Ablageorte, die ein Eintrag bekommen kann: Inbox, jeder Arbeitsbereich,
 * jedes Projekt. Ein Projekt darf nicht in ein Projekt, und nichts in sich selbst.
 * @returns [{ ref, label, icon }]
 */
export function placeOptionsFor(entry = null) {
  const options = [{ ref: null, label: overviewPages[1].title, icon: overviewPages[1].icon }];
  state.workspaces.forEach((workspace) => {
    options.push({ ref: workspaceRef(workspace.id), label: workspaceLabel(workspace), icon: workspaceIcon(workspace) });
  });
  if (entry && isContainer(entry)) return options;
  projectEntries().forEach((project) => {
    if (entry && sameId(project.id, entry.id)) return;
    options.push({ ref: entryRef(project.id), label: project.title || "Projekt", icon: typeIcon("projekt") });
  });
  return options;
}

/** Arbeitsbereiche des gerade gewählten Tabs. */
export function tabWorkspaces() {
  return state.workspaces.filter(
    (workspace) => !workspace.archived && sameId(workspace.tab, state.activeTabId)
  );
}

/** Was im Archiv liegt: erst die Arbeitsbereiche, dann die Einträge. */
export function archivedWorkspaces() {
  return state.workspaces.filter((workspace) => workspace.archived);
}

/** Archivierte Einträge in der Reihenfolge, in der sie angelegt wurden. */
export function archivedEntries() {
  return state.entries.filter((entry) => entry.archived);
}

/** Zahl auf der Favoriten-Karte: markierte Arbeitsbereiche plus markierte Einträge. */
export function favoriteCount() {
  return (
    state.workspaces.filter((workspace) => workspace.favorite && !workspace.archived).length +
    state.entries.filter((entry) => entry.favorite && !entry.archived).length
  );
}

/** Art eines Medien-Eintrags. Einträge aus dem Eingabefeld haben keine Datei und zählen als Dokument. */
export function mediaKindOf(entry) {
  return (entry.media && entry.media.kind) || "doc";
}

/** Alle Medien, neueste zuerst. */
export function mediaEntries() {
  return state.entries
    .filter((entry) => entry.type === "medien" && !entry.archived)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Ressourcen sind alles Eigene (Dokumente, Zeichnungen) und alle Medien, egal wo sie liegen. */
export function resourceEntries() {
  return state.entries
    .filter((entry) => resourceTypes.includes(entry.type) && !entry.archived)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Zahl auf einer Übersichtskarte. */
export function pageCount(page) {
  if (page.kind === "favorites") return favoriteCount();
  if (page.kind === "projects") return projectEntries().length;
  if (page.kind === "resources") return resourceEntries().length;
  return entriesOf(page.parent).length;
}

/** Icon eines Arbeitsbereichs; ohne eigene Wahl ein Ordner. */
export function workspaceIcon(workspace) {
  return workspace.icon || "folder";
}

/** Tag, an dem ein Eintrag im Kalender steht. Ohne eigenes Datum zählt der Tag des Anlegens. */
export function entryDay(entry) {
  return entry.date || dayKey(new Date(entry.createdAt || Date.now()));
}

/** Uhrzeit eines Eintrags. Termine ohne Uhrzeit bekommen die Uhrzeit des Anlegens. */
export function entryTime(entry) {
  if (entry.time) return entry.time;
  if (entry.type === "termin" && entry.createdAt) return timeKey(entry.createdAt);
  return null;
}

/** Farbe eines Eintrags — dieselbe wie im Verlauf des Fortschritt-Blatts. */
export function entryColor(entry) {
  return (xpItems[entry.type] || xpItems.notiz).color;
}

/** Sichtbare Einträge eines Kalendertags. */
export function entriesOfDay(key) {
  return state.entries.filter((entry) => !entry.archived && entryDay(entry) === key);
}

/* ---------- Aufgaben-Seite ---------- */

/** Alle sichtbaren Aufgaben, ungefiltert und unsortiert. */
export function taskEntries() {
  return state.entries.filter((entry) => entry.type === "aufgabe" && !entry.archived);
}

/** Die Sortiernummer einer Aufgabe; ohne eigene zählt der Zeitpunkt des Anlegens. */
export function taskOrder(entry) {
  return Number.isFinite(entry.order) ? entry.order : -(entry.createdAt || 0);
}

/* Platz einer Priorität in der Spalten-Reihenfolge; Unbekanntes kommt hinten. */
function priorityRank(entry) {
  const index = taskPriorities.findIndex((item) => item.id === entry.priority);
  return index < 0 ? taskPriorities.length : index;
}

/**
 * Aufgaben sortieren. Zwei Regeln gelten immer: Erledigtes steht ganz unten,
 * und bei „Neueste zuerst“ schlägt eine von Hand gezogene Reihenfolge die
 * automatische. Eine neue Sortierart braucht hier nur einen weiteren Fall.
 */
export function sortTasks(list, sortId) {
  const rest = (a, b) => {
    if (sortId === "alt") return (a.createdAt || 0) - (b.createdAt || 0);
    if (sortId === "titel") return String(a.title).localeCompare(String(b.title), "de");
    if (sortId === "prio") return priorityRank(a) - priorityRank(b) || taskOrder(a) - taskOrder(b);
    return taskOrder(a) - taskOrder(b);
  };
  return [...list].sort((a, b) => Number(isTaskDone(a)) - Number(isTaskDone(b)) || rest(a, b));
}

/** Liegt die Aufgabe an dem Ort, den der Filter verlangt? „alle“ lässt alles durch. */
function matchesPlace(entry, place) {
  if (place === "alle") return true;
  if (place === "inbox") return hasPlace(entry, null);
  return hasPlace(entry, place);
}

/** Aufgaben nach den Filtern der Bedienzeile sieben und sortieren. */
export function visibleTasks(prefs) {
  const list = taskEntries().filter((entry) => {
    if (prefs.hideDone && isTaskDone(entry)) return false;
    if (prefs.status !== "alle" && entry.status !== prefs.status) return false;
    return matchesPlace(entry, prefs.place);
  });
  return sortTasks(list, prefs.sort);
}

/**
 * Die Spalten des Boards: [{ id, label, icon, color, items }] in der Reihenfolge
 * aus config.js. `field` sagt, welches Feld einer Aufgabe die Spalte bestimmt.
 */
export function taskColumns(prefs) {
  const grouping = taskGroupings.find((item) => item.id === prefs.group) || taskGroupings[0];
  const list = visibleTasks(prefs);
  const columns = grouping.columns.map((column) => ({ ...column, items: [] }));
  list.forEach((entry) => {
    const target = columns.find((column) => column.id === entry[grouping.field]) || columns[0];
    target.items.push(entry);
  });
  return { field: grouping.field, columns };
}

/** Der erste Ablageort einer Aufgabe — dafür steht das kleine Label in der Zeile. */
export function mainPlace(entry) {
  const places = entry.places || [];
  return places.length ? places[0] : null;
}
