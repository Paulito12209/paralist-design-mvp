/*
 * Was der Filter „Verknüpft mit“ durchlässt (Felder: src/data/link-filter-fields.js).
 *
 * Womit ein Eintrag verbunden ist, sind drei Dinge zusammen: seine Ablageorte
 * (`places`: Arbeitsbereiche und Projekte), seine Verknüpfungen (`links`) und —
 * bei einem Projekt — alles, was in ihm liegt. Ein Wert im Filter passt, wenn
 * eine dieser Verbindungen auf ihn zutrifft; mehrere Werte gelten als ODER.
 * „enthält nicht“ dreht das Ergebnis um. Archivierte Einträge zählen nicht
 * als Verbindung, auch wenn sie noch dran hängen.
 * Pfad: src/data/link-filter.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { anyId, inboxId, linkFilterOn, spaceId } from "./link-filter-fields.js";
import { entryRef, isEntryRef, isWorkspaceRef, refId, workspaceRef } from "./refs.js";
import { state } from "./state.js";

/* Einmal je Filterlauf gebaut: Einträge nach Nummer und was in welchem Ort liegt */
function buildIndex() {
  const byId = new Map();
  const contents = new Map();
  state.entries.forEach((entry) => {
    byId.set(String(entry.id), entry);
    if (entry.archived) return;
    (entry.places || []).forEach((ref) => {
      if (!contents.has(ref)) contents.set(ref, []);
      contents.get(ref).push(entry);
    });
  });
  const spaces = new Set(state.workspaces.filter((space) => !space.archived).map((space) => workspaceRef(space.id)));
  return { byId, contents, spaces };
}

/* Die Verbindungen eines Eintrags als Verweise; archivierte und verschwundene fehlen */
function connectionsOf(entry, index) {
  const refs = [...(entry.places || [])];
  (entry.links || []).forEach((id) => refs.push(entryRef(id)));
  if (entry.type === "projekt") (index.contents.get(entryRef(entry.id)) || []).forEach((item) => refs.push(entryRef(item.id)));
  return refs.filter((ref) => {
    if (isWorkspaceRef(ref)) return index.spaces.has(ref);
    const other = isEntryRef(ref) ? index.byId.get(String(refId(ref))) : null;
    return Boolean(other) && !other.archived;
  });
}

/* Welche Art Verbindung ein Verweis ist: „space“ oder der Typ des Eintrags */
function kindOf(ref, index) {
  if (isWorkspaceRef(ref)) return spaceId;
  return index.byId.get(String(refId(ref))).type;
}

function matches(entry, view, index) {
  const refs = connectionsOf(entry, index);
  if (view.linkKinds.includes(anyId) && refs.length) return true;
  if (view.linkKinds.includes(inboxId) && !(entry.places || []).length) return true;
  if (view.linkRefs.some((ref) => refs.includes(ref))) return true;
  return refs.some((ref) => view.linkKinds.includes(kindOf(ref, index)));
}

/**
 * Die Einträge, die der Filter der Ansicht durchlässt; ohne Filter alle.
 * @param list Aufgaben oder Projekte
 * @param view eine Ansicht mit linkKinds, linkRefs und linkNot
 */
export function filterByLinks(list, view) {
  if (!linkFilterOn(view)) return list;
  const index = buildIndex();
  return list.filter((entry) => matches(entry, view, index) !== view.linkNot);
}
