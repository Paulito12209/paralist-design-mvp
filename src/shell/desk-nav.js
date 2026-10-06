/*
 * Die Seitenleiste am Desktop: oben die Icon-Zeile der Seiten
 * (src/shell/desk-pages.js) und „Neu“, darunter die Sammlungen (auch die
 * Arbeitsbereiche, die ihre Seite öffnen) und die Projekte — jede Ansicht
 * eine eigene Gruppe zum Auf- und Zuklappen, „Alle“ zuerst —, unten fest die
 * Icon-Zeile mit Einstellungen, Stufe, Hell/Dunkel und Update
 * (src/shell/desk-foot.js). Eingehängt und aufgefrischt wird die Leiste von
 * src/shell/desk.js; das Markup steht in src/shell/desk-nav-parts.js.
 * Pfad: src/shell/desk-nav.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen, Abstände und Größen stehen in
 * styles/desk-nav.css und styles/desk-nav-foot.css. Welche Ansichten
 * zugeklappt sind, merkt sich der Browser unter storageKeys.deskViewGroups, ob
 * „Mehr anzeigen“ (Personen, Pläne) offen ist unter storageKeys.deskMore.
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { formatNumber } from "../core/format.js";
import { sameId } from "../core/ids.js";
import { readJson, readText, storageKeys, writeJson, writeText } from "../core/storage.js";
import { overviewPages } from "../data/config.js";
import { addProjectView } from "../data/project-views.js";
import { findEntry, pageCount } from "../data/queries.js";
import { ui } from "../data/state.js";
import { openEntryCtxMenu } from "../ui/entry-menu.js";
import {
  closeOverlay,
  goBack,
  openArchive,
  openBookmarks,
  openEntry,
  openProjectsPage,
  openTarget,
} from "../ui/router.js";
import { isViewActive } from "../ui/views.js";
import { collectionLinks } from "../ui/desk-links.js";
import { activeTargets, skeletonMarkup, viewGroupsMarkup } from "./desk-nav-parts.js";

/* Die Seitenleiste selbst und ihre Teile — einmal beim Einhängen gesucht. */
let root = null;
let parts = null;
/* Von src/main.js über src/shell/desk.js hereingegeben. */
let handlers = { openProjectViewMenu: null };
/* Zuletzt geschriebenes Markup je Behälter: Gleiches wird nicht neu gesetzt. */
const lastMarkup = new Map();
/* Projekt oder Ansicht, dessen Menü gerade aus der Seitenleiste geöffnet wurde. */
let menuSource = null;
/* Die zugeklappten Ansichten, als Text-Ids. */
let closedGroups = [];
/* Steht „Mehr anzeigen“ offen (Personen, Pläne)? */
let moreOpen = false;

function collectParts() {
  return {
    collections: collectionLinks.filter((link) => link.nav !== false).map((link) => {
      const row = root.querySelector(`[data-nav-collection="${link.id}"]`);
      return { link, row, count: row.querySelector(".desk-nav-count") };
    }),
    more: root.querySelector("#desk-nav-more"),
    moreToggle: root.querySelector("[data-nav-more]"),
    views: root.querySelector('[data-nav-slot="views"]'),
  };
}

function setActive(row, chosen) {
  row.classList.toggle("is-active", chosen);
  if (chosen) row.setAttribute("aria-current", "page");
  else row.removeAttribute("aria-current");
}

/* Selektor, der nach dem Neuzeichnen denselben Knopf wiederfindet. */
function focusSelector(node) {
  const button = node.closest("[data-open-entry], [data-nav-view-toggle], [data-nav-add-project]");
  if (!button) return "";
  const attribute = ["openEntry", "navViewToggle", "navAddProject"].find((key) => button.dataset[key]);
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

/* Ist die Seite Projekte offen? Nur dort (und am Handy auf der Übersicht) stehen die Pillen mit dem Namensfeld. */
function onProjectsPage() {
  return isViewActive("page") && ui.currentPage?.kind === "projects";
}

/*
 * Eine neue Ansicht wird in den Pillen der Seite Projekte benannt. Darum erst
 * dorthin wechseln, dann anlegen: die Pillen zeichnen sich neu und das Feld
 * bekommt den Fokus.
 */
function addViewFromNav() {
  if (!onProjectsPage()) openProjectsPage();
  addProjectView();
}

/*
 * Plus am Kopf einer Ansicht: ein Projekt in dieser Ansicht anlegen. Die
 * Gruppe klappt auf, damit man es gleich sieht; das Eingabefeld übernimmt
 * die Ansicht (src/data/project-views.js, applyProjectDraft).
 */
function addProjectIn(viewId) {
  closedGroups = closedGroups.filter((id) => id !== viewId);
  writeJson(storageKeys.deskViewGroups, closedGroups);
  renderDeskNav();
  ui.projectDraftView = Number(viewId);
  emit(events.createRequested, "projekt");
}

/* „Mehr anzeigen“ auf- oder zuklappen und den Knopf beschriften. */
function syncMore() {
  parts.more.hidden = !moreOpen;
  parts.moreToggle.setAttribute("aria-expanded", String(moreOpen));
  parts.moreToggle.querySelector(".desk-nav-text").textContent = moreOpen ? "Weniger anzeigen" : "Mehr anzeigen";
}

function toggleMore() {
  moreOpen = !moreOpen;
  writeText(storageKeys.deskMore, moreOpen ? "1" : "");
  syncMore();
}

function toggleGroup(viewId) {
  closedGroups = closedGroups.includes(viewId) ? closedGroups.filter((id) => id !== viewId) : [...closedGroups, viewId];
  writeJson(storageKeys.deskViewGroups, closedGroups);
  renderDeskNav();
}

/**
 * Welche Seite liegt am Desktop gerade über der Mitte — "profile",
 * "progress" oder null? Die Seite darunter bleibt dabei die „offene“: ein
 * Klick auf genau sie muss deshalb die obere schließen, statt nur unsichtbar
 * nach oben zu rollen.
 */
export function coveringPage() {
  if (!dom.profileModal.hidden) return "profile";
  if (!dom.progressModal.hidden) return "progress";
  return null;
}

/*
 * Das schon offene Ziel noch einmal gewählt: liegt eine Seite darüber, geht
 * sie zu (ein Schritt zurück, wie ihr Kreuz) — sonst rollt die Seite nach
 * oben, statt einen doppelten Schritt in den Verlauf zu legen.
 */
function reselect() {
  const covering = coveringPage();
  if (covering) closeOverlay(covering);
  else dom.content.scrollTo({ top: 0, behavior: "smooth" });
}

/** Eine Sammlung öffnen — auch über ⌃ und Ziffer oder „G“ und Buchstabe. */
export function openCollection(id) {
  const link = collectionLinks.find((item) => item.id === id);
  if (!link) return;
  if (activeTargets().collection === id) {
    reselect();
    return;
  }
  if (link.target === "bookmarks") openBookmarks();
  else if (link.target === "archive") openArchive("all");
  else if (link.target === "projects") openProjectsPage();
  else openTarget("overview", link.overview);
}

/* Ein Projekt der Leiste öffnen; das schon offene rollt nur nach oben. */
function openProject(row) {
  if (row.classList.contains("is-active")) reselect();
  else openEntry(row.dataset.openEntry);
}

/* Jeder Knopf der Leiste trägt genau ein data-Merkmal; das erste passende gewinnt. */
const clickActions = [
  ["[data-nav-new]", () => emit(events.createRequested)],
  ["[data-nav-collection]", (node) => openCollection(node.dataset.navCollection)],
  ["[data-nav-more]", toggleMore],
  ["[data-nav-projects]", () => openCollection("projects")],
  ["[data-nav-add-view]", addViewFromNav],
  ["[data-nav-add-project]", (node) => addProjectIn(node.dataset.navAddProject)],
  ["[data-nav-view-toggle]", (node) => toggleGroup(node.dataset.navViewToggle)],
  ["[data-open-entry]", openProject],
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

/* Rechtsklick: auf einem Projekt das Menü eines Eintrags, auf einem Gruppenkopf das der Ansicht. */
function onContextMenu(event) {
  const row = event.target.closest("[data-open-entry]");
  if (row) {
    event.preventDefault();
    menuSource = { kind: "entry", id: row.dataset.openEntry };
    openEntryCtxMenu(row);
    return;
  }
  const head = event.target.closest("[data-nav-view-toggle]");
  if (head && handlers.openProjectViewMenu) {
    event.preventDefault();
    menuSource = { kind: "view", id: head.dataset.navViewToggle };
    handlers.openProjectViewMenu(head);
  }
}

/*
 * Nach einer Wahl im Menü, das aus der Seitenleiste kam. Die Menüs sind für
 * die Seiten gebaut; zwei Fälle brauchen hier einen Schritt mehr:
 * - „Umbenennen“ einer Ansicht: das Namensfeld steht in den Pillen der Seite
 *   Projekte — also dorthin.
 * - „Archivieren“ oder „Löschen“ des gerade offenen Projekts: seine Seite
 *   gibt es nicht mehr — zurück, woher man kam.
 */
function followNavMenu() {
  const source = menuSource;
  if (!source) return;
  menuSource = null;

  if (source.kind === "view") {
    if (sameId(ui.editingProjectViewId, source.id) && !onProjectsPage()) openProjectsPage();
    return;
  }
  const entry = findEntry(source.id);
  const isOpen = isViewActive("entry") && sameId(ui.currentEntryId, source.id);
  if (isOpen && (!entry || entry.archived)) goBack();
}

/**
 * Das feste Gerüst einmal in die Seitenleiste schreiben und die Klicks
 * anmelden (ein Empfänger für die ganze Leiste). Weitere Aufrufe tun nichts.
 * @param target   das <aside class="desk-nav"> aus src/shell/desk.js
 * @param given    { openProjectViewMenu } von src/main.js
 */
export function mountDeskNav(target, given = {}) {
  if (root) return;
  root = target;
  handlers = { ...handlers, ...given };
  closedGroups = readJson(storageKeys.deskViewGroups, []).map(String);
  moreOpen = readText(storageKeys.deskMore) === "1";
  root.innerHTML = skeletonMarkup();
  parts = collectParts();

  root.addEventListener("click", onClick);
  root.addEventListener("contextmenu", onContextMenu);
  on(events.dataChanged, followNavMenu);

  renderDeskNav();
}

/**
 * Zahlen, gewählte Zeile und Gruppen der Ansichten auffrischen. Billig genug für
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
  syncMore();

  swapMarkup(parts.views, viewGroupsMarkup(closedGroups, active.project));
}
