/*
 * Das Archiv: alles, was man aus einer Liste herausgewischt, aber nicht
 * gelöscht hat. Oben laufen Pillen zum Durchschieben — „Alle“, dann
 * „Arbeitsbereiche“, dann je Typ eine (src/data/collections.js, archivePills).
 * Waagerecht wischen wechselt die Pille. In einer Zeile holt Wischen nach
 * rechts sie zurück, nach links löscht es sie endgültig.
 * Pfad: src/features/overview/archive.js
 *
 * Keine anpassbaren visuellen Werte: die Zeilen sehen aus wie überall
 * (styles/rows.css), die Pillen wie auf der Ressourcen-Seite
 * (styles/overview.css, styles/media.css), der Platzhalter steht in
 * styles/empty-state.css.
 */

import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { archivePills } from "../../data/collections.js";
import { archivedEntries, archivedWorkspaces, workspaceIcon, workspaceLabel } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { setPagePill } from "../../ui/router.js";
import { entryGlyph, swipeAction, swipeRow } from "../../ui/rows.js";
import { isViewActive } from "../../ui/views.js";

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

/* Was unter einer Pille steht: Arbeitsbereiche nur unter „Alle“ und ihrer eigenen Pille. */
function archivedFor(pill) {
  const spaces = pill === "all" || pill === "workspaces" ? archivedWorkspaces() : [];
  const entries =
    pill === "workspaces"
      ? []
      : archivedEntries().filter((entry) => pill === "all" || entry.type === pill);
  return { spaces, entries };
}

/* Die Pillen; die Zahl steht nur dort, wo etwas liegt. */
function pillsMarkup(active) {
  return `<div class="tab-pills archive-pills">${archivePills
    .map((pill) => {
      const found = archivedFor(pill.id);
      const count = found.spaces.length + found.entries.length;
      const mark = pill.id === active ? " is-active" : "";
      return `
        <button class="tab-pill${mark}" type="button" data-archive-pill="${pill.id}">
          ${pill.label}${count ? `<span class="media-count">${count}</span>` : ""}
        </button>`;
    })
    .join("")}</div>`;
}

function pillLabel(id) {
  return archivePills.find((pill) => pill.id === id)?.label || "";
}

/* Die gewählte Pille — eine unbekannte (alter Verlaufseintrag) fällt auf „Alle“ zurück. */
function activePill() {
  const pill = ui.currentPage?.pill;
  return archivePills.some((item) => item.id === pill) ? pill : "all";
}

/** Pillen und Liste des Archivs in die Unterseite zeichnen. */
export function renderArchive() {
  const pill = activePill();
  const { spaces, entries } = archivedFor(pill);
  const list =
    spaces.length || entries.length
      ? `<div class="workspace-list">${spaces.map(workspaceArchiveRow).join("")}${entries
          .map(entryArchiveRow)
          .join("")}</div>`
      : emptyState(pill === "all" ? emptyArchive : { ...emptyArchive, title: `Keine ${pillLabel(pill)} im Archiv` });

  /* Die Leiste wird mit ersetzt: ihre Rollstellung mitnehmen, sonst springt
     sie bei jedem Wechsel an den Anfang zurück. */
  const scrolled = dom.pageBody.querySelector(".archive-pills")?.scrollLeft || 0;
  dom.pageBody.innerHTML = pillsMarkup(pill) + list;
  dom.pageBody.querySelector(".archive-pills").scrollLeft = scrolled;
}

const isArchiveOpen = () => isViewActive("page") && ui.currentPage?.kind === "archive";

function selectArchivePill(id) {
  if (!isArchiveOpen()) return;
  setPagePill(id);
  renderArchive();
}

/** Antippen und Wischen der Pillen anmelden. */
export function initArchive() {
  dom.pageBody.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-archive-pill]");
    if (pill) selectArchivePill(pill.dataset.archivePill);
  });
  initPillSwipe(el("view-page"), {
    order: archivePills.map((pill) => pill.id),
    current: activePill,
    select: selectArchivePill,
    enabled: isArchiveOpen,
  });
}
