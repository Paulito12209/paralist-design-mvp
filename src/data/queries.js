/*
 * Fragen an die Daten: Welche Einträge liegen wo, wie viele sind es,
 * wie heißt ein Ablageort. Diese Datei ändert nie etwas — sie liest nur.
 *
 * Das Modell in einem Satz: Arbeitsbereiche stehen ganz oben, darin liegen
 * Projekte, in Projekten alles andere. Jeder Eintrag hat eine Liste von
 * Ablageorten (`places`, Verweise aus refs.js) und erscheint an jedem davon —
 * so kann ein Projekt zugleich bei Marketing und bei Design liegen. Eine leere
 * Liste heißt Eingang.
 * Pfad: src/data/queries.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dayKey, timeKey } from "../core/dates.js";
import { sameId } from "../core/ids.js";
import {
  containerTypes,
  overviewPages,
  resourceTypes,
  typeIcon,
  typeOrder,
  typePlurals,
  xpItems,
} from "./config.js";
import { archiveColumn, isTaskDone, taskGroupings, taskPriorities, taskPriorityOf, taskStatusOf } from "./config-tasks.js";
import { filterByLinks } from "./link-filter.js";
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

/** Anzeigename eines Tabs; leer heißt: der Vorgabename gilt. */
export function tabLabel(tab) {
  return tab.name || tab.placeholder || "Tab";
}

/** Kann dieser Eintrag selbst Einträge aufnehmen? */
export function isContainer(entry) {
  return Boolean(entry && containerTypes.includes(entry.type));
}

/** Liegt der Eintrag an diesem Ort? `null` fragt nach dem Eingang (nirgends abgelegt). */
export function hasPlace(entry, ref) {
  const places = entry.places || [];
  return ref ? places.includes(ref) : places.length === 0;
}

/**
 * Alle Orte eines Eintrags als Text, z.B. „Marketing · Design”. Ohne Ort steht
 * „Eingang” — außer bei Medien: die zählen ohne Ort zu den Ressourcen, nie zum
 * Eingang (siehe inboxEntries unten), darum zeigt ihr Fußpfad das auch so an.
 */
export function placesLabel(entry) {
  const places = entry.places || [];
  if (places.length) return places.map(parentName).join(" · ");
  return entry.type === "medien" ? overviewPages[4].title : overviewPages[1].title;
}

/** Anzeigename eines Ablageorts — Eingang, Arbeitsbereich oder Projekt. */
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
 * Was wirklich im Eingang steht: Einträge ohne Ort, außer Medien — ein
 * Foto oder eine Aufnahme ohne gewählten Ort ist eine Ressource, keine
 * Eingang-Karteikarte, und läuft deshalb nie versehentlich mit ein.
 */
export function inboxEntries() {
  return entriesOf(null).filter((entry) => entry.type !== "medien");
}

/**
 * Eine Liste von Einträgen nach Typ gruppieren, in der Ordnung aus config.js:
 * [{ type, label, icon, items }] — nur Gruppen mit Inhalt. Dieselbe Gruppierung
 * benutzen der Inhalt eines Ablageorts und die verknüpften Einträge, damit
 * beide Listen gleich aussehen.
 */
export function groupByType(list) {
  return typeOrder
    .map((type) => ({
      type,
      label: typePlurals[type] || type,
      icon: typeIcon(type),
      items: list.filter((entry) => entry.type === type),
    }))
    .filter((group) => group.items.length);
}

/** Die Einträge eines Ablageorts nach Typ gruppiert. */
export function groupedEntriesOf(ref) {
  return groupByType(entriesOf(ref));
}

/** Alle Projekte, egal wo sie liegen — Grundlage der Projekt-Ansichten. */
export function projectEntries() {
  return state.entries.filter((entry) => entry.type === "projekt" && !entry.archived);
}

/**
 * Alle Ablageorte, die ein Eintrag bekommen kann: Eingang, jeder Arbeitsbereich,
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

/** Arbeitsbereiche eines Tabs, ohne die archivierten. */
export function workspacesOfTab(tabId) {
  return state.workspaces.filter((workspace) => !workspace.archived && sameId(workspace.tab, tabId));
}

/** Arbeitsbereiche des gerade gewählten Tabs. */
export function tabWorkspaces() {
  return workspacesOfTab(state.activeTabId);
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
  /* Die Karte Arbeitsbereiche zählt, was auf ihrer Seite steht: alle Tabs, ohne archivierte. */
  if (page.kind === "workspaces") return state.workspaces.filter((workspace) => !workspace.archived).length;
  if (page.kind === "resources") return resourceEntries().length;
  /* Die Eingang-Karte (parent null) zählt wie ihre Liste, ohne Medien. */
  if (page.parent === null) return inboxEntries().length;
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

/** Farbe der Arbeitsbereiche — dieselbe wie im Verlauf des Fortschritt-Blatts. */
export function workspaceColor() {
  return xpItems.arbeitsbereich.color;
}

/** Farbe eines Eintrags — dieselbe wie im Verlauf des Fortschritt-Blatts. */
export function entryColor(entry) {
  return (xpItems[entry.type] || xpItems.notiz).color;
}

/** Sichtbare Einträge eines Kalendertags. */
export function entriesOfDay(key) {
  return state.entries.filter((entry) => !entry.archived && entryDay(entry) === key);
}

/** Alle Einträge eines Kalendertags, archivierte eingeschlossen — für die Ringe im Wochenstreifen. */
export function calendarDayEntries(key) {
  return state.entries.filter((entry) => entryDay(entry) === key);
}

/* ---------- Aufgaben-Seite ---------- */

/** Alle sichtbaren Aufgaben, ungefiltert und unsortiert. */
export function taskEntries() {
  return state.entries.filter((entry) => entry.type === "aufgabe" && !entry.archived);
}

/** Die Sortiernummer einer Aufgabe: aufsteigend heißt Ältestes zuerst, Neues hängt unten. Ohne eigene zählt der Zeitpunkt des Anlegens. */
export function taskOrder(entry) {
  return Number.isFinite(entry.order) ? entry.order : entry.createdAt || 0;
}

/* Platz einer Priorität in der Spalten-Reihenfolge; Unbekanntes kommt hinten. */
function priorityRank(entry) {
  const index = taskPriorities.findIndex((item) => item.id === entry.priority);
  return index < 0 ? taskPriorities.length : index;
}

/* Wie weit unten eine Aufgabe steht: offen, dann erledigt, dann archiviert */
function doneRank(entry) {
  if (entry.archived) return 2;
  return isTaskDone(entry) ? 1 : 0;
}

/**
 * Aufgaben sortieren. Erledigtes steht immer ganz unten, Archiviertes darunter. `sortId` kommt aus
 * taskSorts (config.js): „erstellt“ ist die Reihenfolge des Anlegens — bzw.
 * die im Board von Hand gezogene —, „faellig“ das Datum, „titel“ das Alphabet.
 * `asc` false dreht die Reihenfolge um. „prio“ braucht nur die Übersicht
 * (insights.js), die keine Gruppen kennt.
 */
export function sortTasks(list, sortId = "erstellt", asc = true) {
  const rest = (a, b) => {
    if (sortId === "prio") return priorityRank(a) - priorityRank(b) || taskOrder(a) - taskOrder(b);
    if (sortId === "faellig") return String(a.date || "\uffff").localeCompare(String(b.date || "\uffff"));
    if (sortId === "titel") return String(a.title).localeCompare(String(b.title), "de");
    return taskOrder(a) - taskOrder(b);
  };
  const sign = asc ? 1 : -1;
  return [...list].sort((a, b) => doneRank(a) - doneRank(b) || sign * rest(a, b));
}

/* Lässt der Filter der Ansicht Status und Dringlichkeit dieser Aufgabe durch?
   Archiviertes hängt nur am Schalter „Archiviert“ und an der Dringlichkeit. */
function matchesFilter(entry, prefs) {
  if (entry.archived) return Boolean(prefs.showArchived) && !(prefs.hiddenPriorities || []).includes(taskPriorityOf(entry.priority).id);
  if (isTaskDone(entry)) return !prefs.hideDone && !(prefs.hiddenPriorities || []).includes(taskPriorityOf(entry.priority).id);
  if ((prefs.hiddenStatuses || []).includes(taskStatusOf(entry.status).id)) return false;
  return !(prefs.hiddenPriorities || []).includes(taskPriorityOf(entry.priority).id);
}

/** Aufgaben der Seite: nach Verknüpfungen, Status und Dringlichkeit gesiebt, sortiert. Archiviertes fehlt immer. */
export function visibleTasks(prefs) {
  const source = prefs.showArchived ? state.entries.filter((entry) => entry.type === "aufgabe") : taskEntries();
  const list = filterByLinks(source.filter((entry) => matchesFilter(entry, prefs)), prefs);
  return sortTasks(list, prefs.sort, prefs.sortAsc);
}

/**
 * Die Gruppen der Liste: [{ id, label, icon, color, items }] in der
 * Reihenfolge aus config.js. `field` sagt, welches Feld einer Aufgabe die
 * Gruppe bestimmt — oder null, wenn nicht gruppiert wird: dann gibt es genau
 * eine Gruppe ohne Namen mit allen Aufgaben.
 */
export function taskGroups(prefs) {
  const grouping = taskGroupings.find((item) => item.id === prefs.group) || null;
  const list = visibleTasks(prefs);
  if (!grouping) return { field: null, columns: [{ id: "alle", label: "", icon: "", color: "var(--muted)", items: list }] };
  const columns = grouping.columns.map((column) => ({ ...column, items: [] }));
  /* Nach Status gruppiert bekommt Archiviertes die eigene Spalte ganz rechts */
  const archive = grouping.field === "status" && prefs.showArchived ? { ...archiveColumn, items: [], locked: true } : null;
  if (archive) columns.push(archive);
  list.forEach((entry) => {
    if (archive && entry.archived) {
      archive.items.push(entry);
      return;
    }
    const target = columns.find((column) => column.id === entry[grouping.field]) || columns[0];
    target.items.push(entry);
  });
  return { field: grouping.field, columns };
}

/** Die Spalten des Boards: wie taskGroups — nur dass ein Board immer Spalten braucht, ungruppiert nach Dringlichkeit. */
export function taskColumns(prefs) {
  const grouping = taskGroupings.find((item) => item.id === prefs.group) ? prefs.group : taskGroupings[0].id;
  return taskGroups({ ...prefs, group: grouping });
}

/** Der erste Ablageort einer Aufgabe — dafür steht das kleine Label in der Zeile. */
export function mainPlace(entry) {
  const places = entry.places || [];
  return places.length ? places[0] : null;
}
