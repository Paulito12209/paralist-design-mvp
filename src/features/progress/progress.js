/*
 * Das Fortschritt-Blatt hinter der Level-Anzeige oben links: Ring,
 * Meilensteine, Verlauf, nächste Stufen und Historie. Tippt man die Karte
 * „Meilensteine“ an, tritt deren eigene Seite an die Stelle der Karten — mit
 * Pfeil zurück, wie im Einstellungs-Blatt. Am Desktop ist es eine Seite in
 * der Mitte (styles/desk-progress.css) mit den Karten „Diese Woche“ und
 * „Serie“ und dem Aktivitätsband obenauf (progress-desk.js). Wird erst beim
 * ersten Öffnen nachgeladen.
 * Pfad: src/features/progress/progress.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/progress.css,
 * styles/milestones.css, styles/overlays.css und am Desktop styles/desk-progress.css.
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { registerOverlay } from "../../ui/router.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { closeSheet } from "../../ui/sheet.js";
import { donutCard, historyCard } from "./progress-charts.js";
import { historyPageSize, levelsCard, logCard } from "./progress-lists.js";
import { handleDeskClick, progressDeskHead } from "./progress-desk.js";
import { enterMilestones, milestonesPage, milestonesTeaser, toggleMilestone } from "./progress-milestones.js";

/* Offene Unterseite des Blatts: null für die Karten, "milestones" für die Meilensteine. */
let detail = null;

/** Das Blatt zeichnen: die Karten oder die Seite „Meilensteine“. */
export function renderProgress() {
  dom.progressBody.innerHTML =
    detail === "milestones"
      ? milestonesPage()
      : progressDeskHead() + donutCard() + milestonesTeaser() + historyCard() + levelsCard() + logCard();
  /* is-cards: am Desktop stehen die Karten in zwei Spalten, die Meilensteine nicht */
  dom.progressBody.classList.toggle("is-cards", !detail);
  /* Auf der Unterseite rücken Pfeil und „Fortschritt“ zusammen nach links — sie
     sind der Weg zurück zu den Karten (siehe .modal-head.is-back). */
  el("progress-back").hidden = !detail;
  el("progress-head").classList.toggle("is-back", Boolean(detail));
}

/* Neu zeichnen, ohne dass die Liste nach oben springt. */
function rerenderKeepingScroll() {
  const scroll = dom.progressBody.scrollTop;
  renderProgress();
  dom.progressBody.scrollTop = scroll;
}

/**
 * Das Blatt öffnen.
 * @param push false, wenn der Verlauf es zurückholt — dann sagt `entry`, ob
 *   dabei die Seite „Meilensteine“ offen war.
 */
export function open(push = true, entry = null) {
  closeSheet();
  closeCtxMenu();
  emit(events.overlayOpened);
  /* Das Profil-Blatt liegt an derselben Stelle: es weicht. */
  dom.profileModal.hidden = true;
  dom.avatarView.hidden = true;

  const wanted = entry && entry.detail === "milestones" ? "milestones" : null;
  if (wanted && wanted !== detail) enterMilestones();
  detail = wanted;
  ui.historyLimit = historyPageSize;
  renderProgress();
  clearModalPull(dom.progressModal);
  dom.progressModal.hidden = false;
  dom.progressBody.scrollTop = 0;
  if (push) history.pushState({ view: "progress", from: ui.sourceView }, "", "#/fortschritt");
}

/** Die Seite „Meilensteine“ öffnen; sie bekommt einen eigenen Schritt im Verlauf. */
function openMilestones() {
  enterMilestones();
  detail = "milestones";
  renderProgress();
  dom.progressBody.scrollTop = 0;
  history.pushState({ view: "progress", detail, from: ui.sourceView }, "", "#/fortschritt/meilensteine");
}

/** Von den Meilensteinen zurück zu den Karten. */
function closeDetail() {
  if (history.state && history.state.view === "progress" && history.state.detail) {
    history.back();
    return;
  }
  detail = null;
  renderProgress();
}

/** Das Blatt ohne Umweg über den Verlauf schließen. */
export function hide() {
  dom.progressModal.hidden = true;
  detail = null;
}

/** Das Blatt schließen; der Verlauf geht dabei einen Schritt zurück. */
export function close() {
  if (dom.progressModal.hidden) return;
  const entry = history.state;
  if (entry && entry.view === "progress") {
    /* Auf den Meilensteinen liegen zwei Schritte im Verlauf: das Kreuz
       schließt beide, sonst stünden danach wieder die Karten offen. */
    history.go(entry.detail ? -2 : -1);
    return;
  }
  hide();
}

/* Klicks im Blatt: Zeitraum umstellen, mehr Historie, Meilensteine öffnen oder aufklappen. */
function onBodyClick(event) {
  if (handleDeskClick(event)) return;
  const range = event.target.closest("[data-range]");
  if (range) {
    ui.progressRange = Number(range.dataset.range);
    rerenderKeepingScroll();
    return;
  }
  if (event.target.closest("#history-more")) {
    ui.historyLimit += historyPageSize;
    rerenderKeepingScroll();
    return;
  }
  if (event.target.closest("[data-progress-detail]")) {
    openMilestones();
    return;
  }
  const row = event.target.closest("[data-milestone]");
  if (row) {
    toggleMilestone(row.dataset.milestone);
    rerenderKeepingScroll();
  }
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  el("progress-close").addEventListener("click", close);
  el("progress-back").addEventListener("click", closeDetail);
  dom.progressModal.addEventListener("click", (event) => {
    if (event.target === dom.progressModal) close();
  });
  dom.progressBody.addEventListener("click", onBodyClick);
  bindModalPull(dom.progressModal, close);
  registerOverlay("progress", { open, hide, close });
  /* Am Desktop ist Fortschritt eine Seite: geht eine andere auf, tritt sie
     zurück. Am Handy liegt das Blatt darüber und bleibt, wie es war. */
  on(events.viewWillChange, () => {
    if (isDesk() && !dom.progressModal.hidden) hide();
  });
  /* Über die Grenze gezogen: Kopf mit Karten und Band kommt oder geht. */
  onDeskChange(() => {
    if (!dom.progressModal.hidden) rerenderKeepingScroll();
  });
  /* Neue Punkte oder ein abgehakter Eintrag: die offene Seite zählt mit. */
  on(events.xpChanged, () => {
    if (!dom.progressModal.hidden) rerenderKeepingScroll();
  });
}

init();
