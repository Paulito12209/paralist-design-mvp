/*
 * Zeilen zur Seite ziehen, damit die runden Knöpfe dahinter zum Vorschein
 * kommen. Wie weit eine Zeile aufgeht, hängt davon ab, wie viele Knöpfe sie hat.
 *
 * Vier Gesten teilen sich die Zeile; damit sie sich nicht in die Quere kommen
 * (Tab-Wechsel in src/ui/pill-swipe.js), entscheidet die Zeit, bevor sich der
 * Finger bewegt:
 * - sofort wischen          -> nächster oder voriger Tab, die Zeile bleibt stehen;
 *                              senkrecht: die Seite scrollt
 * - grabDelay halten, dann seitlich ziehen
 *                           -> die Zeile färbt sich, das Handy tickt kurz; ab dann
 *                              hängt sie am Finger und rastet beim Loslassen offen
 *                              oder zu ein (senkrecht ziehen lässt sie wieder los)
 * - holdDelay (src/ui/long-press.js) still halten
 *                           -> Android, verschiebbare Zeile: sie hebt sich sofort
 *                              an (src/ui/row-lift.js) und wandert dann mit dem
 *                              Finger senkrecht durch die Liste (src/ui/row-reorder.js)
 *                              oder auf den Archiv-Knopf; ihr Menü gibt es nur über
 *                              die drei Punkte rechts (src/ui/list-clicks.js)
 *                           -> sonst (iOS, Zeilen ohne drei Punkte): beim Loslassen
 *                              öffnet sich das Kontextmenü
 * Eine schon offene Zeile ist sofort angefasst: kurz wischen schiebt sie zu.
 * Tippt man keinen ihrer Knöpfe an, schiebt sie sich nach autoCloseMs von
 * selbst wieder zu — man soll sich nicht lange entscheiden müssen.
 * Pfad: src/ui/swipe.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --swipe-action-size, --swipe-action-gap (styles/tokens.css)
 *                -> Größe der runden Knöpfe und ihr Abstand
 * --swipe-grab-bg (styles/tokens.css) -> Farbe der angefassten Zeile
 * axisSlack      -> ab wie vielen Pixeln entschieden wird, ob waagerecht oder senkrecht gewischt wird
 * grabDelay      -> wie lange man halten muss, bis die Zeile am Finger hängt (Millisekunden);
 *                   kürzer als holdDelay in long-press.js, damit man vorher seitlich ziehen kann
 * grabSlack      -> wie weit der Finger beim Halten wackeln darf, ohne dass es als Wischen gilt
 * grabBuzzMs     -> Länge des kurzen Vibrierens beim Anfassen (0 = aus)
 * autoCloseMs    -> nach so vielen Millisekunden schiebt sich eine offene Zeile von selbst zu (0 = nie)
 */

import { cssNumber } from "../core/css-vars.js";
import { dom } from "../core/dom.js";
import { cancelHold, finishHold, isHolding, setHoldFired, startHold, trackHold } from "./long-press.js";
import { COPY_HOLD } from "./page-tools.js";
import { canLift, startLift } from "./row-lift.js";

const axisSlack = 6;
const grabDelay = 280;
const grabSlack = 8;
const grabBuzzMs = 10;
const autoCloseMs = 8000;

let drag = null;
/* Der Zeit-Schalter der gerade offenen Zeile: { body, timer } — sonst null. */
let autoClose = null;
/* Hat die laufende Berührung eine Zeile angefasst? Dann darf sie keinen Tab
   wechseln. Bleibt bis zur nächsten Berührung stehen, weil pill-swipe erst bei
   touchend fragt — und das kann nach pointerup kommen. */
let rowGesture = false;

/** Gehörte die letzte Berührung einer Zeile (halten und ziehen)? */
export function isRowGesture() {
  return rowGesture;
}

/* Die Zeile hängt ab jetzt am Finger: einfärben und kurz vibrieren. */
function grab(current) {
  if (drag !== current) return;
  current.grabbed = true;
  rowGesture = true;
  current.body.classList.add("is-grabbed");
  if (grabBuzzMs && navigator.vibrate) navigator.vibrate(grabBuzzMs);
}

/* Anfassen beenden: Farbe weg, Zeit-Schalter aus. */
function release(current) {
  clearTimeout(current.timer);
  current.body.classList.remove("is-grabbed", "is-sliding");
}

/* Das seitliche Ziehen aufgeben und die Zeile zuschieben — eine andere Geste übernimmt. */
function dropDrag() {
  if (!drag) return;
  const { body } = drag;
  release(drag);
  drag = null;
  setOffset(body, 0);
}

/* Das Halten hat gegriffen, der Finger steht still: eine Zeile, die sich
   anheben lässt (nur Android, src/ui/row-lift.js), hebt sich jetzt — ohne
   Menü. Das Halten wird dafür verworfen, sonst käme beim Loslassen doch eins. */
function liftOnHold(held) {
  if (!canLift(held.target)) return;
  cancelHold();
  dropDrag();
  rowGesture = true;
  startLift({ pointerId: held.pointerId, clientX: held.startX, clientY: held.startY }, held.target);
}

/* Wie weit die Zeile nach links und rechts aufgeht. */
function limitsOf(body) {
  const size = cssNumber("--swipe-action-size", 44);
  const gap = cssNumber("--swipe-action-gap", 10);
  const wrap = body.closest(".swipe");
  const span = (position) => {
    const count = wrap.querySelectorAll(`.swipe-actions-${position} .swipe-action`).length;
    return count ? count * size + (count + 1) * gap : 0;
  };
  return { left: span("left"), right: span("right") };
}

/* Den Zeit-Schalter der offenen Zeile ausschalten. */
function clearAutoClose() {
  if (!autoClose) return;
  clearTimeout(autoClose.timer);
  autoClose = null;
}

/* Die Zeile ist offen eingerastet: nach autoCloseMs ohne Tipp schiebt sie sich zu. */
function armAutoClose(body) {
  clearAutoClose();
  if (!autoCloseMs) return;
  autoClose = { body, timer: setTimeout(() => setOffset(body, 0), autoCloseMs) };
}

/* transform: schiebt die Zeile, ohne die Liste neu zu berechnen — nur so bleibt es flüssig */
function setOffset(body, x) {
  body.dataset.x = String(x);
  body.style.transform = `translateX(${x}px)`;
  /* Zu heißt: nichts mehr zu warten — auch wenn jemand anderes sie zuschiebt (Tipp daneben, Knopf) */
  if (x === 0 && autoClose?.body === body) clearAutoClose();
}

/** Alle offenen Zeilen wieder zuschieben (außer einer). */
export function closeSwipes(except) {
  document.querySelectorAll(".swipe-body").forEach((body) => {
    if (body !== except && Number(body.dataset.x || 0) !== 0) setOffset(body, 0);
  });
}

/** Ist diese Zeile aufgewischt? Dann öffnet ein Klick sie nicht, sondern schließt sie. */
export function isSwipedOpen(row) {
  const body = row.closest(".swipe-body");
  return Boolean(body && Number(body.dataset.x || 0) !== 0);
}

function onPointerDown(event) {
  /* Auswahlmodus der Aufgaben (data-selecting am Inhalt): ein Tipp wählt an
     oder ab — kein Wischen, kein Halte-Menü. */
  if (event.target.closest("[data-selecting]")) {
    cancelHold();
    rowGesture = false;
    if (drag) release(drag);
    drag = null;
    return;
  }
  const tabPill = event.target.closest("[data-tab-id]");
  /* Pille einer Ansicht auf der Aufgaben-Seite: halten öffnet ihr Menü (src/features/tasks/tasks-views.js) */
  const viewPill = event.target.closest("[data-task-view]");
  /* Pille einer Projekt-Ansicht (src/features/overview/project-views.js) */
  const projectPill = event.target.closest("[data-project-view]");
  const workspaceBtn = event.target.closest("[data-open-workspace]");
  /* Nur Eintrags-Zeilen, keine Kacheln oder Kalender-Termine: die haben eigene Gesten. */
  /* Ein eigenes Lesezeichen hat dasselbe Menü wie jede Eintrags-Zeile; eine Karte in einer Notiz nicht */
  const entryBtn = event.target.closest(".entry-row[data-open-entry], .bookmark-row[data-bookmark-own]");
  /* Eine Zeile im Board der Aufgaben — aber nicht ihr Haken oder Griff, die haben eigene Aufgaben. */
  const boardRow = !event.target.closest("[data-grip], [data-task-done]") && event.target.closest("[data-board-row]");
  /* Kopier-Knopf und kleiner Kopfzeilen-Titel: halten fragt „Seite“ oder „Titel“. */
  const copyBtn = event.target.closest(COPY_HOLD);
  if (copyBtn) startHold(event, copyBtn, "copy");
  else if (tabPill) startHold(event, tabPill, "tab");
  else if (viewPill) startHold(event, viewPill, "taskView");
  else if (projectPill) startHold(event, projectPill, "projectView");
  else if (workspaceBtn) startHold(event, workspaceBtn, "workspace");
  else if (entryBtn || boardRow) startHold(event, entryBtn || boardRow, "entry");

  rowGesture = false;
  if (drag) release(drag);
  drag = null;
  const body = event.target.closest(".swipe-body");
  if (!body || event.target.closest(".swipe-action")) return;
  /* Nur der Finger (bzw. die linke Maustaste) zieht Zeilen, keine zweite Berührung */
  if (!event.isPrimary || event.button > 0) return;
  const start = Number(body.dataset.x || 0);
  drag = {
    body,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    start,
    axis: null,
    grabbed: false,
    timer: 0,
    /* Wie weit die Zeile darf, einmal beim Aufsetzen gezählt — nicht bei jeder Bewegung */
    limits: limitsOf(body),
  };
  /* Offene Zeile: gleich angefasst, damit ein kurzes Wischen sie wieder zuschiebt
     (ohne Farbe und Vibrieren — sie ist ja schon sichtbar „in Arbeit“). Solange
     der Finger sie hält, läuft die Zeit nicht; beim Loslassen beginnt sie neu. */
  if (start !== 0) {
    clearAutoClose();
    drag.grabbed = true;
    rowGesture = true;
    return;
  }
  const current = drag;
  current.timer = setTimeout(() => grab(current), grabDelay);
}

function onPointerMove(event) {
  trackHold(event);
  if (!drag || event.pointerId !== drag.pointerId) return;

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;

  /* Vor dem Anfassen bewegt: das ist Wischen (Tab) oder Scrollen, nicht die Zeile */
  if (!drag.grabbed) {
    if (Math.hypot(dx, dy) > grabSlack) {
      release(drag);
      drag = null;
    }
    return;
  }

  if (!drag.axis) {
    if (Math.abs(dx) < axisSlack && Math.abs(dy) < axisSlack) return;
    drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (drag.axis === "x") {
      cancelHold();
      drag.body.classList.add("is-sliding");
      closeSwipes(drag.body);
    }
  }
  /* Angefasst, aber senkrecht gezogen: die Seite scrollt — Zeile loslassen */
  if (drag.axis === "y") {
    release(drag);
    drag = null;
    return;
  }
  if (drag.axis !== "x") return;

  const { limits } = drag;
  setOffset(drag.body, Math.max(-limits.right, Math.min(limits.left, drag.start + dx)));
}

/* Beim Loslassen rastet die Zeile ein: ab der halben Strecke bleibt sie offen. */
function endDrag() {
  if (finishHold()) {
    dropDrag();
    return;
  }

  if (!drag) return;
  const { body, limits } = drag;
  release(drag);
  drag = null;

  const x = Number(body.dataset.x || 0);
  if (limits.right && x <= -limits.right / 2) setOffset(body, -limits.right);
  else if (limits.left && x >= limits.left / 2) setOffset(body, limits.left);
  else setOffset(body, 0);
  if (Number(body.dataset.x) !== 0) armAutoClose(body);
}

/** Die Wisch-Geste aktivieren. Wird einmal beim Start aufgerufen. */
export function initSwipe() {
  const { content } = dom;
  setHoldFired(liftOnHold);
  content.addEventListener("pointerdown", onPointerDown);
  content.addEventListener("pointermove", onPointerMove);
  content.addEventListener("pointerup", endDrag);
  content.addEventListener("pointercancel", endDrag);
  /* Loslassen kann außerhalb der Liste passieren: dann hier aufräumen */
  window.addEventListener("pointerup", () => {
    if (isHolding() || drag) endDrag();
  });
  window.addEventListener("pointercancel", () => {
    if (isHolding() || drag) endDrag();
  });
}
