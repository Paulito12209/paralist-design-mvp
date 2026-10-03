/*
 * Vom Archiv zurück zu den aktiven Dingen. Der Knopf links über der Archiv-
 * Liste („Aktive Projekte (2)“, src/ui/list-head.js) führt zur Sammlungsliste
 * der gewählten Pille — nie zur Übersichtsseite: Projekte öffnen die Seite
 * Projekte, Arbeitsbereiche deren Seite, Notizen, Zeichnungen und Dokumente
 * die Ressourcen mit der passenden Pille, Aufgaben, Termine und Medien ihren
 * Reiter unten, Lesezeichen die Lesezeichen-Seite. Unter „Alle“ gibt es kein
 * einzelnes Ziel: dort öffnet der Knopf ein Blatt von unten, in dem man die
 * Sammlung wählt (jede Zeile mit der Zahl ihrer aktiven Dinge). Das Blatt
 * sieht in Android und im Experiment aus wie die übrigen (src/ui/sheet.js).
 * Pfad: src/features/overview/archive-active.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sheetTitle      -> Überschrift des Blatts unter „Alle“
 * resourceFilters -> welche Pille der Ressourcen zu Notizen, Dokumenten und Zeichnungen gehört
 * Beschriftung und Zählung des Knopfs: src/data/archive-active.js.
 */

import { activeGroups } from "../../data/archive-active.js";
import { saveState, state } from "../../data/state.js";
import { openSheet } from "../../ui/sheet.js";
import { openBookmarks, openProjectsPage, openTarget, openWorkspacesPage, showTab } from "../../ui/router.js";

const sheetTitle = "Aktive Einträge";

/* Typ -> Pille der Ressourcen-Seite (src/data/config.js, resourceFilters) */
const resourceFilters = { notiz: "notes", dokument: "own", zeichnung: "drawings" };
/* Karte „Ressourcen“ in overviewPages (src/data/config.js) */
const RESOURCES_CARD = 4;

/* Pille des Archivs -> öffnet deren Sammlungsliste */
const targets = {
  workspaces: openWorkspacesPage,
  projekt: openProjectsPage,
  aufgabe: () => showTab("tasks"),
  termin: () => showTab("calendar"),
  medien: () => showTab("media"),
  lesezeichen: () => openBookmarks(),
};

function openResources(filter) {
  state.prefs.resources.filter = filter;
  saveState();
  openTarget("overview", RESOURCES_CARD);
}

/** Die Sammlungsliste zu einer Pille des Archivs öffnen („Alle“ ist kein Ziel, dafür gibt es das Blatt). */
export function openActiveList(pill) {
  if (pill === "all") {
    openActiveSheet();
    return;
  }
  if (resourceFilters[pill]) openResources(resourceFilters[pill]);
  else targets[pill]?.();
}

/* Das Blatt unter „Alle“: eine Zeile je Sammlung, rechts die Zahl der aktiven Dinge. */
function openActiveSheet() {
  openSheet(
    sheetTitle,
    activeGroups().map((group) => ({
      label: group.label,
      icon: group.icon,
      count: group.count,
      onSelect: () => openActiveList(group.id),
    }))
  );
}
