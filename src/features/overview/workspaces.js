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
import { sameId } from "../../core/ids.js";
import { archiveWorkspace, deleteWorkspace, nameWorkspace, toggleFavorite } from "../../data/mutations.js";
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
  commitStaleWorkspaceName();
  const canEdit = isViewActive("home");
  const rows = tabWorkspaces()
    .map((workspace) => workspaceRow(workspace, canEdit))
    .join("");

  /* Die Pille zum Archiv steht mit festem Abstand unter der Liste — nicht am
     unteren Bildschirmrand: auf kleinen Geräten hängt sie sonst hinter der
     Navigationsleiste, auf großen stünde sie einsam weit unten. */
  dom.workspaceList.innerHTML = `${rows}
    <button class="workspace-row workspace-add" type="button" data-add-workspace="1">
      ${icon("folder-plus")}
      <span>Arbeitsbereich hinzufügen</span>
    </button>
    <div class="archive-link-row">
      <button class="archive-link" type="button" data-open-archive="1">
        ${icon("archive")}
        <span>Zum Archiv</span>
      </button>
    </div>`;

  if (canEdit) focusWorkspaceName();
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
      label: "Archivieren",
      icon: "archive",
      onSelect: () => archiveWorkspace(workspace.id),
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
