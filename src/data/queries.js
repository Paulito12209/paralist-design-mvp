/*
 * Fragen an die Daten: Welche Einträge liegen wo, wie viele sind es,
 * wie heißt ein Ablageort. Diese Datei ändert nie etwas — sie liest nur.
 * Pfad: src/data/queries.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { dayKey, timeKey } from "../core/dates.js";
import { sameId, sameParent } from "../core/ids.js";
import { overviewPages, resourceTypes, xpItems } from "./config.js";
import { state } from "./state.js";

/** Name eines Arbeitsbereichs; ein unbekannter Ablageort ist die Inbox. */
export function workspaceName(id) {
  const workspace = state.workspaces.find((item) => sameId(item.id, id));
  return workspace ? workspace.name : "Inbox";
}

/** Anzeigename eines Ablageorts — Übersichtskarte oder Arbeitsbereich. */
export function parentName(parent) {
  if (!parent) return "Inbox";
  const page = Object.values(overviewPages).find((item) => sameParent(item.parent, parent));
  return page ? page.title : workspaceName(parent);
}

/** Sichtbare Einträge eines Ablageorts (Archiviertes bleibt draußen). */
export function entriesOf(parent) {
  return state.entries.filter((entry) => !entry.archived && sameParent(entry.parent, parent));
}

/** Einen Eintrag nach ID finden, egal ob die ID als Zahl oder Text kommt. */
export function findEntry(id) {
  return state.entries.find((entry) => sameId(entry.id, id)) || null;
}

/** Einen Arbeitsbereich nach ID finden. */
export function findWorkspace(id) {
  return state.workspaces.find((workspace) => sameId(workspace.id, id)) || null;
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
