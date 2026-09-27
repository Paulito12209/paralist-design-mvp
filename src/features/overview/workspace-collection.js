/*
 * Die Sammlung „Arbeitsbereiche“ hinter dem Pfeil neben der Überschrift auf
 * der Übersicht: eine Unterseite wie Projekte oder Ressourcen. Oben je
 * angelegtem Tab (Meine, Arbeit, …) eine Pille, darunter die Arbeitsbereiche
 * dieses Tabs als Liste. Waagerecht wischen wechselt die Pille. Die Wahl hier
 * verstellt den Tab auf der Übersicht nicht.
 * Pfad: src/features/overview/workspace-collection.js
 *
 * Keine anpassbaren visuellen Werte: Pillen stehen in styles/overview.css,
 * die Zeilen in styles/rows.css, der Platzhalter in styles/empty-state.css.
 */

import { dom, el } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { sameId } from "../../core/ids.js";
import { tabLabel } from "../../data/queries.js";
import { state, ui } from "../../data/state.js";
import { emptyState } from "../../ui/empty-state.js";
import { initPillSwipe } from "../../ui/pill-swipe.js";
import { setPagePill } from "../../ui/router.js";
import { workspaceRow } from "../../ui/rows.js";
import { isViewActive } from "../../ui/views.js";

/* Ein leerer Tab: anlegen geht auf der Übersicht, dort steht das Plus. */
const emptyTab = {
  icon: "folder",
  accent: "var(--chevron)",
  title: "Noch keine Arbeitsbereiche",
  text: "In diesem Tab liegt noch nichts. Leg auf der Übersicht einen Arbeitsbereich an.",
};

/* Die gewählte Pille; gibt es den Tab nicht mehr, gilt der erste. */
function activeTabId() {
  const pill = ui.currentPage?.pill;
  const tab = state.tabs.find((item) => sameId(item.id, pill)) || state.tabs[0];
  return tab ? tab.id : null;
}

function pillsMarkup(active) {
  return `<div class="tab-pills collection-pills">${state.tabs
    .map((tab) => {
      const mark = sameId(tab.id, active) ? " is-active" : "";
      const glyph = tab.icon ? icon(tab.icon, "tab-pill-icon") : "";
      return `
        <button class="tab-pill${mark}" type="button" data-collection-tab="${tab.id}">
          ${glyph}${escapeHtml(tabLabel(tab))}
        </button>`;
    })
    .join("")}</div>`;
}

/** Pillen und Liste der Sammlung in die Unterseite zeichnen. */
export function renderWorkspaceCollection() {
  const active = activeTabId();
  const spaces = state.workspaces.filter(
    (workspace) => !workspace.archived && sameId(workspace.tab, active)
  );
  const list = spaces.length
    ? `<div class="workspace-list">${spaces.map((workspace) => workspaceRow(workspace)).join("")}</div>`
    : emptyState(emptyTab);

  /* Rollstellung der Leiste mitnehmen, sonst springt sie an den Anfang zurück. */
  const scrolled = dom.pageBody.querySelector(".collection-pills")?.scrollLeft || 0;
  dom.pageBody.innerHTML = pillsMarkup(active) + list;
  dom.pageBody.querySelector(".collection-pills").scrollLeft = scrolled;
}

const isCollectionOpen = () => isViewActive("page") && ui.currentPage?.kind === "workspaces";

function selectCollectionTab(id) {
  if (!isCollectionOpen()) return;
  setPagePill(Number(id));
  renderWorkspaceCollection();
}

/** Antippen und Wischen der Pillen anmelden. */
export function initWorkspaceCollection() {
  dom.pageBody.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-collection-tab]");
    if (pill) selectCollectionTab(pill.dataset.collectionTab);
  });
  initPillSwipe(el("view-page"), {
    order: () => state.tabs.map((tab) => tab.id),
    current: activeTabId,
    select: selectCollectionTab,
    enabled: isCollectionOpen,
  });
}
