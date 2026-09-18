/*
 * Das Fortschritt-Blatt hinter der Level-Anzeige oben links: Ring, Verlauf,
 * nächste Stufen und Historie. Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/progress/progress.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/progress.css und
 * styles/overlays.css.
 */

import { dom, el } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { registerOverlay } from "../../ui/router.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { closeSheet } from "../../ui/sheet.js";
import { donutCard, historyCard } from "./progress-charts.js";
import { historyPageSize, levelsCard, logCard } from "./progress-lists.js";

/** Alle vier Karten in das Blatt zeichnen. */
export function renderProgress() {
  dom.progressBody.innerHTML = donutCard() + historyCard() + levelsCard() + logCard();
}

/* Neu zeichnen, ohne dass die Liste nach oben springt. */
function rerenderKeepingScroll() {
  const scroll = dom.progressBody.scrollTop;
  renderProgress();
  dom.progressBody.scrollTop = scroll;
}

/** Das Blatt öffnen. */
export function open(push = true) {
  closeSheet();
  closeCtxMenu();
  /* Das Profil-Blatt liegt an derselben Stelle: es weicht. */
  dom.profileModal.hidden = true;
  dom.avatarView.hidden = true;

  ui.historyLimit = historyPageSize;
  renderProgress();
  clearModalPull(dom.progressModal);
  dom.progressModal.hidden = false;
  dom.progressBody.scrollTop = 0;
  if (push) history.pushState({ view: "progress", from: ui.sourceView }, "", "#/fortschritt");
}

/** Das Blatt ohne Umweg über den Verlauf schließen. */
export function hide() {
  dom.progressModal.hidden = true;
}

/** Das Blatt schließen; der Verlauf geht dabei einen Schritt zurück. */
export function close() {
  if (dom.progressModal.hidden) return;
  if (history.state && history.state.view === "progress") {
    history.back();
    return;
  }
  hide();
}

/* Klicks im Blatt: Zeitraum umstellen oder mehr Historie zeigen. */
function onBodyClick(event) {
  const range = event.target.closest("[data-range]");
  if (range) {
    ui.progressRange = Number(range.dataset.range);
    rerenderKeepingScroll();
    return;
  }
  if (event.target.closest("#history-more")) {
    ui.historyLimit += historyPageSize;
    rerenderKeepingScroll();
  }
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  el("progress-close").addEventListener("click", close);
  dom.progressModal.addEventListener("click", (event) => {
    if (event.target === dom.progressModal) close();
  });
  dom.progressBody.addEventListener("click", onBodyClick);
  bindModalPull(dom.progressModal, close);
  registerOverlay("progress", { open, hide });
}

init();
