/*
 * Alle festen Elemente aus index.html an einer Stelle. Statt überall
 * `document.getElementById(...)` zu schreiben, holt man sie hier einmal.
 * Pfad: src/core/dom.js
 *
 * Keine anpassbaren visuellen Werte.
 */

const cache = new Map();

/**
 * Element nach ID, gemerkt beim ersten Zugriff.
 *
 * Gemerkt wird nur, was gefunden wurde und noch in der Seite hängt: Felder wie
 * die Eingabe zum Umbenennen entstehen erst beim Zeichnen und werden beim
 * nächsten Zeichnen ersetzt. Ohne diese Prüfung würde hier für immer „nicht da“
 * oder ein längst ausgetauschtes Element zurückkommen.
 */
export function el(id) {
  const known = cache.get(id);
  if (known && known.isConnected) return known;
  const found = document.getElementById(id);
  if (found) cache.set(id, found);
  else cache.delete(id);
  return found;
}

/* Erstes Element, das zum Selektor passt — nur innerhalb dieser Datei gebraucht. */
function q(selector) {
  return document.querySelector(selector);
}

/**
 * Ein Eingabefeld fokussieren und die Schreibmarke ans Ende setzen. `focus()`
 * allein lässt manche Browser den ganzen Text markieren — das sieht nach
 * „alles wird gleich überschrieben“ aus, obwohl man nur weitertippen will.
 */
export function focusAtEnd(input) {
  if (!input) return;
  input.focus();
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

/* Eingabearten, bei denen am Handy die Bildschirmtastatur aufgeht. */
const TEXT_INPUT_TYPES = ["text", "search", "email", "url", "tel", "password", "number"];

/** Öffnet ein Fokus auf `node` die Bildschirmtastatur (Textfeld oder bearbeitbarer Text)? */
export function isTextField(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.isContentEditable || node.tagName === "TEXTAREA") return true;
  return node.tagName === "INPUT" && TEXT_INPUT_TYPES.includes(node.type);
}

/** Alle Elemente, die zum Selektor passen, als echte Liste. */
export function qa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/* Die Elemente, die überall gebraucht werden — als Namen statt als IDs. */
export const dom = {
  get device() { return q(".device"); },
  get content() { return q(".content"); },

  /* Kopfzeile */
  get levelGauge() { return el("level-gauge"); },
  get levelBtn() { return el("level-btn"); },
  get searchEntry() { return el("search-entry"); },
  get searchInput() { return el("search-input"); },
  get profileBtn() { return el("profile-btn"); },

  /* Übersicht */
  get overviewGrid() { return el("overview-grid"); },
  get workspaceTabs() { return el("workspace-tabs"); },
  get workspaceList() { return el("workspace-list"); },

  /* Unterseite (Übersichtskarte oder Arbeitsbereich) */
  get pageHead() { return el("page-head"); },
  get pageCrumb() { return el("page-crumb"); },
  get pageTitle() { return el("page-title"); },
  get pageBody() { return el("page-body"); },
  get pageMenuBtn() { return el("page-menu"); },
  get pageSearchBtn() { return el("page-search"); },
  get backBtn() { return el("back-btn"); },

  /* Eintrag bearbeiten */
  get entryTitle() { return el("entry-title"); },
  get entryPills() { return el("entry-pills"); },
  get entryPanelNotes() { return el("entry-panel-notes"); },
  get entryPanelLinks() { return el("entry-panel-links"); },
  get entryBody() { return el("entry-body"); },
  get entryLinks() { return el("entry-links"); },
  get entryCrumb() { return el("entry-crumb"); },
  get entryBack() { return el("entry-back"); },
  get entryMenu() { return el("entry-menu"); },

  /* Suchen */
  get searchResults() { return el("search-results"); },
  get searchPill() { return el("search-pill"); },

  /* Untere Leiste */
  get bottomBar() { return q(".bottom-bar"); },
  get navShell() { return el("nav-shell"); },
  get tabBar() { return el("tab-bar"); },
  get tabButtons() { return qa(".tab-btn"); },
  get mediaActions() { return el("media-actions"); },
  get drawTools() { return el("draw-tools"); },

  /* Eingabefeld */
  get composer() { return el("composer"); },
  get composerInput() { return el("composer-input"); },
  get composerTypes() { return el("composer-types"); },
  get composerLink() { return el("composer-link"); },
  get composerLinkLabel() { return el("composer-link-label"); },
  get composerTypePill() { return el("composer-type-pill"); },
  get composerTypeIcon() { return el("composer-type-icon"); },
  get composerTypeLabel() { return el("composer-type-label"); },
  get composerSend() { return el("composer-send"); },
  get composerAttach() { return el("composer-attach"); },
  get composerAttachments() { return el("composer-attachments"); },
  get composerMic() { return el("composer-mic"); },

  /* Blätter und Menüs */
  get sheet() { return el("sheet"); },
  get sheetTitle() { return el("sheet-title"); },
  get sheetOptions() { return el("sheet-options"); },
  get ctxMenu() { return el("ctx-menu"); },
  get ctxCard() { return el("ctx-card"); },

  /* Fortschritt und Profil */
  get progressModal() { return el("progress"); },
  get progressBody() { return el("progress-body"); },
  get profileModal() { return el("profile"); },
  get profileBody() { return el("profile-body"); },
  get profileSave() { return el("profile-save"); },
  get avatarView() { return el("avatar-view"); },
  get avatarViewStage() { return el("avatar-view-stage"); },

  /* Kalender */
  get calHead() { return el("cal-head"); },
  get calMonthBtn() { return el("cal-month"); },
  get calMonthLabel() { return el("cal-month-label"); },
  get calStrip() { return el("cal-strip"); },
  get calWeeks() { return el("cal-weeks"); },
  get calModeBtn() { return el("cal-mode"); },
  get calModeIcon() { return el("cal-mode-icon"); },
  get calTodayBtn() { return el("cal-today"); },
  get calSpanBtn() { return el("cal-span"); },
  get calPanel() { return el("cal-panel"); },

  /* Aufgaben */
  get tasksTools() { return el("tasks-tools"); },
  get tasksBody() { return el("tasks-body"); },

  /* Medien */
  get mediaFilters() { return el("media-filters"); },
  get mediaBody() { return el("media-body"); },
  get mediaViewer() { return el("media-viewer"); },

  /* Zeichnung */
  get drawPad() { return el("draw-pad"); },
  get drawCanvas() { return el("draw-canvas"); },
  get drawColors() { return el("draw-colors"); },
};
