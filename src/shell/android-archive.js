/*
 * Android-Fassung: der Archiv-Knopf links unten, gegenüber dem Plus-Knopf.
 * Er ersetzt die Pille „Zum Archiv“ unter den Listen. Er steht nur auf
 * Seiten mit Einträgen — Übersicht, Aufgaben, Eingang, Favoriten,
 * Ressourcen, Lesezeichen, Projekte, Arbeitsbereiche und die Seite eines
 * Arbeitsbereichs (Medien, Kalender und das Archiv selbst nicht) — und dort
 * erst, wenn im Archiv etwas zu genau dieser Seite liegt
 * (src/data/archive-context.js): auf der Übersicht ein Projekt, auf den
 * Lesezeichen ein Lesezeichen. Ein Tipp öffnet das Archiv mit der Pille, die
 * zur Seite passt.
 *
 * Auf der Übersicht und der Seite Projekte steht er nicht: dort führt schon
 * „Archiv (n)“ über der Liste ins Archiv (src/features/overview/project-card.js).
 *
 * Er ist zugleich Ziel zum Ablegen: hält man eine Zeile lange gedrückt und
 * zieht dann (src/ui/row-lift.js), erscheint der Knopf auch bei leerem
 * Archiv — sonst ließe sich der erste Eintrag nie hineinziehen. Loslassen
 * über ihm archiviert Eintrag oder Arbeitsbereich, mit „Rückgängig“ in der
 * Meldung.
 * Den Knopf gibt es immer im Dokument; zu sehen ist er nur in der
 * Android-Fassung (styles/android-archive.css).
 * Pfad: src/shell/android-archive.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * buttonLabel  -> Vorlesetext und Hinweis des Knopfs
 * entryPages   -> Sammlungen, auf denen der Knopf steht, und welche Pille er im Archiv öffnet
 * toastWords   -> Text und Knopf der Meldung nach dem Ablegen
 */

import { emit, events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { archiveWorkspace, restoreFromArchive } from "../data/mutations.js";
import { archivedForView } from "../data/archive-context.js";
import { findEntry, findWorkspace } from "../data/queries.js";
import { ui } from "../data/state.js";
import { archiveEntry } from "../data/xp.js";
import { setRowLift } from "../ui/row-lift.js";
import { openArchive } from "../ui/router.js";
import { showToast } from "../ui/toast.js";
import { currentView } from "../ui/views.js";
import { isAndroidMobile } from "./android-bars.js";

const buttonLabel = "Archiv öffnen";
/* Art der Sammlung (ui.currentPage.kind; der Eingang hat keine) -> Pille im Archiv */
const entryPages = {
  inbox: "all",
  favorites: "all",
  resources: "all",
  bookmarks: "all",
  projects: "projekt",
  workspaces: "workspaces",
};
const toastWords = { done: "Archiviert", undo: "Rückgängig" };

let button = null;
/* Wird gerade eine Zeile gezogen? Dann steht der Knopf auch bei leerem Archiv da. */
let lifting = false;

/* Die Pille, die der Knopf auf der offenen Seite öffnet — oder null, wenn er hier nicht hingehört. */
function archivePill() {
  const view = currentView();
  if (view === "home") return "projekt";
  if (view === "tasks") return "aufgabe";
  if (view !== "page" || !ui.currentPage) return null;
  if (ui.currentPage.isWorkspace) return "all";
  return entryPages[ui.currentPage.kind || "inbox"] || null;
}

/* Liegt im Archiv etwas, das zur offenen Seite gehört? Sonst bleibt der Knopf weg —
   alles Archivierte zeigt die Karte „Archiv“ auf der Übersicht. */
function hasArchived() {
  return archivedForView(currentView(), ui.currentPage).length > 0;
}

/* Übersicht und Seite Projekte haben „Archiv (n)“ über der Liste — dort wäre der Knopf doppelt. */
function hasOwnArchiveLink() {
  return currentView() === "home" || (currentView() === "page" && ui.currentPage?.kind === "projects");
}

/* Sichtbar schalten. Ob gerade die Android-Fassung gilt, entscheidet das Stylesheet.
   Beim Ziehen einer Zeile erscheint er überall, wo er Ziel sein kann. */
function sync() {
  const shown = Boolean(archivePill()) && (lifting || (hasArchived() && !hasOwnArchiveLink()));
  button.classList.toggle("is-shown", shown);
}

/* Was die angehobene Zeile zeigt: ein Arbeitsbereich oder ein Eintrag, der noch nicht im Archiv liegt. */
function itemOf(row) {
  const wrap = row.closest(".swipe");
  const workspaceId = wrap?.dataset.workspace || row.dataset.openWorkspace;
  if (workspaceId) {
    const workspace = findWorkspace(workspaceId);
    return workspace && !workspace.archived ? { workspace } : null;
  }
  const entry = findEntry(wrap?.dataset.entry || row.dataset.openEntry || row.dataset.boardRow);
  return entry && !entry.archived ? { entry } : null;
}

/* Abgelegt: ins Archiv, mit „Rückgängig“ in der Meldung. */
function archiveRow(row) {
  const item = itemOf(row);
  if (!item) return;
  if (item.workspace) archiveWorkspace(item.workspace.id);
  else {
    archiveEntry(item.entry);
    emit(events.dataChanged);
  }
  const target = item.workspace || item.entry;
  showToast({
    icon: "archive",
    title: toastWords.done,
    action: { label: toastWords.undo, icon: "undo", onSelect: () => restoreFromArchive(target) },
  });
}

/** Knopf einhängen und anmelden: Tippen, Ablegen, Sichtbarkeit je Seite. */
export function initAndroidArchive() {
  button = document.createElement("button");
  button.className = "m3-archive";
  button.type = "button";
  button.dataset.liftDrop = "archive";
  button.setAttribute("aria-label", buttonLabel);
  button.title = buttonLabel;
  button.innerHTML = icon("archive");
  /* Er hängt an der Leiste, damit er beim Wegscrollen mit ihr nach unten rückt — wie der Plus-Knopf. */
  dom.navShell.append(button);

  button.addEventListener("click", () => {
    const pill = archivePill();
    if (pill) openArchive(pill);
  });

  setRowLift({
    canLift: (row) => isAndroidMobile() && Boolean(archivePill()) && Boolean(itemOf(row)),
    start: () => {
      lifting = true;
      sync();
    },
    end: () => {
      lifting = false;
      sync();
    },
    drop: (row, zone) => {
      if (zone === button) archiveRow(row);
    },
  });

  on(events.viewOpened, sync);
  on(events.dataChanged, sync);
  sync();
}
