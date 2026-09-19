/*
 * Navigation: welche Seite offen ist, was der Zurück-Pfeil tut und wie die
 * Adresse (#/…) dazu passt. Diese Datei füllt keine Inhalte — sie schaltet nur
 * um und meldet es; die Bereiche zeichnen sich selbst.
 * Pfad: src/ui/router.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { emit, events } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { load, loadedModule } from "../core/lazy.js";
import { archivePage, overviewPages } from "../data/config.js";
import { noteOpen } from "../data/opens.js";
import { findEntry, findWorkspace, workspaceLabel } from "../data/queries.js";
import { workspaceRef } from "../data/refs.js";
import { ui } from "../data/state.js";
import { currentView, isViewActive, setActiveTab, showView } from "./views.js";

/* Die Ansichten, die unten in der Navigationsleiste einen Knopf haben. */
const navViews = ["home", "calendar", "tasks", "media"];

function hashOfTab(tab) {
  return tab === "home" ? "#/" : `#/${tab}`;
}

/** Startseite zeigen. */
export function showHome(replace = true) {
  /* auch über Browser-Zurück verlassen: sonst bliebe die Tastatur offen,
     obwohl die Suche gar nicht mehr zu sehen ist */
  dom.searchInput.blur();
  showView("home");
  setActiveTab("home");
  ui.sourceView = "home";
  writeHistory({ view: "home" }, "#/", replace);
}

/** Eine der Navigations-Ansichten zeigen. */
export function showTab(tab, replace = false) {
  dom.searchInput.blur();
  /* Antippen des schon aktiven Reiters baut nichts neu auf, sondern rollt nur
     sanft nach oben — wie beim zweiten Tippen auf einen iOS-Tab. */
  if (!replace && isViewActive(tab)) {
    dom.content.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (tab === "home") {
    showHome(replace);
    return;
  }
  showView(tab);
  setActiveTab(tab);
  ui.sourceView = tab;
  writeHistory({ view: tab }, hashOfTab(tab), replace || location.hash === hashOfTab(tab));
}

/**
 * Suchseite zeigen.
 * @param list `null` für die Übersicht, "searches" oder "most" für eine der vollen Listen.
 */
export function showSearch(replace = false, list = null) {
  ui.searchList = list;
  ui.searchQuery = dom.searchInput.value.trim();
  showView("search");
  setActiveTab("");
  ui.sourceView = "search";
  const url = list === "searches" ? "#/suchen/gesucht" : list === "most" ? "#/suchen/haeufig" : "#/suchen";
  writeHistory({ view: "search", list }, url, replace || location.hash === url);
}

/**
 * Unterseite einer Übersichtskarte oder eines Arbeitsbereichs zeigen.
 * @param fresh `false`, wenn die Seite aus dem Verlauf zurückkommt.
 */
export function showPage(page, fresh = true) {
  ui.currentPage = page;
  /* Eine frisch geöffnete Seite fängt beim ersten Reiter an. Ohne das würde
     die Wahl von der zuletzt besuchten Seite mitwandern — wer einmal auf
     „Verknüpfte Einträge“ getippt hat, landet sonst überall dort. Kommt die
     Seite dagegen über Zurück wieder, bleibt die Wahl stehen: man will in die
     Liste zurück, aus der man gerade heraus ist. */
  if (fresh) ui.pagePill = "notes";
  showView("page");
}

/** Das Archiv öffnen: dieselbe Unterseite wie eine Sammlung, nur andere Liste. */
export function openArchive() {
  showPage({ ...archivePage });
  writeHistory({ view: "archive", from: ui.sourceView }, "#/archiv", false);
}

/** Eine Übersichtskarte oder einen Arbeitsbereich öffnen. */
export function openTarget(kind, id) {
  if (kind === "overview") {
    const page = overviewPages[id];
    if (!page) return;
    noteOpen("overview", id);
    showPage({ title: page.title, parent: page.parent, kind: page.kind });
    writeHistory({ view: "overview", id, from: ui.sourceView }, `#/uebersicht/${id}`, false);
    return;
  }

  const workspace = findWorkspace(id);
  if (!workspace) return;
  noteOpen("workspace", workspace.id);
  showPage({ title: workspaceLabel(workspace), parent: workspaceRef(workspace.id), isWorkspace: true, workspaceId: workspace.id });
  writeHistory({ view: "workspace", id, from: ui.sourceView }, `#/arbeitsbereich/${id}`, false);
}

/** Einen Eintrag zum Bearbeiten öffnen. */
export function openEntry(id, push = true) {
  const entry = findEntry(id);
  if (!entry) return;
  noteOpen("entry", entry.id);
  ui.currentEntryId = entry.id;
  /* Wie bei einer Unterseite: ein frisch geöffneter Eintrag geht beim Inhalt
     auf, einer aus dem Verlauf behält seine Pille. */
  if (push) ui.entryPill = "notes";
  showView("entry");
  if (push) writeHistory({ view: "entry", id: entry.id, from: ui.sourceView }, `#/eintrag/${entry.id}`, false);
}

/** Zurück zu der Ansicht, aus der man gekommen ist. */
export function restoreFrom(from) {
  if (from === "search") {
    showSearch(true);
    return;
  }
  if (navViews.includes(from) && from !== "home") {
    showTab(from, true);
    return;
  }
  showHome(true);
}

function writeHistory(state, url, replace) {
  if (replace) history.replaceState(state, "", url);
  else history.pushState(state, "", url);
}

/* Modale Blätter (Fortschritt, Profil, Profilbild) melden sich hier an,
   damit der Zurück-Pfeil des Browsers sie schließen kann. */
const overlays = new Map();

/** Ein Blatt anmelden: `open(push, eintrag)` öffnet es, `hide()` schließt es ohne Verlauf. */
export function registerOverlay(name, handlers) {
  overlays.set(name, handlers);
}

function hideAllOverlays() {
  overlays.forEach((handlers) => handlers.hide());
}

/* Welcher nachladbare Bereich bringt welches Blatt mit? Steht ein Blatt nicht
   hier, heißt sein Bereich genauso. */
const overlayModules = { avatar: "profile", file: "viewer" };

/*
 * Ein Blatt aus dem Verlauf wiederherstellen; bei Bedarf wird sein Bereich
 * nachgeladen. `entry` ist der gespeicherte Verlaufseintrag — das
 * Einstellungs-Blatt liest daraus, ob eine Kachel aufgeklappt war, die
 * Dateiansicht, welche Datei offen war.
 */
function restoreOverlay(name, entry = null, extra = "") {
  const openIt = () => {
    const handlers = overlays.get(name);
    if (handlers) handlers.open(false, entry);
    if (extra) restoreOverlay(extra);
  };
  const moduleName = overlayModules[name] || name;
  if (loadedModule(moduleName)) openIt();
  else load(moduleName).then(openIt);
}

window.addEventListener("popstate", (event) => {
  const entry = event.state;
  emit(events.viewWillChange, currentView());

  /* Erst alles schließen, was über der Seite liegt; was der Verlauf verlangt,
     geht gleich danach wieder auf. Ohne das bliebe z.B. die große Bildansicht
     stehen, wenn man von ihr zum Profil zurückgeht. */
  overlays.get("progress")?.hide();
  overlays.get("avatar")?.hide();
  overlays.get("file")?.hide();

  if (entry && entry.view === "file") {
    restoreOverlay("file", entry);
    return;
  }

  if (entry && entry.view === "progress") {
    overlays.get("profile")?.hide();
    restoreOverlay("progress", entry);
    return;
  }
  if (entry && entry.view === "avatar") {
    restoreOverlay("profile", null, "avatar");
    return;
  }
  if (entry && entry.view === "profile") {
    restoreOverlay("profile", entry);
    return;
  }

  hideAllOverlays();

  if (!entry || entry.view === "home") {
    showHome(true);
    return;
  }
  if (entry.view === "search") {
    showSearch(true, entry.list || null);
    return;
  }
  if (navViews.includes(entry.view)) {
    showTab(entry.view, true);
    return;
  }
  if (entry.view === "entry") {
    ui.sourceView = entry.from || "home";
    openEntry(entry.id, false);
    return;
  }
  if (entry.view === "archive") {
    ui.sourceView = entry.from || "home";
    showPage({ ...archivePage }, false);
    return;
  }
  if (entry.view === "overview") {
    const page = overviewPages[entry.id];
    if (!page) return;
    ui.sourceView = entry.from || "home";
    showPage({ title: page.title, parent: page.parent, kind: page.kind }, false);
    return;
  }
  if (entry.view === "workspace") {
    const workspace = findWorkspace(entry.id);
    if (!workspace) return;
    ui.sourceView = entry.from || "home";
    showPage(
      { title: workspaceLabel(workspace), parent: workspaceRef(workspace.id), isWorkspace: true, workspaceId: workspace.id },
      false
    );
  }
});
