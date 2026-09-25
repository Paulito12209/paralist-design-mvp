/*
 * Die Seite eines Arbeitsbereichs: zwei Pillen oben — „Inhalt“ mit dem
 * freien Text zum Arbeitsbereich und „Verknüpfte Einträge“ mit allem, was darin
 * liegt, nach Typ gruppiert und auf-/zuklappbar. Waagerecht wischen wechselt
 * zwischen den Pillen (src/ui/pill-swipe.js). Dieselben zwei Pillen zeigt
 * auch die Seite eines einzelnen Eintrags (src/features/entry/entry.js) —
 * und wie dort startet ein Tipp unter den Text das Schreiben, bei offener
 * Tastatur schließt ein Tipp nur sie (src/ui/write-tap.js).
 *
 * Rechts neben den Pillen stehen dieselben Knöpfe wie auf einer Eintragsseite
 * (src/ui/page-tools.js): Kopieren unter „Inhalt“ — Name als Überschrift und
 * Text —, Filter und Plus unter „Verknüpfte Einträge“.
 * Pfad: src/features/overview/workspace-page.js
 *
 * Keine anpassbaren visuellen Werte: Pillen und Gruppen stehen in
 * styles/rows.css (Klassen .page-pills, .group-head), der Text und die
 * Knöpfe neben den Pillen in styles/entry.css (Klassen .entry-body,
 * .workspace-body, .page-pills-row).
 */

import { emit, events } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { escapeHtml } from "../../core/html.js";
import { entriesOf, findWorkspace, groupedEntriesOf, workspaceLabel } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";
import { groupedListMarkup } from "../../ui/groups.js";
import {
  activeFilter,
  openFilterMenu,
  pageToolsMarkup,
  pillsRowMarkup,
  registerCopySource,
} from "../../ui/page-tools.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { addWritePage } from "../../ui/write-tap.js";

/* Die beiden Pillen; die zweite trägt die Anzahl der Einträge. Kein Icon:
   es wird nie mehr als diese zwei geben, das Wort allein reicht. */
const pills = [
  { id: "notes", label: "Inhalt" },
  { id: "links", label: "Verknüpfte Einträge" },
];

/* Das Wort steht in einem eigenen span: wird es eng, kürzt nur das Wort mit
   „…“, die Zahl dahinter bleibt ganz (styles/entry.css). */
function pillsMarkup(active, count) {
  return `<div class="tab-pills page-pills">${pills
    .map(
      (pill) => `
        <button class="tab-pill${pill.id === active ? " is-active" : ""}" type="button" data-page-pill="${pill.id}">
          <span class="tab-pill-label">${pill.label}</span>${pill.id === "links" && count ? `<span class="media-count">${count}</span>` : ""}
        </button>`
    )
    .join("")}</div>`;
}

/* Schlüssel dieser Seite für den Filter — getrennt von den Eintragsseiten. */
function filterKey(page) {
  return `w:${page.workspaceId}`;
}

/* Der offene Arbeitsbereich — nur, wenn die Ansicht gerade einen zeigt. */
function openWorkspace() {
  const page = ui.currentPage;
  return page && page.isWorkspace ? findWorkspace(page.workspaceId) : null;
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
  const groups = groupedEntriesOf(page.parent);
  const type = activeFilter(filterKey(page), groups);
  const body = ui.pagePill === "links" ? groupedListMarkup(page.parent, type) : notesMarkup(workspace);
  const tools = pageToolsMarkup(ui.pagePill, filterKey(page), groups);
  dom.pageBody.innerHTML = pillsRowMarkup(pillsMarkup(ui.pagePill, count), tools) + body;
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
    /* Der Text wird gleich ersetzt: vorher den Cursor herausnehmen, sonst
       bliebe die Tastatur für ein Feld offen, das es nicht mehr gibt. */
    if (id !== "notes") el("workspace-body")?.blur();
    ui.pagePill = id;
    renderWorkspacePage(ui.currentPage);
  };

  /* Kopiert wird der Name als Überschrift und der Text darunter. */
  registerCopySource("page", () => {
    const workspace = openWorkspace();
    return workspace ? { title: workspaceLabel(workspace), body: workspace.body } : null;
  });

  dom.pageBody.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-page-pill]");
    if (pill) {
      selectPill(pill.dataset.pagePill);
      return;
    }
    const page = ui.currentPage;
    if (!isWorkspaceOpen()) return;
    const filterBtn = event.target.closest("[data-link-filter]");
    if (filterBtn) {
      openFilterMenu(filterBtn, filterKey(page), groupedEntriesOf(page.parent), () => renderWorkspacePage(ui.currentPage));
      return;
    }
    /* Das Plus legt einen Eintrag in diesem Arbeitsbereich an — wie die
       Pille im Platzhalter der leeren Liste. */
    if (event.target.closest("[data-link-add]")) emit(events.createRequested);
  });

  /* Waagerecht wischen wechselt ebenfalls die Pille — nur hier, die
     Sammlungen auf derselben Seite haben keine Pillen. */
  initPillSwipe(el("view-page"), {
    order: pills.map((pill) => pill.id),
    current: () => ui.pagePill,
    select: selectPill,
    enabled: isWorkspaceOpen,
  });

  /* Tipp unter den Text schreibt weiter, bei offener Tastatur schließt er nur
     sie — nur auf einem Arbeitsbereich, nicht auf den Sammlungen derselben Ansicht. */
  addWritePage({
    view: "page",
    isOpen: isWorkspaceOpen,
    field: () => (ui.pagePill === "notes" ? el("workspace-body") : null),
  });

  dom.pageBody.addEventListener("input", (event) => {
    if (event.target.id !== "workspace-body" || !ui.currentPage) return;
    const workspace = findWorkspace(ui.currentPage.workspaceId);
    if (!workspace) return;
    workspace.body = event.target.value;
    scheduleSave();
  });
}
