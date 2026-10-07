/*
 * Die Seitenleiste am Desktop: oben die vier Kacheln der Seiten
 * (src/shell/desk-pages.js), „Suchen“ und der Stift für „Neuer Eintrag“, darunter der
 * Kopf der gewählten Liste mit ihren Zeilen und ganz unten „Archiviert“
 * (src/shell/desk-list.js),
 * unten fest die Icon-Zeile mit Einstellungen, Hilfe, Hell/Dunkel und
 * Update (src/shell/desk-foot.js). Eingehängt und aufgefrischt wird die
 * Leiste von src/shell/desk.js; das Gerüst steht in src/shell/desk-nav-parts.js.
 * Diese Datei fängt alle Klicks der Leiste (ein Empfänger) und öffnet die
 * Seite einer Liste.
 * Pfad: src/shell/desk-nav.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen, Abstände und Größen stehen in
 * styles/desk-nav.css, styles/desk-nav-list.css und styles/desk-nav-foot.css.
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { sameId } from "../core/ids.js";
import { findEntry } from "../data/queries.js";
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
  showTab,
} from "../ui/router.js";
import { isViewActive } from "../ui/views.js";
import { listLink } from "../ui/desk-links.js";
import {
  addToList,
  chooseList,
  closeListMenu,
  mountDeskList,
  renderDeskList,
  toggleArchive,
  toggleListMenu,
  toggleListRow,
} from "./desk-list.js";
import { activeTargets, skeletonMarkup } from "./desk-nav-parts.js";
import { openPalette } from "./search-palette.js";

/* Die Seitenleiste selbst — einmal beim Einhängen gemerkt. */
let root = null;
/* Eintrag, dessen Menü gerade aus der Seitenleiste geöffnet wurde. */
let menuSource = null;

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

/**
 * Die Seite einer Liste öffnen — „G“ und Buchstabe. Aufgaben und Termine
 * sind die Reiter Aufgaben und Kalender.
 */
export function openList(id) {
  const link = listLink(id);
  if (activeTargets().collection === link.id) {
    reselect();
    return;
  }
  if (link.target === "bookmarks") openBookmarks();
  else if (link.target === "archive") openArchive("all");
  else if (link.target === "projects") openProjectsPage();
  else if (link.target) showTab(link.target);
  else openTarget("overview", link.overview);
}

/* Eine Zeile der Leiste öffnen; die schon offene rollt nur nach oben. */
function openRow(row) {
  if (row.classList.contains("is-active")) reselect();
  else if (row.dataset.openWorkspace) openTarget("workspace", row.dataset.openWorkspace);
  else openEntry(row.dataset.openEntry);
}

/* Jeder Knopf der Leiste trägt genau ein data-Merkmal; das erste passende gewinnt. */
const clickActions = [
  ["[data-nav-search]", () => openPalette()],
  ["[data-nav-new]", () => emit(events.createRequested)],
  ["[data-list-menu]", toggleListMenu],
  ["[data-list-pick]", (node) => chooseList(node.dataset.listPick)],
  ["[data-list-add]", addToList],
  ["[data-archive-toggle]", toggleArchive],
  /* Der Pfeil in einer Zeile klappt sie auf — er sitzt im Knopf der Zeile, darum vor ihr */
  ["[data-row-expand]", (node) => toggleListRow(node.dataset.rowExpand)],
  ["[data-open-entry], [data-open-workspace]", openRow],
  /* Ein Klick in die freie Fläche unter den Zeilen legt in der Liste an — wie am Handy */
  ["[data-nav-zone='list']", addToList],
];

function onClick(event) {
  /* Jeder Klick hier bedeutet: ein Menü eines Eintrags aus der Leiste ist nicht mehr offen. */
  menuSource = null;
  for (const [selector, action] of clickActions) {
    const node = event.target.closest(selector);
    if (node) {
      action(node);
      return;
    }
  }
}

/* Rechtsklick auf einen Eintrag: sein Menü, wie in den Listen der Seiten. */
function onContextMenu(event) {
  const row = event.target.closest("[data-open-entry]");
  if (!row) return;
  event.preventDefault();
  closeListMenu();
  menuSource = row.dataset.openEntry;
  openEntryCtxMenu(row);
}

/*
 * Nach einer Wahl im Menü, das aus der Seitenleiste kam: „Archivieren“ oder
 * „Löschen“ des gerade offenen Eintrags — seine Seite gibt es nicht mehr,
 * also zurück, woher man kam.
 */
function followNavMenu() {
  const source = menuSource;
  if (!source) return;
  menuSource = null;
  const entry = findEntry(source);
  const isOpen = isViewActive("entry") && sameId(ui.currentEntryId, source);
  if (isOpen && (!entry || entry.archived)) goBack();
}

/**
 * Das feste Gerüst einmal in die Seitenleiste schreiben und die Klicks
 * anmelden (ein Empfänger für die ganze Leiste). Weitere Aufrufe tun nichts.
 * @param target das <aside class="desk-nav"> aus src/shell/desk.js
 */
export function mountDeskNav(target) {
  if (root) return;
  root = target;
  root.innerHTML = skeletonMarkup();
  mountDeskList(root);

  root.addEventListener("click", onClick);
  root.addEventListener("contextmenu", onContextMenu);
  on(events.dataChanged, followNavMenu);

  renderDeskNav();
}

/**
 * Kopf der Liste, Zeilen und „Archiviert“ auffrischen. Billig genug für jeden
 * Seitenwechsel: gesetzt wird nur, was sich geändert hat.
 */
export function renderDeskNav() {
  if (!root) return;
  renderDeskList(activeTargets());
}
