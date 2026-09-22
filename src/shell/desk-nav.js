/*
 * Die Seitenleiste am Desktop: oben die vier Hauptseiten und der Knopf
 * „Neu anlegen“, darunter die Sammlungen und die Arbeitsbereiche des gewählten
 * Tabs, am Ende eine Tipp-Karte zu den Tastenkürzeln (sie rollt mit und
 * verdeckt so nie die Arbeitsbereiche). Sie ersetzt am Desktop die
 * Navigationsleiste unten. Eingehängt und aufgefrischt wird sie von
 * src/shell/desk.js; das Markup steht in src/shell/desk-nav-parts.js.
 * Pfad: src/shell/desk-nav.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tipStorageKey -> unter welchem Namen sich der Browser merkt, dass die
 *                  Tipp-Karte weggeklickt wurde (löscht man ihn, ist sie wieder da)
 * tipDismissed  -> der Wert, der dort dann steht
 *
 * Aussehen, Abstände und Größen stehen in styles/desk-nav.css, die der
 * Tasten-Schilder und der Tipp-Karte in styles/desk-nav-tip.css.
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { formatNumber } from "../core/format.js";
import { sameId } from "../core/ids.js";
import { readText, writeText } from "../core/storage.js";
import { overviewPages } from "../data/config.js";
import { deskStats } from "../data/insights.js";
import { addWorkspace, selectTab } from "../data/mutations.js";
import { findWorkspace, pageCount } from "../data/queries.js";
import { state, ui } from "../data/state.js";
import { openTarget, restoreFrom, showTab } from "../ui/router.js";
import { isViewActive } from "../ui/views.js";
import { activeTargets, pageLinks, skeletonMarkup, tabsMarkup, workspaceRowsMarkup } from "./desk-nav-parts.js";

const tipStorageKey = "paralist-desk-tip";
const tipDismissed = "1";

/* Die Seitenleiste selbst und ihre Teile — einmal beim Einhängen gesucht. */
let root = null;
let parts = null;
let tipHidden = false;
/* Von src/main.js über src/shell/desk.js hereingegeben: das Menü eines Arbeitsbereichs. */
let menus = { openWorkspaceMenu: null };
/* Zuletzt geschriebenes Markup je Behälter: Gleiches wird nicht neu gesetzt. */
const lastMarkup = new Map();
/* Arbeitsbereich, dessen Menü gerade aus der Seitenleiste geöffnet wurde. */
let menuWorkspaceId = null;

function isTipStoredAway() {
  return readText(tipStorageKey) === tipDismissed;
}

/* Die festen Teile einmal suchen, damit das Auffrischen nicht jedes Mal sucht. */
function collectParts() {
  return {
    pages: pageLinks.map((link) => {
      const row = root.querySelector(`[data-nav-page="${link.tab}"]`);
      return { link, row, count: row.querySelector(".desk-nav-count") };
    }),
    collections: Object.entries(overviewPages).map(([id, page]) => {
      const row = root.querySelector(`[data-nav-overview="${id}"]`);
      return { id, page, row, badge: row.querySelector(".desk-nav-badge") };
    }),
    tabs: root.querySelector('[data-nav-slot="tabs"]'),
    spaces: root.querySelector('[data-nav-slot="spaces"]'),
    tip: root.querySelector('[data-nav-slot="tip"]'),
    newButton: root.querySelector("[data-nav-new]"),
  };
}

/* Eine Zahl rechts in der Zeile; eine 0 wird gar nicht erst gezeigt. */
function setCount(node, value) {
  const text = value ? formatNumber(value) : "";
  if (node.textContent !== text) node.textContent = text;
  node.hidden = !value;
}

function setActive(row, chosen) {
  row.classList.toggle("is-active", chosen);
  if (chosen) row.setAttribute("aria-current", "page");
  else row.removeAttribute("aria-current");
}

/* Selektor, der nach dem Neuzeichnen denselben Knopf wiederfindet. */
function focusSelector(node) {
  const button = node.closest("[data-open-workspace], [data-nav-tab-id]");
  if (!button) return "";
  if (button.dataset.openWorkspace) return `[data-open-workspace="${CSS.escape(button.dataset.openWorkspace)}"]`;
  return `[data-nav-tab-id="${CSS.escape(button.dataset.navTabId)}"]`;
}

/*
 * Markup nur tauschen, wenn es sich wirklich geändert hat — sonst flackerte
 * die Leiste bei jedem Seitenwechsel. Stand die Tastatur-Auswahl in diesem
 * Teil, bekommt derselbe Knopf sie danach zurück: Wer mit Tab durch die
 * Leiste geht, verliert beim Auffrischen nicht seinen Platz.
 */
function swapMarkup(container, html) {
  if (lastMarkup.get(container) === html) return;
  lastMarkup.set(container, html);
  const focused = container.contains(document.activeElement) ? focusSelector(document.activeElement) : "";
  container.innerHTML = html;
  if (!focused) return;
  const again = container.querySelector(focused);
  if (again) again.focus({ preventScroll: true });
}

/*
 * Ein neuer Arbeitsbereich wird in der Liste der Übersicht benannt — nur
 * dort gibt es das Namensfeld (src/ui/rows.js, nur bei offener Übersicht).
 * Darum erst dorthin wechseln, dann anlegen: addWorkspace() meldet die
 * Änderung, die Liste zeichnet sich neu und das Namensfeld bekommt den Fokus
 * (src/features/overview/workspaces.js) — genau wie beim Ordner-Plus dort.
 */
function addWorkspaceFromNav() {
  if (!isViewActive("home")) showTab("home");
  addWorkspace();
}

/* Eine schon offene Seite noch einmal wählen rollt nur nach oben — wie
   showTab() es für die Hauptseiten tut, statt einen doppelten Verlaufsschritt. */
function openOrScroll(row, open) {
  if (row.classList.contains("is-active")) {
    dom.content.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  open();
}

function dismissTip() {
  const hadFocus = parts.tip.contains(document.activeElement);
  writeText(tipStorageKey, tipDismissed);
  tipHidden = true;
  parts.tip.hidden = true;
  /* Der Schließen-Knopf ist weg: die Tastatur-Auswahl landet auf „Neu anlegen“
     statt irgendwo am Anfang der Seite. */
  if (hadFocus) parts.newButton.focus();
}

function onClick(event) {
  const target = event.target;
  /* Jeder Klick hier bedeutet: ein Menü aus der Leiste ist nicht mehr offen. */
  menuWorkspaceId = null;

  const page = target.closest("[data-nav-page]");
  if (page) {
    showTab(page.dataset.navPage);
    return;
  }
  if (target.closest("[data-nav-new]")) {
    emit(events.createRequested);
    return;
  }
  const collection = target.closest("[data-nav-overview]");
  if (collection) {
    openOrScroll(collection, () => openTarget("overview", collection.dataset.navOverview));
    return;
  }
  if (target.closest("[data-nav-add-workspace]")) {
    addWorkspaceFromNav();
    return;
  }
  const tabPill = target.closest("[data-nav-tab-id]");
  if (tabPill) {
    if (!sameId(tabPill.dataset.navTabId, state.activeTabId)) selectTab(tabPill.dataset.navTabId);
    return;
  }
  const space = target.closest("[data-open-workspace]");
  if (space) {
    openOrScroll(space, () => openTarget("workspace", space.dataset.openWorkspace));
    return;
  }
  if (target.closest("[data-tip-close]")) dismissTip();
}

/* Rechtsklick auf einen Arbeitsbereich öffnet dasselbe Menü wie auf der Übersicht. */
function onContextMenu(event) {
  const space = event.target.closest("[data-open-workspace]");
  if (!space || !menus.openWorkspaceMenu) return;
  event.preventDefault();
  menuWorkspaceId = space.dataset.openWorkspace;
  menus.openWorkspaceMenu(space);
}

/*
 * Nach einer Wahl im Menü, das aus der Seitenleiste kam. Das Menü selbst ist
 * für die Liste der Übersicht gebaut; zwei Fälle brauchen hier einen Schritt mehr:
 * - „Umbenennen“: das Namensfeld gibt es nur in der Liste der Übersicht —
 *   also dorthin wechseln; sie zeichnet sich dabei mit dem Feld neu.
 * - „Archivieren“ oder „Löschen“ des gerade offenen Arbeitsbereichs: seine
 *   Seite gibt es nicht mehr — zurück, woher man kam, wie beim Seitenmenü
 *   (src/features/overview/page.js).
 */
function followNavMenu() {
  const id = menuWorkspaceId;
  if (id === null) return;
  menuWorkspaceId = null;

  if (sameId(ui.editingWorkspaceId, id)) {
    if (!isViewActive("home")) showTab("home");
    return;
  }
  const workspace = findWorkspace(id);
  const isOpen = isViewActive("page") && ui.currentPage && sameId(ui.currentPage.workspaceId, id);
  if (isOpen && (!workspace || workspace.archived)) restoreFrom(ui.sourceView);
}

/**
 * Das feste Gerüst einmal in die Seitenleiste schreiben und die Klicks
 * anmelden (ein Empfänger für die ganze Leiste). Weitere Aufrufe tun nichts.
 * @param target   das <aside class="desk-nav"> aus src/shell/desk.js
 * @param handlers { openWorkspaceMenu } aus den Seiten, von src/main.js hereingegeben
 */
export function mountDeskNav(target, handlers = {}) {
  if (root) return;
  root = target;
  menus = { ...menus, ...handlers };
  tipHidden = isTipStoredAway();
  root.innerHTML = skeletonMarkup(tipHidden);
  parts = collectParts();

  root.addEventListener("click", onClick);
  root.addEventListener("contextmenu", onContextMenu);
  on(events.dataChanged, followNavMenu);

  renderDeskNav();
}

/**
 * Zahlen, gewählte Zeile, Tab-Pillen und Arbeitsbereiche auffrischen. Billig
 * genug für jeden Seitenwechsel: die festen Zeilen werden nur umgeschaltet,
 * und die beiden Listen nur neu gesetzt, wenn sich ihr Inhalt geändert hat.
 * Nimmt niemandem den Fokus weg.
 */
export function renderDeskNav() {
  if (!root) return;
  const active = activeTargets();
  const stats = deskStats();

  parts.pages.forEach(({ link, row, count }) => {
    const value = link.count ? link.count(stats) : 0;
    setCount(count, value);
    row.setAttribute("aria-label", value ? `${link.label}, ${link.spoken(value)}` : link.label);
    setActive(row, link.tab === active.tab);
  });

  parts.collections.forEach(({ id, page, row, badge }) => {
    const value = pageCount(page);
    setCount(badge, value);
    row.setAttribute("aria-label", `${page.title}, ${value === 1 ? "1 Eintrag" : `${value} Einträge`}`);
    setActive(row, sameId(id, active.collection));
  });

  swapMarkup(parts.tabs, tabsMarkup());
  swapMarkup(parts.spaces, workspaceRowsMarkup(active.workspace));
  parts.tip.hidden = tipHidden;
}
