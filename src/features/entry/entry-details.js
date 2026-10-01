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
 * die Karte über den Text hoch, ohne die Seite zu bewegen (entry-lift.js);
 * ebenso ein Tipp irgendwo sonst in den Kopf, außer auf das Ketten-Symbol.
 * In der Fassung „Android (Experiment 2: Details)“ öffnet derselbe Tipp
 * stattdessen ein Blatt von unten mit denselben Angaben
 * (entry-details-sheet.js); die Karte bleibt dort ein gewöhnlicher Abschnitt.
 * Das Symbol steht direkt hinter „Details“, das Ketten-Symbol oben in der
 * Kopfzeile (styles/android-details-top.css) — rechts im Kopf liegt dort der
 * Plus-Knopf darüber.
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
import { isMobileVariant } from "../../ui/mobile-variant.js";
import { initDetailsSheet, openDetailsSheet, refreshDetailsSheet } from "./entry-details-sheet.js";
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
  refreshDetailsSheet(entry);
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
  /* Das Symbol im Kopf zeigt auch beim Blatt, ob es offen ist */
  initDetailsSheet((open) => card.querySelector(".details-toggle").setAttribute("aria-expanded", String(open)));

  card.addEventListener("click", (event) => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    if (event.target.closest(".details-link:not(.details-toggle)")) {
      openLinkSheet(entry);
      return;
    }
    if (event.target.closest(".details-head")) {
      /* Experiment 2: dieselben Angaben als Blatt von unten, die Karte bleibt stehen */
      if (isMobileVariant("details-oben")) {
        openDetailsSheet(entry);
        return;
      }
      /* Frisch rechnen: die Zeit auf der Seite ist seit dem Öffnen gewachsen */
      renderEntryDetails(entry);
      toggleLift();
      return;
    }
    handleDetailsClick(event, entry);
  });
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
