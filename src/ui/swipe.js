/*
 * Zeilen zur Seite ziehen, damit die runden Knöpfe dahinter zum Vorschein
 * kommen. Wie weit eine Zeile aufgeht, hängt davon ab, wie viele Knöpfe sie hat.
 *
 * Damit sich das nicht mit dem Tab-Wechsel beißt (src/ui/pill-swipe.js), gilt:
 * - kurz wischen            -> nächster oder voriger Tab, die Zeile bleibt stehen
 * - gedrückt halten, ziehen -> nach grabDelay färbt sich die Zeile, das Handy
 *                              tickt kurz; ab dann hängt sie am Finger und rastet
 *                              beim Loslassen offen oder zu ein
 * - halten, loslassen       -> Kontextmenü wie bisher (src/ui/long-press.js)
 * - halten, bis das Menü greift, dann ziehen
 *                           -> die Zeile wird angehoben und lässt sich auf ein
 *                              Ziel legen (src/ui/row-lift.js), wo das angemeldet ist
 * Eine schon offene Zeile ist sofort angefasst: kurz wischen schiebt sie zu.
 * Pfad: src/ui/swipe.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --swipe-action-size, --swipe-action-gap (styles/tokens.css)
 *                -> Größe der runden Knöpfe und ihr Abstand
 * --swipe-grab-bg (styles/tokens.css) -> Farbe der angefassten Zeile
 * axisSlack      -> ab wie vielen Pixeln entschieden wird, ob waagerecht oder senkrecht gewischt wird
 * grabDelay      -> wie lange man halten muss, bis die Zeile am Finger hängt (Millisekunden);
 *                   kürzer als das Menü in long-press.js, damit man vorher ziehen kann
 * grabSlack      -> wie weit der Finger beim Halten wackeln darf, ohne dass es als Wischen gilt
 * grabBuzzMs     -> Länge des kurzen Vibrierens beim Anfassen (0 = aus)
 */

import { cssNumber } from "../core/css-vars.js";
import { dom } from "../core/dom.js";
import {
  cancelHold,
  finishHold,
  holdTurnedDrag,
  isHolding,
  startHold,
  trackHold,
} from "./long-press.js";
import { COPY_HOLD } from "./page-tools.js";
import { canLift, startLift } from "./row-lift.js";

const axisSlack = 6;
const grabDelay = 280;
const grabSlack = 8;
const grabBuzzMs = 10;

let drag = null;
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

/* transform: schiebt die Zeile, ohne die Liste neu zu berechnen — nur so bleibt es flüssig */
function setOffset(body, x) {
  body.dataset.x = String(x);
  body.style.transform = `translateX(${x}px)`;
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
     (ohne Farbe und Vibrieren — sie ist ja schon sichtbar „in Arbeit“). */
  if (start !== 0) {
    drag.grabbed = true;
    rowGesture = true;
    return;
  }
  const current = drag;
  current.timer = setTimeout(() => grab(current), grabDelay);
}

function onPointerMove(event) {
  /* Das Halten hat gegriffen und der Finger wandert los: Zeile anheben statt Menü */
  const held = holdTurnedDrag(event);
  if (held && canLift(held)) {
    cancelHold();
    if (drag) {
      const { body } = drag;
      release(drag);
      drag = null;
      setOffset(body, 0);
    }
    rowGesture = true;
    startLift(event, held);
    return;
  }
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
    if (drag) {
      const { body } = drag;
      release(drag);
      drag = null;
      setOffset(body, 0);
    }
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
}

/** Die Wisch-Geste aktivieren. Wird einmal beim Start aufgerufen. */
export function initSwipe() {
  const { content } = dom;
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
