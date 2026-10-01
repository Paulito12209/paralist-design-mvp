/*
 * Android-Fassung: die Angaben der Karte „Details“ als Blatt von unten
 * (Material 3 „Bottom sheet“). Die Karte selbst zeigt diese Fassung nicht;
 * der Info-Knopf neben „Kopieren“ (entry-tools.js) öffnet dieses Blatt mit
 * denselben Kennzahlen und Abschnitten (src/data/entry-facts.js, Aufbau und Tipps aus
 * src/ui/details-card.js). Es ist am unteren Rand verankert, liegt über Leiste
 * und Plus-Knopf, und dahinter liegt ein Schleier.
 *
 * Schließen: Tipp auf den Schleier, Escape, das Blatt nach unten ziehen
 * (src/ui/modal-pull.js), die Zurück-Geste bzw. Browser-Zurück oder die
 * Seite wechseln. Damit Zurück zuerst nur das Blatt schließt, legt es beim
 * Öffnen einen eigenen Schritt in den Verlauf (Merkmal detailsSheet);
 * schließt man es anders, wird dieser Schritt still wieder verbraucht — wie
 * beim Auswahlmodus (src/ui/selection.js). Vorwärts öffnet es wieder.
 * Ändert sich der Eintrag,
 * während es offen ist (Status im Auswahl-Blatt darüber), zeichnet
 * entry-details.js es über refreshDetailsSheet neu.
 * Pfad: src/features/entry/entry-details-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sheetLabel -> Überschrift des Blatts und Name für Vorlesehilfen
 *
 * Hinter der Überschrift steht das Symbol, das auf der Karte der übrigen
 * Fassungen zum Hochklappen dient, hier umgedreht. Es ist nur ein Zeichen,
 * kein Knopf.
 * Aussehen in styles/android-entry.css (Klasse .details-sheet).
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { entryFacts } from "../../data/entry-facts.js";
import { findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";
import { fillDetails, handleCardClick } from "../../ui/details-card.js";
import { bindModalPull, clearModalPull } from "../../ui/modal-pull.js";
import { addPopGuard } from "../../ui/router-restore.js";
import { closeSheet } from "../../ui/sheet.js";
import { isViewActive } from "../../ui/views.js";

const sheetLabel = "Details";

let backdrop = null;
let statsBox = null;
let listBox = null;
/* Läuft gerade das eigene history.back() nach einem Schließen per Schleier,
   Ziehen oder Escape? Dann ist der folgende Verlaufsschritt kein Seitenwechsel. */
let ownPop = false;
/* Wird beim Öffnen und Schließen benachrichtigt — die Karte hält damit ihr Symbol auf Stand */
let onToggle = () => {};

/** Ist das Blatt gerade offen? Auch für den Zustand des Info-Knopfs (entry-tools.js). */
export function isDetailsSheetOpen() {
  return Boolean(backdrop) && !backdrop.hidden;
}

function fill(entry) {
  fillDetails(statsBox, listBox, entryFacts(entry));
}

function onKey(event) {
  if (event.key === "Escape") closeDetailsSheet();
}

/**
 * Das Blatt mit den Angaben des Eintrags öffnen.
 * @param push false, wenn der Verlauf schon auf dem Schritt des Blatts steht (Vorwärts)
 */
export function openDetailsSheet(entry, { push = true } = {}) {
  if (!backdrop || !entry || isDetailsSheetOpen()) return;
  if (push) history.pushState({ ...(history.state || { view: "entry" }), detailsSheet: true }, "");
  fill(entry);
  clearModalPull(backdrop);
  delete backdrop.dataset.dismissing;
  backdrop.querySelector(".modal-body").scrollTop = 0;
  backdrop.hidden = false;
  document.addEventListener("keydown", onKey);
  onToggle(true);
}

/**
 * Das Blatt schließen; nichts geschieht, wenn es schon zu ist.
 * @param fromHistory der Verlaufsschritt ist schon weg (Zurück) oder darf
 *        nicht angetastet werden (Seitenwechsel); sonst wird er still verbraucht
 */
export function closeDetailsSheet({ fromHistory = false } = {}) {
  if (!isDetailsSheetOpen()) return;
  backdrop.hidden = true;
  document.removeEventListener("keydown", onKey);
  onToggle(false);
  if (!fromHistory && history.state?.detailsSheet) {
    ownPop = true;
    history.back();
  }
}

/* Verlaufsschritte, die das Blatt selbst erledigt — vor jedem Seitenwechsel
   (src/ui/router-restore.js). true heißt: die Seite bleibt, wie sie ist. */
function onPop(event) {
  if (ownPop) {
    ownPop = false;
    return true;
  }
  /* Zurück bei offenem Blatt: nur das Blatt schließen, samt einem Auswahl-
     Blatt darüber (Status, Dringlichkeit) — es hat keinen eigenen Schritt */
  if (isDetailsSheetOpen()) {
    closeSheet();
    closeDetailsSheet({ fromHistory: true });
    return true;
  }
  /* Vorwärts auf den Schritt des Blatts: auf derselben Seite wieder öffnen */
  if (event.state?.detailsSheet && isViewActive("entry")) {
    openDetailsSheet(findEntry(ui.currentEntryId), { push: false });
    return true;
  }
  return false;
}

/** Offenes Blatt nach einer Änderung neu füllen. */
export function refreshDetailsSheet(entry) {
  if (isDetailsSheetOpen() && entry) fill(entry);
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
      <p class="details-sheet-title">${sheetLabel}${icon("panel-open")}</p>
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

  addPopGuard(onPop);
  /* Eine andere Seite: das Blatt gehört zum verlassenen Eintrag. Der Verlauf
     bleibt unangetastet — er gehört jetzt der neuen Seite. */
  on(events.viewWillChange, () => closeDetailsSheet({ fromHistory: true }));
}
