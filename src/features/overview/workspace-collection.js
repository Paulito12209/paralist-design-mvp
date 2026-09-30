/*
 * Die Seite „Arbeitsbereiche“ (#/arbeitsbereiche): hier werden Tabs und
 * Arbeitsbereiche angelegt, umbenannt und verwaltet. Oben je Tab eine Pille
 * (Meine, Arbeit, …), dahinter das kleine Plus für einen neuen Tab, rechts
 * hinter der Trennlinie der Ordner-Plus-Knopf. Darunter die Arbeitsbereiche
 * des gewählten Tabs, die Zeile „Arbeitsbereich hinzufügen“ und „Zum Archiv“.
 * Die gewählte Pille ist der Tab der App (state.activeTabId) — so legt „neu“
 * dort an, wo man hinsieht, und Browser-Zurück findet dieselbe Pille wieder.
 * Waagerecht wischen wechselt den Tab. Antippen, Halten und Rechtsklick
 * behandelt src/ui/list-clicks.js wie überall (data-tab-id, data-open-workspace).
 * Pfad: src/features/overview/workspace-collection.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyTab   -> was ein Tab ohne Arbeitsbereiche zeigt
 * addLabel   -> Vorlesetext des Ordner-Plus-Knopfs rechts
 *
 * Aussehen: Pillenzeile in styles/overview.css, die Zeilen in styles/rows.css,
 * der Platzhalter in styles/empty-state.css.
 */

import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { selectTab } from "../../data/mutations.js";
import { state, ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { isViewActive } from "../../ui/views.js";
import { afterTabsRender, tabPillsMarkup } from "./tabs.js";
import {
  commitStaleWorkspaceName,
  focusWorkspaceName,
  workspaceRowsMarkup,
  workspaceTailMarkup,
} from "./workspaces.js";

/* Ein leerer Tab: angelegt wird direkt hier, über die Zeile unter der Liste. */
const emptyTab = {
  icon: "folder",
  accent: "var(--chevron)",
  title: "Noch keine Arbeitsbereiche",
  text: "Tippe unten auf „Arbeitsbereich hinzufügen“.",
};
const addLabel = "Arbeitsbereich hinzufügen";

/** Ist gerade die Seite Arbeitsbereiche offen? */
export function isWorkspacesPageOpen() {
  return isViewActive("page") && ui.currentPage?.kind === "workspaces";
}

/* Tabs links, kleines Plus; rechts fest Trennlinie und Ordner-Plus — wie früher auf der Übersicht. */
function pillsRowMarkup() {
  return `
    <div class="tab-pills-row">
      <div class="tab-pills collection-pills">${tabPillsMarkup()}</div>
      <div class="tab-pills-tools">
        <div class="tab-pills-fade"></div>
        <div class="tab-pills-end">
          <div class="tab-pills-split"></div>
          <button class="add-btn" type="button" data-add-workspace="1" aria-label="${addLabel}">${icon("folder-plus")}</button>
        </div>
      </div>
    </div>`;
}

/** Pillen, Liste und die Zeilen darunter in die Unterseite zeichnen. */
export function renderWorkspaceCollection() {
  /* Ein offenes Namensfeld nimmt seinen Text mit ins neue Feld (ui.nameDraft). */
  commitStaleWorkspaceName();
  const rows = workspaceRowsMarkup(true);
  /* Rollstellung der Leiste mitnehmen, sonst springt sie an den Anfang zurück. */
  const scrolled = dom.pageBody.querySelector(".collection-pills")?.scrollLeft || 0;
  dom.pageBody.innerHTML = `${pillsRowMarkup()}${rows ? "" : emptyState(emptyTab)}
    <div class="workspace-list">${rows}${workspaceTailMarkup()}</div>`;
  dom.pageBody.querySelector(".collection-pills").scrollLeft = scrolled;
  afterTabsRender();
  focusWorkspaceName();
}

/** Wischen über die Seite anmelden: es wechselt den Tab, nie während ein Name getippt wird. */
export function initWorkspaceCollection() {
  initPillSwipe(el("view-page"), {
    order: () => state.tabs.map((tab) => tab.id),
    current: () => state.activeTabId,
    select: selectTab,
    enabled: () => isWorkspacesPageOpen() && ui.editingTabId == null && ui.editingWorkspaceId == null,
  });
}
