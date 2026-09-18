/*
 * Ein Blatt (Fortschritt, Profil, Profilbild, Auswahl-Blatt) nach unten ziehen,
 * um es zu schließen. Gezogen wird nur, wenn der Inhalt schon oben steht —
 * sonst scrollt man ganz normal.
 * Pfad: src/ui/modal-pull.js
 *
 * ANPASSBARE WERTE
 * -----------------------------------
 * --modal-dismiss-pull (styles/tokens.css) -> wie weit man ziehen muss, damit es schließt
 * startSlack   -> ab wie vielen Pixeln die Bewegung als Ziehen gilt
 * dimDistance  -> ab welcher Strecke der dunkle Hintergrund ganz aufgehellt ist (Pixel)
 */

import { cssNumber } from "../core/css-vars.js";
import { dom } from "../core/dom.js";

const startSlack = 8;
const dimDistance = 420;
const closeAnimationMs = 180;

let pull = null;
let ignoreClicksUntil = 0;

function panelOf(backdrop) {
  return backdrop.querySelector(".modal") || backdrop.querySelector(".sheet");
}

/** Reste einer Ziehbewegung entfernen, damit das Blatt beim nächsten Öffnen sauber steht. */
export function clearModalPull(backdrop) {
  if (!backdrop) return;
  const panel = panelOf(backdrop);
  if (panel) {
    panel.style.transform = "";
    panel.style.transition = "";
  }
  backdrop.style.removeProperty("--modal-dim");
  const body = backdrop.querySelector(".modal-body");
  if (body) body.style.overflow = "";
}

/** Ein Blatt für die Ziehgeste anmelden. */
export function bindModalPull(backdrop, closeFn) {
  backdrop.addEventListener("pointerdown", (event) => {
    if (backdrop.hidden || event.button) return;
    if (backdrop.dataset.dismissing === "1") return;
    /* Liegt das Auswahl-Blatt darüber, gehört die Geste ihm */
    if (!dom.sheet.hidden && backdrop !== dom.sheet) return;
    if (event.target.closest(".modal-close, .profile-save, .profile-avatar-edit")) return;
    if (event.target === backdrop) return;

    const body = backdrop.querySelector(".modal-body");
    const head = backdrop.querySelector(".modal-head");
    const inHead = Boolean(head && head.contains(event.target));
    const atTop = !body || body.scrollTop <= 0;
    if (!inHead && !atTop) return;

    pull = {
      backdrop,
      closeFn,
      pointerId: event.pointerId,
      startY: event.clientY,
      startX: event.clientX,
      fromHead: inHead,
      active: false,
      y: 0,
    };
  });
}

function onMove(event) {
  if (!pull || event.pointerId !== pull.pointerId) return;
  const { backdrop } = pull;
  if (backdrop.hidden) {
    pull = null;
    return;
  }
  const panel = panelOf(backdrop);
  const body = backdrop.querySelector(".modal-body");
  const dy = event.clientY - pull.startY;
  const dx = event.clientX - pull.startX;

  if (!pull.active) {
    if (Math.abs(dx) < startSlack && Math.abs(dy) < startSlack) return;
    /* Nur nach unten und deutlicher senkrecht als waagerecht */
    if (dy <= 0 || Math.abs(dy) <= Math.abs(dx)) {
      pull = null;
      return;
    }
    if (!pull.fromHead && body && body.scrollTop > 0) {
      pull = null;
      return;
    }
    pull.active = true;
    ignoreClicksUntil = Date.now() + 500;
    if (panel) panel.style.transition = "none";
    if (body) body.style.overflow = "hidden";
    try {
      backdrop.setPointerCapture(event.pointerId);
    } catch (error) {
      /* ohne Capture folgt die Bewegung nur, solange der Finger auf dem Blatt bleibt */
    }
  }

  pull.y = Math.max(0, dy);
  /* transform: verschiebt das Blatt, ohne die Seite neu zu berechnen — nur so bleibt es flüssig */
  if (panel) panel.style.transform = `translateY(${pull.y}px)`;
  backdrop.style.setProperty("--modal-dim", String(Math.max(0.15, 1 - pull.y / dimDistance)));
  if (event.cancelable) event.preventDefault();
}

function onEnd(event) {
  if (!pull || (event && event.pointerId !== pull.pointerId)) return;
  const { backdrop, closeFn, active, y } = pull;
  const panel = panelOf(backdrop);
  const body = backdrop.querySelector(".modal-body");
  if (body) body.style.overflow = "";
  pull = null;
  if (!active || backdrop.dataset.dismissing === "1") return;

  ignoreClicksUntil = Date.now() + closeAnimationMs + 220;
  const threshold = cssNumber("--modal-dismiss-pull", 100);

  if (y >= threshold) {
    backdrop.dataset.dismissing = "1";
    if (panel) {
      panel.style.transition = "transform 0.2s ease";
      panel.style.transform = `translateY(${Math.max(panel.offsetHeight, y + 80)}px)`;
    }
    setTimeout(() => {
      closeFn();
      clearModalPull(backdrop);
      delete backdrop.dataset.dismissing;
    }, closeAnimationMs);
    return;
  }

  if (panel) {
    panel.style.transition = "transform 0.2s ease";
    panel.style.transform = "";
    backdrop.style.setProperty("--modal-dim", "1");
    setTimeout(() => {
      panel.style.transition = "";
      backdrop.style.removeProperty("--modal-dim");
    }, 200);
  }
}

/** Die Geste aktivieren. Wird einmal beim Start aufgerufen. */
export function initModalPull() {
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("pointercancel", onEnd);
  /* Nach dem Ziehen kommt oft noch ein Klick: der würde sonst hinter dem Blatt etwas öffnen. */
  document.addEventListener(
    "click",
    (event) => {
      if (Date.now() >= ignoreClicksUntil) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
}
