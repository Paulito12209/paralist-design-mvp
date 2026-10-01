/*
 * Die Seite eines Arbeitsbereichs: zwei Pillen oben — „Inhalt“ mit dem
 * Text zum Arbeitsbereich als Bausteine wie auf einer Eintragsseite („/“-Menü,
 * Listen, Checkboxen, Karten; src/ui/block-editor.js) und „Verknüpfte Einträge“ mit allem, was darin
 * liegt, nach Typ gruppiert und auf-/zuklappbar. Waagerecht wischen wechselt
 * zwischen den Pillen (src/ui/pill-swipe.js). Dieselben zwei Pillen zeigt
 * auch die Seite eines einzelnen Eintrags (src/features/entry/entry.js) —
 * und wie dort startet ein Tipp unter den Text das Schreiben, bei offener
 * Tastatur schließt ein Tipp nur sie (src/ui/write-tap.js).
 *
 * Unter dem Text steht wie auf einer Eintragsseite die Karte „Details“
 * (workspace-details.js) mit Einträgen, Erinnerung und letzter Änderung.
 *
 * Rechts neben den Pillen stehen dieselben Knöpfe wie auf einer Eintragsseite
 * (src/ui/page-tools.js): Kopieren unter „Inhalt“ — Name als Überschrift und
 * Text —, Filter und Plus unter „Verknüpfte Einträge“.
 * Pfad: src/features/overview/workspace-page.js
 *
 * Keine anpassbaren visuellen Werte: Pillen und Gruppen stehen in
 * styles/rows.css (Klassen .page-pills, .group-head), der Text und die
 * Knöpfe neben den Pillen in styles/entry.css (Klassen .entry-body,
 * .workspace-body, .page-pills-row), die Bausteine in styles/blocks.css,
 * styles/embeds.css und styles/slash-menu.css.
 */

import { emit, events } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { entriesOf, findWorkspace, groupedEntriesOf, workspaceLabel } from "../../data/queries.js";
import { markEdited } from "../../data/mutations.js";
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
import { createBlockEditor } from "../../ui/block-editor.js";
import { initWorkspaceDetails, showWorkspaceDetails } from "./workspace-details.js";

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

/*
 * Der Inhalt als Baustein-Editor. Er wird einmal angelegt und bei jedem
 * Zeichnen der Seite wieder eingehängt; den Text setzt er nur neu, wenn ein
 * anderer Arbeitsbereich offen ist oder sich der Text von außen geändert hat.
 * { panel, root, editor, id, text } — oder null, solange nie ein Inhalt offen war.
 */
let notes = null;

/* Tippen speichert erst kurz nach dem letzten Buchstaben. */
function saveNotes(text) {
  const workspace = openWorkspace();
  if (!workspace || workspace.id !== notes.id) return;
  workspace.body = text;
  notes.text = text;
  /* Für „Geändert“ in der Karte „Details“ */
  markEdited(workspace);
  scheduleSave();
}

/* Die Fläche unter „Inhalt“ mit dem Editor für diesen Arbeitsbereich. */
function notesPanel(workspace) {
  if (!notes) {
    const panel = document.createElement("div");
    panel.className = "entry-panel";
    const root = document.createElement("div");
    root.className = "entry-body note-blocks workspace-body";
    root.id = "workspace-body";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "Inhalt");
    /* Erst einhängen, dann anlegen: das „/“-Menü setzt sich neben den Editor */
    panel.append(root);
    const editor = createBlockEditor(root, { onChange: saveNotes, emptyHint: "Schreib etwas zu diesem Arbeitsbereich …" });
    notes = { panel, root, editor, id: null, text: null };
    initWorkspaceDetails({ onEntries: () => selectPill("links"), textRoot: root });
  }
  const text = workspace.body || "";
  if (notes.id !== workspace.id || notes.text !== text) {
    notes.id = workspace.id;
    notes.text = text;
    notes.editor.setText(text);
  }
  return notes.panel;
}

/** Die Seite des offenen Arbeitsbereichs zeichnen. */
export function renderWorkspacePage(page) {
  const workspace = findWorkspace(page.workspaceId);
  if (!workspace) return;
  const count = entriesOf(page.parent).length;
  const groups = groupedEntriesOf(page.parent);
  const type = activeFilter(filterKey(page), groups);
  const links = ui.pagePill === "links";
  const tools = pageToolsMarkup(ui.pagePill, filterKey(page), groups);
  dom.pageBody.innerHTML = pillsRowMarkup(pillsMarkup(ui.pagePill, count), tools) + (links ? groupedListMarkup(page.parent, type) : "");
  if (links) return;
  /* Unter dem Text die Karte „Details“ (workspace-details.js) */
  const panel = notesPanel(workspace);
  dom.pageBody.append(panel);
  showWorkspaceDetails(workspace, panel);
}

/** Tippt jemand gerade im Inhalt? Dann darf die Seite nicht neu gezeichnet werden. */
export function isWritingNotes() {
  return Boolean(notes && notes.root.contains(document.activeElement));
}

const isWorkspaceOpen = () => Boolean(ui.currentPage && ui.currentPage.isWorkspace);

/* Pille wechseln — über die Pillen, durch Wischen oder „Einträge“ in der Karte „Details“ */
function selectPill(id) {
  if (!isWorkspaceOpen()) return;
  /* Der Text wird gleich ersetzt: vorher den Cursor herausnehmen, sonst
     bliebe die Tastatur für ein Feld offen, das es nicht mehr gibt. */
  if (id !== "notes") notes?.editor.blur();
  ui.pagePill = id;
  renderWorkspacePage(ui.currentPage);
}

/** Pillen und Inhalt anmelden. */
export function initWorkspacePage() {

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
    field: () => (ui.pagePill === "notes" && notes?.root.isConnected ? notes.root : null),
    focusEnd: () => notes?.editor.focusEnd(),
  });
}
