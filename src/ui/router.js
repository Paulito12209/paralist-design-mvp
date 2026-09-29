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
import { bookmarksPage, workspacesPage } from "../data/collections.js";
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

/* Reiter, die das erneute Antippen selbst behandeln, statt erst nach oben zu rollen. */
const reselectHandlers = new Map();

/** Für einen Reiter festlegen, was erneutes Antippen tut (ersetzt das Hochrollen). */
export function registerReselect(tab, handler) {
  reselectHandlers.set(tab, handler);
}

/** Eine der Navigations-Ansichten zeigen. */
export function showTab(tab, replace = false) {
  dom.searchInput.blur();
  /* Antippen des schon aktiven Reiters baut nichts neu auf: das erste Mal
     rollt es sanft nach oben — wie bei einem iOS-Tab —, steht die Seite schon
     oben, stellt der Bereich seinen Ausgangszustand her. Ein Bereich mit
     eigener Reihenfolge (Kalender) übernimmt beides selbst. */
  if (!replace && isViewActive(tab)) {
    if (reselectHandlers.has(tab)) reselectHandlers.get(tab)();
    else if (dom.content.scrollTop > 1) dom.content.scrollTo({ top: 0, behavior: "smooth" });
    else emit(events.tabReselected, tab);
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
  const keep = replace || location.hash === url;
  writeHistory({ view: "search", list, depth: searchDepth() + (keep ? 0 : 1) }, url, keep);
}

/* Wie viele Verlaufsschritte die Suche schon über der Seite liegt, von der aus
   sie geöffnet wurde. Jede Unterliste zählt einen weiter; aus dem Verlauf
   wiederhergestellt bringt der Eintrag seine Zahl selbst mit. */
function searchDepth() {
  return history.state?.view === "search" ? history.state.depth || 0 : 0;
}

/**
 * Suche verlassen: genau dorthin zurück, wo sie geöffnet wurde — Kalender,
 * Aufgaben, eine Seite oder die Übersicht —, auch über geöffnete Unterlisten
 * hinweg. Nur wenn die Suche direkt über ihre Adresse kam, gibt es kein
 * Davor; dann geht es auf die Übersicht.
 */
export function closeSearch() {
  dom.searchInput.blur();
  const depth = searchDepth();
  if (depth > 0) history.go(-depth);
  else showHome();
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

/**
 * Das Archiv öffnen: dieselbe Unterseite wie eine Sammlung, nur andere Liste.
 * @param pill welche Pille oben gewählt ist — „Zum Archiv“ unter den
 *   Arbeitsbereichen öffnet gleich deren Pille, die Karte „Alle“.
 */
export function openArchive(pill = "all") {
  showPage({ ...archivePage, pill });
  writeHistory({ view: "archive", pill, from: ui.sourceView }, "#/archiv", false);
}

/**
 * Die Lesezeichen-Sammlung öffnen: dieselbe Unterseite wie das Archiv, beim
 * ersten Öffnen mit der ersten Pille („Web-Lesezeichen“).
 */
export function openBookmarks(pill = "") {
  showPage({ ...bookmarksPage, pill });
  writeHistory({ view: "bookmarks", pill, from: ui.sourceView }, "#/lesezeichen", false);
}

/**
 * Die Sammlung aller Arbeitsbereiche öffnen (Pfeil neben „Arbeitsbereiche“).
 * Sie beginnt bei dem Tab, der auf der Übersicht gerade gewählt ist.
 */
export function openWorkspacesPage(pill) {
  showPage({ ...workspacesPage, pill });
  writeHistory({ view: "workspaces", pill, from: ui.sourceView }, "#/arbeitsbereiche", false);
}

/**
 * Die Pille einer Sammlung wechseln und im Verlauf vermerken: kommt man über
 * Zurück wieder hierher, steht dieselbe Pille wie beim Verlassen.
 */
export function setPagePill(pill) {
  if (!ui.currentPage) return;
  ui.currentPage.pill = pill;
  if (history.state) history.replaceState({ ...history.state, pill }, "");
}

/**
 * Eine Übersichtskarte oder einen Arbeitsbereich öffnen.
 * @param replace `true`, wenn die neue Seite die aktuelle im Verlauf ersetzen
 *   soll — nach dem Umwandeln eines Eintrags in einen Arbeitsbereich führt
 *   Zurück dann dorthin, woher man kam, nicht auf eine Seite, die es nicht mehr gibt.
 */
export function openTarget(kind, id, replace = false) {
  if (kind === "overview") {
    const page = overviewPages[id];
    if (!page) return;
    /* Sammlungen (Eingang, Favoriten, …) zählen nicht als „geöffnet“: sie sind
       Wegweiser wie die Reiter unten, die Suche merkt sich nur Inhalte. */
    showPage({ title: page.title, parent: page.parent, kind: page.kind });
    writeHistory({ view: "overview", id, from: ui.sourceView }, `#/uebersicht/${id}`, false);
    return;
  }

  const workspace = findWorkspace(id);
  if (!workspace) return;
  noteOpen("workspace", workspace.id);
  showPage({ title: workspaceLabel(workspace), parent: workspaceRef(workspace.id), isWorkspace: true, workspaceId: workspace.id });
  writeHistory({ view: "workspace", id, from: ui.sourceView }, `#/arbeitsbereich/${id}`, replace);
}

/**
 * Einen Eintrag zum Bearbeiten öffnen.
 * @param push    `false`, wenn der Eintrag aus dem Verlauf zurückkommt.
 * @param replace `true`, wenn die Seite die aktuelle im Verlauf ersetzen soll
 *   (wie bei openTarget — nach dem Umwandeln eines Arbeitsbereichs in einen Eintrag).
 */
export function openEntry(id, push = true, replace = false) {
  const entry = findEntry(id);
  if (!entry) return;
  /* Nur ein echtes Öffnen zählt, nicht das Wiederkommen über Zurück. */
  if (push) noteOpen("entry", entry.id);
  ui.currentEntryId = entry.id;
  /* Wie bei einer Unterseite: ein frisch geöffneter Eintrag geht beim Inhalt
     auf, einer aus dem Verlauf behält seine Pille. */
  if (push) ui.entryPill = "notes";
  showView("entry");
  if (push) writeHistory({ view: "entry", id: entry.id, from: ui.sourceView }, `#/eintrag/${entry.id}`, replace);
}

/**
 * Einen Eintrag so öffnen, wie man ihn sehen will: ein Medium bildschirmfüllend
 * als Datei — wie im Medien-Reiter —, alles andere als Seite. Die Seite eines
 * Mediums (Notizen, Verknüpfungen) liegt in der Dateiansicht hinter „Zur Seite“.
 * @param list optional: die IDs, durch die die Dateiansicht blättern darf.
 */
export function openEntryOrFile(id, list = null) {
  const entry = findEntry(id);
  if (!entry) return;
  if (entry.type !== "medien") {
    openEntry(entry.id);
    return;
  }
  withOverlay("file", (handlers) => handlers.open(true, entry, list));
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

/**
 * Der Zurück-Pfeil einer Seite: genau einen Schritt zurück im Verlauf — auf die
 * Seite, Sammlung oder den Reiter, wo man zuletzt war. Nur ohne eigenen
 * Verlaufseintrag (Seite frisch über ihre Adresse geöffnet) geht es auf die
 * Ansicht, aus der die Seite stammt.
 */
export function goBack() {
  if (history.state) history.back();
  else restoreFrom(ui.sourceView);
}

/** Der Vorwärts-Pfeil am Desktop: einen Schritt vor, wenn es einen gibt. */
export function goForward() {
  history.forward();
}

function writeHistory(state, url, replace) {
  if (replace) history.replaceState(state, "", url);
  else history.pushState(state, "", url);
}

/* Modale Blätter (Fortschritt, Profil, Profilbild) melden sich hier an,
   damit der Zurück-Pfeil des Browsers sie schließen kann. */
const overlays = new Map();

/**
 * Ein Blatt anmelden: `open(push, eintrag)` öffnet es, `hide()` schließt es
 * ohne Verlauf, `close()` (freiwillig) schließt es wie das Kreuz — mit dem
 * Schritt zurück im Verlauf.
 */
export function registerOverlay(name, handlers) {
  overlays.set(name, handlers);
}

/** Ein angemeldetes Blatt wie mit seinem Kreuz schließen; zurück steht die Seite darunter. */
export function closeOverlay(name) {
  overlays.get(name)?.close?.();
}

function hideAllOverlays() {
  overlays.forEach((handlers) => handlers.hide());
}

/* Welcher nachladbare Bereich bringt welches Blatt mit? Steht ein Blatt nicht
   hier, heißt sein Bereich genauso. */
const overlayModules = { avatar: "profile", crop: "profile", file: "viewer" };

/*
 * Ein Blatt aus dem Verlauf wiederherstellen; bei Bedarf wird sein Bereich
 * nachgeladen. `entry` ist der gespeicherte Verlaufseintrag — das
 * Einstellungs-Blatt liest daraus, ob eine Kachel aufgeklappt war, die
 * Dateiansicht, welche Datei offen war.
 */
function restoreOverlay(name, entry = null, extra = "") {
  withOverlay(name, (handlers) => {
    handlers.open(false, entry);
    if (extra) restoreOverlay(extra);
  });
}

/* Ein angemeldetes Blatt benutzen; sein Bereich wird vorher nachgeladen, wenn
   er noch fehlt. Erst danach gibt es die Handgriffe zum Öffnen. */
function withOverlay(name, run) {
  const go = () => {
    const handlers = overlays.get(name);
    if (handlers) run(handlers);
  };
  const moduleName = overlayModules[name] || name;
  if (loadedModule(moduleName)) go();
  else load(moduleName).then(go);
}

window.addEventListener("popstate", (event) => {
  const entry = event.state;
  emit(events.viewWillChange, currentView());

  /* Erst alles schließen, was über der Seite liegt; was der Verlauf verlangt,
     geht gleich danach wieder auf. Ohne das bliebe z.B. die große Bildansicht
     stehen, wenn man von ihr zum Profil zurückgeht. */
  overlays.get("progress")?.hide();
  overlays.get("avatar")?.hide();
  overlays.get("crop")?.hide();
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
  /* Der Ausschnitt-Editor kommt nicht zurück (siehe profile.js) — dafür das Profil */
  if (entry && (entry.view === "profile" || entry.view === "avatar-crop")) {
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
  /* Zeigt ein Posten auf etwas, das es nicht mehr gibt (gelöscht oder in
     einen Arbeitsbereich umgewandelt), geht es auf die Übersicht — sonst
     bliebe die alte Seite stehen und Zurück täte sichtbar nichts. */
  if (entry.view === "entry") {
    ui.sourceView = entry.from || "home";
    if (!findEntry(entry.id)) {
      showHome(true);
      return;
    }
    openEntry(entry.id, false);
    return;
  }
  if (entry.view === "archive") {
    ui.sourceView = entry.from || "home";
    showPage({ ...archivePage, pill: entry.pill || "all" }, false);
    return;
  }
  if (entry.view === "bookmarks") {
    ui.sourceView = entry.from || "home";
    showPage({ ...bookmarksPage, pill: entry.pill }, false);
    return;
  }
  if (entry.view === "workspaces") {
    ui.sourceView = entry.from || "home";
    showPage({ ...workspacesPage, pill: entry.pill }, false);
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
    ui.sourceView = entry.from || "home";
    if (!workspace) {
      showHome(true);
      return;
    }
    showPage(
      { title: workspaceLabel(workspace), parent: workspaceRef(workspace.id), isWorkspace: true, workspaceId: workspace.id },
      false
    );
  }
});
