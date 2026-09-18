/*
 * Zeilen zur Seite wischen, damit die runden Knöpfe dahinter zum Vorschein
 * kommen. Wie weit eine Zeile aufgeht, hängt davon ab, wie viele Knöpfe sie hat.
 * Pfad: src/ui/swipe.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --swipe-action-size, --swipe-action-gap (styles/tokens.css)
 *                -> Größe der runden Knöpfe und ihr Abstand
 * axisSlack      -> ab wie vielen Pixeln entschieden wird, ob waagerecht oder senkrecht gewischt wird
 */

import { cssNumber } from "../core/css-vars.js";
import { dom } from "../core/dom.js";
import {
  cancelHold,
  finishHold,
  isHolding,
  startHold,
  trackHold,
} from "./long-press.js";

const axisSlack = 6;

let drag = null;

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
  const tabPill = event.target.closest("[data-tab-id]");
  const workspaceBtn = event.target.closest("[data-open-workspace]");
  if (tabPill) startHold(event, tabPill, "tab");
  else if (workspaceBtn) startHold(event, workspaceBtn, "workspace");

  const body = event.target.closest(".swipe-body");
  if (!body || event.target.closest(".swipe-action")) return;
  drag = {
    body,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    start: Number(body.dataset.x || 0),
    axis: null,
  };
}

function onPointerMove(event) {
  trackHold(event);
  if (!drag || event.pointerId !== drag.pointerId) return;

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;

  if (!drag.axis) {
    if (Math.abs(dx) < axisSlack && Math.abs(dy) < axisSlack) return;
    drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (drag.axis === "x") {
      cancelHold();
      drag.body.classList.add("is-sliding");
      closeSwipes(drag.body);
    }
  }
  if (drag.axis !== "x") return;

  const limits = limitsOf(drag.body);
  setOffset(drag.body, Math.max(-limits.right, Math.min(limits.left, drag.start + dx)));
}

/* Beim Loslassen rastet die Zeile ein: ab der halben Strecke bleibt sie offen. */
function endDrag() {
  if (finishHold()) {
    if (drag) {
      const { body } = drag;
      drag = null;
      body.classList.remove("is-sliding");
      setOffset(body, 0);
    }
    return;
  }

  if (!drag) return;
  const { body } = drag;
  drag = null;
  body.classList.remove("is-sliding");

  const limits = limitsOf(body);
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
