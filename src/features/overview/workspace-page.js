/*
 * Die Seite eines Arbeitsbereichs: zwei Pillen oben — „Schreibblock“ mit dem
 * freien Text zum Arbeitsbereich und „Verknüpfte Inhalte“ mit allem, was darin
 * liegt, nach Typ gruppiert und auf-/zuklappbar.
 * Pfad: src/features/overview/workspace-page.js
 *
 * Keine anpassbaren visuellen Werte: Pillen, Schreibblock und Gruppen stehen in
 * styles/rows.css (Klassen .page-pills, .workspace-body, .group-head).
 */

import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { entriesOf, findWorkspace } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";
import { groupedListMarkup } from "../../ui/groups.js";

/* Die beiden Pillen; die zweite trägt die Anzahl der Einträge. */
const pills = [
  { id: "notes", label: "Schreibblock", icon: "note" },
  { id: "links", label: "Verknüpfte Inhalte", icon: "link" },
];

function pillsMarkup(active, count) {
  return `<div class="tab-pills page-pills">${pills
    .map(
      (pill) => `
        <button class="tab-pill${pill.id === active ? " is-active" : ""}" type="button" data-page-pill="${pill.id}">
          ${icon(pill.icon, "tab-pill-icon")}${pill.label}${pill.id === "links" && count ? `<span class="media-count">${count}</span>` : ""}
        </button>`
    )
    .join("")}</div>`;
}

/* Der Schreibblock: freier Text, wird kurz nach dem Tippen gespeichert. */
function notesMarkup(workspace) {
  return `<textarea class="entry-body workspace-body" id="workspace-body" placeholder="Schreib etwas zu diesem Arbeitsbereich …" aria-label="Schreibblock">${escapeHtml(workspace.body || "")}</textarea>`;
}

/** Die Seite des offenen Arbeitsbereichs zeichnen. */
export function renderWorkspacePage(page) {
  const workspace = findWorkspace(page.workspaceId);
  if (!workspace) return;
  const count = entriesOf(page.parent).length;
  const body = ui.pagePill === "links" ? groupedListMarkup(page.parent) : notesMarkup(workspace);
  dom.pageBody.innerHTML = pillsMarkup(ui.pagePill, count) + body;
}

/** Tippt jemand gerade im Schreibblock? Dann darf die Seite nicht neu gezeichnet werden. */
export function isWritingNotes() {
  return document.activeElement === el("workspace-body");
}

/** Pillen und Schreibblock anmelden. */
export function initWorkspacePage() {
  dom.pageBody.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-page-pill]");
    if (!pill || !ui.currentPage || !ui.currentPage.isWorkspace) return;
    ui.pagePill = pill.dataset.pagePill;
    renderWorkspacePage(ui.currentPage);
  });

  dom.pageBody.addEventListener("input", (event) => {
    if (event.target.id !== "workspace-body" || !ui.currentPage) return;
    const workspace = findWorkspace(ui.currentPage.workspaceId);
    if (!workspace) return;
    workspace.body = event.target.value;
    scheduleSave();
  });
}
