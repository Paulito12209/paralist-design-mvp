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
 *
 * Im Auswahlmodus zieht der Griff einer gewählten Zeile alle gewählten
 * mit: die übrigen verschwinden aus ihren Spalten, die angefasste trägt sie
 * als Stapel mit der Zahl oben rechts. Loslassen gibt allen den Wert der
 * Zielspalte, in ihrer bisherigen Reihenfolge an der Stelle der Lücke —
 * mit „Rückgängig“ in der Meldung. Der Griff einer nicht gewählten Zeile
 * zieht wie immer nur sie.
 * Pfad: src/features/tasks/tasks-drag.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * scrollSpeed  -> wie schnell am Rand mitgerollt wird (Pixel je Bild)
 * startSlack   -> ab wie vielen Pixeln Bewegung das Ziehen wirklich beginnt
 * stackWords   -> Texte der Meldung nach dem Ablegen eines Stapels
 *
 * Wie breit der Randstreifen ist, steht als --board-edge in styles/tokens.css.
 */

import { cssNumber } from "../../core/css-vars.js";
import { dom } from "../../core/dom.js";
import { restoreSnapshot, snapshotEntries } from "../../data/mutations-bulk.js";
import { moveTask, moveTasks } from "../../data/mutations-tasks.js";
import { findEntry } from "../../data/queries.js";
import { saveState } from "../../data/state.js";
import { activeTaskView } from "../../data/task-views.js";
import { showToast } from "../../ui/toast.js";
import { isPicked, isSelecting } from "./tasks-pick.js";

const scrollSpeed = 12;
const startSlack = 4;
const stackWords = { many: "Aufgaben", undo: "Rückgängig" };

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

/*
 * Läuft einmal je Bildaufbau, solange gezogen wird: rollt Seite und Board
 * weiter, wenn der Zeiger am Rand steht, und setzt die Lücke. Die Lücke wird
 * hier und nicht bei jeder Bewegung gesetzt, weil sie das Layout misst —
 * einmal je Bild reicht dem Auge, mehr kostet nur.
 */
function autoScroll() {
  if (!drag) return;
  if (drag.moved) updateGap(drag.x, drag.y);
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
  const { card, gap, grip, pointerId, stack } = drag;
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
  card.classList.remove("is-dragging", "is-stack");
  card.removeAttribute("style");
  delete card.dataset.stack;
  document.body.classList.remove("is-dragging-task");
  const moved = drag.moved;
  drag = null;

  if (!save || !moved || !box) {
    redrawBoard();
    return;
  }

  /* Mitgetragene Zeilen stehen noch unsichtbar in ihren Spalten — sie sind keine Nachbarn */
  const siblings = Array.from(box.querySelectorAll(".board-row:not(.is-carried)"));
  const index = siblings.indexOf(card);
  const above = entryOfCard(siblings[index - 1]);
  const below = entryOfCard(siblings[index + 1]);
  /* Von Hand gezogen heißt: diese Reihenfolge soll gelten. Sie lebt in der
     Sortierung „Erstellt“ — steht die Seite auf Fällig oder Titel, wechselt
     sie dafür zurück. Absteigend gezeigt ist die Zeile darüber die spätere. */
  const view = activeTaskView();
  if (view.sort !== "erstellt") {
    view.sort = "erstellt";
    saveState();
  }
  const [before, after] = view.sortAsc ? [above, below] : [below, above];
  if (stack.length > 1) dropStack(stack, box, before, after, view.sortAsc);
  else moveTask(entryOfCard(card), box.dataset.field, box.dataset.drop, before, after);
  redrawBoard();
}

/*
 * Einen Stapel ablegen: alle bekommen den Wert der Zielspalte und stehen in
 * ihrer bisherigen Reihenfolge an der Stelle der Lücke. Absteigend gezeigt
 * steht die oberste Zeile mit der höchsten Sortiernummer — deshalb umgedreht.
 */
function dropStack(stack, box, before, after, ascending) {
  const entries = stack.map(entryOfCard).filter(Boolean);
  const snap = snapshotEntries(entries);
  moveTasks(ascending ? entries : [...entries].reverse(), box.dataset.field, box.dataset.drop, before, after);
  const column = box.closest(".board-col")?.querySelector(".board-head-name")?.textContent || "";
  showToast({
    icon: "board",
    title: `${entries.length} ${stackWords.many} → ${column}`,
    action: { label: stackWords.undo, icon: "undo", onSelect: () => restoreSnapshot(snap) },
  });
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
  /* Gewählte Zeile im Auswahlmodus: alle gewählten kommen mit, in ihrer Reihenfolge im Board */
  const stack =
    isSelecting() && isPicked(card.dataset.boardRow) ? Array.from(board.querySelectorAll(".board-row[data-picked]")) : [card];
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
    stack,
  };
  stack.forEach((row) => {
    if (row !== card) row.classList.add("is-carried");
  });
  if (stack.length > 1) {
    card.classList.add("is-stack");
    card.dataset.stack = String(stack.length);
  }

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
