/*
 * Das Fortschritt-Blatt hinter der Level-Anzeige oben links: Ring, Analyse
 * (Nutzungszeit und Serie), Meilensteine, Verlauf, nächste Stufen und
 * Historie (die Analyse nur am Handy). Tippt man eine Karte an („Meilensteine“, „Nutzungszeit“, „Serie“),
 * tritt deren eigene Seite an die Stelle der Karten — mit Pfeil zurück, wie im
 * Einstellungs-Blatt. In der Android-Fassung ist das Blatt eine ganze Seite
 * mit Kopfleiste (Pfeil links, Titel der Seite) statt eines Blatts von unten. Am Desktop ist es eine Seite in
 * der Mitte (styles/desk-progress.css) mit den Karten „Diese Woche“ und
 * „Serie“ und dem Aktivitätsband obenauf (progress-desk.js). Wird erst beim
 * ersten Öffnen nachgeladen.
 * Pfad: src/features/progress/progress.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pages -> die Unterseiten: Titel (steht in der Kopfleiste bzw. über dem
 *          Inhalt), Stück Adresse hinter „#/fortschritt/“ und Inhalt
 *
 * Sonst keine anpassbaren visuellen Werte: siehe styles/progress.css,
 * styles/milestones.css, styles/overlays.css und am Desktop styles/desk-progress.css.
 */

import { emit, events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { insightsSection } from "../../ui/insight-tiles.js";
import { isMobileOs } from "../../ui/platform.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { registerOverlay } from "../../ui/router.js";
import { streakCard, usageCard } from "../../ui/usage-pages.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { closeSheet } from "../../ui/sheet.js";
import { donutCard, historyCard } from "./progress-charts.js";
import { historyPageSize, levelsCard, logCard } from "./progress-lists.js";
import { handleDeskClick, progressDeskHead } from "./progress-desk.js";
import { enterMilestones, milestonesPage, milestonesTeaser, toggleMilestone } from "./progress-milestones.js";

const rootTitle = "Fortschritt";

/* Die Unterseiten: Name, Stück Adresse und Inhalt. Die Karten tragen ihren
   Namen schon selbst im Kopf; die Überschrift davor zeigen nur die anderen
   Fassungen (die Android-Fassung nennt ihn in der Kopfleiste). */
const pages = {
  milestones: { title: "Meilensteine", hash: "meilensteine", markup: () => milestonesPage(), enter: enterMilestones },
  usage: { title: "Nutzungszeit", hash: "nutzungszeit", markup: () => pageHeading("Nutzungszeit") + usageCard() },
  streak: { title: "Serie", hash: "serie", markup: () => pageHeading("Serie") + streakCard() },
};

function pageHeading(title) {
  return `<h3 class="settings-detail-title">${title}</h3>`;
}

/* Die Analyse steht nur am Handy hier; am Desktop bleibt sie im Profil (Punkt „Analyse“). */
function insightsBlock() {
  return isDesk() ? "" : `<section class="progress-insights">${insightsSection("data-progress-detail")}</section>`;
}

/* Offene Unterseite des Blatts: null für die Karten, sonst ein Schlüssel aus `pages`. */
let detail = null;

/** Das Blatt zeichnen: die Karten oder eine Unterseite. */
export function renderProgress() {
  dom.progressBody.innerHTML = detail
    ? pages[detail].markup()
    : progressDeskHead() + donutCard() + insightsBlock() + milestonesTeaser() + historyCard() + levelsCard() + logCard();
  /* is-cards: am Desktop stehen die Karten in zwei Spalten, die Unterseiten nicht */
  dom.progressBody.classList.toggle("is-cards", !detail);
  /* Als Seite (Android) steht links immer der Pfeil — auf den Karten schließt er
     das Blatt, auf einer Unterseite führt er zu den Karten — und in der Leiste
     der Name der Seite. */
  const asPage = isMobileOs("android");
  el("progress-title").textContent = asPage && detail ? pages[detail].title : rootTitle;
  /* Als Blatt rücken Pfeil und „Fortschritt“ auf einer Unterseite zusammen nach
     links — sie sind der Weg zurück zu den Karten (siehe .modal-head.is-back). */
  el("progress-back").hidden = !detail && !asPage;
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

  const wanted = entry && pages[entry.detail] ? entry.detail : null;
  if (wanted && wanted !== detail) pages[wanted].enter?.();
  detail = wanted;
  ui.historyLimit = historyPageSize;
  renderProgress();
  clearModalPull(dom.progressModal);
  dom.progressModal.hidden = false;
  dom.progressBody.scrollTop = 0;
  if (push) history.pushState({ view: "progress", from: ui.sourceView }, "", "#/fortschritt");
}

/** Eine Unterseite öffnen; sie bekommt einen eigenen Schritt im Verlauf. */
export function openPage(key) {
  if (!pages[key]) return;
  pages[key].enter?.();
  detail = key;
  renderProgress();
  dom.progressBody.scrollTop = 0;
  history.pushState({ view: "progress", detail, from: ui.sourceView }, "", `#/fortschritt/${pages[key].hash}`);
}

/* Der Pfeil links: auf einer Unterseite zurück zu den Karten, auf den Karten
   (nur als Seite sichtbar) das Blatt schließen. */
function goBack() {
  if (!detail) {
    close();
    return;
  }
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
    /* Auf einer Unterseite liegen zwei Schritte im Verlauf: das Kreuz
       schließt beide, sonst stünden danach wieder die Karten offen. */
    history.go(entry.detail ? -2 : -1);
    return;
  }
  hide();
}

/* Klicks im Blatt: Zeitraum umstellen, mehr Historie, Unterseite öffnen, Meilenstein aufklappen. */
function onBodyClick(event) {
  if (handleDeskClick(event)) return;
  const range = event.target.closest("[data-range]");
  if (range) {
    ui.progressRange = Number(range.dataset.range);
    rerenderKeepingScroll();
    return;
  }
  const usageRange = event.target.closest("[data-usage-range]");
  if (usageRange) {
    ui.usageRange = Number(usageRange.dataset.usageRange);
    rerenderKeepingScroll();
    return;
  }
  if (event.target.closest("#history-more")) {
    ui.historyLimit += historyPageSize;
    rerenderKeepingScroll();
    return;
  }
  const page = event.target.closest("[data-progress-detail]");
  if (page) {
    openPage(page.dataset.progressDetail);
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
  el("progress-back").addEventListener("click", goBack);
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
