/*
 * Das Profil-Blatt hinter dem runden Knopf oben rechts: Bild, Nutzungszeit,
 * Serie und die Listen. Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/profile/profile.js
 *
 * Keine anpassbaren visuellen Werte: siehe styles/profile.css und
 * styles/overlays.css.
 */

import { emit, events } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { flushUsage, trackUsage } from "../../data/usage.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { closeCtxMenu } from "../../ui/ctx-menu.js";
import { registerOverlay } from "../../ui/router.js";
import { closeSheet, openSheet } from "../../ui/sheet.js";
import {
  bindPhotoInputs,
  commitDraft,
  currentPhoto,
  discardDraft,
  hasDraft,
  renderAvatarStage,
  renderProfileButton,
  setDraft,
} from "./avatar.js";
import { identityCard, listsMarkup, streakCard, usageCard } from "./profile-cards.js";

/** Alle Karten in das Blatt zeichnen. */
export function renderProfile() {
  dom.profileBody.innerHTML = identityCard() + usageCard() + streakCard() + listsMarkup();
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

function applyDraft(value) {
  setDraft(value);
  rerenderKeepingScroll();
  showSaveBar(true);
}

function dropDraft() {
  discardDraft();
  showSaveBar(false);
}

/** Das Blatt und die große Bildansicht ohne Umweg über den Verlauf schließen. */
export function hide() {
  dom.profileModal.hidden = true;
  dom.avatarView.hidden = true;
  dropDraft();
  clearModalPull(dom.profileModal);
  clearModalPull(dom.avatarView);
}

/** Das Blatt öffnen. */
export function open(push = true) {
  closeSheet();
  closeCtxMenu();
  emit(events.overlayOpened);
  /* Das Fortschritt-Blatt liegt an derselben Stelle: es weicht. */
  dom.progressModal.hidden = true;
  trackUsage();
  flushUsage();

  if (dom.profileModal.hidden) {
    renderProfile();
    dom.profileBody.scrollTop = 0;
  }
  clearModalPull(dom.profileModal);
  dom.profileModal.hidden = false;

  if (push) {
    dom.avatarView.hidden = true;
    history.pushState({ view: "profile", from: ui.sourceView }, "", "#/profil");
  }
}

/** Das Blatt schließen; der Verlauf geht dabei einen Schritt zurück. */
export function close() {
  if (dom.profileModal.hidden) return;
  if (history.state && history.state.view === "profile") {
    history.back();
    return;
  }
  hide();
}

/** Die große Bildansicht öffnen. */
export function openAvatarView(push = true) {
  renderAvatarStage();
  clearModalPull(dom.avatarView);
  dom.avatarView.hidden = false;
  if (push) history.pushState({ view: "avatar", from: "profile" }, "", "#/profil/bild");
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

/* Das Blatt „Profilbild“ mit den drei Quellen. */
function openAvatarPicker() {
  const options = [
    { icon: "camera", label: "Foto aufnehmen", onSelect: () => el("profile-file-photo").click() },
    { icon: "photos", label: "Aus der Bibliothek", onSelect: () => el("profile-file-library").click() },
  ];
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

/* Klicks im Blatt: Bild ändern, Bild ansehen, Zeitraum umstellen. */
function onBodyClick(event) {
  if (event.target.closest("[data-avatar-edit]")) {
    openAvatarPicker();
    return;
  }
  if (event.target.closest("[data-avatar-view]")) {
    openAvatarView();
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
  dom.profileModal.addEventListener("click", (event) => {
    if (event.target === dom.profileModal) close();
  });
  dom.profileBody.addEventListener("click", onBodyClick);

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

  bindPhotoInputs(applyDraft);
  bindModalPull(dom.profileModal, close);
  bindModalPull(dom.avatarView, closeAvatarView);

  registerOverlay("profile", { open, hide });
  registerOverlay("avatar", { open: openAvatarView, hide: hideAvatarView });
}

init();
