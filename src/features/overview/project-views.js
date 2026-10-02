/*
 * Die Pillen der Projekt-Ansichten — auf der Übersicht unter „Projekte ↗“
 * und oben auf der Seite Projekte, gebaut wie die Pillen der Aufgaben-Seite
 * (src/features/tasks/tasks-views.js): links „Alle“ und die eigenen
 * Ansichten, dahinter das kleine Plus für eine neue Ansicht
 * (am Handy mit „Neue Ansicht“ daneben, src/ui/pill-add.js); rechts hinter
 * der Trennlinie der runde Knopf „Projekt hinzufügen“ (Rakete mit Plus) —
 * in der Android-Fassung steht dort stattdessen das Symbol „Ansicht“
 * (viewPanelButton aus src/ui/view-panel.js, styles/android-sheet.css). Eine
 * neue Ansicht startet gleich im Namensfeld. Halten oder Rechtsklick öffnet
 * das Menü: Umbenennen, Icon, Duplizieren, Nach links, Nach rechts, Löschen —
 * „Alle“ kennt nur Icon und Duplizieren. Waagerecht wischen wechselt die
 * Ansicht, nie während ein Name getippt wird. In der Oberfläche heißen sie
 * immer „Ansicht“ — „Tab“ sind die Pillen der Arbeitsbereiche.
 * Pfad: src/features/overview/project-views.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * addProjectLabel -> Vorlesetext und Hinweis des runden Knopfs rechts
 * menuLabels      -> Beschriftungen im Halte-Menü
 *
 * Aussehen: styles/overview.css (Pillenzeile, Knopf rechts).
 */

import { emit, events } from "../../core/bus.js";
import { dom, el, focusAtEnd } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { sameId } from "../../core/ids.js";
import { noHistoryForm } from "../../core/no-history.js";
import {
  addProjectView,
  beginRenameProjectView,
  commitProjectViewName,
  deleteProjectView,
  duplicateProjectView,
  findProjectView,
  moveProjectView,
  projectViewLabel,
  selectProjectView,
  setProjectViewIcon,
} from "../../data/project-views.js";
import { state, ui } from "../../data/state.js";
import { showTabMenu } from "../../ui/tab-menu.js";
import { isDesk } from "../../ui/desk-mode.js";
import { addLongPressMenu, cancelHold } from "../../ui/long-press.js";
import { iconPickerAction } from "../../ui/pickers.js";
import { tabGlyph } from "../../ui/tab-glyph.js";
import { fitPillInput } from "../../ui/pill-input.js";
import { addViewPill } from "../../ui/pill-add.js";
import { initPillSwipe, revealActive } from "../../ui/pill-swipe.js";
import { viewPanelButton } from "../../ui/view-panel.js";
import { currentView, isViewActive } from "../../ui/views.js";

const addProjectLabel = "Projekt hinzufügen";
const menuLabels = {
  rename: "Umbenennen",
  duplicate: "Duplizieren",
  left: "Nach links",
  right: "Nach rechts",
  delete: "Löschen",
};

const INPUT_ID = "project-view-input";

/** Ist gerade die Seite Projekte offen? */
export function isProjectsPageOpen() {
  return isViewActive("page") && ui.currentPage?.kind === "projects";
}

/* Eine Pille — oder das Namensfeld, solange ihr Name getippt wird. */
function pillMarkup(view) {
  const glyph = tabGlyph("projects", view.icon, { fixed: view.fixed });
  if (sameId(view.id, ui.editingProjectViewId)) {
    return `
      <div class="tab-pill is-active">
        ${glyph}
        <input class="tab-pill-input" id="${INPUT_ID}" type="text" size="1" value="${escapeHtml(view.name)}"
          placeholder="${escapeHtml(view.placeholder || "")}" aria-label="Ansicht benennen" form="${noHistoryForm}" enterkeyhint="go" />
      </div>`;
  }
  const active = sameId(view.id, state.activeProjectViewId) ? " is-active" : "";
  return `
    <button class="tab-pill${active}" type="button" data-project-view="${view.id}">
      ${glyph}${escapeHtml(projectViewLabel(view))}
    </button>`;
}

/** Die ganze Zeile: Pillen, kleines Plus, Trennlinie, Knopf „Projekt hinzufügen“. */
export function projectViewsMarkup() {
  return `
    <div class="tab-pills-row">
      <div class="tab-pills">
        ${state.projectViews.map(pillMarkup).join("")}
        ${addViewPill("data-project-view-add")}
      </div>
      <div class="tab-pills-tools">
        <div class="tab-pills-fade"></div>
        <div class="tab-pills-end">
          <div class="tab-pills-split"></div>
          <button class="add-btn" type="button" data-project-add="1" aria-label="${addProjectLabel}" title="${addProjectLabel}">
            ${icon("rocket-plus")}
          </button>
          ${viewPanelButton(true)}
        </div>
      </div>
    </div>`;
}

/* Das Namensfeld der sichtbaren Seite. Nur dort suchen: die verborgene Seite
   kann noch ein altes Feld mit derselben id tragen, bis sie neu zeichnet. */
function nameInput() {
  return el(`view-${currentView()}`)?.querySelector(`#${INPUT_ID}`) || null;
}

/** Nach dem Zeichnen: das Namensfeld einer neuen Ansicht bekommt den Fokus. */
export function afterProjectViewsRender() {
  const input = nameInput();
  if (!input) return;
  fitPillInput(input);
  focusAtEnd(input);
}

/**
 * „Projekt hinzufügen“: das Eingabefeld mit dem Typ Projekt öffnen. Die
 * gewählte Ansicht merkt sich die Datenschicht, damit das neue Projekt dort
 * auch zu sehen ist (applyProjectDraft in src/data/project-views.js).
 */
export function requestProject(viewId = state.activeProjectViewId) {
  ui.projectDraftView = viewId;
  emit(events.createRequested, "projekt");
}

/** Das Menü einer Pille (gedrückt halten oder Rechtsklick). */
export function openProjectViewMenu(pill) {
  const id = Number(pill.dataset.projectView);
  const view = findProjectView(id);
  if (!view) return;
  const index = state.projectViews.indexOf(view);
  const options = [];
  if (!view.fixed) options.push({ label: menuLabels.rename, icon: "pencil", onSelect: () => beginRenameProjectView(id) });
  options.push(iconPickerAction(view.icon, (name) => setProjectViewIcon(id, name)));
  options.push({ label: menuLabels.duplicate, icon: "copy", onSelect: () => duplicateProjectView(id) });
  if (!view.fixed) {
    if (index > 0) options.push({ label: menuLabels.left, icon: "back", onSelect: () => moveProjectView(id, -1) });
    if (index < state.projectViews.length - 1) {
      options.push({ label: menuLabels.right, icon: "arrow-right", onSelect: () => moveProjectView(id, 1) });
    }
    options.push({ label: menuLabels.delete, icon: "trash", danger: true, onSelect: () => deleteProjectView(id) });
  }
  showTabMenu(pill, options);
}

/* Den getippten Namen übernehmen — nur, solange wirklich eine Ansicht benannt wird. */
function finishName(value) {
  if (ui.editingProjectViewId == null) return;
  commitProjectViewName(value);
}

/* Klicks in der Zeile: Ansicht wählen, neue Ansicht, neues Projekt. */
function onClick(event) {
  const pill = event.target.closest("[data-project-view]");
  if (pill) {
    selectProjectView(Number(pill.dataset.projectView));
    return;
  }
  if (event.target.closest("[data-project-view-add]")) addProjectView();
  else if (event.target.closest("[data-project-add]")) requestProject();
}

/* Tippen, Enter, Fokusverlust, Klicks und Rechtsklick in einem Behälter. */
function bindContainer(container) {
  container.addEventListener("click", onClick);
  container.addEventListener("input", (event) => {
    if (event.target.id !== INPUT_ID) return;
    fitPillInput(event.target);
    revealActive(el(`view-${currentView()}`));
  });
  container.addEventListener("keydown", (event) => {
    if (event.target.id !== INPUT_ID || event.key !== "Enter") return;
    event.preventDefault();
    finishName(event.target.value);
  });
  /* blur in der Aufnahmephase: sonst erreicht das Ereignis den Zuhörer nicht */
  container.addEventListener(
    "blur",
    (event) => {
      if (event.target.id === INPUT_ID) finishName(event.target.value);
    },
    true
  );
  container.addEventListener("contextmenu", (event) => {
    const pill = event.target.closest("[data-project-view]");
    if (!pill) return;
    event.preventDefault();
    cancelHold();
    openProjectViewMenu(pill);
  });
}

/** Klicks, Namensfeld, Halte-Menü und Wischen auf Übersicht und Seite Projekte anmelden. */
export function initProjectViews() {
  bindContainer(dom.projectViews);
  bindContainer(dom.projectList);
  bindContainer(dom.pageBody);
  addLongPressMenu("projectView", openProjectViewMenu);

  const order = () => state.projectViews.map((view) => view.id);
  const current = () => state.activeProjectViewId;
  const naming = () => ui.editingProjectViewId != null;
  /* Übersicht: am Desktop steht dort keine Projektliste, also auch kein Wischen. */
  initPillSwipe(el("view-home"), { order, current, select: selectProjectView, enabled: () => !naming() && !isDesk() });
  initPillSwipe(el("view-page"), { order, current, select: selectProjectView, enabled: () => !naming() && isProjectsPageOpen() });
}
