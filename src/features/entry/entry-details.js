/*
 * Die Karte „Details“ am Ende des Reiters „Inhalt“ einer Eintragsseite —
 * bei jeder Kategorie. Aufgebaut wie der Kopf eines Profils: oben „Details“
 * und rechts das Ketten-Symbol „Verknüpfen“ (src/ui/link-sheet.js) und das
 * Symbol zum Hochklappen (entry-lift.js), darunter drei Kennzahlen
 * nebeneinander (bei Aufgabe und Projekt Dringlichkeit | Fälligkeit | Status,
 * bei den meisten anderen in der Mitte die Erinnerung — ein Tipp auf Status
 * oder Dringlichkeit öffnet das Blatt dazu, einer auf Fälligkeit oder
 * Erinnerung die Auswahl für Tag und Uhrzeit, src/ui/date-field.js), nach
 * einer Trennlinie die übrigen Angaben in Abschnitten; die Zeile
 * „Erinnerung“ im Abschnitt „Zeit“ öffnet src/ui/remind-sheet.js. Was dort
 * steht, stellt src/data/entry-facts.js zusammen; wie Kennzahlen und Zeilen
 * aussehen und was ein Tipp darauf tut (auch die Adresse eines Lesezeichens),
 * steht gemeinsam mit dem Arbeitsbereich in src/ui/details-card.js.
 *
 * Die Karte gehört zur Seite, nicht zur Navigation: sie scrollt mit dem Text
 * und liegt unter der Navigation. Wie weit sie beim Öffnen hervorschaut,
 * regelt entry-fold.js. Ein Tipp auf „Details“ oder das Symbol rechts klappt
 * die Karte über den Text hoch, ohne die Seite zu bewegen (entry-lift.js).
 * In der Fassung „Android (Experiment 2: Details)“ ist die Karte nur
 * hochgeklappt zu sehen; geholt wird sie dort über das Symbol neben den
 * Reitern (entry-tools.js, showDetails), ihr Ketten-Symbol ersetzt der Knopf
 * links über der Leiste (styles/android-details-top.css).
 * Pfad: src/features/entry/entry-details.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * detailsLabel  -> Überschrift der Karte
 * linkLabel     -> Name des Ketten-Symbols für Vorlesehilfen und Tooltip
 * liftLabel     -> Name des Symbols zum Hochklappen
 *
 * Aussehen in styles/entry-details.css.
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { entryFacts } from "../../data/entry-facts.js";
import { findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { detailsMarkup, fillDetails, handleCardClick } from "../../ui/details-card.js";
import { openLinkSheet } from "../../ui/link-sheet.js";
import { initEntryLift, refreshLift, toggleLift } from "./entry-lift.js";

const detailsLabel = "Details";
const linkLabel = "Verknüpfen";
const liftLabel = "Details hochklappen";

/* Die Karte und ihre beiden Flächen, die sich je Eintrag neu füllen */
let card = null;
let statsBox = null;
let listBox = null;

/** Die Karte — entry-fold.js misst an ihr, wie weit sie hervorschaut. */
export function detailsCard() {
  return card;
}

/**
 * Kennzahlen und Abschnitte als HTML — für die Karte hier und für die
 * Karte „Details“ in der rechten Spalte am Desktop (entry-rail.js).
 */
export function detailsBodyMarkup(entry) {
  return detailsMarkup(entryFacts(entry));
}

/** Kennzahlen und Abschnitte für den offenen Eintrag neu schreiben. */
export function renderEntryDetails(entry) {
  if (!card || !entry) return;
  fillDetails(statsBox, listBox, entryFacts(entry));
  refreshLift();
}

/** Karte ans Ende des Reiters „Inhalt“ hängen und ihre Tipps anmelden. */
export function initEntryDetails() {
  card = document.createElement("section");
  card.className = "details-card";
  card.setAttribute("aria-label", detailsLabel);
  card.innerHTML = `
    <div class="details-head">
      <button class="details-title" type="button">${detailsLabel}</button>
      <button class="details-link" type="button" aria-label="${linkLabel}" title="${linkLabel}">${icon("link")}</button>
      <button class="details-link details-toggle" type="button" aria-label="${liftLabel}" title="${liftLabel}" aria-expanded="false">${icon("panel-open")}</button>
    </div>
    <div class="details-stats"></div>
    <div class="details-list"></div>`;
  statsBox = card.querySelector(".details-stats");
  listBox = card.querySelector(".details-list");
  dom.entryPanelNotes.append(card);
  initEntryLift(card);

  card.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    if (event.target.closest(".details-title, .details-toggle")) {
      /* Frisch rechnen: die Zeit auf der Seite ist seit dem Öffnen gewachsen */
      renderEntryDetails(entry);
      toggleLift();
      return;
    }
    if (event.target.closest(".details-link")) {
      openLinkSheet(entry);
      return;
    }
    handleDetailsClick(event, entry);
  });
}

/**
 * Die Karte vom Symbol neben den Reitern aus holen bzw. zurücklegen. Sie
 * liegt unter „Inhalt“: steht gerade „Verknüpfte Einträge“ offen, wechselt
 * die Seite erst dorthin — über die Pille, damit Text und Knöpfe wie bei
 * jedem Wechsel neu gezeichnet werden — und klappt die Karte dann hoch.
 */
export function showDetails(entry) {
  if (ui.entryPill !== "notes") dom.entryPills.querySelector('[data-entry-pill="notes"]')?.click();
  /* Frisch rechnen: die Zeit auf der Seite ist seit dem Öffnen gewachsen */
  renderEntryDetails(entry);
  toggleLift();
}

/**
 * Tipps auf Kennzahlen und antippbare Zeilen — hier und in der Karte rechts
 * am Desktop (src/ui/details-card.js). Gibt `true` zurück, wenn der Tipp
 * etwas tat.
 * @param done nach dem Ändern des Links: die Karte, in der er stand, neu zeichnen.
 */
export function handleDetailsClick(event, entry, done = renderEntryDetails) {
  return handleCardClick(event, entry, { done });
}
