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
 * Aus einer Liste heraus („Details“ im Drei-Punkte-Menü, src/ui/entry-menu.js
 * und das Menü eines Arbeitsbereichs) öffnet openDetailsFor dasselbe Blatt
 * für einen beliebigen Eintrag oder Arbeitsbereich. Kennzahlen, die nur auf
 * der Seite etwas tun („Einträge“ wechselt die Pille), sind dort reiner Text.
 *
 * In der Android-Fassung steht statt der Überschrift „Details“ der Kopf mit
 * Icon, Titel und Kategorie, statt der drei Kennzahlen „Verknüpfen“ und
 * Zeilen untereinander wie in Google Tasks, und unten fest eine Leiste mit
 * „Als erledigt markieren“ (src/ui/details-rows.js). Beim Öffnen endet das
 * Blatt mitten in der zweiten Zeile der Abschnitte darunter und wächst beim
 * Hochwischen (src/ui/details-expand.js). Jede Änderung (auch aus Blättern darüber, etwa
 * „Verknüpfen“) zeichnet das offene Blatt neu.
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
 *               (wie hoch es in Android beim Öffnen steht: src/ui/details-expand.js)
 *
 * Hinter der Überschrift steht das Symbol, das auf der Karte der übrigen
 * Fassungen zum Hochklappen dient, hier umgedreht. Es ist nur ein Zeichen,
 * kein Knopf.
 * Aussehen: styles/details-sheet.css (iOS-Blatt), in Android styles/android-entry.css (Material 3).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { icon } from "../core/html.js";
import { entryFacts } from "../data/entry-facts.js";
import { findEntry, findWorkspace } from "../data/queries.js";
import { workspaceFacts } from "../data/workspace-facts.js";
import { fillDetails, handleCardClick } from "./details-card.js";
import { bindDetailsExpand, fitDetailsPeek } from "./details-expand.js";
import { detailsDoneMarkup, detailsHeadMarkup, detailsRowsMarkup, groupsWithoutTime, handleRowsClick } from "./details-rows.js";
import { bindModalPull, clearModalPull } from "./modal-pull.js";
import { isMobileOs } from "./platform.js";
import { addPopGuard } from "./router-restore.js";
import { closeSheet } from "./sheet.js";
import { isViewActive } from "./views.js";

const sheetLabel = "Details";
/* Kennzahlen, deren Tipp src/ui/details-card.js selbst erledigt — alle anderen brauchen eine Aktion der Seite */
const ownFields = ["date", "remind", "status", "priority"];
/* Die Ansicht, unter der ein aus einer Liste gewählter Eintrag läuft */
const pickView = "pick";

let backdrop = null;
let body = null;
let statsBox = null;
let rowsBox = null;
let headBox = null;
let footBox = null;
let listBox = null;
/* Aus einer Liste gewählt: { kind: "entry" | "workspace", id } */
let pick = null;
/* Ansicht, deren Angaben gerade im Blatt stehen ("entry" oder "page") */
let openView = null;
/* Pro Ansicht: { subject(), facts(subject), actions?() } — von der Seite angemeldet */
const sources = {
  [pickView]: {
    subject: () => (pick ? (pick.kind === "workspace" ? findWorkspace(pick.id) : findEntry(pick.id)) : null),
    facts: (subject) => (pick.kind === "workspace" ? workspaceFacts(subject) : entryFacts(subject)),
    kind: () => pick.kind,
  },
};
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
  if (!subject) return;
  const facts = source.facts(subject);
  const actions = source.actions?.() || {};
  /* Ohne Aktion dahinter ist eine Kennzahl kein Knopf */
  const stats = facts.stats.map((stat) =>
    stat.field && !ownFields.includes(stat.field) && !actions[stat.field] ? { ...stat, field: null } : stat
  );
  /* Android: Kopf, Verknüpfen und Zeilen statt der drei Kennzahlen, „Zeit“ steckt in den Zeilen */
  if (isMobileOs("android")) {
    const kind = kindOf(source);
    /* Ein aufgeklappter Titel bleibt beim Neuzeichnen aufgeklappt */
    const expanded = headBox.querySelector("[data-details-title]")?.getAttribute("aria-expanded") === "true";
    headBox.innerHTML = detailsHeadMarkup(subject, kind);
    if (expanded) headBox.querySelector("[data-details-title]").setAttribute("aria-expanded", "true");
    rowsBox.innerHTML = detailsRowsMarkup(subject, kind, { ...facts, stats });
    footBox.innerHTML = detailsDoneMarkup(subject, kind);
    footBox.hidden = !footBox.firstChild;
    fillDetails(statsBox, listBox, groupsWithoutTime({ ...facts, stats }));
    statsBox.innerHTML = "";
    return;
  }
  headBox.innerHTML = "";
  footBox.innerHTML = "";
  footBox.hidden = true;
  rowsBox.innerHTML = "";
  fillDetails(statsBox, listBox, { ...facts, stats });
}

/* Eintrag oder Arbeitsbereich? Die Seite eines Arbeitsbereichs heißt "page". */
function kindOf(source) {
  return source.kind ? source.kind() : openView === "page" ? "workspace" : "entry";
}

/* Escape schließt, was obenauf liegt: erst ein Blatt darüber (Verknüpfen,
   Status, Tab), dann dieses — sonst ginge das untere zu und das obere bliebe */
function onKey(event) {
  if (event.key !== "Escape") return;
  if (!dom.sheet.hidden) {
    closeSheet();
    return;
  }
  closeDetailsSheet();
}

/**
 * Das Blatt mit den Angaben der Seite `view` öffnen.
 * @param push false, wenn der Verlauf schon auf dem Schritt des Blatts steht (Vorwärts)
 */
export function openDetailsSheet(view, { push = true } = {}) {
  const source = sources[view];
  if (!backdrop || !source?.subject() || isDetailsSheetOpen()) return;
  openView = view;
  if (push) {
    const state = view === pickView ? { ...(history.state || {}), detailsPick: pick } : { ...(history.state || { view }) };
    history.pushState({ ...state, detailsSheet: view }, "");
  }
  fill();
  clearModalPull(backdrop);
  delete backdrop.dataset.dismissing;
  backdrop.hidden = false;
  /* Erst sichtbar, dann nach oben: solange das Blatt versteckt ist, bleibt
     die alte Scroll-Lage vom letzten Mal hängen */
  body.scrollTop = 0;
  fitDetailsPeek();
  document.addEventListener("keydown", onKey);
  toggleListeners.forEach((listener) => listener(true));
}

/**
 * Das Blatt für einen Eintrag oder Arbeitsbereich aus einer Liste heraus öffnen.
 * @param kind    "entry" oder "workspace"
 * @param subject der Eintrag bzw. Arbeitsbereich
 */
export function openDetailsFor(kind, subject) {
  if (!backdrop) initDetailsSheet();
  pick = { kind, id: subject.id };
  openDetailsSheet(pickView);
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
  /* Vorwärts auf den Schritt des Blatts: auf derselben Seite wieder öffnen;
     ein aus einer Liste gewählter Eintrag kommt aus dem Verlaufsschritt */
  const view = event.state?.detailsSheet;
  if (view === pickView && event.state.detailsPick) {
    pick = event.state.detailsPick;
    openDetailsSheet(pickView, { push: false });
    return true;
  }
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
      <div class="details-sheet-head"></div>
      <div class="modal-body details-sheet-body">
        <div class="details-rows"></div>
        <div class="details-stats"></div>
        <div class="details-list"></div>
      </div>
      <div class="details-sheet-foot" hidden></div>
    </div>`;
  headBox = backdrop.querySelector(".details-sheet-head");
  footBox = backdrop.querySelector(".details-sheet-foot");
  body = backdrop.querySelector(".modal-body");
  rowsBox = backdrop.querySelector(".details-rows");
  statsBox = backdrop.querySelector(".details-stats");
  listBox = backdrop.querySelector(".details-list");
  dom.sheet.before(backdrop);
  bindModalPull(backdrop, closeDetailsSheet);
  bindDetailsExpand(backdrop, body);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeDetailsSheet();
      return;
    }
    const source = sources[openView];
    const subject = source?.subject();
    if (!subject) return;
    if (handleRowsClick(event, subject, kindOf(source), fill)) return;
    handleCardClick(event, subject, { done: fill, actions: source.actions?.() });
  });

  addPopGuard(onPop);
  /* Eine andere Seite: das Blatt gehört zur verlassenen Seite. Der Verlauf
     bleibt unangetastet — er gehört jetzt der neuen Seite. */
  on(events.viewWillChange, () => closeDetailsSheet({ fromHistory: true }));
  /* Verknüpfen, Typ ändern, Erledigt: das offene Blatt zeigt gleich den neuen Stand */
  on(events.dataChanged, () => {
    if (isDetailsSheetOpen()) fill();
  });
}
