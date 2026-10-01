/*
 * Fassung „Android (Experiment 2: Details)“: die Angaben der Karte „Details“
 * als Blatt von unten (Material 3 „Bottom sheet“). Auf der Seite bleibt die
 * Karte ein gewöhnlicher Abschnitt am Textende; ein Tipp auf ihren Kopf holt
 * nicht sie selbst hoch, sondern öffnet dieses Blatt mit denselben
 * Kennzahlen und Abschnitten (src/data/entry-facts.js, Aufbau und Tipps aus
 * src/ui/details-card.js). Es ist am unteren Rand verankert, liegt über Leiste
 * und Plus-Knopf, und dahinter liegt ein Schleier.
 *
 * Schließen: Tipp auf den Schleier, Escape, das Blatt nach unten ziehen
 * (src/ui/modal-pull.js) oder die Seite wechseln. Ändert sich der Eintrag,
 * während es offen ist (Status im Auswahl-Blatt darüber), zeichnet
 * entry-details.js es über refreshDetailsSheet neu.
 * Pfad: src/features/entry/entry-details-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sheetLabel -> Überschrift des Blatts und Name für Vorlesehilfen
 *
 * Aussehen in styles/android-details-top.css (Klasse .details-sheet).
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { entryFacts } from "../../data/entry-facts.js";
import { findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { fillDetails, handleCardClick } from "../../ui/details-card.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";

const sheetLabel = "Details";

let backdrop = null;
let statsBox = null;
let listBox = null;
/* Wird beim Öffnen und Schließen benachrichtigt — die Karte hält damit ihr Symbol auf Stand */
let onToggle = () => {};

function isOpen() {
  return Boolean(backdrop) && !backdrop.hidden;
}

function fill(entry) {
  fillDetails(statsBox, listBox, entryFacts(entry));
}

function onKey(event) {
  if (event.key === "Escape") closeDetailsSheet();
}

/** Das Blatt mit den Angaben des Eintrags öffnen. */
export function openDetailsSheet(entry) {
  if (!backdrop || !entry) return;
  fill(entry);
  clearModalPull(backdrop);
  delete backdrop.dataset.dismissing;
  backdrop.querySelector(".modal-body").scrollTop = 0;
  backdrop.hidden = false;
  document.addEventListener("keydown", onKey);
  onToggle(true);
}

/** Das Blatt schließen; nichts geschieht, wenn es schon zu ist. */
export function closeDetailsSheet() {
  if (!isOpen()) return;
  backdrop.hidden = true;
  document.removeEventListener("keydown", onKey);
  onToggle(false);
}

/** Offenes Blatt nach einer Änderung neu füllen. */
export function refreshDetailsSheet(entry) {
  if (isOpen() && entry) fill(entry);
}

/**
 * Blatt einmal anlegen — vor dem Auswahl-Blatt, damit Status, Dringlichkeit
 * und Erinnerung, die es öffnet, darüber liegen.
 * @param toggled bekommt true/false beim Öffnen und Schließen
 */
export function initDetailsSheet(toggled = () => {}) {
  onToggle = toggled;
  backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop details-sheet";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${sheetLabel}">
      <p class="details-sheet-title">${sheetLabel}</p>
      <div class="modal-body details-sheet-body">
        <div class="details-stats"></div>
        <div class="details-list"></div>
      </div>
    </div>`;
  statsBox = backdrop.querySelector(".details-stats");
  listBox = backdrop.querySelector(".details-list");
  dom.sheet.before(backdrop);
  bindModalPull(backdrop, closeDetailsSheet);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeDetailsSheet();
      return;
    }
    const entry = findEntry(ui.currentEntryId);
    if (entry) handleCardClick(event, entry, { done: () => fill(entry) });
  });

  /* Eine andere Seite: das Blatt gehört zum verlassenen Eintrag */
  on(events.viewWillChange, closeDetailsSheet);
}
