/*
 * Fragen an die Daten: Welche Einträge liegen wo, wie viele sind es,
 * wie heißt ein Ablageort. Diese Datei ändert nie etwas — sie liest nur.
 *
 * Das Modell in einem Satz: Arbeitsbereiche stehen ganz oben, darin liegen
 * Projekte, in Projekten alles andere; jeder Eintrag hat genau einen Ablageort
 * (`parent`, ein Verweis aus refs.js, null = Inbox).
 * Pfad: src/data/queries.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dayKey, timeKey } from "../core/dates.js";
import { sameId, sameParent } from "../core/ids.js";
import { containerTypes, overviewPages, resourceTypes, typeIcon, typeOrder, typePlurals, xpItems } from "./config.js";
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
  return state.entries.filter((entry) => !entry.archived && sameParent(entry.parent, ref));
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
export function parentOptionsFor(entry = null) {
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
  return state.workspaces.filter((workspace) => sameId(workspace.tab, state.activeTabId));
}

/** Zahl auf der Favoriten-Karte: markierte Arbeitsbereiche plus markierte Einträge. */
export function favoriteCount() {
  return (
    state.workspaces.filter((workspace) => workspace.favorite).length +
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
