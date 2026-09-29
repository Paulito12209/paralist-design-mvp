/*
 * Der Kopf der Desktop-Fassung: links über der Seitenleiste die Wortmarke mit
 * dem Klapp-Knopf, über der Mitte die Reiterzeile — links Zurück und Vorwärts,
 * mittig die vier Reiter und die Suche als Segment-Leiste wie in Apple Arcade,
 * rechts oben die Level-Anzeige (derselbe Knopf wie am Handy, hierher
 * umgesetzt). Diese Datei hängt die Teile ein, hält den gewählten Reiter, die
 * Pfeile und den Hinweis der Stufe aktuell und merkt sich, ob die Seitenleiste
 * zu ist.
 * Pfad: src/shell/desk-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * wordmark  -> der Name oben links
 * closedTag -> Wert im Browser-Speicher, solange die Seitenleiste zu ist
 *
 * Aussehen und Maße stehen in styles/desk-head.css, das Ein- und Ausklappen
 * des Rasters in styles/desk.css. Die Reiter selbst kommen aus pageLinks in
 * src/ui/desk-links.js.
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { readText, storageKeys, writeText } from "../core/storage.js";
import { formatNumber } from "../core/format.js";
import { deskStats } from "../data/insights.js";
import { levelInfo, totalXp } from "../data/xp.js";
import { closeOverlay, goBack, goForward, showTab } from "../ui/router.js";
import { currentView, isViewActive } from "../ui/views.js";
import { pageLinks, withCommand } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";
import { coveringPage } from "./desk-nav.js";
import { openPalette } from "./search-palette.js";

const wordmark = "Paralist";
const closedTag = "1";

let brand = null;
let strip = null;
let parts = null;
let closed = false;
/* Wird gerufen, nachdem die Seitenleiste auf- oder zugeklappt ist. */
let onToggle = () => {};

/* Ein runder Knopf des Kopfs; `shortcut` landet im Tooltip und für Vorlesehilfen. */
function headButton(action, iconName, label, shortcut = "", extraClass = "") {
  const tip = shortcut ? `${label} (${shortcut})` : label;
  const keys = shortcut ? ` aria-keyshortcuts="${escapeHtml(shortcut.replace("⌘", "Meta+").replace("Strg ", "Control+"))}"` : "";
  return `<button class="desk-head-btn${extraClass}" type="button" data-head="${action}" aria-label="${label}" title="${escapeHtml(tip)}"${keys}>${icon(iconName)}</button>`;
}

function toggleButton(extraClass = "") {
  return headButton("toggle", "sidebar", "Seitenleiste ein- oder ausklappen", withCommand("\\"), extraClass);
}

/*
 * Ein Reiter: nur sein Name, ohne Icon — ruhig wie die Leiste in Apple Arcade.
 * Die Taste steht nicht als Schild in der Pille — eine Ziffer dort liest man
 * als Anzahl. Sie erscheint erst beim Überfahren als kleiner Hinweis
 * „Taste 1“ unter dem Reiter. Kein title: sonst käme der Hinweis doppelt.
 */
function tabMarkup(link) {
  return `
    <button class="desk-tab" type="button" data-head-tab="${link.tab}" aria-keyshortcuts="${link.key}">
      <span class="desk-tab-label">${link.label}</span>
      <span class="desk-tab-hint" aria-hidden="true">Taste ${keyCap(link.key, " desk-kbd-inverse")}</span>
    </button>`;
}

/* Die Suche als letztes Segment der Leiste, nur mit Lupe; öffnet die Palette. */
function searchSegmentMarkup() {
  const key = withCommand("K");
  return `
    <button class="desk-tab desk-tab-search" type="button" data-head="search" aria-label="Suchen" aria-keyshortcuts="${escapeHtml(key.replace("⌘", "Meta+").replace("Strg ", "Control+"))}">
      ${icon("search", "desk-tab-icon")}
      <span class="desk-tab-hint" aria-hidden="true">Suchen ${keyCap(key, " desk-kbd-inverse")}</span>
    </button>`;
}

function brandMarkup() {
  return `<span class="desk-wordmark">${wordmark}</span>${toggleButton()}`;
}

/*
 * Drei Zonen: die äußeren teilen sich den Rest gleich (styles/desk-head.css),
 * darum stehen die Reiter immer genau in der Mitte — egal wie viele Knöpfe
 * links oder rechts stehen.
 */
function stripMarkup() {
  return `
    <div class="desk-tabs-lead">
      ${toggleButton(" desk-tabs-toggle")}
      ${headButton("back", "back", "Zurück", withCommand("["))}
      ${headButton("forward", "chevron", "Vorwärts", withCommand("]"))}
    </div>
    <nav class="desk-tabs-list" aria-label="Reiter">${pageLinks.map(tabMarkup).join("")}${searchSegmentMarkup()}</nav>
    <div class="desk-tabs-end">
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

/** Gewählten Reiter, Zahlen für Vorlesehilfen und die Pfeile auffrischen. */
export function renderDeskHead() {
  if (!strip) return;
  const view = currentView();
  const stats = deskStats();
  parts.tabs.forEach(({ link, button }) => {
    const chosen = link.tab === view;
    button.classList.toggle("is-active", chosen);
    if (chosen) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
    const value = link.count ? link.count(stats) : 0;
    button.setAttribute("aria-label", value ? `${link.label}, ${link.spoken(value)}` : link.label);
  });
  parts.search.classList.toggle("is-active", view === "search");
  const reach = historyReach();
  setEnabled(parts.back, reach.back);
  setEnabled(parts.forward, reach.forward);
  renderLevelHint();
}

/* Der Hinweis unter der Level-Anzeige: welche Stufe und wie weit noch. */
function renderLevelHint() {
  const xp = totalXp();
  const info = levelInfo(xp);
  const text = `Stufe ${info.level} · noch ${formatNumber(Math.max(0, info.to - xp))} XP`;
  if (parts.levelHint.textContent !== text) parts.levelHint.textContent = text;
}

/**
 * Die Level-Anzeige (#level-btn, gezeichnet von src/shell/level-gauge.js)
 * steht am Desktop oben rechts in der Reiterzeile, darunter ihr Hinweis; unter
 * 1024px kehrt sie an den Anfang der Kopfzeile des Handys zurück. Ein Knopf an
 * zwei Orten statt zwei Knöpfen: Skala, Stufen-Meldung und Klick bleiben eins.
 */
export function placeLevelButton(desk) {
  if (!strip) return;
  const button = dom.levelBtn;
  if (desk && button.parentElement !== parts.end) {
    parts.end.append(button);
    button.append(parts.levelHint);
  } else if (!desk && button.parentElement === parts.end) {
    parts.levelHint.remove();
    document.querySelector(".top-bar").prepend(button);
  }
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
  const tab = event.target.closest("[data-head-tab]");
  if (tab) {
    openPageTab(tab.dataset.headTab);
    return;
  }
  const action = event.target.closest("[data-head]")?.dataset.head;
  if (action === "toggle") setNavClosed(!closed);
  else if (action === "back") goBack();
  else if (action === "forward") goForward();
  /* Die Palette öffnet in der Mitte; die Seitenleiste bleibt, wie sie ist. */
  else if (action === "search") openPalette();
}

/**
 * Wortmarke und Reiterzeile einhängen: die Wortmarke vor die Kopfzeile des
 * Handys (am Desktop ausgeblendet, styles/desk.css), die Reiterzeile vor die
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

  /* header: die Reiterzeile ist der Kopf der mittleren Spalte */
  strip = document.createElement("header");
  strip.className = "desk-tabs";
  strip.innerHTML = stripMarkup();
  dom.content.before(strip);

  parts = {
    tabs: pageLinks.map((link) => ({ link, button: strip.querySelector(`[data-head-tab="${link.tab}"]`) })),
    back: strip.querySelector('[data-head="back"]'),
    forward: strip.querySelector('[data-head="forward"]'),
    stripToggle: strip.querySelector(".desk-tabs-toggle"),
    search: strip.querySelector(".desk-tab-search"),
    end: strip.querySelector(".desk-tabs-end"),
    levelHint: document.createElement("span"),
  };
  parts.levelHint.className = "desk-level-hint";
  parts.levelHint.setAttribute("aria-hidden", "true");

  brand.addEventListener("click", onClick);
  strip.addEventListener("click", onClick);
  window.navigation?.addEventListener("currententrychange", renderDeskHead);
  window.addEventListener("popstate", renderDeskHead);

  closed = readText(storageKeys.deskNav) === closedTag;
  dom.device.classList.toggle("is-nav-closed", closed);
  renderDeskHead();
}
