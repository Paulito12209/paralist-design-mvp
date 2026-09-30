/*
 * Die Ansichten der Aufgaben-Seite — die Pillen über der Liste, wie die Tabs
 * über den Arbeitsbereichen. Jede Ansicht merkt sich ihr Layout (Liste oder
 * Board), Sortierung, Gruppierung, Ort-Filter und ob Erledigte zu sehen sind.
 * Die erste Ansicht „Alle“ ist fest: sie lässt sich nicht löschen, nicht
 * umbenennen und nicht filtern — Layout, Sortierung und Gruppierung darf
 * auch sie sich merken. Eine neue Ansicht beginnt als Kopie von „Alle“.
 * Pfad: src/data/task-views.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * allViewName    -> Name der festen ersten Ansicht
 * viewPlaceholder -> Vorgabename einer neuen Ansicht („Ansicht 2“)
 * copyPlaceholder -> Vorgabename einer Kopie („Alle Kopie“)
 *
 * Womit eine Ansicht startet, steht in src/data/config.js (taskDefaults).
 */

import { emit, events } from "../core/bus.js";
import { nextId, sameId } from "../core/ids.js";
import { taskDefaults } from "./config-tasks.js";
import { saveState, state, ui } from "./state.js";

export const allViewName = "Alle";
const viewPlaceholder = (n) => `Ansicht ${n}`;
const copyPlaceholder = (name) => `${name} Kopie`;

/** Die feste erste Ansicht, wie sie beim allerersten Start entsteht. */
export function allTaskView() {
  return { id: 1, name: allViewName, icon: null, fixed: true, ...taskDefaults };
}

/** Eine Ansicht nach ihrer id; null, wenn es sie nicht gibt. */
export function findTaskView(id) {
  return state.taskViews.find((view) => sameId(view.id, id)) || null;
}

/** Die gewählte Ansicht — im Zweifel „Alle“. */
export function activeTaskView() {
  return findTaskView(state.activeTaskViewId) || state.taskViews[0];
}

/* Speichern und alle sichtbaren Listen auffrischen. */
function commit() {
  saveState();
  emit(events.dataChanged);
}

/** Eine Ansicht wählen. */
export function selectTaskView(id) {
  if (!findTaskView(id)) return;
  state.activeTaskViewId = id;
  commit();
}

/** Einstellungen der gewählten Ansicht ändern; „Alle“ bleibt immer ungefiltert. */
export function updateTaskView(changes) {
  const view = activeTaskView();
  Object.assign(view, changes);
  if (view.fixed) view.place = taskDefaults.place;
  commit();
}

/* Eine Kopie anlegen, dahinter einreihen, auswählen und gleich benennen lassen. */
function insertCopy(source, index, placeholder) {
  const id = nextId(state.taskViews);
  const copy = { ...source, id, name: "", placeholder, icon: source.icon || null, fixed: false };
  state.taskViews.splice(index, 0, copy);
  state.activeTaskViewId = id;
  ui.editingTaskViewId = id;
  commit();
}

/** Neue Ansicht über das kleine Plus: eine Kopie von „Alle“ am Ende. */
export function addTaskView() {
  insertCopy(state.taskViews[0], state.taskViews.length, viewPlaceholder(state.taskViews.length + 1));
}

/** Eine bestimmte Ansicht verdoppeln — direkt hinter dem Original. */
export function duplicateTaskView(id) {
  const source = findTaskView(id);
  if (!source) return;
  const index = state.taskViews.indexOf(source);
  insertCopy(source, index + 1, copyPlaceholder(source.name || source.placeholder || allViewName));
}

/** Umbenennen beginnen (nicht bei „Alle“). */
export function beginRenameTaskView(id) {
  const view = findTaskView(id);
  if (!view || view.fixed) return;
  if (!view.placeholder) view.placeholder = view.name;
  ui.editingTaskViewId = id;
  emit(events.dataChanged);
}

/** Den getippten Namen übernehmen; leer bleibt der Vorgabename. */
export function commitTaskViewName(typed) {
  const view = findTaskView(ui.editingTaskViewId);
  ui.editingTaskViewId = null;
  if (view) view.name = typed.trim() || view.placeholder || viewPlaceholder(state.taskViews.indexOf(view) + 1);
  commit();
}

/** Icon einer Ansicht setzen oder entfernen. */
export function setTaskViewIcon(id, iconName) {
  const view = findTaskView(id);
  if (!view) return;
  view.icon = iconName || null;
  commit();
}

/** Eine Ansicht um einen Platz nach links (-1) oder rechts (+1) rücken; „Alle“ bleibt vorn. */
export function moveTaskView(id, dir) {
  const views = state.taskViews;
  const from = views.findIndex((view) => sameId(view.id, id));
  const to = from + dir;
  if (from < 1 || to < 1 || to >= views.length) return;
  const [view] = views.splice(from, 1);
  views.splice(to, 0, view);
  commit();
}

/** Eine Ansicht löschen; war sie gewählt, gilt danach „Alle“. */
export function deleteTaskView(id) {
  const view = findTaskView(id);
  if (!view || view.fixed) return;
  state.taskViews = state.taskViews.filter((item) => item !== view);
  if (sameId(state.activeTaskViewId, id)) state.activeTaskViewId = state.taskViews[0].id;
  commit();
}
