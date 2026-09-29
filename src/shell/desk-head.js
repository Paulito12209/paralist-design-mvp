/*
 * Der Kopf der Desktop-Fassung: links über der Seitenleiste die Wortmarke mit
 * dem Klapp-Knopf, über der Mitte die Reiterzeile — links Zurück und Vorwärts,
 * mittig die vier Reiter, rechts der runde Such-Knopf, sobald die Seitenleiste
 * zu ist. Diese Datei hängt beide Teile ein, hält den gewählten Reiter und die
 * Pfeile aktuell und merkt sich, ob die Seitenleiste zu ist.
 * Pfad: src/shell/desk-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * wordmark  -> der Name oben links
 * closedTag -> Wert im Browser-Speicher, solange die Seitenleiste zu ist
 *
 * Aussehen und Maße stehen in styles/desk-head.css, das Ein- und Ausklappen
 * des Rasters in styles/desk.css. Die Reiter selbst kommen aus pageLinks in
 * src/shell/desk-links.js.
 */

import { dom } from "../core/dom.js";
import { escapeHtml, icon } from "../core/html.js";
import { readText, storageKeys, writeText } from "../core/storage.js";
import { deskStats } from "../data/insights.js";
import { goBack, goForward, showTab } from "../ui/router.js";
import { currentView } from "../ui/views.js";
import { pageLinks, withCommand } from "./desk-links.js";

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

function tabMarkup(link) {
  return `
    <button class="desk-tab" type="button" data-head-tab="${link.tab}" aria-keyshortcuts="${link.key}" title="${link.label} (${link.key})">
      ${icon(link.icon, "desk-tab-icon")}
      <span class="desk-tab-label">${link.label}</span>
      <kbd class="desk-kbd" aria-hidden="true">${link.key}</kbd>
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
    <nav class="desk-tabs-list" aria-label="Reiter">${pageLinks.map(tabMarkup).join("")}</nav>
    <div class="desk-tabs-end">
      ${headButton("search", "search", "Suchen", withCommand("K"), " desk-tabs-search")}
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
  const reach = historyReach();
  setEnabled(parts.back, reach.back);
  setEnabled(parts.forward, reach.forward);
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
  const hadFocus = value && Boolean(document.activeElement?.closest(".desk-nav, .desk-brand, .top-bar"));
  dom.device.classList.toggle("is-nav-closed", value);
  if (hadFocus) parts.stripToggle.focus();
  onToggle(value);
}

function onClick(event) {
  const tab = event.target.closest("[data-head-tab]");
  if (tab) {
    showTab(tab.dataset.headTab);
    return;
  }
  const action = event.target.closest("[data-head]")?.dataset.head;
  if (action === "toggle") setNavClosed(!closed);
  else if (action === "back") goBack();
  else if (action === "forward") goForward();
  else if (action === "search") {
    /* Die Suche liegt in der Seitenleiste: sie klappt dafür wieder auf. */
    setNavClosed(false);
    dom.searchInput.focus();
  }
}

/**
 * Wortmarke und Reiterzeile einhängen: die Wortmarke vor die Kopfzeile mit
 * der Suche, die Reiterzeile vor die Mitte. Weitere Aufrufe tun nichts.
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
  };

  /* Das Schild „⌘K“ rechts im Suchfeld. Am Handy blendet styles/desk.css es aus. */
  const searchKey = document.createElement("kbd");
  searchKey.className = "desk-kbd search-kbd";
  searchKey.setAttribute("aria-hidden", "true");
  searchKey.textContent = withCommand("K");
  dom.searchInput.after(searchKey);
  dom.searchInput.setAttribute("aria-keyshortcuts", withCommand("K").replace("⌘", "Meta+").replace("Strg ", "Control+"));

  brand.addEventListener("click", onClick);
  strip.addEventListener("click", onClick);
  window.navigation?.addEventListener("currententrychange", renderDeskHead);
  window.addEventListener("popstate", renderDeskHead);

  closed = readText(storageKeys.deskNav) === closedTag;
  dom.device.classList.toggle("is-nav-closed", closed);
  renderDeskHead();
}
