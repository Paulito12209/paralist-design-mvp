/*
 * Das Einstellungs-Blatt hinter dem runden Knopf oben rechts: Profilkopf, die
 * beiden Kacheln unter „Analyse“, die Darstellung und die Konto-Listen. Tippt
 * man eine Kachel an, tritt an die Stelle der Liste die volle Karte mit
 * Diagramm. Der Bereich heißt weiter „profile“, weil das Blatt am Profilkopf
 * hängt. Unter „Konto“ führt eine Zeile zu den Kontoeinstellungen, unter
 * „Support“ zwei auf das Feedback-Formular und die Danksagungen; „Roadmap“
 * ist dagegen ein Link nach draußen und braucht hier nichts (Adresse in
 * profile-cards.js). „Nach Updates suchen“ unter „Mehr“ bittet die Hülle, die
 * neueste Fassung zu laden. Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/profile/profile.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/profile.css,
 * styles/settings.css und styles/overlays.css.
 */

import { emit, events } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { flushUsage, trackUsage } from "../../data/usage.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { registerOverlay } from "../../ui/router.js";
import { closeSheet, openSheet } from "../../ui/sheet.js";
import { hideCropper, openCropper } from "./avatar-crop.js";
import {
  bindPhotoInputs,
  commitDraft,
  currentPhoto,
  currentSource,
  discardDraft,
  hasDraft,
  renderAvatarStage,
  renderProfileButton,
  setDraft,
} from "./avatar.js";
import { noteFeedbackInput, onFeedbackClick } from "./feedback.js";
import { toggleNavLabels } from "./nav-labels.js";
import { identityCard, listsMarkup } from "./profile-cards.js";
import {
  appearanceSection,
  detailHash,
  detailMarkup,
  enterDetail,
  insightsSection,
  isDetail,
  settleDetail,
} from "./settings-cards.js";
import { setTheme } from "./theme.js";

/* Welche große Ansicht zuletzt gezeichnet wurde — null steht für die Liste. */
let shownDetail = null;

/** Das Blatt zeichnen: entweder die Liste oder die aufgeklappte Kachel. */
export function renderProfile() {
  shownDetail = ui.settingsDetail;
  dom.profileBody.innerHTML = shownDetail
    ? detailMarkup(shownDetail)
    : identityCard() + insightsSection() + appearanceSection() + listsMarkup();
  /* Nur auf einer Unterseite: der Pfeil erscheint und „Einstellungen“ rückt
     neben ihn — zusammen sind sie der Weg zurück zur Liste. Auf der Liste
     selbst führt das Kreuz allein aus dem Blatt heraus. */
  el("profile-back").hidden = !shownDetail;
  el("profile-head").classList.toggle("is-back", Boolean(shownDetail));
  if (shownDetail) settleDetail(shownDetail);
}

/* Neu zeichnen, ohne dass die Liste nach oben springt. */
function rerenderKeepingScroll() {
  const scroll = dom.profileBody.scrollTop;
  renderProfile();
  dom.profileBody.scrollTop = scroll;
}

/* Die Leiste „Abbrechen / Speichern“ erscheint nur, solange eine Änderung offen ist. */
function showSaveBar(on) {
  dom.profileSave.hidden = !on;
}

function applyDraft(value, whole = null) {
  setDraft(value, whole);
  rerenderKeepingScroll();
  showSaveBar(true);
}

function dropDraft() {
  discardDraft();
  showSaveBar(false);
}

/** Eine Kachel aufklappen: die volle Karte tritt an die Stelle der Liste. */
function openDetail(key) {
  if (!isDetail(key)) return;
  enterDetail(key);
  ui.settingsDetail = key;
  renderProfile();
  dom.profileBody.scrollTop = 0;
  history.pushState({ view: "profile", detail: key, from: ui.sourceView }, "", `#/einstellungen/${detailHash(key)}`);
}

/** Von der vollen Karte zurück zur Liste. */
function closeDetail() {
  if (history.state && history.state.view === "profile" && history.state.detail) {
    history.back();
    return;
  }
  ui.settingsDetail = null;
  renderProfile();
}

/** Das Blatt und die große Bildansicht ohne Umweg über den Verlauf schließen. */
export function hide() {
  dom.profileModal.hidden = true;
  dom.avatarView.hidden = true;
  hideCropper();
  ui.settingsDetail = null;
  dropDraft();
  clearModalPull(dom.profileModal);
  clearModalPull(dom.avatarView);
}

/**
 * Das Blatt öffnen.
 * @param push false, wenn der Verlauf es zurückholt — dann sagt `entry`, ob
 *   dabei eine Kachel aufgeklappt war.
 */
export function open(push = true, entry = null) {
  closeSheet();
  closeCtxMenu();
  emit(events.overlayOpened);
  /* Das Fortschritt-Blatt liegt an derselben Stelle: es weicht. */
  dom.progressModal.hidden = true;
  trackUsage();
  flushUsage();

  ui.settingsDetail = entry && isDetail(entry.detail) ? entry.detail : null;
  /* Neu gezeichnet wird nur, wenn das Blatt zu war oder eine andere Ebene dran
     ist — sonst bliebe die Liste stehen, wo die Kachel hingehört. */
  if (dom.profileModal.hidden || ui.settingsDetail !== shownDetail) {
    renderProfile();
    dom.profileBody.scrollTop = 0;
  }
  clearModalPull(dom.profileModal);
  dom.profileModal.hidden = false;

  if (push) {
    dom.avatarView.hidden = true;
    history.pushState({ view: "profile", from: ui.sourceView }, "", "#/einstellungen");
  }
}

/** Das Blatt schließen; der Verlauf geht dabei einen Schritt zurück. */
export function close() {
  if (dom.profileModal.hidden) return;
  const entry = history.state;
  if (entry && entry.view === "profile") {
    /* Bei aufgeklappter Kachel liegen zwei Schritte im Verlauf: das Kreuz
       schließt beide, sonst stünde danach wieder die Liste offen. */
    history.go(entry.detail ? -2 : -1);
    return;
  }
  hide();
}

/** Die große Bildansicht öffnen. */
export function openAvatarView(push = true) {
  renderAvatarStage();
  clearModalPull(dom.avatarView);
  dom.avatarView.hidden = false;
  if (push) history.pushState({ view: "avatar", from: "profile" }, "", "#/einstellungen/bild");
}

/** Die große Bildansicht schließen. */
export function closeAvatarView() {
  if (dom.avatarView.hidden) return;
  if (history.state && history.state.view === "avatar") {
    history.back();
    return;
  }
  dom.avatarView.hidden = true;
  clearModalPull(dom.avatarView);
}

function hideAvatarView() {
  dom.avatarView.hidden = true;
}

/* Den Ausschnitt-Editor schließen; er hat einen eigenen Verlaufsschritt. */
function closeCropper() {
  if (history.state && history.state.view === "avatar-crop") {
    history.back();
    return;
  }
  hideCropper();
}

/* Den Ausschnitt wählen — für ein neues Foto oder das schon hinterlegte. */
function startCrop(whole) {
  openCropper(whole, { done: applyDraft, close: closeCropper });
  history.pushState({ view: "avatar-crop", from: "profile" }, "", "#/einstellungen/bild/ausschnitt");
}

/* Das Blatt „Profilbild“ mit den Quellen, dem Ausschnitt und dem Entfernen. */
function openAvatarPicker() {
  const options = [
    { icon: "camera", label: "Foto aufnehmen", onSelect: () => el("profile-file-photo").click() },
    { icon: "photos", label: "Aus der Bibliothek", onSelect: () => el("profile-file-library").click() },
  ];
  const whole = currentSource();
  if (whole) options.push({ icon: "image", label: "Ausschnitt ändern", onSelect: () => startCrop(whole) });
  if (currentPhoto()) {
    options.push({
      icon: "trash",
      label: "Bild entfernen",
      danger: true,
      split: true,
      onSelect: () => applyDraft(""),
    });
  }
  openSheet("Profilbild", options);
}

/* Was „Nach Updates suchen“ rechts in der Zeile anzeigt. */
const updateStatus = {
  checking: "Wird gesucht …",
  loading: "Wird geladen …",
  current: "Aktuell",
  offline: "Kein Netz",
};

/* Die Hülle (src/shell/update-prompt.js) sieht nach und lädt eine neuere
   Fassung sofort; hier steht nur, was sie zurückmeldet. */
function checkForUpdateNow(row) {
  if (row.dataset.busy === "1") return;
  const status = row.querySelector(".plist-status");
  const show = (key) => {
    status.textContent = updateStatus[key] || "";
    row.dataset.busy = key === "checking" || key === "loading" ? "1" : "";
  };
  show("checking");
  emit(events.updateRequested, { report: show });
}

/* Klicks im Blatt: Feedback-Seite, Bild, Kacheln, Darstellung, Zeitraum. */
function onBodyClick(event) {
  if (onFeedbackClick(event)) {
    rerenderKeepingScroll();
    return;
  }
  if (event.target.closest("[data-avatar-edit]")) {
    openAvatarPicker();
    return;
  }
  if (event.target.closest("[data-avatar-view]")) {
    openAvatarView();
    return;
  }
  if (event.target.closest('[data-settings-action="update"]')) {
    checkForUpdateNow(event.target.closest("button"));
    return;
  }
  const card = event.target.closest("[data-settings-detail]");
  if (card) {
    openDetail(card.dataset.settingsDetail);
    return;
  }
  const theme = event.target.closest("[data-theme-option]");
  if (theme) {
    setTheme(theme.dataset.themeOption);
    rerenderKeepingScroll();
    return;
  }
  if (event.target.closest("[data-nav-labels-toggle]")) {
    toggleNavLabels();
    rerenderKeepingScroll();
    return;
  }
  const range = event.target.closest("[data-usage-range]");
  if (!range) return;
  ui.usageRange = Number(range.dataset.usageRange);
  rerenderKeepingScroll();
}

/* Beim Laden des Moduls einmal alles anmelden. */
function init() {
  el("profile-close").addEventListener("click", close);
  el("profile-back").addEventListener("click", closeDetail);
  dom.profileModal.addEventListener("click", (event) => {
    if (event.target === dom.profileModal) close();
  });
  dom.profileBody.addEventListener("click", onBodyClick);
  /* Tippen wird nur gemerkt, nicht neu gezeichnet — sonst spränge die
     Schreibmarke im Feedback-Formular bei jedem Buchstaben ans Ende. */
  dom.profileBody.addEventListener("input", noteFeedbackInput);

  el("avatar-view-close").addEventListener("click", closeAvatarView);
  dom.avatarView.addEventListener("click", (event) => {
    if (event.target === dom.avatarView) closeAvatarView();
  });

  el("profile-photo-cancel").addEventListener("click", () => {
    dropDraft();
    rerenderKeepingScroll();
  });
  el("profile-photo-save").addEventListener("click", () => {
    if (!hasDraft()) return;
    commitDraft();
    showSaveBar(false);
    renderProfileButton();
    rerenderKeepingScroll();
  });

  bindPhotoInputs((image) => startCrop({ image, crop: null }));
  bindModalPull(dom.profileModal, close);
  bindModalPull(dom.avatarView, closeAvatarView);

  registerOverlay("profile", { open, hide });
  registerOverlay("avatar", { open: openAvatarView, hide: hideAvatarView });
  /* Den Editor holt der Verlauf nicht zurück — das gewählte Foto ist dann nicht mehr da. */
  registerOverlay("crop", { open: () => {}, hide: hideCropper });
}

init();
