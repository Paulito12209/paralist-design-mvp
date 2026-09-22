/*
 * Was das Eingabefeld vorschlägt, bevor man es anfasst: Ablageort und Typ,
 * abgeleitet aus der Seite, die gerade offen ist. Eigene Datei, damit die
 * Regel an einer Stelle steht und nicht zwischen den Knöpfen verschwindet.
 * Pfad: src/features/composer/composer-defaults.js
 *
 * ANPASSBARE WERTE (alle in src/data/config.js)
 * -----------------------------------
 * proposedType        -> Typ, den eine Seite ohne nähere Angabe vorschlägt
 * resourceFilterTypes -> welchen Typ jede Pille der Ressourcen-Seite anlegt
 * calendarSegments[*].pick -> welchen Typ jede Spalte der Kalenderliste anlegt
 */

import {
  calendarSegments,
  proposedType,
  resourceFilterTypes,
  resourcePick,
} from "../../data/config.js";
import { findEntry, isContainer, mainPlace } from "../../data/queries.js";
import { entryRef } from "../../data/refs.js";
import { state, ui } from "../../data/state.js";
import { currentView } from "../../ui/views.js";

/* Ressourcen-Seite: der Typ folgt der Filter-Pille, die gerade oben leuchtet. */
function resourceType() {
  return resourceFilterTypes[state.prefs.resources.filter] || resourceFilterTypes.all;
}

/* Kalender: im Stundenraster ein Termin, in der Liste das, was die gewählte
   Spalte zeigt — eine Aufgabe unter „Aufgaben“, ein Projekt unter „Projekte“. */
function calendarType() {
  const prefs = state.prefs.calendar;
  if (prefs.mode !== "list") return "termin";
  const segment = calendarSegments.find((item) => item.id === prefs.seg);
  return segment ? segment.pick : "termin";
}

/**
 * Der Vorschlag für die Seite, die gerade offen ist. Die Regel in einem Satz:
 * das Eingabefeld legt an, was die Ansicht zeigt, und legt es dorthin, wo die
 * Ansicht steht.
 *
 * ORT — ein Arbeitsbereich und ein Projekt sind selbst Ablageorte. Jeder
 * andere geöffnete Eintrag kann nichts aufnehmen und gibt stattdessen seinen
 * eigenen Ort weiter: was man neben einer Aufgabe aus Projekt X notiert,
 * gehört auch nach X. Sammlungen (Favoriten, Projekte, Ressourcen, Archiv)
 * sind keine Orte — dort bleibt es beim Eingang.
 *
 * VERKNÜPFUNG — steht man auf der Seite eines Eintrags, der selbst nichts
 * aufnehmen kann, wird das Neue zusätzlich mit ihm verknüpft: die Notiz neben
 * der Aufgabe gehört zu dieser Aufgabe, und man findet sie auf beiden Seiten.
 * Bei einem Projekt braucht es das nicht — dort ist der Ablageort schon die
 * Verbindung, und ein Projekt steht nie unter „Verknüpfte Einträge“.
 *
 * TYP — das, was die Seite gerade zeigt: die Projekte-Karte ein Projekt, die
 * Ressourcen-Seite den Typ ihrer aktiven Pille, der Kalender einen Termin, die
 * Aufgaben-Seite und ein offenes Projekt eine Aufgabe, die Medien-Seite ein
 * Medium. Sonst der Vorschlag aus src/data/config.js.
 *
 * Welcher Knopf unten dazu leuchtet, leitet `chooseComposerType` aus dem Typ
 * ab; nur die Medien-Seite nennt ihn selbst, weil „medien“ keinen hat.
 */
export function contextDefaults() {
  const proposal = { type: proposedType, place: null };
  const view = currentView();

  if (view === "page" && ui.currentPage) {
    const page = ui.currentPage;
    if (page.kind === "projects") return { type: "projekt", place: null };
    if (page.kind === "resources") return { type: resourceType(), place: null };
    if (page.isWorkspace) return { ...proposal, place: page.parent };
    return proposal;
  }
  if (view === "entry") {
    const entry = findEntry(ui.currentEntryId);
    if (isContainer(entry)) return { type: "aufgabe", place: entryRef(entry.id) };
    if (entry) return { ...proposal, place: mainPlace(entry), link: entry.id };
    return proposal;
  }
  if (view === "calendar") return { type: calendarType(), place: null };
  if (view === "tasks") return { type: "aufgabe", place: null };
  if (view === "media") return { type: "medien", pick: resourcePick.id, place: null };
  return proposal;
}

/**
 * Welchen Typ die Pille im Platzhalter einer leeren Liste vorwählt. Der Knopf
 * „Ressourcen“ ist der einzige, der nicht wie ein Typ heißt: er legt ein
 * Dokument an. Ohne Angabe bleibt es bei dem, was die Seite ohnehin vorschlägt
 * — so bleibt die Pille eine Abkürzung und kein zweiter, abweichender Weg.
 */
export function pickOverrides(pick) {
  if (!pick) return {};
  if (pick === resourcePick.id) return { type: resourcePick.typeId, pick: resourcePick.id };
  return { type: pick, pick };
}
