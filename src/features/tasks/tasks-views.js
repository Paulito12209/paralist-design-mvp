/*
 * Die Pillen über der Aufgaben-Liste — gebaut wie die Tabs über den
 * Arbeitsbereichen der Übersicht: links „Alle“ und die eigenen Ansichten,
 * dahinter das kleine Plus für eine neue Ansicht
 * (am Handy mit „Neue Ansicht“ daneben, src/ui/pill-add.js); rechts hinter der
 * Trennlinie der runde Knopf ✓+, der eine Aufgabe anlegt — dieselbe Zeile
 * wie ein Tipp in die Liste (tasks-inline.js), nicht das Eingabefeld unten.
 * In der Android-Fassung steht dort stattdessen das Symbol „Ansicht“
 * (src/ui/view-panel.js, styles/android-sheet.css). Der aktive Tab ist gefüllt, eine neue Ansicht
 * startet gleich im Eingabefeld. Gedrückt halten (oder Rechtsklick) öffnet
 * das Menü: Umbenennen, Icon, Duplizieren, nach links, nach rechts, Löschen —
 * „Alle“ kennt nur Icon und Duplizieren. Waagerecht über die Liste wischen
 * wechselt die Ansicht (src/ui/pill-swipe.js). „Alle“ trägt ein ⓘ: ein Tipp
 * darauf erklärt, dass diese Ansicht jeden Ort zeigt und wie man eine für
 * einen Ort baut — deshalb gibt es im Blatt „Filtern“ dort keinen Ort.
 * Pfad: src/features/tasks/tasks-views.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * addTaskLabel -> Vorlesetext des runden ✓+
 * menuLabels   -> Beschriftungen im Halte-Menü
 * allInfo      -> Überschrift und Text der Erklärung hinter dem ⓘ an „Alle“
 *
 * Aussehen: styles/overview.css (Pillenzeile) und styles/tasks.css (das ⓘ).
 */

import { dom, el, focusAtEnd } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { sameId } from "../../core/ids.js";
import { noHistoryForm } from "../../core/no-history.js";
import { state, ui } from "../../data/state.js";
import {
  addTaskView,
  beginRenameTaskView,
  commitTaskViewName,
  deleteTaskView,
  duplicateTaskView,
  findTaskView,
  moveTaskView,
  selectTaskView,
  setTaskViewIcon,
} from "../../data/task-views.js";
import { showTabMenu } from "../../ui/tab-menu.js";
import { addLongPressMenu, cancelHold } from "../../ui/long-press.js";
import { openInfoDialog } from "../../ui/info-dialog.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { tabGlyph } from "../../ui/tab-glyph.js";
import { fitPillInput, } from "../../ui/pill-input.js";
import { addViewPill } from "../../ui/pill-add.js";
import { initPillSwipe, revealActive } from "../../ui/pill-swipe.js";
import { viewPanelButton } from "../../ui/view-panel.js";
import { startTaskRow } from "./tasks-inline.js";
import { isSelecting } from "./tasks-pick.js";

const addTaskLabel = "Aufgabe hinzufügen";
const menuLabels = {
  rename: "Umbenennen",
  duplicate: "Duplizieren",
  left: "Nach links",
  right: "Nach rechts",
  delete: "Löschen",
};

const allInfo = {
  title: "Alle Orte",
  text: "„Alle“ zeigt Aufgaben von jedem Ort. Für einen Ort tippe auf das kleine Plus neben den Pillen und filtere die neue Ansicht nach Ort.",
};

const INPUT_ID = "task-view-input";

/* Eine Pille — oder das Eingabefeld, solange ihr Name getippt wird. */
function pillMarkup(view) {
  const glyph = tabGlyph("tasks", view.icon, { fixed: view.fixed });
  if (sameId(view.id, ui.editingTaskViewId)) {
    return `
      <div class="tab-pill is-active">
        ${glyph}
        <input class="tab-pill-input" id="${INPUT_ID}" type="text" size="1" value="${escapeHtml(view.name)}"
          placeholder="${escapeHtml(view.placeholder || "")}" aria-label="Ansicht benennen" form="${noHistoryForm}" enterkeyhint="go" />
      </div>
    `;
  }
  const active = sameId(view.id, state.activeTaskViewId) ? " is-active" : "";
  /* Kein Knopf im Knopf: das ⓘ ist ein span, den handleViewsClick zuerst prüft */
  const info = view.fixed
    ? `<span class="tab-pill-info" role="button" tabindex="0" data-task-view-info aria-label="Was zeigt „${escapeHtml(view.name)}“?">${icon("info")}</span>`
    : "";
  return `
    <button class="tab-pill${active}" type="button" data-task-view="${view.id}">
      ${glyph}${escapeHtml(view.name || view.placeholder || "")}${info}
    </button>
  `;
}

/** Die ganze Zeile: Pillen, kleines Plus, Trennlinie, ✓+. */
export function taskViewsMarkup(end = "") {
  return `
    <div class="tab-pills-row">
      <div class="tab-pills" id="task-view-pills">
        ${state.taskViews.map(pillMarkup).join("")}
        ${addViewPill("data-task-view-add")}
      </div>
      <div class="tab-pills-tools">
        <div class="tab-pills-fade"></div>
        <div class="tab-pills-end">
          ${end}
          <div class="tab-pills-split"></div>
          <button class="add-btn task-add-btn" type="button" data-task-add aria-label="${addTaskLabel}" title="${addTaskLabel}">
            ${icon("task-plus")}
          </button>
          ${viewPanelButton()}
        </div>
      </div>
    </div>
  `;
}

/** Nach dem Zeichnen: das Eingabefeld einer neuen Ansicht bekommt den Fokus. */
export function afterViewsRender() {
  const input = el(INPUT_ID);
  if (!input) return;
  fitPillInput(input);
  focusAtEnd(input);
}

/* Das Menü einer Pille (gedrückt halten oder Rechtsklick). */
function openViewMenu(pill) {
  const id = Number(pill.dataset.taskView);
  const view = findTaskView(id);
  if (!view) return;
  const index = state.taskViews.indexOf(view);
  const options = [];
  if (!view.fixed) options.push({ label: menuLabels.rename, icon: "pencil", onSelect: () => beginRenameTaskView(id) });
  options.push(iconPickerAction(view.icon, (name) => setTaskViewIcon(id, name)));
  options.push({ label: menuLabels.duplicate, icon: "copy", onSelect: () => duplicateTaskView(id) });
  if (!view.fixed) {
    if (index > 0) options.push({ label: menuLabels.left, icon: "back", onSelect: () => moveTaskView(id, -1) });
    if (index < state.taskViews.length - 1) {
      options.push({ label: menuLabels.right, icon: "arrow-right", onSelect: () => moveTaskView(id, 1) });
    }
    options.push({ label: menuLabels.delete, icon: "trash", danger: true, onSelect: () => deleteTaskView(id) });
  }
  showTabMenu(pill, options);
}

/** Klicks in der Zeile: Ansicht wählen, neue Ansicht, neue Aufgabe. */
export function handleViewsClick(event) {
  if (event.target.closest("[data-task-view-info]")) {
    openInfoDialog(allInfo.title, allInfo.text);
    return;
  }
  const pill = event.target.closest("[data-task-view]");
  if (pill) {
    selectTaskView(Number(pill.dataset.taskView));
    return;
  }
  if (event.target.closest("[data-task-view-add]")) addTaskView();
  else if (event.target.closest("[data-task-add]")) startTaskRow();
}

/** Tastatur im Namensfeld, Halte-Menü, Rechtsklick und Wischen anmelden. */
export function initTaskViews() {
  const tools = dom.tasksTools;

  tools.addEventListener("input", (event) => {
    if (event.target.id !== INPUT_ID) return;
    fitPillInput(event.target);
    revealActive(el("view-tasks"));
  });
  tools.addEventListener("keydown", (event) => {
    if (event.target.id !== INPUT_ID || event.key !== "Enter") return;
    event.preventDefault();
    commitTaskViewName(event.target.value);
  });
  /* blur in der Aufnahmephase: sonst erreicht das Ereignis den Zuhörer nicht */
  tools.addEventListener(
    "blur",
    (event) => {
      if (event.target.id === INPUT_ID) commitTaskViewName(event.target.value);
    },
    true
  );

  addLongPressMenu("taskView", openViewMenu);
  tools.addEventListener("contextmenu", (event) => {
    const pill = event.target.closest("[data-task-view]");
    if (!pill) return;
    event.preventDefault();
    cancelHold();
    openViewMenu(pill);
  });

  /* Nicht während eine Ansicht benannt wird: dann gehört das Wischen dem Textfeld. */
  initPillSwipe(el("view-tasks"), {
    order: () => state.taskViews.map((view) => view.id),
    current: () => state.activeTaskViewId,
    select: selectTaskView,
    /* Im Auswahlmodus stehen keine Pillen da: wischen wechselt dann nichts */
    enabled: () => ui.editingTaskViewId == null && !isSelecting(),
  });
}
