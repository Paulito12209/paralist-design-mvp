/*
 * Die Angaben „Details“ als Blatt von unten — in allen Fassungen. Eine Karte
 * unter dem Text gibt es nicht, weder auf der Seite eines Eintrags noch auf
 * der eines Arbeitsbereichs; der
 * Info-Knopf neben „Kopieren“ (src/features/entry/entry-tools.js bzw.
 * src/features/overview/workspace-page.js) öffnet dieses Blatt mit denselben
 * Kennzahlen und Abschnitten (src/data/entry-facts.js bzw.
 * src/data/workspace-facts.js, Aufbau und Tipps aus src/ui/details-card.js).
 * Es ist am unteren Rand verankert, liegt über Leiste und Plus-Knopf, und
 * dahinter liegt ein Schleier.
 *
 * Ein Blatt für beide Seiten: jede Seite meldet sich mit
 * registerDetailsSource an und sagt, was sie zeigt (Eintrag bzw.
 * Arbeitsbereich), welche Angaben dazugehören und was eigene Kennzahlen tun.
 *
 * Schließen: Tipp auf den Schleier, Escape, das Blatt nach unten ziehen
 * (src/ui/modal-pull.js), die Zurück-Geste bzw. Browser-Zurück oder die
 * Seite wechseln. Damit Zurück zuerst nur das Blatt schließt, legt es beim
 * Öffnen einen eigenen Schritt in den Verlauf (Merkmal detailsSheet);
 * schließt man es anders, wird dieser Schritt still wieder verbraucht — wie
 * beim Auswahlmodus (src/ui/selection.js). Vorwärts öffnet es wieder.
 * Ändern sich die Angaben, während es offen ist (Status im Auswahl-Blatt
 * darüber), zeichnet die Seite es über refreshDetailsSheet neu.
 * Pfad: src/ui/details-sheet.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sheetLabel -> Überschrift des Blatts und Name für Vorlesehilfen
 *
 * Hinter der Überschrift steht das Symbol, das auf der Karte der übrigen
 * Fassungen zum Hochklappen dient, hier umgedreht. Es ist nur ein Zeichen,
 * kein Knopf.
 * Aussehen: styles/details-sheet.css (iOS-Blatt), in Android styles/android-entry.css (Material 3).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { fillDetails, handleCardClick } from "./details-card.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";
import { addPopGuard } from "./router-restore.js";
import { closeSheet } from "./sheet.js";
import { isViewActive } from "./views.js";

const sheetLabel = "Details";

let backdrop = null;
let statsBox = null;
let listBox = null;
/* Ansicht, deren Angaben gerade im Blatt stehen ("entry" oder "page") */
let openView = null;
/* Pro Ansicht: { subject(), facts(subject), actions?() } — von der Seite angemeldet */
const sources = {};
/* Läuft gerade das eigene history.back() nach einem Schließen per Schleier,
   Ziehen oder Escape? Dann ist der folgende Verlaufsschritt kein Seitenwechsel. */
let ownPop = false;
/* Wird beim Öffnen und Schließen benachrichtigt — Karte und Info-Knopf halten damit ihren Zustand auf Stand */
const toggleListeners = [];

/** Ist das Blatt gerade offen? Auch für den Zustand des Info-Knopfs. */
export function isDetailsSheetOpen() {
  return Boolean(backdrop) && !backdrop.hidden;
}

/** Der Info-Knopf neben „Kopieren“ — Markup für die Werkzeuge einer Seite. */
export function infoButtonMarkup() {
  return `<button class="page-tool entry-info-btn" type="button" data-entry-info aria-label="${sheetLabel}" title="${sheetLabel}" aria-expanded="${isDetailsSheetOpen()}">${icon("info")}</button>`;
}

/**
 * Eine Seite meldet an, was ihr Blatt zeigt.
 * @param view    "entry" oder "page"
 * @param source  { subject, facts, actions? } — Eintrag/Arbeitsbereich der offenen Seite,
 *                dessen Angaben und `{ feld: () => … }` für eigene Kennzahlen
 */
export function registerDetailsSource(view, source) {
  sources[view] = source;
}

function fill() {
  const source = sources[openView];
  const subject = source?.subject();
  if (subject) fillDetails(statsBox, listBox, source.facts(subject));
}

function onKey(event) {
  if (event.key === "Escape") closeDetailsSheet();
}

/**
 * Das Blatt mit den Angaben der Seite `view` öffnen.
 * @param push false, wenn der Verlauf schon auf dem Schritt des Blatts steht (Vorwärts)
 */
export function openDetailsSheet(view, { push = true } = {}) {
  const source = sources[view];
  if (!backdrop || !source?.subject() || isDetailsSheetOpen()) return;
  openView = view;
  if (push) history.pushState({ ...(history.state || { view }), detailsSheet: view }, "");
  fill();
  clearModalPull(backdrop);
  delete backdrop.dataset.dismissing;
  backdrop.querySelector(".modal-body").scrollTop = 0;
  backdrop.hidden = false;
  document.addEventListener("keydown", onKey);
  toggleListeners.forEach((listener) => listener(true));
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
  toggleListeners.forEach((listener) => listener(false));
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
  const view = event.state?.detailsSheet;
  if (view && sources[view] && isViewActive(view)) {
    openDetailsSheet(view, { push: false });
    return true;
  }
  return false;
}

/** Offenes Blatt dieser Ansicht nach einer Änderung neu füllen. */
export function refreshDetailsSheet(view) {
  if (isDetailsSheetOpen() && openView === view) fill();
}

/**
 * Blatt einmal anlegen — vor dem Auswahl-Blatt, damit Status, Dringlichkeit
 * und Erinnerung, die es öffnet, darüber liegen. Weitere Aufrufe melden nur
 * ihren Zuhörer an.
 * @param toggled bekommt true/false beim Öffnen und Schließen
 */
export function initDetailsSheet(toggled = () => {}) {
  toggleListeners.push(toggled);
  if (backdrop) return;
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
    const source = sources[openView];
    const subject = source?.subject();
    if (subject) handleCardClick(event, subject, { done: fill, actions: source.actions?.() });
  });

  addPopGuard(onPop);
  /* Eine andere Seite: das Blatt gehört zur verlassenen Seite. Der Verlauf
     bleibt unangetastet — er gehört jetzt der neuen Seite. */
  on(events.viewWillChange, () => closeDetailsSheet({ fromHistory: true }));
}
