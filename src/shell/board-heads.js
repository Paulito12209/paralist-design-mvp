/*
 * Spaltenköpfe des Boards bleiben beim Scrollen stehen: wer in einer langen
 * Spalte nach unten rollt, sieht oben weiter, welche Spalte welche ist
 * (Aufgaben und Projekte). Die Köpfe rasten dazu direkt unter der Werkzeugzeile
 * ein (Archiv, Sortieren, Filtern, Ansicht), die in der Android-Fassung selbst
 * oben einrastet.
 * Warum per Skript: das Board rollt seitlich und ist damit selbst ein
 * Scrollbereich — ein reines `position: sticky` im Kopf würde sich am Board
 * statt an der Seite festhalten und nie greifen. Deshalb misst dieses Skript,
 * wie weit die Köpfe nach unten müssten, und schreibt den Wert als
 * --board-head-shift an den Behälter des Boards; die Köpfe verschieben sich
 * damit (styles/tasks-board.css). Gemessen wird nur beim Scrollen der Seite,
 * beim Gleiten der Werkzeugzeile (wenn die Suchleiste geht oder kommt), bei
 * neuem Zeichnen und beim Drehen — nie beim seitlichen Wischen im Board.
 * Ohne sichtbare Werkzeugzeile (iOS-Fassung, Computer) bleibt alles, wie es war.
 * Pfad: src/shell/board-heads.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * BOARD_END_PX -> so viel Luft unter den Köpfen bleibt am Ende des Boards, bevor
 *                 sie mit ihm aus dem Bild laufen (gleich dem Polster
 *                 unten in styles/tasks-board.css)
 *
 * Farbe und Fuge der festgehaltenen Köpfe: styles/tasks-board.css.
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";

const BOARD_END_PX = 4;
const STUCK_ATTR = "data-board-stuck";

let frame = 0;
let lastHost = null;
let lastShift = 0;

/** Das Board der gerade sichtbaren Seite, falls es eines gibt. */
function visibleBoard() {
  return dom.content.querySelector(".view:not([hidden]) .board");
}

/** Die Werkzeugzeile über dem Board — nur dort vorhanden, wo sie auch zu sehen ist. */
function toolRowOf(board) {
  const row = board.parentElement.querySelector(":scope > .project-card-head");
  return row && row.offsetHeight ? row : null;
}

/** Wie weit die Köpfe nach unten müssen, damit sie unter der Werkzeugzeile stehen. */
function shiftFor(board, row) {
  const head = board.querySelector(".board-head");
  if (!row || !head) return 0;
  const wanted = row.getBoundingClientRect().bottom - board.getBoundingClientRect().top;
  const room = board.offsetHeight - head.offsetHeight - BOARD_END_PX;
  return Math.max(0, Math.min(wanted, room));
}

function update() {
  frame = 0;
  const board = visibleBoard();
  if (!board) return;
  const row = toolRowOf(board);
  const shift = shiftFor(board, row);
  const host = board.parentElement;
  if (host !== lastHost || shift !== lastShift) {
    /* Am Behälter statt am Board: ein neu gezeichnetes Board erbt den Wert sofort */
    host.style.setProperty("--board-head-shift", `${shift}px`);
    host.toggleAttribute(STUCK_ATTR, shift > 0);
    lastHost = host;
    lastShift = shift;
  }
  /* Gleitet die Werkzeugzeile gerade (Suchleiste geht oder kommt), gibt es dabei
     kein Scroll-Ereignis: weiter jedes Bild nachmessen, bis sie steht */
  if (row && row.getAnimations().length) schedule();
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

/** Zuhörer anmelden. */
export function initBoardHeads() {
  /* passive/capture: das Ereignis „scroll“ steigt nicht auf; nur die Seite selbst
     zählt, nicht das seitliche Wischen im Board */
  dom.content.addEventListener(
    "scroll",
    (event) => {
      if (event.target === dom.content) schedule();
    },
    { passive: true, capture: true },
  );
  dom.content.addEventListener(
    "transitionrun",
    (event) => {
      if (event.target.classList.contains("project-card-head")) schedule();
    },
    { capture: true },
  );
  window.addEventListener("resize", schedule);
  on(events.dataChanged, schedule);
  on(events.viewOpened, schedule);
}
