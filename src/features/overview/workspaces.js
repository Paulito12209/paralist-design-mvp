/*
 * Die Liste der Arbeitsbereiche unter den Tab-Pillen der Seite
 * Arbeitsbereiche: anlegen, umbenennen, Icon geben, in einen anderen Tab
 * legen, zu Favoriten, löschen. Gezeichnet wird sie von
 * src/features/overview/workspace-collection.js; das Namensfeld zeigt auch
 * die Favoriten-Seite (src/features/overview/page.js).
 * Pfad: src/features/overview/workspaces.js
 *
 * Keine anpassbaren visuellen Werte: Zeilenhöhe und Trennlinien stehen in
 * styles/rows.css (Klasse .workspace-row).
 */

import { emit, events } from "../../core/bus.js";
import { dom, el, focusAtEnd } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { sameId } from "../../core/ids.js";
import { filterCollectionWorkspaces } from "../../data/collection-filters.js";
import { sortCollectionWorkspaces } from "../../data/collection-sorts.js";
import { archiveWorkspace, deleteWorkspace, nameWorkspace, restoreFromArchive, toggleFavorite } from "../../data/mutations.js";
import { archivedEntries, archivedWorkspaces, findWorkspace, tabWorkspaces } from "../../data/queries.js";
import { saveState, ui } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { moveWorkspaceAction } from "../../ui/move-menu.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { typeChangeAction } from "../../ui/type-menu.js";
import { workspaceRow } from "../../ui/rows.js";
import { pageSelectLead } from "./page-select.js";

/** Die Eingabe beim Umbenennen fokussieren, falls sie gerade im Dokument steht. */
export function focusWorkspaceName() {
  focusAtEnd(el("workspace-name-input"));
}

/**
 * Die Zeilen der Arbeitsbereiche im gewählten Tab, gefiltert und sortiert wie
 * in der Karte „Ansicht“; `canEdit` erlaubt das Namensfeld. Der gerade
 * benannte bleibt immer stehen — sonst verschwände ein frisch angelegter
 * unter „Nur Favoriten“ samt seinem Namensfeld.
 */
export function workspaceRowsMarkup(canEdit) {
  const all = tabWorkspaces();
  const shown = filterCollectionWorkspaces("workspaces", all);
  const kept = all.filter((workspace) => shown.includes(workspace) || sameId(workspace.id, ui.editingWorkspaceId));
  return sortCollectionWorkspaces("workspaces", kept)
    .map((workspace) => workspaceRow(workspace, canEdit))
    .join("");
}

/**
 * Unter der Liste: die Zeile „Arbeitsbereich hinzufügen“ (ohne sie, wenn
 * `withAdd` false ist — dann legt die Pille im Platzhalter an) und — sobald etwas
 * im Archiv liegt — die Pille „Zum Archiv“ mit der Pille Arbeitsbereiche.
 * Die Pille sitzt am unteren Ende der Seite, direkt über der Navigation, und
 * folgt einer langen Liste mit Mindestabstand (styles/view-end.css).
 */
export function workspaceTailMarkup(withAdd = true) {
  const hasArchived = archivedWorkspaces().length > 0 || archivedEntries().length > 0;
  const archiveButton = hasArchived
    ? `<div class="archive-link-row">
      <button class="archive-link" type="button" data-open-archive="workspaces">
        ${icon("archive")}
        <span>Zum Archiv</span>
      </button>
    </div>`
    : "";
  const addRow = withAdd
    ? `<button class="workspace-row workspace-add" type="button" data-add-workspace="1">
      ${icon("folder-plus")}
      <span>Arbeitsbereich hinzufügen</span>
    </button>`
    : "";
  return `
    ${addRow}
    ${archiveButton}`;
}


/**
 * Den eingegebenen Namen übernehmen; ein leeres Feld behält den Vorgabenamen.
 * Das Feld sagt selbst, wen es benennt (`data-editing`), damit der Name auch
 * dann ankommt, wenn inzwischen schon ein anderer Arbeitsbereich im Feld steht.
 */
export function commitWorkspaceName() {
  const input = el("workspace-name-input");
  /* `done` verhindert, dass dasselbe Feld zweimal übernommen wird (blur + Neuzeichnen) */
  if (!input || input.dataset.done) return;
  input.dataset.done = "1";
  const id = input.dataset.editing;
  const workspace = findWorkspace(id);
  ui.nameDraft = null;
  if (sameId(ui.editingWorkspaceId, id)) ui.editingWorkspaceId = null;
  if (!workspace) {
    emit(events.dataChanged);
    return;
  }
  nameWorkspace(workspace, input.value || workspace.name);
}

/**
 * Vor dem Neuzeichnen: steht noch ein Namensfeld in der Seite, wird es
 * entweder übernommen (es gehört zu einem ANDEREN Arbeitsbereich als dem, der
 * gleich im Feld stehen soll) oder sein Text gemerkt (derselbe Arbeitsbereich —
 * das neue Feld zeigt ihn dann wieder). So geht Getipptes nie verloren.
 */
export function commitStaleWorkspaceName() {
  const input = el("workspace-name-input");
  if (!input || input.dataset.done) return;
  if (sameId(input.dataset.editing, ui.editingWorkspaceId)) {
    ui.nameDraft = { id: input.dataset.editing, value: input.value };
    return;
  }
  commitWorkspaceName();
}

/** Umbenennen starten. Der bisherige Name steht als Platzhalter, falls man alles löscht. */
export function beginRenameWorkspace(id) {
  const workspace = findWorkspace(id);
  if (workspace && !workspace.placeholder) workspace.placeholder = workspace.name;
  ui.editingWorkspaceId = id;
  emit(events.dataChanged);
}

/** Das Menü einer Zeile (gedrückt halten, Rechtsklick oder die drei Punkte; `anchor` ist dann der Punkt). */
export function openWorkspaceMenu(button, anchor = button) {
  const workspace = findWorkspace(button.dataset.openWorkspace);
  if (!workspace) return;

  openCtxMenu(anchor, [
    /* Auf einer Sammlung steht „Auswählen“ ganz oben (src/features/overview/page-select.js) */
    ...pageSelectLead(button),
    { label: "Umbenennen", icon: "pencil", onSelect: () => beginRenameWorkspace(workspace.id) },
    iconPickerAction(workspace.icon, (name) => {
      workspace.icon = name;
      saveState();
      emit(events.dataChanged);
    }),
    /* Umbenennen, Icon, Typ: was der Arbeitsbereich IST, steht beieinander;
       dahinter, wo er liegt — der Punkt fehlt, solange es nur einen Tab gibt */
    typeChangeAction({ workspace }),
    ...[moveWorkspaceAction(button, workspace)].filter(Boolean),
    {
      label: workspace.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: workspace.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(workspace),
    },
    /* Im Archiv steht an dieser Stelle „Zurückholen“ */
    workspace.archived
      ? { label: "Zurückholen", icon: "history", onSelect: () => restoreFromArchive(workspace) }
      : { label: "Archivieren", icon: "archive", onSelect: () => archiveWorkspace(workspace.id) },
    {
      label: "Löschen",
      icon: "trash",
      danger: true,
      onSelect: () => deleteWorkspace(workspace.id),
    },
  ]);
}

/* Enter und Fokusverlust im Umbenennen-Feld übernehmen den Namen. */
function bindNameInput(container) {
  if (!container) return;
  container.addEventListener("keydown", (event) => {
    if (event.target.id !== "workspace-name-input" || event.key !== "Enter") return;
    event.preventDefault();
    commitWorkspaceName();
  });
  /* blur in der Aufnahmephase: sonst erreicht das Ereignis den Zuhörer nicht */
  container.addEventListener(
    "blur",
    (event) => {
      if (event.target.id === "workspace-name-input") commitWorkspaceName();
    },
    true
  );
}

/** Tastatur und Fokus im Namensfeld anmelden. */
export function initWorkspaces() {
  bindNameInput(dom.pageBody);
}
