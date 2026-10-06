/*
 * Die Tastenkürzel der Desktop-Fassung. Gelten nur ab 1024px; am Handy
 * kommt dieses Modul gar nicht erst an (src/shell/desk.js lädt es mit).
 * Pfad: src/shell/desk-keys.js
 *
 * Keine anpassbaren visuellen Werte. Welche Taste welche Seite und welche
 * Sammlung öffnet, steht in src/ui/desk-links.js (pageLinks, collectionLinks,
 * chordWindow) — so können Taste und Schild daneben nie auseinanderlaufen.
 * Die Kürzel mit zwei Zusatztasten prüft src/shell/desk-combos.js.
 *
 * Tastenkürzel (nur, solange nicht in ein Feld getippt wird und kein Blatt offen ist):
 *   N              -> Eingabefeld zum Anlegen öffnen
 *   /  oder ⌘K     -> Such-Palette öffnen (src/shell/search-palette.js); bei offener
 *                     Palette markiert ⌘K das Suchwort, alle anderen Kürzel ruhen
 *   ⇧⌘Ü ⇧⌘K ⇧⌘A ⇧⌘M (oder 1 bis 4) -> Übersicht, Kalender, Aufgaben, Medien
 *   ⇧⌘O           -> Seitenfenster rechts auf- und zuklappen
 *   ⌃1 bis ⌃7 (oder G, dann I F B R L A P) -> Eingang, Favoriten, Arbeitsbereiche,
 *                     Ressourcen, Lesezeichen, Archiv, Projekte
 *   ⌘[  und  ⌘]    -> zurück und vor
 *   ⌘\             -> Seitenleiste ein- und ausklappen
 *   ⌘,             -> Profil und Einstellungen (Punkt „Konto“)
 *   ?              -> Profil › Kurzbefehle
 *   Escape         -> schließt, was obenauf liegt: Palette, Menü, Auswahl-Blatt, Dialog,
 *                     Dateiansicht, zuletzt das Eingabefeld — auch beim Tippen darin
 * Statt ⌘ gilt außerhalb des Macs Strg, statt ⌃ Alt.
 */

import { emit, events } from "../core/bus.js";
import { dom, el } from "../core/dom.js";
import { load } from "../core/lazy.js";
import { closeCtxMenu } from "../ui/ctx-menu.js";
import { isDesk } from "../ui/desk-mode.js";
import { chordKey, chordWindow, collectionLinks, pageLinks } from "../ui/desk-links.js";
import { goBack, goForward } from "../ui/router.js";
import { closeSheet } from "../ui/sheet.js";
import { onComboKey } from "./desk-combos.js";
import { isNavClosed, openPageTab, setNavClosed, toggleSidePanel } from "./desk-head.js";
import { openCollection } from "./desk-nav.js";
import { closePalette, isPaletteOpen, openPalette } from "./search-palette.js";

const navKeys = Object.fromEntries(pageLinks.map((link) => [link.key, link.tab]));
const chordTargets = Object.fromEntries(collectionLinks.map((link) => [link.key.toLowerCase(), link.id]));

/* Offene Ebenen, über denen kein Kürzel etwas auslösen darf. Profil und
   Fortschritt zählen nicht: am Desktop sind sie Seiten
   (src/features/profile/profile-page.js, src/features/progress/progress.js). */
const openLayers =
  ".palette-backdrop:not([hidden]), .modal-backdrop:not([hidden]):not(#profile):not(#progress), .sheet-backdrop:not([hidden]), .ctx-backdrop:not([hidden]), .viewer-backdrop:not([hidden]), .update-backdrop:not([hidden])";

/* „G“ wurde gedrückt: bis zu diesem Zeitpunkt zählt der nächste Buchstabe als Sammlung. */
let chordUntil = 0;

/* Tippt man gerade in ein Feld? Dann gehört jede Taste dem Feld. */
function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/*
 * Escape schließt die oberste Ebene über ihren eigenen Knopf — so läuft alles
 * über denselben Weg wie ein Klick, samt Verlauf und Zurück-Pfeil.
 * Gibt `true` zurück, wenn es etwas zu schließen gab.
 */
function closeTopLayer() {
  if (document.querySelector(".update-backdrop:not([hidden])")) return false;
  /* Die Palette öffnet nur, wenn sonst nichts offen ist — oder über dem
     Eingabefeld. Sie liegt darum immer obenauf. */
  if (isPaletteOpen()) {
    closePalette();
    return true;
  }
  if (!dom.ctxMenu.hidden) {
    closeCtxMenu();
    return true;
  }
  if (!dom.sheet.hidden) {
    closeSheet();
    return true;
  }
  const viewerClose = document.querySelector(".viewer-backdrop:not([hidden]) [data-viewer='close']");
  /* Mehrere Blätter können offen sein (Profilbild über dem Profil): das
     zuletzt eingehängte liegt oben. */
  const modals = document.querySelectorAll(".modal-backdrop:not([hidden]) .modal-close");
  const closeButton = viewerClose || modals[modals.length - 1];
  if (closeButton) {
    closeButton.click();
    return true;
  }
  if (!dom.composer.hidden) {
    el("composer-close").click();
    return true;
  }
  return false;
}

/* Nach einem Seitenwechsel per Taste steht der Fokus sonst weiter auf einem
   Knopf der alten Seite — und zeigt dort seinen Tastatur-Rahmen. */
function dropStaleFocus() {
  const active = document.activeElement;
  if (active && active !== document.body && !isTyping(active)) active.blur();
}

/* Die Such-Palette öffnen — auch bei zugeklappter Seitenleiste, die bleibt zu. */
function focusSearch() {
  openPalette();
}

/*
 * Kürzel mit der Befehlstaste (⌘ am Mac, Strg sonst). Sie gelten auch beim
 * Tippen in einem Feld nur für die Suche — die übrigen gehören dann dem Feld.
 * Gibt `true` zurück, wenn die Taste hier etwas getan hat.
 */
function onCommandKey(event) {
  const key = event.key.toLowerCase();
  if (key === "k") {
    focusSearch();
    return true;
  }
  if (isTyping(event.target)) return false;
  if (key === "\\") setNavClosed(!isNavClosed());
  else if (key === "[") goBack();
  else if (key === "]") goForward();
  else if (key === ",") openProfile("konto");
  else return false;
  return true;
}

/* Was die Kürzel aus src/shell/desk-combos.js auslösen. */
const comboActions = {
  openPage: (tab) => {
    dropStaleFocus();
    openPageTab(tab);
  },
  openCollection: (id) => {
    dropStaleFocus();
    openCollection(id);
  },
  toggleSide: toggleSidePanel,
};

/* Die Profilseite auf einem Punkt ihres Untermenüs öffnen. */
function openProfile(pane) {
  dropStaleFocus();
  load("profile").then((module) => module.openPane(pane));
}

/* „G“ öffnet das Fenster für den Buchstaben einer Sammlung; der Buchstabe schließt es wieder. */
function onChordKey(event) {
  const key = event.key.toLowerCase();
  if (Date.now() < chordUntil) {
    chordUntil = 0;
    if (!chordTargets[key]) return false;
    dropStaleFocus();
    openCollection(chordTargets[key]);
    return true;
  }
  if (key !== chordKey.toLowerCase()) return false;
  chordUntil = Date.now() + chordWindow;
  return true;
}

function onKeyDown(event) {
  if (!isDesk() || event.defaultPrevented) return;
  if (event.key === "Escape") {
    /* Das Update-Fenster schließt sich bei Escape selbst, noch bevor die Taste
       hier ankommt — sie darf dann nicht auch noch die Ebene darunter zumachen
       (ein offener Entwurf im Eingabefeld ginge verloren). */
    if (event.target instanceof Element && event.target.closest(".update-backdrop")) return;
    if (closeTopLayer()) event.preventDefault();
    return;
  }
  /* Zuerst die Kürzel mit zwei Zusatztasten — ⇧⌘K darf nicht als ⌘K die Suche öffnen. */
  if (!document.querySelector(openLayers) && onComboKey(event, comboActions)) {
    event.preventDefault();
    return;
  }
  /* Alt und Umschalt sind erlaubt: auf deutschen Tastaturen braucht „\“, „[“
     und „]“ eine davon. Es zählt das Zeichen, nicht die Taste. */
  const command = event.metaKey || event.ctrlKey;
  if (command && !document.querySelector(openLayers)) {
    if (onCommandKey(event)) event.preventDefault();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
  if (document.querySelector(openLayers)) return;

  if (onChordKey(event)) {
    event.preventDefault();
    return;
  }
  if (event.key === "/") {
    event.preventDefault();
    focusSearch();
    return;
  }
  if (event.key === "?") {
    event.preventDefault();
    openProfile("kurzbefehle");
    return;
  }
  if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    emit(events.createRequested);
    return;
  }
  if (navKeys[event.key]) {
    event.preventDefault();
    dropStaleFocus();
    openPageTab(navKeys[event.key]);
  }
}

/** Den Zuhörer einmal anmelden (src/shell/desk.js). */
export function initDeskKeys() {
  document.addEventListener("keydown", onKeyDown);
}
