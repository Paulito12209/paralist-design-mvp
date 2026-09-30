/*
 * Was durchsucht wird und in welcher Reihenfolge die Treffer stehen.
 * Durchsucht werden Einträge (Titel und Text), Arbeitsbereiche und die
 * Übersichtskarten.
 * Pfad: src/features/search/search-data.js
 *
 * Keine anpassbaren visuellen Werte: wie viele Treffer die Suchseite zeigt
 * und wie sie gefiltert werden, steht in search-refine.js.
 */

import { projectsPage } from "../../data/collections.js";
import { overviewPages, typeIcon, typeLabel } from "../../data/config.js";
import { openCounts } from "../../data/opens.js";
import { findEntry, findWorkspace, placesLabel, workspaceIcon } from "../../data/queries.js";
import { state } from "../../data/state.js";

/** Ein Eintrag als Such-Zeile. */
export function itemOfEntry(entry) {
  return {
    kind: "entry",
    id: entry.id,
    type: entry.type,
    title: entry.title || "Ohne Titel",
    icon: typeIcon(entry.type),
    label: typeLabel(entry.type),
    note: placesLabel(entry),
    /* Der Eintrag selbst: danach filtert und sortiert die Suchseite (search-refine.js) */
    entry,
  };
}

/** Ein Arbeitsbereich als Such-Zeile. */
export function itemOfWorkspace(workspace) {
  return {
    kind: "workspace",
    id: workspace.id,
    title: workspace.name,
    icon: workspaceIcon(workspace),
    label: "Arbeitsbereich",
  };
}

/** Eine Übersichtskarte als Such-Zeile. */
function itemOfPage(id, page) {
  return { kind: "overview", id, title: page.title, icon: page.icon, label: "Übersicht" };
}

/**
 * Aus einem Merkposten wird erst beim Anzeigen eine Zeile:
 * Gelöschtes fällt so von allein heraus.
 */
export function resolveOpen(open) {
  if (open.kind === "entry") {
    const entry = findEntry(open.id);
    return entry && !entry.archived ? itemOfEntry(entry) : null;
  }
  if (open.kind === "workspace") {
    const workspace = findWorkspace(open.id);
    return workspace ? itemOfWorkspace(workspace) : null;
  }
  /* Alles andere (früher auch Sammlungen) gehört nicht in die Merklisten. */
  return null;
}

/** Alle Merkposten, die es noch gibt, als fertige Zeilen-Bausteine. */
export function knownOpens() {
  return state.opens.map((open) => ({ open, item: resolveOpen(open) })).filter((row) => row.item);
}

/** Merkposten nach Häufigkeit, bei Gleichstand der jüngere zuerst. */
export function mostOpened() {
  return knownOpens().sort((a, b) => b.open.count - a.open.count || b.open.ts - a.open.ts);
}

/*
 * Alles Durchsuchbare: der Titel, der ganze Text, in dem gesucht wird, und
 * wie daraus eine Zeile wird. Die Zeile entsteht erst für die Treffer — sonst würde bei jedem
 * getippten Buchstaben für jeden Eintrag der Ablageort nachgeschlagen.
 */
function searchPool() {
  return [
    ...state.entries
      .filter((entry) => !entry.archived)
      .map((entry) => ({
        title: entry.title || "",
        text: `${entry.title} ${entry.body || ""}`,
        make: () => itemOfEntry(entry),
      })),
    ...state.workspaces.map((workspace) => ({
      title: workspace.name,
      text: workspace.name,
      make: () => itemOfWorkspace(workspace),
    })),
    ...Object.entries(overviewPages).map(([id, page]) => ({
      title: page.title,
      text: page.title,
      make: () => itemOfPage(id, page),
    })),
    /* Die Seite Projekte steht wie eine Karte in der Suche; ihr Schlüssel ist ihre Art. */
    { title: projectsPage.title, text: projectsPage.title, make: () => itemOfPage(projectsPage.kind, { ...projectsPage, icon: "rocket" }) },
  ];
}

/**
 * Alle Treffer zu einem Suchbegriff, ohne Obergrenze. Zuerst kommen Titel, die
 * mit dem Begriff beginnen, danach das, was am häufigsten geöffnet wurde.
 * Die Such-Palette am Desktop teilt sie in Gruppen und zählt sie.
 * `titleOnly` sucht nur im Titel, nicht im Text (Schalter „Nur im Titel“).
 */
export function matchingItems(query, { titleOnly = false } = {}) {
  const needle = query.toLowerCase();
  /* Die Anzahlen einmal nachschlagen, nicht für jeden Vergleich neu suchen. */
  const counts = openCounts();
  const countOf = (item) => counts.get(`${item.kind}:${item.id}`) || 0;

  return searchPool()
    .filter((row) => (titleOnly ? row.title : row.text).toLowerCase().includes(needle))
    .map((row) => row.make())
    .sort((a, b) => {
      const startA = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
      const startB = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
      if (startA !== startB) return startA - startB;
      return countOf(b) - countOf(a);
    });
}
