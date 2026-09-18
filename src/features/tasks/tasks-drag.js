/*
 * Zeilen im Board verschieben — mit der Maus und mit dem Finger (Pointer
 * Events). Angefasst wird am Griffstreifen rechts; die Zeile hebt sich als
 * Karte ab, hängt am Zeiger, und die Lücke zeigt, wo sie landet. Zieht man an
 * den Rand, rollt die Seite bzw. das Board von selbst weiter.
 *
 * Damit es flüssig bleibt: die Zeile bewegt sich nur über `transform`, ihre
 * Maße werden einmal beim Anfassen genommen, und während der Bewegung wird
 * höchstens die Zeile unter dem Zeiger gemessen — nie das ganze Board und nie
 * über `getComputedStyle`.
 * Pfad: src/features/tasks/tasks-drag.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * scrollSpeed  -> wie schnell am Rand mitgerollt wird (Pixel je Bild)
 * startSlack   -> ab wie vielen Pixeln Bewegung das Ziehen wirklich beginnt
 *
 * Wie breit der Randstreifen ist, steht als --board-edge in styles/tokens.css.
 */

import { cssNumber } from "../../core/css-vars.js";
import { dom } from "../../core/dom.js";
import { moveTask } from "../../data/mutations.js";
import { findEntry } from "../../data/queries.js";
import { saveState, state } from "../../data/state.js";

const scrollSpeed = 12;
const startSlack = 4;

/* Der laufende Zug; außerhalb eines Zuges null. */
let drag = null;
/* Nach einem Zug kommt noch ein Klick — der darf den Eintrag nicht öffnen. */
let blockClick = false;
let redrawBoard = () => {};

/** Kam der Klick direkt nach einem Zug? Dann wird er verworfen. */
export function consumeDragClick() {
  if (!blockClick) return false;
  blockClick = false;
  return true;
}

/* Der Eintrag zu einer Zeile im Board. */
function entryOfCard(card) {
  return card ? findEntry(card.dataset.boardRow) : null;
}

/* Die Lücke an eine neue Stelle setzen; `before` ist die Zeile, über der sie steht. */
function placeGap(box, before) {
  const { gap } = drag;
  if (before) box.insertBefore(gap, before);
  else box.append(gap);
  drag.box = box;
}

/*
 * Wohin gehört der Zeiger gerade? Gemessen wird nur die eine Zeile unter ihm —
 * liegt er in ihrer oberen Hälfte, kommt die Lücke davor, sonst dahinter.
 */
function updateGap(x, y) {
  const under = document.elementFromPoint(x, y);
  if (!under) return;
  const column = under.closest(".board-col");
  const box = under.closest(".board-rows") || (column && column.querySelector(".board-rows"));
  if (!box) return;

  const over = under.closest(".board-row");
  if (over && over !== drag.card) {
    const rect = over.getBoundingClientRect();
    placeGap(box, y < rect.top + rect.height / 2 ? over : over.nextElementSibling);
    return;
  }
  /* Über der Kopfzeile, dem Knopf oder einer leeren Spalte: ans Ende der Spalte. */
  if (box !== drag.box) placeGap(box, null);
}

/* Rollt Seite und Board weiter, solange der Zeiger am Rand steht. */
function autoScroll() {
  if (!drag) return;
  const edge = cssNumber("--board-edge", 44);
  const { x, y, board } = drag;
  const view = dom.content;
  const top = drag.contentRect.top;
  const bottom = drag.contentRect.bottom;

  if (y < top + edge) view.scrollTop -= scrollSpeed;
  else if (y > bottom - edge) view.scrollTop += scrollSpeed;

  if (board) {
    const rect = drag.boardRect;
    if (x < rect.left + edge) board.scrollLeft -= scrollSpeed;
    else if (x > rect.right - edge) board.scrollLeft += scrollSpeed;
  }
  drag.frame = requestAnimationFrame(autoScroll);
}

/* Die Zeile an die Stelle der Lücke zurückstellen und alles aufräumen. */
function endDrag(save) {
  if (!drag) return;
  const { card, gap, grip, pointerId } = drag;
  cancelAnimationFrame(drag.frame);
  /* Der Zeiger kann schon weg sein (Fenster verlassen, Browser-Geste): dann
     gibt es nichts mehr freizugeben und der Versuch würde nur stolpern. */
  try {
    if (grip.hasPointerCapture(pointerId)) grip.releasePointerCapture(pointerId);
  } catch (error) {
    /* nichts zu tun */
  }

  const box = gap.parentElement;
  gap.replaceWith(card);
  card.classList.remove("is-dragging");
  card.removeAttribute("style");
  document.body.classList.remove("is-dragging-task");
  const moved = drag.moved;
  drag = null;

  if (!save || !moved || !box) {
    redrawBoard();
    return;
  }

  const entry = entryOfCard(card);
  const siblings = Array.from(box.querySelectorAll(".board-row"));
  const index = siblings.indexOf(card);
  const before = entryOfCard(siblings[index - 1]);
  const after = entryOfCard(siblings[index + 1]);
  /* Von Hand gezogen heißt: diese Reihenfolge soll gelten. Stand die Seite auf
     einer anderen Sortierung, wechselt sie dafür zurück auf „Neueste zuerst“. */
  if (state.prefs.tasks.sort !== "neu") {
    state.prefs.tasks.sort = "neu";
    saveState();
  }
  moveTask(entry, box.dataset.field, box.dataset.drop, before, after);
  redrawBoard();
}

/* Anfassen am Griff: Maße einmal nehmen, Lücke einsetzen, Zeile lösen. */
function onPointerDown(event) {
  blockClick = false;
  const grip = event.target.closest("[data-grip]");
  if (!grip || drag) return;
  const card = grip.closest(".board-row");
  const board = dom.tasksBody.querySelector(".board");
  if (!card || !board) return;
  event.preventDefault();

  const rect = card.getBoundingClientRect();
  const deviceRect = dom.device.getBoundingClientRect();
  const gap = document.createElement("div");
  gap.className = "board-gap";
  gap.style.height = `${rect.height}px`;

  drag = {
    card,
    grip,
    gap,
    board,
    box: card.parentElement,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    moved: false,
    boardRect: board.getBoundingClientRect(),
    contentRect: dom.content.getBoundingClientRect(),
    frame: 0,
  };

  card.parentElement.insertBefore(gap, card);
  card.classList.add("is-dragging");
  card.style.width = `${rect.width}px`;
  card.style.height = `${rect.height}px`;
  card.style.left = `${rect.left - deviceRect.left}px`;
  card.style.top = `${rect.top - deviceRect.top}px`;
  dom.device.append(card);
  document.body.classList.add("is-dragging-task");
  drag.frame = requestAnimationFrame(autoScroll);
  /* Der Griff fängt den Zeiger ein, damit die Bewegung auch dann bei uns
     ankommt, wenn der Finger die Zeile verlässt. */
  try {
    grip.setPointerCapture(event.pointerId);
  } catch (error) {
    /* ohne Einfangen laufen die Bewegungen über das Fenster — das reicht auch */
  }
}

function onPointerMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (!drag.moved && Math.abs(dx) < startSlack && Math.abs(dy) < startSlack) return;
  drag.moved = true;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drag.card.style.transform = `translate(${dx}px, ${dy}px)`;
  updateGap(event.clientX, event.clientY);
}

/**
 * Das Ziehen im Board aktivieren. Ein Empfänger für das ganze Board statt
 * eines Zuhörers je Zeile.
 * @param redraw zeichnet das Board nach dem Ablegen neu.
 */
export function initTaskDrag(redraw) {
  redrawBoard = redraw;
  dom.tasksBody.addEventListener("pointerdown", onPointerDown);
  /* Die gezogene Zeile hängt am Gerät statt in der Spalte, damit sie über den
     Spalten liegt — ihre Bewegungen kommen deshalb am Fenster an, nicht mehr
     im Board. */
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    blockClick = drag.moved;
    endDrag(true);
  });
  /* Mitten in der Bewegung abgebrochen (Anruf, Escape, Zeiger verloren):
     die Zeile geht dorthin zurück, wo die Lücke gerade steht — gespeichert
     wird nichts. */
  window.addEventListener("pointercancel", () => endDrag(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drag) endDrag(false);
  });
}
