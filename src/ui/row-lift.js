/*
 * Eine Zeile anheben und auf ein Ziel ziehen — z.B. auf den Archiv-Knopf der
 * Android-Fassung (src/shell/android-archive.js). Angehoben wird, sobald das
 * lange Drücken greift (src/ui/long-press.js, angestoßen aus src/ui/swipe.js):
 * der Finger steht noch still, das Handy tickt, und eine Kopie der Zeile hängt
 * ab jetzt am Finger — ein Menü gibt es nicht. Jedes Element mit
 * data-lift-drop ist ein Ziel; schwebt die Zeile darüber, bekommt es die
 * Klasse is-drop-over. Loslassen über einem Ziel gibt die Zeile an die
 * angemeldete Stelle weiter, sonst passiert nichts.
 *
 * Was angehoben werden darf und was beim Ablegen passiert, weiß diese Datei
 * nicht — das meldet die obere Schicht mit setRowLift() an. Eine Zeile in
 * einer Liste mit data-reorder darf immer angehoben werden: sie lässt sich
 * dann auch verschieben (src/ui/row-reorder.js), und die Kopie sieht aus wie
 * die „gezogene Zeile“ in Material 3 — sie folgt dem Finger nur senkrecht und
 * bleibt in ihrer Spalte, so wie dort.
 *
 * Damit es flüssig bleibt: die Kopie bewegt sich nur über `translate`, ihre
 * Maße werden einmal beim Anheben genommen, und das Ziel unter dem Finger
 * wird höchstens einmal je Bild gesucht.
 * Pfad: src/ui/row-lift.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * liftBuzzMs   -> Länge des kurzen Vibrierens beim Anheben (0 = aus)
 * --m3-reorder-edge (styles/tokens-android.css) -> Abstand der Kopie einer verschiebbaren Zeile zum linken und rechten Geräterand;
 *                 Icon und Titel bleiben dabei genau über ihrer Stelle in der Liste
 * clickBlockMs -> wie lange nach dem Ablegen ein Klick verworfen wird (Millisekunden)
 *
 * Aussehen der angehobenen Zeile und des Ziels: styles/android-archive.css.
 */

import { cssNumber } from "../core/css-vars.js";
import { dom } from "../core/dom.js";
import { beginReorder, finishReorder, isReorderRow, updateReorder } from "./row-reorder.js";

const liftBuzzMs = 10;
const clickBlockMs = 400;

/* Angemeldet von oben: { canLift(row), start(), end(), drop(row, zone) } */
let handler = null;
/* Der laufende Zug; außerhalb eines Zuges null. */
let lift = null;
let blockClickUntil = 0;

/** Die obere Schicht meldet an, was angehoben werden darf und was beim Ablegen geschieht. */
export function setRowLift(next) {
  handler = next;
}

/** Darf diese Zeile (das Ziel des langen Drückens) angehoben werden? */
export function canLift(row) {
  return Boolean(row && (isReorderRow(row) || handler?.canLift(row)));
}

/** Läuft gerade ein Zug? */
export function isLifting() {
  return Boolean(lift);
}

/* Das Ziel unter dem Finger — die Kopie selbst lässt den Zeiger durch (styles/android-archive.css). */
function zoneAt(x, y) {
  return document.elementFromPoint(x, y)?.closest("[data-lift-drop]") || null;
}

/* Das Ziel unter dem Finger markieren — einmal je Bild, weil es das Layout misst. */
function frame() {
  if (!lift) return;
  lift.frame = 0;
  const { ghost, x, y, startX, startY, reorder } = lift;
  /* translate statt transform: so verschiebt das Schrumpfen über dem Ziel (scale) die Kopie nicht mit.
     Eine verschiebbare Zeile bleibt in ihrer Spalte (Material 3): nur senkrecht nachführen. */
  ghost.style.translate = `${reorder ? 0 : x - startX}px ${y - startY}px`;
  /* Beim Verschieben rückt die Zeile am Rand nach; rollt die Seite, folgt gleich ein weiteres Bild */
  if (lift.reorder && updateReorder(y)) lift.frame = requestAnimationFrame(frame);
  const zone = zoneAt(x, y);
  if (zone === lift.zone) return;
  lift.zone?.classList.remove("is-drop-over");
  zone?.classList.add("is-drop-over");
  ghost.classList.toggle("is-over-drop", Boolean(zone));
  lift.zone = zone;
}

/**
 * Anheben: eine Kopie der Zeile legt sich genau über sie und folgt ab jetzt
 * dem Finger. `row` ist das Element, auf dem lange gedrückt wurde; `event`
 * braucht nur pointerId, clientX und clientY — der Aufrufer gibt die Stelle
 * des Haltens herein, denn beim Anheben bewegt sich der Finger noch nicht.
 */
export function startLift(event, row) {
  if (lift || !canLift(row)) return;
  const source = row.closest(".swipe") || row;
  const rect = row.getBoundingClientRect();
  const deviceRect = dom.device.getBoundingClientRect();
  const reorder = isReorderRow(row);
  /* Als gezogene Zeile spannt sich die Kopie fast über das ganze Gerät, links
     und rechts gleich weit vom Rand; ihr Innenabstand gleicht das aus, damit
     Icon und Titel genau über ihrer Stelle in der Liste stehen bleiben. */
  const edge = reorder ? cssNumber("--m3-reorder-edge", 8) : 0;
  const left = reorder ? edge : rect.left - deviceRect.left;
  const width = reorder ? deviceRect.width - 2 * edge : rect.width;
  const ghost = row.cloneNode(true);
  ghost.classList.add("row-lift");
  if (reorder) {
    ghost.classList.add("is-reordering");
    ghost.style.paddingLeft = `${rect.left - deviceRect.left - left}px`;
    ghost.style.paddingRight = `${deviceRect.left + left + width - rect.right}px`;
  }
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.left = `${left}px`;
  ghost.style.top = `${rect.top - deviceRect.top}px`;
  ghost.style.width = `${width}px`;
  ghost.style.height = `${rect.height}px`;
  /* Über dem Ziel schrumpft die Kopie zum Finger hin, nicht zu ihrer Mitte */
  ghost.style.transformOrigin = `${event.clientX - deviceRect.left - left}px ${event.clientY - rect.top}px`;
  dom.device.append(ghost);
  source.classList.add("is-lift-source");
  document.body.classList.add("is-row-lifting");

  lift = {
    row,
    source,
    ghost,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    zone: null,
    frame: 0,
    reorder,
  };
  if (reorder) beginReorder(row);
  if (liftBuzzMs && navigator.vibrate) navigator.vibrate(liftBuzzMs);
  handler?.start();
  lift.frame = requestAnimationFrame(frame);
}

/* Aufräumen; mit `drop` landet die Zeile im Ziel unter dem Finger. Das Ziel
   wird dafür noch einmal an der letzten Stelle gesucht: bei einem schnellen
   Zug kann das letzte Bild noch fehlen. */
function endLift(drop) {
  if (!lift) return;
  const { row, source, ghost, reorder } = lift;
  const zone = drop ? zoneAt(lift.x, lift.y) : null;
  lift.zone?.classList.remove("is-drop-over");
  cancelAnimationFrame(lift.frame);
  lift = null;
  ghost.remove();
  source.classList.remove("is-lift-source");
  document.body.classList.remove("is-row-lifting");
  /* Der Klick nach dem Loslassen gehört zum Zug, nicht zur Zeile oder zum Knopf darunter */
  blockClickUntil = Date.now() + clickBlockMs;
  /* Über einem Ziel (Archiv) bleibt die Reihenfolge, wie sie war; sonst gilt der neue Platz */
  if (reorder) finishReorder(drop && !zone);
  if (drop && zone) handler?.drop(row, zone);
  handler?.end();
}

function onPointerMove(event) {
  if (!lift || event.pointerId !== lift.pointerId) return;
  lift.x = event.clientX;
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
    lift.x = event.clientX;
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
  /* capture: vor allen anderen Zuhörern, damit weder Zeile noch Knopf den Klick sehen */
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
