/*
 * Die Liste der Arbeitsbereiche unter den Tab-Pillen: anlegen, umbenennen,
 * Icon geben, zu Favoriten, löschen.
 * Pfad: src/features/overview/workspaces.js
 *
 * Keine anpassbaren visuellen Werte: Zeilenhöhe und Trennlinien stehen in
 * styles/rows.css (Klasse .workspace-row).
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { deleteWorkspace, toggleFavorite } from "../../data/mutations.js";
import { findWorkspace, tabWorkspaces } from "../../data/queries.js";
import { saveState, ui } from "../../data/state.js";
import { openCtxMenu } from "../../ui/ctx-menu.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { workspaceRow } from "../../ui/rows.js";
import { isViewActive } from "../../ui/views.js";

/** Die Eingabe beim Umbenennen fokussieren, falls sie gerade im Dokument steht. */
export function focusWorkspaceName() {
  const input = el("workspace-name-input");
  if (!input) return;
  input.focus();
  input.select();
}

/** Die Liste neu zeichnen. Umbenennen ist nur möglich, wenn die Startseite offen ist. */
export function renderWorkspaces() {
  const canEdit = isViewActive("home");
  const rows = tabWorkspaces()
    .map((workspace) => workspaceRow(workspace, canEdit))
    .join("");

  dom.workspaceList.innerHTML = `${rows}
    <button class="workspace-row workspace-add" type="button" data-add-workspace="1">
      ${icon("folder-plus")}
      <span>Add Workspace</span>
    </button>`;

  if (canEdit) focusWorkspaceName();
}

/** Den eingegebenen Namen übernehmen. */
export function commitWorkspaceName() {
  const input = el("workspace-name-input");
  if (!input) return;
  const workspace = findWorkspace(ui.editingWorkspaceId);
  ui.editingWorkspaceId = null;
  if (workspace) workspace.name = input.value.trim() || workspace.name || "Arbeitsbereich";
  saveState();
  emit(events.dataChanged);
}

/** Umbenennen starten. */
export function beginRenameWorkspace(id) {
  ui.editingWorkspaceId = id;
  emit(events.dataChanged);
}

/** Das Menü einer Zeile (gedrückt halten oder Rechtsklick). */
export function openWorkspaceMenu(button) {
  const workspace = findWorkspace(button.dataset.openWorkspace);
  if (!workspace) return;

  openCtxMenu(button, [
    { label: "Umbenennen", icon: "pencil", onSelect: () => beginRenameWorkspace(workspace.id) },
    iconPickerAction(workspace.icon, (name) => {
      workspace.icon = name;
      saveState();
      emit(events.dataChanged);
    }),
    {
      label: workspace.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten",
      icon: workspace.favorite ? "star" : "star-outline",
      onSelect: () => toggleFavorite(workspace),
    },
    {
      label: "Löschen",
      icon: "trash",
      danger: true,
      onSelect: () => deleteWorkspace(workspace.id),
    },
  ]);
}

/* Enter und Fokusverlust im Umbenennen-Feld übernehmen den Namen.
   Das Feld steht je nach Seite in der Liste oder in der Unterseite. */
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

/** Tastatur, Fokus und Auffrischen anmelden. */
export function initWorkspaces() {
  bindNameInput(dom.workspaceList);
  bindNameInput(dom.pageBody);

  on(events.dataChanged, () => {
    if (isViewActive("home")) renderWorkspaces();
  });
  on(events.viewOpened, (name) => {
    if (name === "home") renderWorkspaces();
  });
}
