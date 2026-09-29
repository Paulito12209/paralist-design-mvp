/*
 * Die Seitenleiste am Desktop: oben „Neu“, darunter die Sammlungen und die
 * Arbeitsbereiche — jeder Tab eine eigene Gruppe zum Auf- und Zuklappen —,
 * unten fest Stufe und Konto. Die vier Reiter stehen nicht hier, sondern in
 * der Reiterzeile (src/shell/desk-head.js). Eingehängt und aufgefrischt wird
 * die Leiste von src/shell/desk.js; das Markup steht in src/shell/desk-nav-parts.js.
 * Pfad: src/shell/desk-nav.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen, Abstände und Größen stehen in
 * styles/desk-nav.css und styles/desk-nav-foot.css. Welche Tab-Gruppen
 * zugeklappt sind, merkt sich der Browser unter storageKeys.deskGroups.
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { formatNumber } from "../core/format.js";
import { sameId } from "../core/ids.js";
import { load } from "../core/lazy.js";
import { readJson, storageKeys, writeJson } from "../core/storage.js";
import { overviewPages } from "../data/config.js";
import { addTab, addWorkspace, selectTab } from "../data/mutations.js";
import { findWorkspace, pageCount } from "../data/queries.js";
import { state, ui } from "../data/state.js";
import { openArchive, openBookmarks, openTarget, restoreFrom, showTab } from "../ui/router.js";
import { isViewActive } from "../ui/views.js";
import { collectionLinks } from "./desk-links.js";
import { activeTargets, footMarkup, skeletonMarkup, tabGroupsMarkup } from "./desk-nav-parts.js";

/* Die Seitenleiste selbst und ihre Teile — einmal beim Einhängen gesucht. */
let root = null;
let parts = null;
/* Von src/main.js über src/shell/desk.js hereingegeben. */
let handlers = { openWorkspaceMenu: null, openTabMenu: null, profilePhoto: () => "" };
/* Zuletzt geschriebenes Markup je Behälter: Gleiches wird nicht neu gesetzt. */
const lastMarkup = new Map();
/* Arbeitsbereich oder Tab, dessen Menü gerade aus der Seitenleiste geöffnet wurde. */
let menuSource = null;
/* Die zugeklappten Tab-Gruppen, als Text-Ids. */
let closedGroups = [];

function collectParts() {
  return {
    collections: collectionLinks.map((link) => {
      const row = root.querySelector(`[data-nav-collection="${link.id}"]`);
      return { link, row, count: row.querySelector(".desk-nav-count") };
    }),
    spaces: root.querySelector('[data-nav-slot="spaces"]'),
    foot: root.querySelector('[data-nav-slot="foot"]'),
  };
}

function setActive(row, chosen) {
  row.classList.toggle("is-active", chosen);
  if (chosen) row.setAttribute("aria-current", "page");
  else row.removeAttribute("aria-current");
}

/* Selektor, der nach dem Neuzeichnen denselben Knopf wiederfindet. */
function focusSelector(node) {
  const button = node.closest("[data-open-workspace], [data-nav-tab-toggle], [data-nav-add-workspace], [data-nav-level], [data-nav-profile]");
  if (!button) return "";
  const attribute = ["openWorkspace", "navTabToggle", "navAddWorkspace", "navLevel", "navProfile"].find((key) => button.dataset[key]);
  const name = attribute.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `[data-${name}="${CSS.escape(button.dataset[attribute])}"]`;
}

/*
 * Markup nur tauschen, wenn es sich wirklich geändert hat — sonst flackerte
 * die Leiste bei jedem Seitenwechsel. Stand die Tastatur-Auswahl in diesem
 * Teil, bekommt derselbe Knopf sie danach zurück.
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
 * Ein neuer Arbeitsbereich oder Tab wird auf der Übersicht benannt — nur
 * dort gibt es das Namensfeld. Darum erst dorthin wechseln, dann anlegen:
 * die Liste zeichnet sich neu und das Feld bekommt den Fokus.
 */
function addWorkspaceIn(tabId) {
  closedGroups = closedGroups.filter((id) => id !== tabId);
  writeJson(storageKeys.deskGroups, closedGroups);
  if (!sameId(tabId, state.activeTabId)) selectTab(tabId);
  if (!isViewActive("home")) showTab("home");
  addWorkspace();
}

function addTabFromNav() {
  if (!isViewActive("home")) showTab("home");
  addTab();
}

function toggleGroup(tabId) {
  closedGroups = closedGroups.includes(tabId) ? closedGroups.filter((id) => id !== tabId) : [...closedGroups, tabId];
  writeJson(storageKeys.deskGroups, closedGroups);
  renderDeskNav();
}

/**
 * Eine Sammlung öffnen — auch über das Kürzel „G“ und Buchstabe. Ist sie
 * schon offen, rollt die Seite nur nach oben, statt einen doppelten Schritt
 * in den Verlauf zu legen.
 */
export function openCollection(id) {
  const link = collectionLinks.find((item) => item.id === id);
  if (!link) return;
  if (activeTargets().collection === id) {
    dom.content.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (link.target === "bookmarks") openBookmarks();
  else if (link.target === "archive") openArchive("all");
  else openTarget("overview", link.overview);
}

function openWorkspace(row) {
  if (row.classList.contains("is-active")) dom.content.scrollTo({ top: 0, behavior: "smooth" });
  else openTarget("workspace", row.dataset.openWorkspace);
}

/* Jeder Knopf der Leiste trägt genau ein data-Merkmal; das erste passende gewinnt. */
const clickActions = [
  ["[data-nav-new]", () => emit(events.createRequested)],
  ["[data-nav-collection]", (node) => openCollection(node.dataset.navCollection)],
  ["[data-nav-add-tab]", addTabFromNav],
  ["[data-nav-add-workspace]", (node) => addWorkspaceIn(node.dataset.navAddWorkspace)],
  ["[data-nav-tab-toggle]", (node) => toggleGroup(node.dataset.navTabToggle)],
  ["[data-open-workspace]", openWorkspace],
  ["[data-nav-level]", () => load("progress").then((module) => module.open())],
  ["[data-nav-profile]", () => load("profile").then((module) => module.open())],
];

function onClick(event) {
  /* Jeder Klick hier bedeutet: ein Menü aus der Leiste ist nicht mehr offen. */
  menuSource = null;
  for (const [selector, action] of clickActions) {
    const node = event.target.closest(selector);
    if (node) {
      action(node);
      return;
    }
  }
}

/* Rechtsklick: auf einem Arbeitsbereich sein Menü, auf einem Gruppenkopf das des Tabs. */
function onContextMenu(event) {
  const space = event.target.closest("[data-open-workspace]");
  if (space && handlers.openWorkspaceMenu) {
    event.preventDefault();
    menuSource = { kind: "workspace", id: space.dataset.openWorkspace };
    handlers.openWorkspaceMenu(space);
    return;
  }
  const head = event.target.closest("[data-nav-tab-toggle]");
  if (head && handlers.openTabMenu) {
    event.preventDefault();
    menuSource = { kind: "tab", id: head.dataset.navTabToggle };
    handlers.openTabMenu(head);
  }
}

/*
 * Nach einer Wahl im Menü, das aus der Seitenleiste kam. Die Menüs sind für
 * die Übersicht gebaut; zwei Fälle brauchen hier einen Schritt mehr:
 * - „Umbenennen“: das Namensfeld gibt es nur auf der Übersicht — also dorthin.
 * - „Archivieren“ oder „Löschen“ des gerade offenen Arbeitsbereichs: seine
 *   Seite gibt es nicht mehr — zurück, woher man kam.
 */
function followNavMenu() {
  const source = menuSource;
  if (!source) return;
  menuSource = null;

  const renaming = source.kind === "tab" ? sameId(ui.editingTabId, source.id) : sameId(ui.editingWorkspaceId, source.id);
  if (renaming) {
    if (!isViewActive("home")) showTab("home");
    return;
  }
  if (source.kind !== "workspace") return;
  const workspace = findWorkspace(source.id);
  const isOpen = isViewActive("page") && ui.currentPage && sameId(ui.currentPage.workspaceId, source.id);
  if (isOpen && (!workspace || workspace.archived)) restoreFrom(ui.sourceView);
}

/**
 * Das feste Gerüst einmal in die Seitenleiste schreiben und die Klicks
 * anmelden (ein Empfänger für die ganze Leiste). Weitere Aufrufe tun nichts.
 * @param target   das <aside class="desk-nav"> aus src/shell/desk.js
 * @param given    { openWorkspaceMenu, openTabMenu, profilePhoto } von src/main.js
 */
export function mountDeskNav(target, given = {}) {
  if (root) return;
  root = target;
  handlers = { ...handlers, ...given };
  closedGroups = readJson(storageKeys.deskGroups, []).map(String);
  root.innerHTML = skeletonMarkup();
  parts = collectParts();

  root.addEventListener("click", onClick);
  root.addEventListener("contextmenu", onContextMenu);
  on(events.dataChanged, followNavMenu);

  renderDeskNav();
}

/**
 * Zahlen, gewählte Zeile, Tab-Gruppen und Fuß auffrischen. Billig genug für
 * jeden Seitenwechsel: die festen Zeilen werden nur umgeschaltet, alles
 * andere nur neu gesetzt, wenn sich sein Inhalt geändert hat.
 */
export function renderDeskNav() {
  if (!root) return;
  const active = activeTargets();

  parts.collections.forEach(({ link, row, count }) => {
    setActive(row, link.id === active.collection);
    if (!count) return;
    const value = pageCount(overviewPages[link.overview]);
    const text = value ? formatNumber(value) : "";
    if (count.textContent !== text) count.textContent = text;
    count.hidden = !value;
    row.setAttribute("aria-label", value ? `${link.title}, ${value === 1 ? "1 Eintrag" : `${value} Einträge`}` : link.title);
  });

  swapMarkup(parts.spaces, tabGroupsMarkup(closedGroups, active.workspace));
  swapMarkup(parts.foot, footMarkup(handlers.profilePhoto()));
}
