/*
 * Eine Zeile anheben, um sie in ihrer Liste zu verschieben (Android-Fassung).
 * Angehoben wird, sobald das lange Drücken greift (src/ui/long-press.js,
 * angestoßen aus src/ui/swipe.js): der Finger steht noch still, das Handy
 * tickt, und eine Kopie der Zeile hängt ab jetzt am Finger — ein Menü gibt es
 * nicht. Anheben lässt sich nur eine Zeile in einer Liste mit data-reorder;
 * ihr Platz wandert mit dem Finger (src/ui/row-reorder.js). Die Kopie sieht
 * aus wie die „gezogene Zeile“ in Material 3 — sie spannt sich über die ganze
 * Breite, folgt dem Finger nur senkrecht und bleibt in ihrer Spalte.
 *
 * Damit es flüssig bleibt: die Kopie bewegt sich nur über `translate`, ihre
 * Maße werden einmal beim Anheben genommen, und der neue Platz wird
 * höchstens einmal je Bild gesucht.
 * Pfad: src/ui/row-lift.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * liftBuzzMs   -> Länge des kurzen Vibrierens beim Anheben (0 = aus)
 * --m3-reorder-edge (styles/tokens-android.css) -> Abstand der Kopie zum linken und rechten Geräterand;
 *                 Icon und Titel bleiben dabei genau über ihrer Stelle in der Liste
 * clickBlockMs -> wie lange nach dem Ablegen ein Klick verworfen wird (Millisekunden)
 *
 * Aussehen der angehobenen Zeile: styles/android-reorder.css.
 */

import { cssNumber } from "../core/css-vars.js";
import { dom } from "../core/dom.js";
import { beginReorder, finishReorder, isReorderRow, updateReorder } from "./row-reorder.js";

const liftBuzzMs = 10;
const clickBlockMs = 400;

/* Der laufende Zug; außerhalb eines Zuges null. */
let lift = null;
let blockClickUntil = 0;

/** Darf diese Zeile (das Ziel des langen Drückens) angehoben werden? */
export function canLift(row) {
  return Boolean(row && isReorderRow(row));
}

/** Läuft gerade ein Zug? */
export function isLifting() {
  return Boolean(lift);
}

/* Die Kopie senkrecht nachführen und den Platz in der Liste — einmal je Bild, weil es das Layout misst. */
function frame() {
  if (!lift) return;
  lift.frame = 0;
  lift.ghost.style.translate = `0 ${lift.y - lift.startY}px`;
  /* Am Rand rückt die Zeile nach; rollt die Seite, folgt gleich ein weiteres Bild */
  if (updateReorder(lift.y)) lift.frame = requestAnimationFrame(frame);
}

/**
 * Anheben: eine Kopie der Zeile legt sich genau über sie und folgt ab jetzt
 * dem Finger. `row` ist das Element, auf dem lange gedrückt wurde; `event`
 * braucht nur pointerId und clientY — der Aufrufer gibt die Stelle
 * des Haltens herein, denn beim Anheben bewegt sich der Finger noch nicht.
 */
export function startLift(event, row) {
  if (lift || !canLift(row)) return;
  /* Kopiert wird die ganze Zeile samt allem neben ihr (bei Aufgaben der Ring
     davor), und zwar in einer Hülle mit den Klassen ihrer Liste: so gelten für
     die Kopie dieselben Regeln wie in der Liste (z.B. .task-rows …). */
  const body = row.closest(".swipe-body") || row;
  const list = body.closest("[data-reorder]");
  const rect = body.getBoundingClientRect();
  const deviceRect = dom.device.getBoundingClientRect();
  /* Die Kopie spannt sich fast über das ganze Gerät, links und rechts gleich
     weit vom Rand; der Inhalt rückt um dasselbe Maß zurück, damit Icon und
     Titel genau über ihrer Stelle in der Liste stehen bleiben. */
  const edge = cssNumber("--m3-reorder-edge", 8);
  const width = deviceRect.width - 2 * edge;
  const copy = body.cloneNode(true);
  copy.classList.remove("is-grabbed", "is-sliding");
  copy.style.transform = "";
  copy.style.marginLeft = `${rect.left - deviceRect.left - edge}px`;
  copy.style.marginRight = `${deviceRect.left + edge + width - rect.right}px`;
  const ghost = document.createElement("div");
  ghost.className = `${list?.className || ""} row-lift`;
  ghost.setAttribute("aria-hidden", "true");
  ghost.append(copy);
  ghost.style.left = `${edge}px`;
  ghost.style.top = `${rect.top - deviceRect.top}px`;
  ghost.style.width = `${width}px`;
  ghost.style.height = `${rect.height}px`;
  dom.device.append(ghost);
  document.body.classList.add("is-row-lifting");

  lift = { ghost, pointerId: event.pointerId, startY: event.clientY, y: event.clientY, frame: 0 };
  beginReorder(row);
  if (liftBuzzMs && navigator.vibrate) navigator.vibrate(liftBuzzMs);
  lift.frame = requestAnimationFrame(frame);
}

/* Aufräumen; mit `drop` gilt der neue Platz, sonst kehrt die Zeile an ihren alten zurück. */
function endLift(drop) {
  if (!lift) return;
  cancelAnimationFrame(lift.frame);
  lift.ghost.remove();
  lift = null;
  document.body.classList.remove("is-row-lifting");
  /* Der Klick nach dem Loslassen gehört zum Zug, nicht zur Zeile darunter */
  blockClickUntil = Date.now() + clickBlockMs;
  finishReorder(drop);
}

function onPointerMove(event) {
  if (!lift || event.pointerId !== lift.pointerId) return;
  lift.y = event.clientY;
  if (!lift.frame) lift.frame = requestAnimationFrame(frame);
}

/* Solange eine Zeile angehoben ist, scrollt der Finger nicht die Seite —
   sonst bräche der Browser den Zug ab (pointercancel). */
function onTouchMove(event) {
  if (lift) event.preventDefault();
}

/** Zuhörer einmal anmelden. Wird beim Start aufgerufen. */
export function initRowLift() {
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", (event) => {
    if (!lift || event.pointerId !== lift.pointerId) return;
    lift.y = event.clientY;
    endLift(true);
  });
  /* Abgebrochen (Anruf, Browser-Geste): nichts ablegen */
  window.addEventListener("pointercancel", () => endLift(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") endLift(false);
  });
  /* passive: false, sonst wäre preventDefault wirkungslos */
  dom.content.addEventListener("touchmove", onTouchMove, { passive: false });
  /* capture: vor allen anderen Zuhörern, damit die Zeile den Klick nicht sieht */
  window.addEventListener(
    "click",
    (event) => {
      if (Date.now() > blockClickUntil) return;
      blockClickUntil = 0;
      event.stopPropagation();
      event.preventDefault();
    },
    true
  );
}
