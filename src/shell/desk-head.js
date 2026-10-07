/*
 * Der Kopf der Desktop-Fassung: links über der Seitenleiste die Wortmarke,
 * daneben die Stufen-Anzeige (öffnet Fortschritt und Statistiken; derselbe
 * Knopf wie am Handy, hierher umgesetzt) und der Klapp-Knopf, über der Mitte
 * die Kopfzeile — links Zurück und Vorwärts,
 * daneben der Pfad der offenen Seite mit ihren Knöpfen (Kategorie, Favorit,
 * Cover, Menü), rechts das Icon „Ansicht umstellen“ (nur auf Seiten mit einer
 * Karte „Ansicht“, src/ui/view-panel.js) und ganz rechts der Knopf fürs
 * Seitenfenster. Die vier Seiten und
 * die Suche stehen als Icons oben in der Seitenleiste (src/shell/desk-pages.js).
 * Diese Datei hängt die Teile ein, hält Pfeile und Stufen-Hinweis aktuell und
 * merkt sich, ob die Seitenleiste zu ist.
 * Pfad: src/shell/desk-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * wordmark  -> der Name oben links
 * closedTag -> Wert im Browser-Speicher, solange die Seitenleiste zu ist
 * viewLabel -> Hinweis und Vorlesetext des Icons „Ansicht umstellen“
 *
 * Aussehen und Maße stehen in styles/desk-head.css, das Ein- und Ausklappen
 * des Rasters in styles/desk.css, das Seitenfenster in styles/desk-side.css.
 */

import { dom } from "../core/dom.js";
import { formatNumber } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { levelInfo, totalXp } from "../data/xp.js";
import { load } from "../core/lazy.js";
import { readText, storageKeys, writeText } from "../core/storage.js";
import { closeOverlay, goBack, goForward, showTab } from "../ui/router.js";
import { isViewActive } from "../ui/views.js";
import { sideLink, spokenKeys, withCommand, withShiftCommand } from "../ui/desk-links.js";
import { coveringPage } from "./desk-nav.js";
import { placePageHead } from "./desk-page-head.js";

const wordmark = "Paralist";
const closedTag = "1";
const viewLabel = "Ansicht umstellen";

let brand = null;
let strip = null;
let parts = null;
let closed = false;
/* Wird gerufen, nachdem die Seitenleiste auf- oder zugeklappt ist. */
let onToggle = () => {};

/* Ein runder Knopf des Kopfs; `shortcut` landet im Tooltip und für Vorlesehilfen,
   `attrs` sind weitere Attribute (fertiges HTML). */
function headButton(action, iconName, label, shortcut = "", extraClass = "", attrs = "") {
  const tip = shortcut ? `${label} (${shortcut})` : label;
  const keys = shortcut ? ` aria-keyshortcuts="${escapeHtml(spokenKeys(shortcut))}"` : "";
  return `<button class="desk-head-btn${extraClass}" type="button" data-head="${action}" aria-label="${label}" title="${escapeHtml(tip)}"${keys}${attrs}>${icon(iconName)}</button>`;
}

function toggleButton(extraClass = "") {
  return headButton("toggle", "sidebar", "Seitenleiste ein- oder ausklappen", withCommand("\\"), extraClass);
}

/* Wortmarke, daneben der Platz für die Stufe, rechts der Klapp-Knopf. */
function brandMarkup() {
  return `<span class="desk-brand-lead"><span class="desk-wordmark">${wordmark}</span><span class="desk-brand-level" data-brand-slot="level"></span></span>${toggleButton()}`;
}

/* Der Hinweis an der Stufe: welche Stufe und wie weit noch. */
function renderLevelHint() {
  const xp = totalXp();
  const info = levelInfo(xp);
  const text = `Stufe ${info.level} · noch ${formatNumber(Math.max(0, info.to - xp))} XP`;
  if (parts.levelHint.textContent !== text) parts.levelHint.textContent = text;
}

/**
 * Die Stufen-Anzeige (#level-btn, gezeichnet von src/shell/level-gauge.js)
 * steht am Desktop neben „Paralist“, unter 1024px kehrt sie an den Anfang
 * der Kopfzeile des Handys zurück. Ein Knopf an zwei Orten statt zwei
 * Knöpfen: Skala, Stufen-Meldung und Klick bleiben eins.
 */
export function placeLevelButton(desk) {
  if (!brand) return;
  const button = dom.levelBtn;
  if (desk && button.parentElement !== parts.level) {
    parts.level.append(button);
    button.append(parts.levelHint);
  } else if (!desk && button.parentElement === parts.level) {
    parts.levelHint.remove();
    document.querySelector(".top-bar").prepend(button);
  }
}

/*
 * Drei Teile: links Klapp-Knopf (nur bei zugeklappter Seitenleiste), Zurück
 * und Vorwärts, in der Mitte der Platz für den Pfad und die Knöpfe der
 * offenen Seite (src/shell/desk-page-head.js holt sie hierher), rechts das
 * Icon „Ansicht umstellen“ und ganz rechts der Knopf fürs Seitenfenster — wie
 * in T3 Code. Das Icon klappt die Karte „Ansicht“ der offenen Seite auf und
 * zu (data-view-panel-toggle, src/ui/view-panel.js); auf welchen Seiten es
 * steht, sagt styles/desk-head.css.
 */
function stripMarkup() {
  return `
    <div class="desk-tabs-lead">
      ${toggleButton(" desk-tabs-toggle")}
      ${headButton("back", "back", "Zurück", withCommand("["))}
      ${headButton("forward", "chevron", "Vorwärts", withCommand("]"))}
    </div>
    <div class="desk-tabs-page" data-head-slot="page"></div>
    <div class="desk-tabs-end">
      ${headButton("view", "sliders", viewLabel, "", " desk-view-toggle", ' data-view-panel-toggle aria-expanded="false"')}
      ${headButton("side", "sidebar-right", "Seitenfenster öffnen", withShiftCommand(sideLink.letter), " desk-side-toggle")}
    </div>`;
}

/*
 * Kann man gerade zurück oder vor? Die Navigation-API des Browsers weiß es
 * genau; ohne sie bleiben beide Pfeile an — ein Schritt ins Leere tut nichts.
 */
function historyReach() {
  const nav = window.navigation;
  if (!nav || !nav.currentEntry) return { back: true, forward: true };
  return { back: nav.canGoBack, forward: nav.canGoForward };
}

function setEnabled(button, enabled) {
  button.disabled = !enabled;
}

/** Pfeile, Stufen-Hinweis, Knopf des Seitenfensters und den Pfad der offenen Seite auffrischen. */
export function renderDeskHead() {
  if (!strip) return;
  renderLevelHint();
  const reach = historyReach();
  setEnabled(parts.back, reach.back);
  setEnabled(parts.forward, reach.forward);
  placePageHead(parts.page);
}

/** Der Knopf rechts zeigt, ob das Seitenfenster offen ist (src/shell/desk-side.js meldet es). */
export function markSideOpen(open) {
  if (!strip) return;
  parts.side.classList.toggle("is-active", open);
  parts.side.setAttribute("aria-pressed", String(open));
  const label = open ? "Seitenfenster schließen" : "Seitenfenster öffnen";
  parts.side.setAttribute("aria-label", label);
  parts.side.title = `${label} (${withShiftCommand(sideLink.letter)})`;
}

/** Ist die Seitenleiste gerade zugeklappt? */
export function isNavClosed() {
  return closed;
}

/**
 * Seitenleiste auf- oder zuklappen und das merken. Stand die Tastatur-Auswahl
 * in der Leiste, springt sie auf den Klapp-Knopf der Reiterzeile — sonst
 * landete sie in einer unsichtbaren Spalte.
 */
export function setNavClosed(value) {
  closed = value;
  writeText(storageKeys.deskNav, value ? closedTag : "");
  const hadFocus = value && Boolean(document.activeElement?.closest(".desk-nav, .desk-brand"));
  dom.device.classList.toggle("is-nav-closed", value);
  if (hadFocus) parts.stripToggle.focus();
  onToggle(value);
}

/**
 * Einen der vier Reiter öffnen — per Klick und über die Tasten 1 bis 4. Liegt
 * Profil oder Fortschritt über genau diesem Reiter, geht die Seite zu; sonst
 * bliebe man dort stecken, weil der Reiter darunter schon als offen gilt.
 */
export function openPageTab(tab) {
  const covering = coveringPage();
  if (covering && isViewActive(tab)) closeOverlay(covering);
  else showTab(tab);
}

function onClick(event) {
  const action = event.target.closest("[data-head]")?.dataset.head;
  if (action === "toggle") setNavClosed(!closed);
  else if (action === "back") goBack();
  else if (action === "forward") goForward();
  else if (action === "side") toggleSidePanel();
}

/** Das Seitenfenster auf- oder zuklappen; es lädt erst beim ersten Mal nach. */
export function toggleSidePanel() {
  load("deskSide").then((module) => module.toggleSide());
}

/**
 * Wortmarke und Kopfzeile einhängen: die Wortmarke vor die Kopfzeile des
 * Handys (am Desktop ausgeblendet, styles/desk.css), die Kopfzeile vor die
 * Mitte. Weitere Aufrufe tun nichts.
 * @param handlers { onToggle } wird nach jedem Auf- und Zuklappen gerufen.
 */
export function mountDeskHead(handlers = {}) {
  if (strip) return;
  if (handlers.onToggle) onToggle = handlers.onToggle;

  brand = document.createElement("div");
  brand.className = "desk-brand";
  brand.innerHTML = brandMarkup();
  document.querySelector(".top-bar").before(brand);

  /* header: die Zeile ist der Kopf der mittleren Spalte */
  strip = document.createElement("header");
  strip.className = "desk-tabs";
  strip.innerHTML = stripMarkup();
  dom.content.before(strip);

  parts = {
    back: strip.querySelector('[data-head="back"]'),
    forward: strip.querySelector('[data-head="forward"]'),
    stripToggle: strip.querySelector(".desk-tabs-toggle"),
    page: strip.querySelector('[data-head-slot="page"]'),
    side: strip.querySelector('[data-head="side"]'),
    level: brand.querySelector('[data-brand-slot="level"]'),
    levelHint: document.createElement("span"),
  };
  /* Der Hinweis hängt am Knopf selbst, damit er mit ihm wandert; steht im Dunkeln unter ihm */
  parts.levelHint.className = "desk-foot-hint desk-level-hint";
  parts.levelHint.setAttribute("aria-hidden", "true");

  brand.addEventListener("click", onClick);
  strip.addEventListener("click", onClick);
  window.navigation?.addEventListener("currententrychange", renderDeskHead);
  window.addEventListener("popstate", renderDeskHead);

  closed = readText(storageKeys.deskNav) === closedTag;
  dom.device.classList.toggle("is-nav-closed", closed);
  renderDeskHead();
}
