/*
 * Die Seite eines Arbeitsbereichs: zwei Pillen oben — „Inhalt“ mit dem
 * freien Text zum Arbeitsbereich und „Verknüpfte Einträge“ mit allem, was darin
 * liegt, nach Typ gruppiert und auf-/zuklappbar. Waagerecht wischen wechselt
 * zwischen den Pillen (src/ui/pill-swipe.js). Dieselben zwei Pillen zeigt
 * auch die Seite eines einzelnen Eintrags (src/features/entry/entry.js).
 * Pfad: src/features/overview/workspace-page.js
 *
 * Keine anpassbaren visuellen Werte: Pillen, Text und Gruppen stehen in
 * styles/rows.css (Klassen .page-pills, .workspace-body, .group-head).
 */

import { dom, el } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { entriesOf, findWorkspace } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";
import { groupedListMarkup } from "../../ui/groups.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";

/* Die beiden Pillen; die zweite trägt die Anzahl der Einträge. Kein Icon:
   es wird nie mehr als diese zwei geben, das Wort allein reicht. */
const pills = [
  { id: "notes", label: "Inhalt" },
  { id: "links", label: "Verknüpfte Einträge" },
];

function pillsMarkup(active, count) {
  return `<div class="tab-pills page-pills">${pills
    .map(
      (pill) => `
        <button class="tab-pill${pill.id === active ? " is-active" : ""}" type="button" data-page-pill="${pill.id}">
          ${pill.label}${pill.id === "links" && count ? `<span class="media-count">${count}</span>` : ""}
        </button>`
    )
    .join("")}</div>`;
}

/* Der Inhalt: freier Text, wird kurz nach dem Tippen gespeichert. */
function notesMarkup(workspace) {
  return `<textarea class="entry-body workspace-body" id="workspace-body" placeholder="Schreib etwas zu diesem Arbeitsbereich …" aria-label="Inhalt">${escapeHtml(workspace.body || "")}</textarea>`;
}

/** Die Seite des offenen Arbeitsbereichs zeichnen. */
export function renderWorkspacePage(page) {
  const workspace = findWorkspace(page.workspaceId);
  if (!workspace) return;
  const count = entriesOf(page.parent).length;
  const body = ui.pagePill === "links" ? groupedListMarkup(page.parent) : notesMarkup(workspace);
  dom.pageBody.innerHTML = pillsMarkup(ui.pagePill, count) + body;
}

/** Tippt jemand gerade im Inhalt? Dann darf die Seite nicht neu gezeichnet werden. */
export function isWritingNotes() {
  return document.activeElement === el("workspace-body");
}

/** Pillen und Inhalt anmelden. */
export function initWorkspacePage() {
  const isWorkspaceOpen = () => Boolean(ui.currentPage && ui.currentPage.isWorkspace);
  const selectPill = (id) => {
    if (!isWorkspaceOpen()) return;
    ui.pagePill = id;
    renderWorkspacePage(ui.currentPage);
  };

  dom.pageBody.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-page-pill]");
    if (pill) selectPill(pill.dataset.pagePill);
  });

  /* Waagerecht wischen wechselt ebenfalls die Pille — nur hier, die
     Sammlungen auf derselben Seite haben keine Pillen. */
  initPillSwipe(el("view-page"), {
    order: pills.map((pill) => pill.id),
    current: () => ui.pagePill,
    select: selectPill,
    enabled: isWorkspaceOpen,
  });

  dom.pageBody.addEventListener("input", (event) => {
    if (event.target.id !== "workspace-body" || !ui.currentPage) return;
    const workspace = findWorkspace(ui.currentPage.workspaceId);
    if (!workspace) return;
    workspace.body = event.target.value;
    scheduleSave();
  });
}
