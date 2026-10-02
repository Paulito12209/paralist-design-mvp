/*
 * Die Ansichten der Projekte — die Pillen über der Projektliste auf der
 * Übersicht und der Seite Projekte, gebaut wie die Ansichten der
 * Aufgaben-Seite (src/data/task-views.js). Jede Ansicht merkt sich ihre
 * Sortierung, ihr Layout (Liste oder Board, `layout` und `group`) und entweder eine handverlesene Liste von Projekten (`ids`)
 * oder die Filter: „Verknüpft mit“ (Arbeitsbereiche und Inhalt,
 * src/data/link-filter.js), Status, Dringlichkeit und „Nur Favoriten“. Sind
 * `ids` gefüllt, zählen nur sie; die Filter ruhen dann. Die erste Ansicht „Alle“
 * ist fest (sie steht vorn, solange neue Ansichten nicht davor eingereiht werden —
 * src/data/view-place.js): sie zeigt jedes Projekt, darf aber sortieren. Eine neue Ansicht
 * beginnt als Kopie von „Alle“. Verschiebt man eine Projektzeile mit dem
 * Finger (src/ui/row-reorder.js) oder im Board (src/features/overview/projects-board.js),
 * wechselt die Ansicht auf „Eigene Reihenfolge“; gemerkt wird sie je Ansicht unter dem Schlüssel
 * projectOrderScope(id) in src/data/manual-order.js.
 * Pfad: src/data/project-views.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * projectOrderPrefix -> Anfang des Schlüssels, unter dem eine Ansicht ihre eigene Reihenfolge merkt
 * allProjectViewName -> Name der festen ersten Ansicht
 * viewPlaceholder    -> Vorgabename einer neuen Ansicht („Ansicht 2“)
 * copyPlaceholder    -> Vorgabename einer Kopie („Alle Kopie“)
 *
 * Womit eine Ansicht startet und wonach sie sortieren kann, steht in
 * src/data/config.js (projectViewDefaults, projectSorts).
 */

import { emit, events } from "../core/bus.js";
import { nextId, sameId } from "../core/ids.js";
import { manualId, sortEntries } from "./collection-sorts.js";
import { projectSorts, projectViewDefaults } from "./config.js";
import { taskGroupings, taskLayouts, taskPriorities, taskPriorityOf, taskStatuses, taskStatusOf } from "./config-tasks.js";
import { filterByLinks } from "./link-filter.js";
import { cleanLinkFields } from "./link-filter-fields.js";
import { manualRank } from "./manual-order.js";
import { entriesOf, projectEntries } from "./queries.js";
import { entryRef, isWorkspaceRef, workspaceRef } from "./refs.js";
import { saveState, state, ui } from "./state.js";
import { setTabIconsOn } from "./tab-icons.js";
import { fixedViewOf, newViewIndex } from "./view-place.js";

export const projectOrderPrefix = "pv:";
export const allProjectViewName = "Alle";
const viewPlaceholder = (n) => `Ansicht ${n}`;
const copyPlaceholder = (name) => `${name} Kopie`;

/** Die feste erste Ansicht, wie sie beim allerersten Start entsteht. */
export function allProjectView() {
  return { id: 1, name: allProjectViewName, icon: null, fixed: true, ...projectViewDefaults, ids: [] };
}

/** Eine Ansicht nach ihrer id; null, wenn es sie nicht gibt. */
export function findProjectView(id) {
  return state.projectViews.find((view) => sameId(view.id, id)) || null;
}

/** Die gewählte Ansicht — im Zweifel „Alle“. */
export function activeProjectView() {
  return findProjectView(state.activeProjectViewId) || fixedViewOf(state.projectViews);
}

/** Der Schlüssel, unter dem eine Ansicht ihre eigene Reihenfolge merkt (data-reorder der Liste). */
export function projectOrderScope(id) {
  return `${projectOrderPrefix}${id}`;
}

/** Die Ansicht zu so einem Schlüssel; null, wenn es keine ist oder sie nicht mehr existiert. */
export function projectViewOfScope(scope) {
  if (!String(scope).startsWith(projectOrderPrefix)) return null;
  return findProjectView(scope.slice(projectOrderPrefix.length));
}

/** Anzeigename einer Ansicht; leer heißt: der Vorgabename gilt. */
export function projectViewLabel(view) {
  return view.name || view.placeholder || allProjectViewName;
}

/* Speichern und alle sichtbaren Listen auffrischen. */
function commit() {
  saveState();
  emit(events.dataChanged);
}

/* „Alle“ bleibt ungefiltert und ohne Auswahl — nur die Sortierung darf sie sich merken. */
function keepAllOpen(view) {
  if (!view.fixed) return;
  Object.assign(view, {
    linkKinds: [],
    linkRefs: [],
    linkNot: false,
    hiddenStatuses: [],
    hiddenPriorities: [],
    statusNot: false,
    priorityNot: false,
    favoritesOnly: false,
    ids: [],
  });
}

/** Eine Ansicht wählen. */
export function selectProjectView(id) {
  if (!findProjectView(id)) return;
  state.activeProjectViewId = Number(id);
  commit();
}

/** Einstellungen einer Ansicht ändern (ohne Angabe: der gewählten). */
export function updateProjectView(changes, id = state.activeProjectViewId) {
  const view = findProjectView(id) || activeProjectView();
  Object.assign(view, changes);
  keepAllOpen(view);
  commit();
}

/* Eine Kopie anlegen, dahinter einreihen, auswählen und gleich benennen lassen. */
function insertCopy(source, index, placeholder) {
  const id = nextId(state.projectViews);
  const copy = { ...source, ids: [...source.ids], id, name: "", placeholder, icon: source.icon || null, fixed: false };
  state.projectViews.splice(index, 0, copy);
  state.activeProjectViewId = id;
  ui.editingProjectViewId = id;
  commit();
  return copy;
}

/** Neue Ansicht über das kleine Plus: eine Kopie von „Alle“, vor „Alle“ oder am Ende (Einstellungen › Tabs). */
export function addProjectView() {
  const views = state.projectViews;
  return insertCopy(fixedViewOf(views), newViewIndex(views), viewPlaceholder(views.length + 1));
}

/** Eine bestimmte Ansicht verdoppeln — direkt hinter dem Original. */
export function duplicateProjectView(id) {
  const source = findProjectView(id);
  if (!source) return;
  insertCopy(source, state.projectViews.indexOf(source) + 1, copyPlaceholder(projectViewLabel(source)));
}

/** Umbenennen beginnen (nicht bei „Alle“). */
export function beginRenameProjectView(id) {
  const view = findProjectView(id);
  if (!view || view.fixed) return;
  if (!view.placeholder) view.placeholder = view.name;
  ui.editingProjectViewId = view.id;
  emit(events.dataChanged);
}

/** Den getippten Namen übernehmen; leer bleibt der Vorgabename. */
export function commitProjectViewName(typed) {
  const view = findProjectView(ui.editingProjectViewId);
  ui.editingProjectViewId = null;
  if (view) {
    view.name = String(typed || "").trim() || view.placeholder || viewPlaceholder(state.projectViews.indexOf(view) + 1);
  }
  commit();
}

/** Icon einer Ansicht setzen oder entfernen. */
export function setProjectViewIcon(id, iconName) {
  const view = findProjectView(id);
  if (!view) return;
  view.icon = iconName || null;
  /* Ein gewähltes Icon soll man sehen — auch wenn die Ansichten bisher nur Text zeigten */
  if (iconName) setTabIconsOn("projects", true);
  commit();
}

/** Eine Ansicht um einen Platz nach links (-1) oder rechts (+1) rücken; „Alle“ selbst bleibt, wo sie ist. */
export function moveProjectView(id, dir) {
  const views = state.projectViews;
  const from = views.findIndex((view) => sameId(view.id, id));
  const to = from + dir;
  if (from < 0 || views[from].fixed || to < 0 || to >= views.length) return;
  const [view] = views.splice(from, 1);
  views.splice(to, 0, view);
  commit();
}

/** Eine Ansicht löschen; war sie gewählt, gilt danach „Alle“. */
export function deleteProjectView(id) {
  const view = findProjectView(id);
  if (!view || view.fixed) return;
  state.projectViews = state.projectViews.filter((item) => item !== view);
  if (sameId(state.activeProjectViewId, id)) state.activeProjectViewId = fixedViewOf(state.projectViews).id;
  /* Ihre eigene Reihenfolge braucht niemand mehr */
  if (state.prefs.manualOrders) delete state.prefs.manualOrders[projectOrderScope(view.id)];
  commit();
}

/** Ein Projekt in die handverlesene Liste einer Ansicht nehmen oder wieder heraus. */
export function toggleProjectInView(projectId, id = state.activeProjectViewId) {
  const view = findProjectView(id);
  if (!view || view.fixed) return;
  const has = view.ids.some((item) => sameId(item, projectId));
  view.ids = has ? view.ids.filter((item) => !sameId(item, projectId)) : [...view.ids, Number(projectId)];
  commit();
}

/* ---------- Welche Projekte eine Ansicht zeigt ---------- */

/* Die Projekte zählen zusätzlich ihre Einträge; alles andere vergleicht
   src/data/collection-sorts.js wie in den übrigen Sammlungen. */
const projectKeys = {
  eintraege: (project) => entriesOf(entryRef(project.id)).length,
};

/**
 * Projekte sortieren; bei Gleichstand entscheidet der Name.
 * @param scope der Schlüssel der eigenen Reihenfolge — nötig nur für „Eigene Reihenfolge“.
 */
export function sortProjects(list, sortId, asc, scope = "") {
  return sortEntries(list, sortId, asc, { ...projectKeys, [manualId]: manualRank(scope, "e") });
}

/* Lässt der Filter Status und Dringlichkeit dieses Projekts durch? */
function matchesStatus(project, view) {
  return !view.hiddenStatuses.includes(taskStatusOf(project.status).id) && !view.hiddenPriorities.includes(taskPriorityOf(project.priority).id);
}

/** Die Projekte einer Ansicht, sortiert — archivierte bleiben draußen. */
export function visibleProjects(view = activeProjectView()) {
  const pool = projectEntries();
  const list = view.ids.length
    ? pool.filter((project) => view.ids.some((id) => sameId(id, project.id)))
    : filterByLinks(
        pool.filter((project) => matchesStatus(project, view) && (!view.favoritesOnly || project.favorite)),
        view
      );
  return sortProjects(list, view.sort, view.sortAsc, projectOrderScope(view.id));
}

/* ---------- Anlegen, Löschen, Laden ---------- */

/**
 * Der Arbeitsbereich, den eine Ansicht fürs Anlegen vorgibt: nur wenn sie
 * genau einen Arbeitsbereich verlangt und sonst nichts — sonst ist offen, wohin.
 */
export function draftSpace(view) {
  const only = !view.linkNot && view.linkKinds.length === 0 && view.linkRefs.length === 1;
  return only && isWorkspaceRef(view.linkRefs[0]) ? view.linkRefs[0] : null;
}

/**
 * Ein frisch angelegtes Projekt der Ansicht zuordnen, aus der „Projekt
 * hinzufügen“ kam — sonst wäre es in einer gefilterten Ansicht sofort
 * unsichtbar. Mit Auswahl kommt es in die Liste; ohne Auswahl bekommt es den
 * einzigen Arbeitsbereich des Filters „Verknüpft mit“ als Ort und bei „Nur
 * Favoriten“ den Stern.
 * Ruft src/data/mutations-tasks.js (applyEntryDefaults) beim Anlegen auf.
 */
export function applyProjectDraft(entry) {
  const draft = ui.projectDraftView;
  ui.projectDraftView = null;
  const view = entry.type === "projekt" && draft != null ? findProjectView(draft) : null;
  if (!view || view.fixed) return;
  if (view.ids.length) {
    view.ids.push(entry.id);
    return;
  }
  const space = draftSpace(view);
  if (space && !entry.places.includes(space)) entry.places.push(space);
  if (view.favoritesOnly) entry.favorite = true;
}

/** Ein gelöschtes Projekt aus allen Auswahl-Listen streichen. */
export function dropProjectFromViews(id) {
  state.projectViews.forEach((view) => {
    view.ids = view.ids.filter((item) => !sameId(item, id));
  });
}

/** Einen Ort, den es nicht mehr gibt, aus den Filtern „Verknüpft mit“ nehmen — der Rest des Filters bleibt. */
export function dropPlaceFromViews(ref) {
  state.projectViews.forEach((view) => {
    view.linkRefs = view.linkRefs.filter((item) => item !== ref);
  });
}

/* Eine Auswahl auf gültige Werte prüfen; unbekannte Werte fallen auf die Vorgabe zurück. */
function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/**
 * Den gespeicherten Stand übernehmen (aus src/data/state.js, nach der
 * Migration): fehlt die Liste, entsteht „Alle“; steht „Alle“ nicht vorn,
 * rückt sie nach vorn; `ids` zeigen nur auf Projekte, die es gibt; die
 * gewählte Ansicht existiert. Gibt zurück, ob sich etwas geändert hat.
 */
export function adoptProjectViews(saved) {
  const list = Array.isArray(saved.projectViews) ? saved.projectViews.filter((view) => view && typeof view === "object") : [];
  if (!list.some((view) => view.fixed)) list.unshift(allProjectView());
  /* Genau eine Ansicht ist „Alle“: die erste mit dem Merkmal, wo sie auch steht */
  const fixedAt = list.findIndex((view) => view.fixed);

  const projects = new Set(state.entries.filter((entry) => entry.type === "projekt").map((entry) => String(entry.id)));
  const validRefs = new Set(state.workspaces.map((workspace) => workspaceRef(workspace.id)).concat(state.entries.map((entry) => entryRef(entry.id))));
  const known = (value, items) => (Array.isArray(value) ? [...new Set(value)].filter((id) => items.some((item) => item.id === id)) : []);
  const sorts = projectSorts.map((item) => item.id);
  const groups = taskGroupings.map((item) => item.id);
  state.projectViews = list.map((view, index) => {
    const ids = Array.isArray(view.ids) ? [...new Set(view.ids.map(Number))].filter((id) => projects.has(String(id))) : [];
    const clean = {
      id: Number(view.id) || index + 1,
      name: index === fixedAt ? allProjectViewName : String(view.name || ""),
      placeholder: typeof view.placeholder === "string" ? view.placeholder : undefined,
      icon: typeof view.icon === "string" ? view.icon : null,
      fixed: index === fixedAt,
      layout: pick(view.layout, taskLayouts, projectViewDefaults.layout),
      group: pick(view.group, groups, projectViewDefaults.group),
      sort: pick(view.sort, sorts, projectViewDefaults.sort),
      sortAsc: typeof view.sortAsc === "boolean" ? view.sortAsc : projectViewDefaults.sortAsc,
      ...cleanLinkFields(view, validRefs),
      hiddenStatuses: known(view.hiddenStatuses, taskStatuses),
      hiddenPriorities: known(view.hiddenPriorities, taskPriorities),
      statusNot: view.statusNot === true,
      priorityNot: view.priorityNot === true,
      favoritesOnly: view.favoritesOnly === true,
      ids,
    };
    keepAllOpen(clean);
    return clean;
  });
  const active = Number(saved.activeProjectViewId);
  state.activeProjectViewId = state.projectViews.some((view) => view.id === active) ? active : fixedViewOf(state.projectViews).id;
  return (
    JSON.stringify(state.projectViews) !== JSON.stringify(saved.projectViews) ||
    state.activeProjectViewId !== saved.activeProjectViewId
  );
}
