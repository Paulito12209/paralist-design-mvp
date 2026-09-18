/*
 * „Verknüpfte Inhalte“: die Einträge eines Ablageorts, nach Typ gruppiert,
 * jede Gruppe mit Überschrift zum Auf- und Zuklappen. Kommt auf der Seite
 * eines Arbeitsbereichs und eines Projekts vor.
 * Pfad: src/ui/groups.js
 *
 * Keine anpassbaren visuellen Werte: Überschrift und Pfeil stehen in
 * styles/rows.css (Klassen .group-head, .group-body).
 */

import { icon } from "../core/html.js";
import { groupedEntriesOf } from "../data/queries.js";
import { ui } from "../data/state.js";
import { entryRow } from "./rows.js";

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
  if (!groups.length) return `<p class="empty-note">Noch keine Einträge.</p>`;
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
