/*
 * Die Karte „Details“ am Ende des Reiters „Inhalt“ eines Arbeitsbereichs —
 * wie auf der Seite eines Eintrags: oben „Details“ und rechts das Symbol, das
 * die Karte ganz in den Blick holt, darunter drei Kennzahlen (Einträge |
 * Erinnerung | Geändert) und nach einer Trennlinie die Abschnitte. Was darin
 * steht, stellt src/data/workspace-facts.js zusammen; wie es aussieht und was
 * ein Tipp tut, src/ui/details-card.js. Ein Tipp auf „Einträge“ wechselt zur
 * Pille „Verknüpfte Einträge“, einer auf „Erinnerung“ öffnet die Auswahl für
 * Tag und Uhrzeit.
 *
 * Beim Öffnen schaut der Kopf der Karte gerade über der Navigation hervor:
 * die Fläche des Textes wird so hoch, dass die Karte unten steht, und ein
 * Tipp in diese Fläche schreibt am Textende weiter (src/ui/write-tap.js).
 * Kennzahlen und Abschnitte blenden erst ein, wenn sie über der Navigation
 * auftauchen (src/ui/details-peek.js). Anders als beim Eintrag wird langer
 * Text nicht gekürzt und die Karte nicht hochgeklappt: ein Tipp auf
 * „Details“ scrollt die Seite, bis die ganze Karte zu sehen ist, ein zweiter
 * zurück nach oben.
 *
 * Am Desktop mit rechter Spalte steht dieselbe Karte dort
 * (workspace-rail.js); die hier entfällt (styles/entry-desk.css).
 * Pfad: src/features/overview/workspace-details.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * detailsLabel -> Überschrift der Karte
 * showLabel    -> Name des Symbols rechts für Vorlesehilfen und Tooltip
 * MIN_ROOM_PX  -> kleinste Höhe der Fläche für den Text
 * SHOW_GAP_PX  -> so viel Luft bleibt über der Navigation, wenn die Karte ganz in den Blick gescrollt ist
 *
 * Aussehen in styles/entry-details.css (dieselben Klassen wie beim Eintrag).
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { workspaceFacts } from "../../data/workspace-facts.js";
import { isRailShown } from "../../ui/desk-mode.js";
import { fillDetails, handleCardClick } from "../../ui/details-card.js";
import { coveredFrom, revealWatcher } from "../../ui/details-peek.js";

const detailsLabel = "Details";
const showLabel = "Details zeigen";
const MIN_ROOM_PX = 120;
const SHOW_GAP_PX = 12;

let card = null;
let statsBox = null;
let listBox = null;
let watchReveal = null;
/* Die Fläche mit dem Text, unter der die Karte steht, und der Arbeitsbereich dazu */
let panel = null;
let current = null;
/* Was ein Tipp auf „Einträge“ tut — von der Seite hereingegeben */
let showEntries = () => {};

/* Wer Bewegung abgeschaltet hat, springt sofort statt zu gleiten. */
function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/*
 * Die Fläche des Textes so hoch machen, dass der Kopf der Karte gerade über
 * der Navigation steht — bei ganz nach oben gescrollter Seite gerechnet.
 * Langer Text bleibt, wie er ist; die Karte folgt dann darunter.
 */
function layout() {
  if (!card || !card.isConnected || !panel) return;
  panel.style.minHeight = "";
  if (isRailShown()) return;
  const covered = coveredFrom();
  watchReveal(covered);
  /* Oberkante der Fläche, als stünde die Seite ganz oben; dazwischen der Abstand über der Karte */
  const top = panel.getBoundingClientRect().top + dom.content.scrollTop;
  const between = card.offsetTop - panel.offsetTop - panel.offsetHeight;
  const head = card.firstElementChild.offsetHeight;
  const room = Math.max(MIN_ROOM_PX, Math.round(covered - head - between - top));
  if (panel.offsetHeight < room) panel.style.minHeight = `${room}px`;
}

/* Erster Tipp: die ganze Karte in den Blick — ist sie das schon, zurück nach oben. */
function toggleShown() {
  const rect = card.getBoundingClientRect();
  const covered = coveredFrom();
  const contentTop = dom.content.getBoundingClientRect().top;
  const shown = rect.bottom <= covered - SHOW_GAP_PX + 1 || rect.top <= contentTop + SHOW_GAP_PX;
  if (shown) {
    dom.content.scrollTo({ top: 0, behavior: scrollBehavior() });
    return;
  }
  /* So weit, dass ihr Ende über der Navigation steht — passt sie nicht, bis ihr Kopf oben ist */
  const delta = Math.min(rect.bottom - (covered - SHOW_GAP_PX), rect.top - contentTop - SHOW_GAP_PX);
  dom.content.scrollBy({ top: delta, behavior: scrollBehavior() });
}

function ensureCard() {
  if (card) return card;
  card = document.createElement("section");
  card.className = "details-card";
  card.setAttribute("aria-label", detailsLabel);
  card.innerHTML = `
    <div class="details-head">
      <button class="details-title" type="button">${detailsLabel}</button>
      <button class="details-link details-toggle" type="button" aria-label="${showLabel}" title="${showLabel}">${icon("panel-open")}</button>
    </div>
    <div class="details-stats"></div>
    <div class="details-list"></div>`;
  statsBox = card.querySelector(".details-stats");
  listBox = card.querySelector(".details-list");
  watchReveal = revealWatcher(card);
  card.addEventListener("click", (event) => {
    if (!current) return;
    if (event.target.closest(".details-title, .details-toggle")) {
      toggleShown();
      return;
    }
    handleCardClick(event, current, { actions: { entries: () => showEntries() } });
  });
  return card;
}

/**
 * Die Karte unter die Fläche des Textes hängen und für diesen Arbeitsbereich
 * füllen. Ruft die Seite bei jedem Zeichnen des Reiters „Inhalt“ auf.
 */
export function showWorkspaceDetails(workspace, notesPanel) {
  ensureCard();
  current = workspace;
  panel = notesPanel;
  panel.after(card);
  fillDetails(statsBox, listBox, workspaceFacts(workspace));
  layout();
  /* Cover, Kopf und Titel zeichnet die Seite erst nach dem Inhalt
     (src/features/overview/page.js) — einen Frame später steht alles darüber fest */
  requestAnimationFrame(layout);
}

/**
 * Einmal anmelden: neu messen, wenn sich die Größe ändert — und was ein Tipp
 * auf „Einträge“ tut.
 * @param options.onEntries wechselt zur Pille „Verknüpfte Einträge“
 * @param options.textRoot  der Text des Arbeitsbereichs, dessen Höhe zählt
 */
export function initWorkspaceDetails({ onEntries, textRoot }) {
  showEntries = onEntries;
  /* ResizeObserver: neu messen, wenn der Text wächst oder sich die Anzeigefläche
     oder die Leiste unten ändert — nicht bei jedem Tastendruck, nie beim Scrollen.
     Kopf und Titel zählen mit (ein langer Name bricht um, ein Cover macht den
     Kopf höher). Die Fläche selbst wird nicht beobachtet: ihre Mindesthöhe
     setzt diese Datei. */
  const observer = new ResizeObserver(() => layout());
  [dom.content, dom.pageHead, dom.pageTitle, textRoot, dom.navShell].forEach((node) => node && observer.observe(node));
  /* Tastatur zu: am iPhone ändert sich dabei keine Größe, der Beobachter schweigt */
  on(events.keyboardClosed, () => layout());
}
