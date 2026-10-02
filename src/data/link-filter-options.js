/*
 * Woraus das Blatt „Filtern“ die Werte für „Verknüpft mit“ nimmt: die
 * Sammel-Chips (Irgendwas, Eingang, Arbeitsbereiche, je Typ), der Name eines
 * bestimmten Eintrags und die Liste zum Aussuchen. Was davon durchkommt,
 * rechnet src/data/link-filter.js.
 *
 * Zwei Seiten kennen den Filter: die Aufgaben („task“) und die Projekte
 * („project“). Ein Projekt kann kein Projekt enthalten, darum fehlt dort der
 * Typ Projekte.
 * Pfad: src/data/link-filter-options.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * kindLabels  -> Namen und Icons der drei Sammel-Chips
 * spaceTab    -> Name der Pille „Arbeitsbereiche“ in der Auswahl
 */

import { typeIcon, typeOrder, typePlurals, typeSingular } from "./config.js";
import { anyId, inboxId, spaceId } from "./link-filter-fields.js";
import { findEntry, findWorkspace, groupByType, workspaceIcon, workspaceLabel } from "./queries.js";
import { entryRef, isEntryRef, isWorkspaceRef, refId, workspaceRef } from "./refs.js";
import { state } from "./state.js";

const kindLabels = {
  [anyId]: { label: "Irgendwas", icon: "link" },
  [inboxId]: { label: "Eingang", icon: "inbox" },
  [spaceId]: { label: "Arbeitsbereiche", icon: "layers" },
};
const spaceTab = "Arbeitsbereiche";

/* Die Typen, die in dieser Seite vorkommen können */
function typesFor(scope) {
  return scope === "project" ? typeOrder.filter((type) => type !== "projekt") : typeOrder;
}

/**
 * Die Sammel-Chips für den Abschnitt: [{ id, label, icon }]. Ein Typ steht
 * nur da, wenn es Einträge davon gibt — oder wenn er schon gewählt ist, damit
 * man ihn wieder abwählen kann.
 */
export function linkKindOptions(scope, view) {
  const present = new Set(state.entries.filter((entry) => !entry.archived).map((entry) => entry.type));
  const shown = (type) => present.has(type) || view.linkKinds.includes(type);
  const fixed = [anyId, inboxId, spaceId].map((id) => ({ id, ...kindLabels[id] }));
  const kinds = typesFor(scope)
    .filter(shown)
    .map((type) => ({ id: type, label: typePlurals[type] || type, icon: typeIcon(type) }));
  return [...fixed, ...kinds];
}

/** Name und Icon eines bestimmten Eintrags oder Arbeitsbereichs; null, wenn es ihn nicht mehr gibt. */
export function linkRefInfo(ref) {
  if (isWorkspaceRef(ref)) {
    const workspace = findWorkspace(refId(ref));
    return workspace ? { label: workspaceLabel(workspace), icon: workspaceIcon(workspace) } : null;
  }
  const entry = isEntryRef(ref) ? findEntry(refId(ref)) : null;
  if (!entry || entry.archived) return null;
  return { label: entry.title || typeSingular(entry.type), icon: entry.icon || typeIcon(entry.type) };
}

/**
 * Die Liste zum Aussuchen, als Pillen: „Arbeitsbereiche“ und je Typ eine —
 * [{ id, label, items: [{ ref, label, icon }] }], nur Pillen mit Inhalt.
 */
export function linkPickTabs(scope) {
  const spaces = state.workspaces
    .filter((workspace) => !workspace.archived)
    .map((workspace) => ({ ref: workspaceRef(workspace.id), label: workspaceLabel(workspace), icon: workspaceIcon(workspace) }));
  const allowed = new Set(typesFor(scope));
  const pool = state.entries.filter((entry) => !entry.archived && allowed.has(entry.type));
  const groups = groupByType(pool).map((group) => ({
    id: group.type,
    label: group.label,
    items: group.items.map((entry) => ({ ref: entryRef(entry.id), label: entry.title || typeSingular(entry.type), icon: entry.icon || typeIcon(entry.type) })),
  }));
  return [{ id: spaceId, label: spaceTab, items: spaces }, ...groups].filter((tab) => tab.items.length);
}
