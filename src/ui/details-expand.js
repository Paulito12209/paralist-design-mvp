/*
 * Android: das Blatt „Details“ öffnet halb und wächst beim Hochwischen.
 * Beim Öffnen endet es mitten in einer Zeile unter „Nutzung“ — so sieht man,
 * dass es weitergeht. Solange es so steht, rollt der Inhalt nicht in sich:
 * ein Wisch nach oben (oder das Mausrad nach unten) zieht das ganze Blatt
 * nach oben, bis alles zu sehen ist oder es seine Höchsthöhe erreicht
 * (--m3-sheet-max). Erst dann rollt der Inhalt unter dem Kopf; Kopf und
 * Leiste unten bleiben stehen. Passt alles hinein (große Geräte), rollt nichts.
 * Nach unten wischen schließt das Blatt wie bisher (src/ui/modal-pull.js).
 * Pfad: src/ui/details-expand.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * peekRow      -> in welcher Zeile der Abschnitte das Blatt beim Öffnen endet
 *                 (1 = zweite Zeile), angeschnitten zur Hälfte
 * startSlack   -> ab wie vielen Pixeln die Bewegung als Hochziehen gilt
 * expandPull   -> wie weit man hochziehen muss, damit es ganz aufgeht; weniger
 *                 springt zurück auf halb (Pixel)
 * snapMs       -> wie lange das Blatt nach dem Loslassen auf- bzw. zurückgleitet (ms)
 *
 * Aussehen: styles/android-details.css (Klasse is-peek am Blatt).
 */

import { isMobileOs } from "./platform.js";

const peekRow = 1;
const startSlack = 8;
const expandPull = 48;
const snapMs = 200;

let backdrop = null;
let body = null;
let peekHeight = 0;
let drag = null;
let ignoreClicksUntil = 0;

/* Steht das Blatt gerade halb offen? */
function isPeek() {
  return backdrop.classList.contains("is-peek");
}

/* Wie hoch der Inhalt höchstens werden kann: so hoch wie er ist, aber nicht
   höher, als das Blatt (--m3-sheet-max) neben Kopf und Leiste Platz lässt.
   Gemessen ohne eigene Höhe — die Grenze steht in Prozent, nicht in Pixeln. */
function fullHeight() {
  const set = body.style.maxHeight;
  body.style.maxHeight = "";
  const full = body.clientHeight;
  body.style.maxHeight = set;
  return full;
}

/* Ganz auf bzw. zurück auf halb, weich gleitend. Ganz auf heißt: keine
   eigene Höhe mehr — wird der Inhalt danach länger, wächst das Blatt mit. */
function snap(open) {
  const target = open ? fullHeight() : peekHeight;
  body.style.transition = `max-height ${snapMs}ms ease`;
  body.style.maxHeight = `${Math.round(target)}px`;
  setTimeout(() => {
    body.style.transition = "";
    if (open) {
      backdrop.classList.remove("is-peek");
      body.style.maxHeight = "";
    }
  }, snapMs);
}

/** Beim Öffnen: halb aufziehen — oder ganz, wenn ohnehin alles hineinpasst. */
export function fitDetailsPeek() {
  body.style.maxHeight = "";
  body.style.transition = "";
  backdrop.classList.remove("is-peek");
  if (!isMobileOs("android")) return;
  const row = body.querySelectorAll(".details-list .details-row")[peekRow];
  if (!row) return;
  const cut = row.getBoundingClientRect().top + row.offsetHeight / 2 - body.getBoundingClientRect().top;
  if (cut >= fullHeight()) return;
  peekHeight = Math.round(cut);
  body.style.maxHeight = `${peekHeight}px`;
  backdrop.classList.add("is-peek");
}

function onDown(event) {
  if (backdrop.hidden || event.button || !isPeek()) return;
  if (event.target === backdrop || !body.parentElement.contains(event.target)) return;
  drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false };
}

function onMove(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dy = drag.startY - event.clientY;
  const dx = event.clientX - drag.startX;
  if (!drag.active) {
    if (Math.abs(dx) < startSlack && Math.abs(dy) < startSlack) return;
    /* Nur nach oben und deutlicher senkrecht als waagerecht; nach unten gehört die Geste src/ui/modal-pull.js */
    if (dy <= 0 || Math.abs(dy) <= Math.abs(dx)) {
      drag = null;
      return;
    }
    drag.active = true;
    drag.full = fullHeight();
    body.style.transition = "none";
  }
  drag.pulled = Math.max(0, dy);
  body.style.maxHeight = `${Math.min(drag.full, peekHeight + drag.pulled)}px`;
  if (event.cancelable) event.preventDefault();
}

function onUp(event) {
  if (!drag || (event && event.pointerId !== drag.pointerId)) return;
  const { active, pulled = 0 } = drag;
  drag = null;
  if (!active) return;
  /* Sonst löst der Finger beim Loslassen über einer Zeile noch deren Tipp aus */
  ignoreClicksUntil = Date.now() + snapMs + 200;
  snap(pulled >= expandPull);
}

/* Auf Touch-Geräten bricht der Browser die Zeiger-Ereignisse sonst mit
   pointercancel ab, sobald er selbst wischen will (siehe src/ui/modal-pull.js) */
function onTouchMove(event) {
  if (drag?.active && event.cancelable) event.preventDefault();
}

/* Mausrad bzw. Touchpad: nach unten rollen öffnet das Blatt ganz */
function onWheel(event) {
  if (!isPeek() || event.deltaY <= 0) return;
  event.preventDefault();
  snap(true);
}

/**
 * Das Blatt einmal anmelden.
 * @param sheetBackdrop der Schleier des Blatts (.details-sheet)
 * @param scrollBody    der Inhalt, der in sich rollt (.modal-body)
 */
export function bindDetailsExpand(sheetBackdrop, scrollBody) {
  backdrop = sheetBackdrop;
  body = scrollBody;
  backdrop.addEventListener("pointerdown", onDown);
  backdrop.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  backdrop.addEventListener(
    "click",
    (event) => {
      if (Date.now() >= ignoreClicksUntil) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
}
