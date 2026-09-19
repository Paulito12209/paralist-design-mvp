/*
 * „Verknüpfte Inhalte“: die Einträge eines Ablageorts, nach Typ gruppiert,
 * jede Gruppe mit Überschrift zum Auf- und Zuklappen. Kommt auf der Seite
 * eines Arbeitsbereichs und eines Projekts vor.
 * Pfad: src/ui/groups.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyLinks -> Emblem, Überschrift, Satz und Pille, solange hier nichts liegt
 *
 * Aussehen von Überschrift und Pfeil steht in styles/rows.css
 * (Klassen .group-head, .group-body), das des Platzhalters in
 * styles/empty-state.css.
 */

import { icon } from "../core/html.js";
import { groupedEntriesOf } from "../data/queries.js";
import { ui } from "../data/state.js";
import { emptyState } from "./empty-state.js";
import { entryRow } from "./rows.js";

/* Platzhalter, solange in diesem Arbeitsbereich oder Projekt nichts liegt. */
const emptyLinks = {
  icon: "layers",
  accent: "var(--prio-irgendwann)",
  title: "Noch nichts verknüpft",
  text: "Was du hier anlegst, bleibt an diesem Ort — Aufgaben, Notizen und Termine.",
  action: { label: "Eintrag hinzufügen", pick: "aufgabe" },
};

/** Schlüssel einer Gruppe im Merkzettel der eingeklappten Gruppen. */
export function groupKey(ref, type) {
  return `${ref || "inbox"}|${type}`;
}

/** Eine Gruppe: Überschrift mit Anzahl und Pfeil, darunter die Zeilen. */
function groupMarkup(ref, group) {
  const key = groupKey(ref, group.type);
  const open = !ui.collapsedGroups.has(key);
  return `
    <div class="group${open ? "" : " is-collapsed"}" data-group="${key}">
      <button class="group-head" type="button" data-toggle-group="${key}" aria-expanded="${open}">
        ${icon(group.icon, "group-icon")}
        <span class="group-label">${group.label}</span>
        <span class="group-count">${group.items.length}</span>
        ${icon("chevron", "group-chevron")}
      </button>
      <div class="group-body workspace-list"${open ? "" : " hidden"}>
        ${group.items.map((entry) => entryRow(entry)).join("")}
      </div>
    </div>
  `;
}

/** Alle Gruppen eines Ablageorts; leer, wenn dort nichts liegt. */
export function groupedListMarkup(ref) {
  const groups = groupedEntriesOf(ref);
  if (!groups.length) return emptyState(emptyLinks);
  return groups.map((group) => groupMarkup(ref, group)).join("");
}

/** Eine Gruppe auf- oder zuklappen, ohne die Seite neu zu zeichnen. */
export function toggleGroup(button) {
  const key = button.dataset.toggleGroup;
  const wrap = button.closest(".group");
  const body = wrap && wrap.querySelector(".group-body");
  if (!body) return;
  const open = body.hidden;
  body.hidden = !open;
  wrap.classList.toggle("is-collapsed", !open);
  button.setAttribute("aria-expanded", String(open));
  if (open) ui.collapsedGroups.delete(key);
  else ui.collapsedGroups.add(key);
}
