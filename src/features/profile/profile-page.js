/*
 * Das Einstellungs-Blatt als Seite am Desktop (ab 1024px): es liegt in der
 * Mitte statt als Dialog darüber, heißt „Profil“ und hat links ein Untermenü
 * (src/features/profile/settings-nav.js). Verlauf und Zurück bleiben die des
 * Blatts: #/einstellungen, der Pfeil oben links führt dorthin, woher man kam.
 * Öffnet man daneben eine andere Seite (Reiter, Sammlung), tritt das Profil
 * ohne eigenen Verlaufsschritt zurück — Zurück holt es wieder. Diese Datei
 * hängt das Untermenü ein, hält Titel und Auswahl aktuell und wechselt den
 * Punkt; gezeichnet wird der Inhalt in src/features/profile/profile.js.
 * Pfad: src/features/profile/profile-page.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pageTitle  -> Überschrift der Seite am Desktop
 * sheetTitle -> Überschrift des Blatts am Handy
 *
 * Aussehen in styles/desk-settings.css.
 */

import { events, on } from "../../core/bus.js";
import { dom, el } from "../../core/dom.js";
import { ui } from "../../data/state.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { enterPane, isPane, settingsNavMarkup } from "./settings-nav.js";

const pageTitle = "Profil";
const sheetTitle = "Einstellungen";

let nav = null;
/* Von profile.js hereingegeben: neu zeichnen und ohne Verlauf schließen. */
let redraw = () => {};
let hideSheet = () => {};

/** Titel und Untermenü passend zur Breite und zum gewählten Punkt setzen. */
export function renderPageChrome() {
  el("profile-title").textContent = isDesk() ? pageTitle : sheetTitle;
  if (nav) nav.innerHTML = isDesk() ? settingsNavMarkup(ui.settingsPane) : "";
}

/*
 * Einen Punkt wählen. Kein neuer Verlaufsschritt — der Punkt wird im
 * vorhandenen Eintrag vermerkt, damit Zurück ihn wieder herstellt. War eine
 * Unterseite offen (zwei Schritte im Verlauf), bleibt das vermerkt: das
 * Schließen geht dann weiter beide zurück (siehe close in profile.js).
 */
export function selectPane(id) {
  if (!isPane(id)) return;
  enterPane(id);
  const entry = history.state;
  if (entry && entry.view === "profile") {
    const stack = entry.stack || (entry.detail ? 2 : 1);
    history.replaceState({ view: "profile", from: entry.from, pane: id, stack }, "", "#/einstellungen");
  }
  ui.settingsPane = id;
  ui.settingsDetail = null;
  redraw();
  dom.profileBody.scrollTop = 0;
}

/**
 * Untermenü einhängen und die Wechsel anmelden. Einmal beim Laden des Profils.
 * @param handlers { render, hide } aus src/features/profile/profile.js.
 */
export function initProfilePage(handlers) {
  redraw = handlers.render;
  hideSheet = handlers.hide;
  /* nav: das Untermenü ist eine eigene Navigation innerhalb der Seite */
  nav = document.createElement("nav");
  nav.className = "settings-nav";
  nav.setAttribute("aria-label", "Bereiche des Profils");
  dom.profileModal.querySelector(".modal").prepend(nav);
  nav.addEventListener("click", (event) => {
    const item = event.target.closest("[data-settings-pane]");
    if (item) selectPane(item.dataset.settingsPane);
  });

  /* Eine andere Seite geht auf: die Profilseite tritt zurück. Am Handy
     liegt das Blatt darüber und bleibt, wie es war. */
  on(events.viewWillChange, () => {
    if (isDesk() && !dom.profileModal.hidden) hideSheet();
  });
  /* Über die Grenze gezogen: Blatt wird Seite und umgekehrt. */
  onDeskChange(() => {
    if (!dom.profileModal.hidden) redraw();
  });
}
