/*
 * Das Archiv: alles, was man aus einer Liste herausgewischt, aber nicht
 * gelöscht hat — erst die Arbeitsbereiche, dann die Einträge. Wischen nach
 * rechts holt eine Zeile zurück, nach links löscht sie endgültig.
 * Pfad: src/features/overview/archive.js
 *
 * Keine anpassbaren visuellen Werte: die Zeilen sehen aus wie überall
 * (styles/rows.css), der Platzhalter steht in styles/empty-state.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { archivedEntries, archivedWorkspaces, workspaceIcon, workspaceLabel } from "../../data/queries.js";
import { emptyState } from "../../ui/empty-state.js";
import { entryGlyph, swipeAction, swipeRow } from "../../ui/rows.js";

/* Ein leeres Archiv bekommt keine Pille: hier legt man nichts an, hier landet etwas. */
const emptyArchive = {
  icon: "archive",
  accent: "var(--archive-color)",
  title: "Das Archiv ist leer",
  text: "Wisch eine Zeile nach links und tippe auf den grauen Knopf, dann liegt sie hier.",
};

/* Beide Zeilenarten haben dieselben zwei Knöpfe, nur andere Namen dahinter. */
function archiveRow(dataAttr, restoreKind, deleteKind, rowHtml) {
  return swipeRow(
    dataAttr,
    [swipeAction(restoreKind, "Zurückholen", "history", "restore")],
    [swipeAction(deleteKind, "Löschen", "trash", "delete")],
    rowHtml
  );
}

function workspaceArchiveRow(workspace) {
  return archiveRow(
    `data-workspace="${workspace.id}"`,
    "restore-workspace",
    "delete-workspace",
    `
      <div class="workspace-row">
        ${icon(workspaceIcon(workspace))}
        <span>${escapeHtml(workspaceLabel(workspace))}</span>
      </div>
    `
  );
}

function entryArchiveRow(entry) {
  return archiveRow(
    `data-entry="${entry.id}"`,
    "restore",
    "delete",
    `
      <div class="workspace-row entry-row">
        ${entryGlyph(entry)}
        <span>${escapeHtml(entry.title)}</span>
      </div>
    `
  );
}

/** Die Liste des Archivs als HTML. */
export function archiveMarkup() {
  const spaces = archivedWorkspaces();
  const entries = archivedEntries();
  if (!spaces.length && !entries.length) return emptyState(emptyArchive);

  return `<div class="workspace-list">${spaces.map(workspaceArchiveRow).join("")}${entries
    .map(entryArchiveRow)
    .join("")}</div>`;
}
