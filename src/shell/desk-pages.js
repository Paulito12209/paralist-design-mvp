/*
 * Die vier Kacheln oben in der Seitenleiste am Desktop, direkt unter
 * „Paralist“: Übersicht, Kalender, Aufgaben und Medien — nur Icons, in vier
 * gleich breiten Kacheln wie die Favoriten oben in Raycast. Name und Kürzel
 * (⇧⌘Ü, ⇧⌘K, ⇧⌘A, ⇧⌘M) erscheinen beim Überfahren als kleiner Hinweis
 * darunter. Die gewählte Seite trägt eine kräftigere Fläche. Die Suche steht
 * darunter als eigene Zeile (src/shell/desk-nav-parts.js).
 * Pfad: src/shell/desk-pages.js
 *
 * Keine anpassbaren visuellen Werte: welche Seite welches Icon und welchen
 * Buchstaben hat, steht in pageLinks (src/ui/desk-links.js); Größen und
 * Farben in styles/desk-nav-pages.css.
 */

import { escapeHtml, icon } from "../core/html.js";
import { deskStats } from "../data/insights.js";
import { pageLinks, spokenKeys, withShiftCommand } from "../ui/desk-links.js";
import { keyCap } from "../ui/key-caps.js";
import { currentView } from "../ui/views.js";
import { openPageTab } from "./desk-head.js";

let row = null;
let buttons = [];

/* Ein Icon-Knopf mit seinem Hinweis. Kein title: sonst käme der Hinweis doppelt. */
function pageButton(target, iconName, label, shortcut) {
  return `
    <button class="desk-page-btn" type="button" data-desk-page="${target}" aria-label="${escapeHtml(label)}" aria-keyshortcuts="${escapeHtml(spokenKeys(shortcut))}">
      ${icon(iconName)}
      <span class="desk-page-hint" aria-hidden="true">${escapeHtml(label)} ${keyCap(shortcut, " desk-kbd-inverse")}</span>
    </button>`;
}

function rowMarkup() {
  return pageLinks.map((link) => pageButton(link.tab, link.icon, link.label, withShiftCommand(link.letter))).join("");
}

/** Gewählte Seite und die vorgelesenen Zahlen (Termine heute, offene Aufgaben) auffrischen. */
export function renderDeskPages() {
  if (!row) return;
  const view = currentView();
  const stats = deskStats();
  buttons.forEach(({ target, button, link }) => {
    const chosen = target === view;
    button.classList.toggle("is-active", chosen);
    if (chosen) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
    if (!link) return;
    const value = link.count ? link.count(stats) : 0;
    button.setAttribute("aria-label", value ? `${link.label}, ${link.spoken(value)}` : link.label);
  });
}

function onClick(event) {
  const target = event.target.closest("[data-desk-page]")?.dataset.deskPage;
  if (target) openPageTab(target);
}

/**
 * Die Zeile einmal in ihren Platz der Seitenleiste schreiben.
 * @param slot das leere Feld oben in der Leiste (src/shell/desk-nav-parts.js)
 */
export function mountDeskPages(slot) {
  if (row || !slot) return;
  row = slot;
  row.innerHTML = rowMarkup();
  buttons = [...row.querySelectorAll("[data-desk-page]")].map((button) => ({
    target: button.dataset.deskPage,
    button,
    link: pageLinks.find((item) => item.tab === button.dataset.deskPage) || null,
  }));
  row.addEventListener("click", onClick);
  renderDeskPages();
}
