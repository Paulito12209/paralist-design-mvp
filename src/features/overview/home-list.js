/*
 * Android (Experiment): der Kopf über der Liste der Übersicht — das Gegenstück
 * zu „Liste ˅“ in der Seitenleiste am Desktop. Links „Projekte ˅“: ein Tipp
 * öffnet das Blatt „Liste wählen“ mit denselben acht Listen wie am Desktop
 * (src/ui/desk-links.js, listLinks); die Wahl bleibt gemerkt. Rechts, gebaut
 * wie die Knöpfe in Google Chat („Threads“ und der runde Knopf daneben):
 * - die Pille „≡ Liste“ bzw. „▥ Kanban“ schaltet das Layout der gewählten
 *   Projekt-Ansicht um,
 * - der runde Knopf mit dem Reiter-Symbol blendet die Reiter (Ansichten) ein
 *   und aus — wie „Tabs anzeigen“ im Blatt „Ansicht“,
 * - der runde Pfeil öffnet die Seite der Liste.
 * Pille und Reiter-Knopf gibt es nur bei Projekten. Bei allen anderen Listen
 * stehen darunter schlicht ihre Zeilen; ein Tipp in die freie Fläche darunter
 * öffnet das Eingabefeld mit dem passenden Typ.
 * In den übrigen Fassungen bleibt der Kopf, wie er in index.html steht.
 * Pfad: src/features/overview/home-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * menuTitle     -> Überschrift des Blatts mit den Listen
 * layoutLabels  -> Beschriftung und Symbol der Pille je Layout
 * tabsLabels    -> was der Reiter-Knopf vorliest (an / aus)
 * openTargets   -> was der runde Pfeil je Liste öffnet (data-Attribut für src/ui/list-clicks.js)
 * Maße und Farben: styles/android-overview-sheet.css und --m3-ov-head-size,
 * --m3-ov-arrow-size in styles/tokens-android.css. Gemerkt wird die Wahl unter
 * storageKeys.homeList.
 */

import { emit, events } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { readText, storageKeys, writeText } from "../../core/storage.js";
import { activeProjectView, updateProjectView } from "../../data/project-views.js";
import {
  archivedEntries,
  archivedWorkspaces,
  entryDay,
  inboxEntries,
  projectEntries,
  resourceEntries,
  taskEntries,
} from "../../data/queries.js";
import { state } from "../../data/state.js";
import { setTabsOn, tabsOn } from "../../data/tabs-visibility.js";
import { listLink, listLinks } from "../../ui/desk-links.js";
import { isMobileOs } from "../../ui/platform.js";
import { archiveActions, entryRow, workspaceRow } from "../../ui/rows.js";
import { openSheet } from "../../ui/sheet.js";
import { applyTabs } from "../../ui/tabs-visibility.js";

const menuTitle = "Liste wählen";
const layoutLabels = {
  list: { label: "Liste", icon: "list", next: "board" },
  board: { label: "Kanban", icon: "board", next: "list" },
};
const tabsLabels = { on: "Tabs ausblenden", off: "Tabs anzeigen" };
const openTargets = {
  projects: 'data-open-projects="1"',
  workspaces: 'data-open-overview="3"',
  resources: 'data-open-overview="4"',
  archive: 'data-open-archive="all"',
  inbox: 'data-open-overview="1"',
  tasks: 'data-home-list-tab="tasks"',
  events: 'data-home-list-tab="calendar"',
  bookmarks: 'data-open-bookmarks="1"',
};

/* Der Kopf, wie er in index.html steht — für alle Fassungen außer dem Experiment. */
let plainHead = "";

/** Ist gerade „Android (Experiment)“ am Handy zu sehen? Nur dort gibt es die Listenwahl. */
export function isHomeListOn() {
  return isMobileOs("android") && document.documentElement.dataset.mobileVariant === "experiment";
}

/** Die Liste, die unter den Kacheln steht; außerhalb des Experiments immer Projekte. */
export function homeList() {
  return isHomeListOn() ? listLink(readText(storageKeys.homeList)) : listLinks[0];
}

/* Einträge eines Typs, ohne archivierte — Termine nach ihrem Tag, der nächste zuerst. */
function entriesOfType(type) {
  return state.entries.filter((entry) => entry.type === type && !entry.archived);
}

/* Die Zeilen einer Liste: Arbeitsbereiche mit ihrer Zeile, Einträge mit ihrer;
   im Archiv mit Zurückholen und Löschen beim Wischen. */
function rowsOf(link) {
  if (link.id === "workspaces") {
    return state.workspaces.filter((workspace) => !workspace.archived).map((workspace) => workspaceRow(workspace));
  }
  if (link.id === "archive") {
    return [
      ...archivedWorkspaces().map((workspace) => workspaceRow(workspace, false, archiveActions("restore-workspace", "delete-workspace"))),
      ...archivedEntries().map((entry) => entryRow(entry, "", archiveActions("restore", "delete"))),
    ];
  }
  const byList = {
    inbox: inboxEntries,
    resources: resourceEntries,
    tasks: taskEntries,
    events: () => entriesOfType("termin").sort((a, b) => entryDay(a).localeCompare(entryDay(b))),
    bookmarks: () => entriesOfType("lesezeichen"),
  };
  return (byList[link.id] || (() => []))().map((entry) => entryRow(entry));
}

/**
 * Die Zeilen einer anderen Liste als Projekte. Leer steht nur die blasse Zeile
 * zum Anlegen da (im Archiv nichts) — wie bei den Projekten in Android.
 */
export function homeListMarkup() {
  const link = homeList();
  const rows = rowsOf(link).join("");
  const add =
    !rows && link.create
      ? `<button class="workspace-row workspace-add" type="button" data-empty-add="${link.create}">${icon("plus")}<span>${escapeHtml(link.add)}</span></button>`
      : "";
  return `<div class="workspace-list" data-home-list="${link.id}">${rows}${add}</div>`;
}

/* Links „Projekte ˅“, rechts Pille, Reiter-Knopf und Pfeil. */
function headMarkup(link) {
  const projects = link.id === "projects";
  const layout = layoutLabels[activeProjectView().layout] || layoutLabels.list;
  const tabs = tabsOn("home");
  const tools = projects
    ? `
      <button class="home-list-layout" type="button" data-home-layout="${layout.next}" aria-label="Layout: ${layout.label}">
        ${icon(layout.icon)}<span>${layout.label}</span>
      </button>
      <button class="home-list-round home-list-tabs${tabs ? " is-on" : ""}" type="button" data-home-tabs="1" aria-pressed="${tabs}" aria-label="${tabs ? tabsLabels.on : tabsLabels.off}">
        ${icon("tabs")}
      </button>`
    : "";
  return `
    <h2 class="home-list-title">
      <button class="home-list-pick" type="button" data-home-list-menu="1" aria-haspopup="menu" aria-label="${escapeHtml(link.title)} — Liste wechseln">
        <span>${escapeHtml(link.title)}</span>${icon("chevron", "home-list-chevron")}
      </button>
    </h2>
    <div class="home-list-tools">
      ${tools}
      <button class="home-list-round" type="button" ${openTargets[link.id]} aria-label="${escapeHtml(link.title)} öffnen">
        ${icon("arrow-up-right")}
      </button>
    </div>`;
}

/** Den Kopf über der Liste zeichnen — im Experiment neu, sonst wie in index.html. */
export function renderHomeHead() {
  const head = dom.projectList.previousElementSibling?.previousElementSibling;
  if (!head?.classList.contains("project-head")) return;
  if (!plainHead) plainHead = head.innerHTML;
  const link = homeList();
  const markup = isHomeListOn() ? headMarkup(link) : plainHead;
  if (head.innerHTML !== markup) head.innerHTML = markup;
  head.dataset.homeList = isHomeListOn() ? link.id : "";
}

/* Eine Liste wählen: merken und die Übersicht neu zeichnen lassen. */
function chooseList(id) {
  writeText(storageKeys.homeList, id);
  emit(events.dataChanged);
}

/* Das Blatt mit den acht Listen; ein Strich trennt die Ablagen vom Laufenden. */
function openListMenu() {
  const chosen = homeList().id;
  openSheet(
    menuTitle,
    listLinks.map((link) => ({
      label: link.title,
      icon: link.icon,
      active: link.id === chosen,
      split: Boolean(link.cut),
      onSelect: () => chooseList(link.id),
    }))
  );
}

/* Reiter der Übersicht ein- oder ausblenden — derselbe Schalter wie im Blatt „Ansicht“. */
function toggleTabs() {
  const on = !tabsOn("home");
  setTabsOn("home", on);
  applyTabs();
  emit(events.tabsVisibilityChanged, { scope: "home", on });
  emit(events.dataChanged);
}

/* Klicks im Kopf; die Pfeile mit data-open-… erledigt src/ui/list-clicks.js. */
function onHeadClick(event) {
  if (!isHomeListOn()) return;
  if (event.target.closest("[data-home-list-menu]")) openListMenu();
  else if (event.target.closest("[data-home-tabs]")) toggleTabs();
  else {
    const layout = event.target.closest("[data-home-layout]");
    if (layout) updateProjectView({ layout: layout.dataset.homeLayout });
    /* Aufgaben und Termine haben keine eigene Seite, sondern einen Reiter unten:
       derselbe Weg wie ein Tipp auf den Reiter selbst */
    const tab = event.target.closest("[data-home-list-tab]");
    if (tab) document.querySelector(`.tab-btn[data-tab="${tab.dataset.homeListTab}"]`)?.click();
  }
}

/* Tipp in die freie Fläche unter einer anderen Liste: Eingabefeld mit ihrem Typ. */
function onListClick(event) {
  const list = dom.projectList.querySelector("[data-home-list]");
  const link = homeList();
  if (!list || !link.create || event.target.closest("button, .swipe")) return;
  if (event.clientY < list.getBoundingClientRect().bottom) return;
  emit(events.createRequested, link.create);
}

/** Klicks auf Kopf und freie Fläche anmelden. */
export function initHomeList() {
  dom.projectList.parentElement.addEventListener("click", (event) => {
    if (event.target.closest(".project-head")) onHeadClick(event);
  });
  dom.projectList.addEventListener("click", onListClick);
}
