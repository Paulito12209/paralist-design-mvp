/*
 * Eine Zeile anheben und auf ein Ziel ziehen — z.B. auf den Archiv-Knopf der
 * Android-Fassung (src/shell/android-archive.js). Angehoben wird nach dem
 * langen Drücken (src/ui/long-press.js): wandert der Finger danach, statt
 * loszulassen, öffnet sich kein Menü, sondern eine Kopie der Zeile hängt am
 * Finger. Jedes Element mit data-lift-drop ist ein Ziel; schwebt die Zeile
 * darüber, bekommt es die Klasse is-drop-over. Loslassen über einem Ziel gibt
 * die Zeile an die angemeldete Stelle weiter, sonst passiert nichts.
 *
 * Was angehoben werden darf und was beim Ablegen passiert, weiß diese Datei
 * nicht — das meldet die obere Schicht mit setRowLift() an.
 *
 * Damit es flüssig bleibt: die Kopie bewegt sich nur über `translate`, ihre
 * Maße werden einmal beim Anheben genommen, und das Ziel unter dem Finger
 * wird höchstens einmal je Bild gesucht.
 * Pfad: src/ui/row-lift.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * liftBuzzMs   -> Länge des kurzen Vibrierens beim Anheben (0 = aus)
 * clickBlockMs -> wie lange nach dem Ablegen ein Klick verworfen wird (Millisekunden)
 *
 * Aussehen der angehobenen Zeile und des Ziels: styles/android-archive.css.
 */

import { dom } from "../core/dom.js";
import { firedHoldTarget } from "./long-press.js";

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
  return Boolean(handler && row && handler.canLift(row));
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
  const { ghost, x, y, startX, startY } = lift;
  /* translate statt transform: so verschiebt das Schrumpfen über dem Ziel (scale) die Kopie nicht mit */
  ghost.style.translate = `${x - startX}px ${y - startY}px`;
  const zone = zoneAt(x, y);
  if (zone === lift.zone) return;
  lift.zone?.classList.remove("is-drop-over");
  zone?.classList.add("is-drop-over");
  ghost.classList.toggle("is-over-drop", Boolean(zone));
  lift.zone = zone;
}

/**
 * Anheben: eine Kopie der Zeile legt sich genau über sie und folgt ab jetzt
 * dem Finger. `row` ist das Element, auf dem lange gedrückt wurde.
 */
export function startLift(event, row) {
  if (lift || !canLift(row)) return;
  const source = row.closest(".swipe") || row;
  const rect = row.getBoundingClientRect();
  const deviceRect = dom.device.getBoundingClientRect();
  const ghost = row.cloneNode(true);
  ghost.classList.add("row-lift");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.left = `${rect.left - deviceRect.left}px`;
  ghost.style.top = `${rect.top - deviceRect.top}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  /* Über dem Ziel schrumpft die Kopie zum Finger hin, nicht zu ihrer Mitte */
  ghost.style.transformOrigin = `${event.clientX - rect.left}px ${event.clientY - rect.top}px`;
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
  };
  if (liftBuzzMs && navigator.vibrate) navigator.vibrate(liftBuzzMs);
  handler.start();
  lift.frame = requestAnimationFrame(frame);
}

/* Aufräumen; mit `drop` landet die Zeile im Ziel unter dem Finger. Das Ziel
   wird dafür noch einmal an der letzten Stelle gesucht: bei einem schnellen
   Zug kann das letzte Bild noch fehlen. */
function endLift(drop) {
  if (!lift) return;
  const { row, source, ghost } = lift;
  const zone = drop ? zoneAt(lift.x, lift.y) : null;
  lift.zone?.classList.remove("is-drop-over");
  cancelAnimationFrame(lift.frame);
  lift = null;
  ghost.remove();
  source.classList.remove("is-lift-source");
  document.body.classList.remove("is-row-lifting");
  /* Der Klick nach dem Loslassen gehört zum Zug, nicht zur Zeile oder zum Knopf darunter */
  blockClickUntil = Date.now() + clickBlockMs;
  if (drop && zone) handler.drop(row, zone);
  handler.end();
}

function onPointerMove(event) {
  if (!lift || event.pointerId !== lift.pointerId) return;
  lift.x = event.clientX;
  lift.y = event.clientY;
  if (!lift.frame) lift.frame = requestAnimationFrame(frame);
}

/* Solange eine Zeile angehoben ist — oder gleich angehoben werden kann, weil
   das lange Drücken schon gegriffen hat —, scrollt der Finger nicht die Seite. */
function onTouchMove(event) {
  if (lift || canLift(firedHoldTarget())) event.preventDefault();
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
