/*
 * Browser-Zurück und -Vor: ein Verlaufseintrag beschreibt, was offen war —
 * eine Seite, ein Blatt darüber, ein Eintrag. Diese Datei stellt genau das
 * wieder her. Das Öffnen selbst (und das Schreiben der Verlaufseinträge)
 * steht in src/ui/router.js; hier wird nur nachgeschlagen und aufgerufen.
 * Pfad: src/ui/router-restore.js
 *
 * Keine anpassbaren visuellen Werte.
 */

import { emit, events } from "../core/bus.js";
import { bookmarksPage, projectsPage, workspacesPage } from "../data/collections.js";
import { archivePage, overviewPages } from "../data/config.js";
import { findEntry, findWorkspace, workspaceLabel } from "../data/queries.js";
import { workspaceRef } from "../data/refs.js";
import { ui } from "../data/state.js";
import {
  hideAllOverlays,
  hideOverlay,
  navViews,
  openEntry,
  restoreOverlay,
  showHome,
  showPage,
  showSearch,
  showTab,
} from "./router.js";
import { currentView } from "./views.js";

/*
 * Ein Blatt, das der Verlauf verlangt, wieder öffnen. Gibt `true` zurück, wenn
 * der Eintrag ein Blatt war — dann bleibt die Seite darunter, wie sie ist.
 */
function restoreSheet(entry) {
  if (!entry) return false;
  if (entry.view === "file") {
    restoreOverlay("file", entry);
    return true;
  }
  if (entry.view === "progress") {
    hideOverlay("profile");
    restoreOverlay("progress", entry);
    return true;
  }
  if (entry.view === "avatar") {
    restoreOverlay("profile", null, "avatar");
    return true;
  }
  /* Der Ausschnitt-Editor kommt nicht zurück (siehe profile.js) — dafür das Profil */
  if (entry.view === "profile" || entry.view === "avatar-crop") {
    restoreOverlay("profile", entry);
    return true;
  }
  return false;
}

/* Sammlungen mit eigenem Verlaufseintrag: Archiv, Lesezeichen, Arbeitsbereiche, Projekte. */
const collectionPages = { archive: archivePage, bookmarks: bookmarksPage, workspaces: workspacesPage, projects: projectsPage };

/* Die Seite, die der Verlaufseintrag beschreibt, wieder aufbauen. */
function restorePage(entry) {
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
  ui.sourceView = entry.from || "home";
  /* Zeigt ein Posten auf etwas, das es nicht mehr gibt (gelöscht oder in
     einen Arbeitsbereich umgewandelt), geht es auf die Übersicht — sonst
     bliebe die alte Seite stehen und Zurück täte sichtbar nichts. */
  if (entry.view === "entry") {
    if (findEntry(entry.id)) openEntry(entry.id, false);
    else showHome(true);
    return;
  }
  if (collectionPages[entry.view]) {
    /* Die Seite Arbeitsbereiche braucht keine Pille: sie zeigt den gewählten Tab. */
    const pill = entry.view === "archive" ? entry.pill || "all" : entry.pill;
    showPage({ ...collectionPages[entry.view], pill }, false);
    return;
  }
  /* Ältere Einträge `{ view: "overview", id: "3" }` meinten die Karte Projekte;
     Karte 3 heißt jetzt Arbeitsbereiche und öffnet deren Seite — so landet
     Zurück nie auf einer leeren Projektliste. */
  if (entry.view === "overview") {
    const page = overviewPages[entry.id];
    if (page) showPage({ title: page.title, parent: page.parent, kind: page.kind }, false);
    return;
  }
  if (entry.view === "workspace") {
    const workspace = findWorkspace(entry.id);
    if (!workspace) {
      showHome(true);
      return;
    }
    showPage(
      { title: workspaceLabel(workspace), parent: workspaceRef(workspace.id), isWorkspace: true, workspaceId: workspace.id },
      false
    );
  }
}

/*
 * Verlaufsschritte, die eine Seite selbst verbraucht — der Auswahlmodus der
 * Aufgaben, wenn er über ✕ oder eine Aktion endet. Dann gibt es nichts
 * wiederherzustellen, und ein Seitenwechsel würde nur die Meldung mit
 * „Rückgängig“ schließen. Jeder Wächter sagt `true`, wenn er den Schritt
 * übernimmt.
 */
const popGuards = [];

/** Einen Wächter anmelden: guard(event) -> true, wenn dieser Schritt still bleiben soll. */
export function addPopGuard(guard) {
  popGuards.push(guard);
}

function onPopState(event) {
  if (popGuards.some((guard) => guard(event))) return;
  const entry = event.state;
  emit(events.viewWillChange, currentView());

  /* Erst alles schließen, was über der Seite liegt; was der Verlauf verlangt,
     geht gleich danach wieder auf. Ohne das bliebe z.B. die große Bildansicht
     stehen, wenn man von ihr zum Profil zurückgeht. */
  ["progress", "avatar", "crop", "file"].forEach(hideOverlay);
  if (restoreSheet(entry)) return;

  hideAllOverlays();
  restorePage(entry);
}

/** Browser-Zurück und -Vor anmelden. Einmal beim Start aus src/main.js. */
export function initHistoryRestore() {
  window.addEventListener("popstate", onPopState);
}
