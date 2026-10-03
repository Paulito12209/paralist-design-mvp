/*
 * Die Seite „Arbeitsbereiche“ (#/arbeitsbereiche): hier werden Tabs und
 * Arbeitsbereiche angelegt, umbenannt und verwaltet. Oben je Tab eine Pille
 * (Meine, Arbeit, …), dahinter das kleine Plus für einen neuen Tab, rechts
 * hinter der Trennlinie der Ordner-Plus-Knopf (in der Android-Fassung das
 * Symbol „Ansicht“, styles/android-sheet.css). Darunter die Arbeitsbereiche
 * des gewählten Tabs, die Zeile „Arbeitsbereich hinzufügen“ und „Zum Archiv“
 * (in der Android-Fassung der Archiv-Knopf links unten, src/shell/android-archive.js).
 * Ist der Tab leer, steht statt der Zeile der Platzhalter mit einer Pille
 * zum Anlegen in der Mitte — wie auf den übrigen Seiten. In der
 * Android-Fassung fehlt die Zeile auch neben Arbeitsbereichen: dort legt ein
 * Tipp unter den letzten an (src/features/overview/page-inline.js).
 * Die gewählte Pille ist der Tab der App (state.activeTabId) — so legt „neu“
 * dort an, wo man hinsieht, und Browser-Zurück findet dieselbe Pille wieder.
 * Waagerecht wischen wechselt den Tab. Antippen, Halten und Rechtsklick
 * behandelt src/ui/list-clicks.js wie überall (data-tab-id, data-open-workspace).
 * Pfad: src/features/overview/workspace-collection.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyTab   -> was ein Tab ohne Arbeitsbereiche zeigt: Emblem, Farbe, Satz und
 *               Beschriftung der Pille in der Mitte
 * addLabel   -> Vorlesetext des Ordner-Plus-Knopfs rechts
 *
 * Aussehen: Pillenzeile in styles/overview.css, die Zeilen in styles/rows.css,
 * der Platzhalter in styles/empty-state.css.
 */

import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { selectTab } from "../../data/mutations.js";
import { tabWorkspaces } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { collectionEmptyState } from "../../ui/empty-state.js";
import { filterEmptyState } from "../../ui/filter-empty.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { isMobileOs } from "../../ui/platform.js";
import { viewPanelButton } from "../../ui/view-panel.js";
import { isViewActive } from "../../ui/views.js";
import { afterTabsRender, tabPillsMarkup } from "./tabs.js";
import {
  commitStaleWorkspaceName,
  focusWorkspaceName,
  workspaceRowsMarkup,
  workspaceTailMarkup,
} from "./workspaces.js";

/* Ein leerer Tab: Emblem im Orange der Karte Arbeitsbereiche und die Pille
   zum Anlegen. Sie trägt data-add-workspace wie der Ordner-Plus-Knopf oben,
   damit src/ui/list-clicks.js beide gleich behandelt. */
const emptyTab = {
  icon: "layers",
  accent: "var(--workspace-icon-color)",
  title: "Noch keine Arbeitsbereiche",
  text: "Ein Arbeitsbereich ist ein Verantwortungsbereich ohne Enddatum, in dem du einen Standard dauerhaft halten willst.",
  action: { label: "Arbeitsbereich anlegen" },
  data: 'data-add-workspace="1"',
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
          ${viewPanelButton()}
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
  /* Leerer Tab: die Pille im Platzhalter legt an, die Zeile darunter sagte
     dasselbe noch einmal und entfällt. Blenden nur die Filter alles aus,
     steht der Filter-Platzhalter da und die Zeile zum Anlegen bleibt. */
  const filteredAway = !rows && tabWorkspaces().length > 0;
  const empty = filteredAway ? filterEmptyState() : rows ? "" : collectionEmptyState(emptyTab);
  /* Android: keine Zeile „Arbeitsbereich hinzufügen“ — ein Tipp unter den
     letzten Arbeitsbereich legt an (src/features/overview/page-inline.js). */
  const withAdd = (Boolean(rows) || filteredAway) && !isMobileOs("android");
  dom.pageBody.innerHTML = `${pillsRowMarkup()}${empty}
    <div class="workspace-list" data-reorder="workspaces">${rows}${workspaceTailMarkup(withAdd)}</div>`;
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
