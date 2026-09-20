/*
 * Pull-to-Search: Durch Ziehen nach unten (mindestens 120px) bei oberstem
 * Scrollstand wird die Suchseite geöffnet und das Suchfeld fokussiert.
 * Pfad: src/ui/pull-search.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * pullThreshold -> Zieh-Strecke in Pixeln, ab der die Suche auslöst (120px)
 * startSlack    -> ab wie vielen Pixeln die Bewegung als Ziehen gilt
 * resistance    -> Dämpfungsfaktor beim elastischen Mitziehen des Inhalts
 * resetAnimMs   -> Dauer des Zurückfederns beim Loslassen (Millisekunden)
 *
 * HINWEIS: Touch-Events statt Pointer-Events
 * Chrome Mobile fängt bei scrollTop === 0 die Wisch-Geste als natives
 * "Pull-to-Refresh" ab, noch bevor pointermove feuert. Mit touchstart/
 * touchmove (passive: false) + preventDefault() wird das zuverlässig
 * unterdrückt. Pointer-Events dienen als Fallback für Maus auf dem Desktop.
 */

import { dom } from "../core/dom.js";
import { showSearch } from "./router.js";
import { isViewActive } from "./views.js";

const pullThreshold = 120;
const startSlack = 8;
const resistance = 0.45;
const resetAnimMs = 220;

let pull = null;
let ignoreClicksUntil = 0;

/* ───────── Bedingung: darf ein Pull starten? ───────── */

function canStartPull(target) {
  /* Suche ist bereits aktiv: kein erneuter Pull nötig */
  if (isViewActive("search")) return false;
  /* Auf Unterseiten gibt es keine Standard-Kopfzeile */
  if (document.body.classList.contains("is-subpage")) return false;
  /* Liegt ein Blatt oder Modal darüber, gehört die Geste nicht der Suche */
  if (!dom.sheet.hidden) return false;
  const activeModal = document.querySelector(".modal-backdrop:not([hidden])");
  if (activeModal) return false;

  /* Eingabefelder und horizontale Wischbereiche behalten ihre eigene Interaktion */
  if (target.closest("input, textarea, select, .tab-pills, .cal-strip, .drawing-canvas")) {
    return false;
  }

  /* Der Inhalt muss ganz oben stehen (mit kleiner Toleranz für Subpixel-Rundung) */
  return !dom.content || dom.content.scrollTop <= 1;
}

/* ───────── Visuelles Verschieben / Zurücksetzen ───────── */

function applyVisualShift(distance) {
  const capped =
    distance < pullThreshold
      ? distance * resistance
      : pullThreshold * resistance + (distance - pullThreshold) * (resistance * 0.4);

  if (dom.content) {
    dom.content.style.transform = `translateY(${capped.toFixed(1)}px)`;
  }
  document.body.classList.toggle("is-pull-search-ready", distance >= pullThreshold);
}

function resetVisual() {
  document.body.classList.remove("is-pull-search-ready");

  if (dom.content) {
    dom.content.style.transition = `transform ${resetAnimMs}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
    dom.content.style.transform = "";
    setTimeout(() => {
      if (dom.content) dom.content.style.transition = "";
    }, resetAnimMs);
  }
}

/* ───────── Touch-basierte Geste (Mobile) ───────── */

function onTouchStart(event) {
  /* Nur Single-Touch */
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];

  if (!canStartPull(touch.target)) return;

  pull = {
    id: touch.identifier,
    startX: touch.clientX,
    startY: touch.clientY,
    active: false,
    distance: 0,
    isTouch: true,
  };
}

function onTouchMove(event) {
  if (!pull || !pull.isTouch) return;
  const touch = Array.from(event.changedTouches).find((t) => t.identifier === pull.id);
  if (!touch) return;

  const dy = touch.clientY - pull.startY;
  const dx = touch.clientX - pull.startX;

  if (!pull.active) {
    if (Math.abs(dx) < startSlack && Math.abs(dy) < startSlack) return;

    /* Nur nach unten und eindeutig senkrechter als waagerechter Zug */
    if (dy <= 0 || dy <= Math.abs(dx) * 1.1) {
      pull = null;
      return;
    }

    /* Sobald schon nach oben gescrollt wurde, greift normales Scrollen */
    if (dom.content && dom.content.scrollTop > 1) {
      pull = null;
      return;
    }

    pull.active = true;
    if (dom.content) dom.content.style.transition = "none";
  }

  /* Pull aktiv – natives Scroll und Pull-to-Refresh unterdrücken */
  if (event.cancelable) event.preventDefault();

  const pullDistance = Math.max(0, dy);
  pull.distance = pullDistance;
  applyVisualShift(pullDistance);
}

function onTouchEnd(event) {
  if (!pull || !pull.isTouch) return;
  const touch = Array.from(event.changedTouches).find((t) => t.identifier === pull.id);
  if (!touch) return;

  const { active, distance } = pull;
  pull = null;
  if (!active) return;

  /* Verhindert versehentliche Klicks auf Karten nach dem Ziehen */
  ignoreClicksUntil = Date.now() + resetAnimMs + 100;

  const triggered = distance >= pullThreshold;
  resetVisual();

  if (triggered) {
    showSearch();
    setTimeout(() => {
      dom.searchInput.focus();
    }, 60);
  }
}

/* ───────── Pointer-basierte Geste (Maus / Desktop) ───────── */

function onPointerDown(event) {
  /* Auf Touch-Geräten übernimmt der Touch-Handler */
  if (event.pointerType === "touch") return;
  /* Nur mit linker Maustaste */
  if (event.button) return;
  if (!canStartPull(event.target)) return;

  pull = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    distance: 0,
    isTouch: false,
  };
}

function onPointerMove(event) {
  if (!pull || pull.isTouch || event.pointerId !== pull.pointerId) return;

  const dy = event.clientY - pull.startY;
  const dx = event.clientX - pull.startX;

  if (!pull.active) {
    if (Math.abs(dx) < startSlack && Math.abs(dy) < startSlack) return;

    if (dy <= 0 || dy <= Math.abs(dx) * 1.1) {
      pull = null;
      return;
    }

    if (dom.content && dom.content.scrollTop > 1) {
      pull = null;
      return;
    }

    pull.active = true;
    try {
      dom.content.setPointerCapture(event.pointerId);
    } catch (err) {
      /* PointerCapture wird im Browser bei Bedarf ignoriert */
    }
    if (dom.content) dom.content.style.transition = "none";
  }

  const pullDistance = Math.max(0, dy);
  pull.distance = pullDistance;
  applyVisualShift(pullDistance);

  if (event.cancelable) event.preventDefault();
}

function onPointerEnd(event) {
  if (!pull || pull.isTouch) return;
  if (event && event.pointerId !== pull.pointerId) return;

  const { active, distance } = pull;
  pull = null;
  if (!active) return;

  ignoreClicksUntil = Date.now() + resetAnimMs + 100;

  const triggered = distance >= pullThreshold;
  resetVisual();

  if (triggered) {
    showSearch();
    setTimeout(() => {
      dom.searchInput.focus();
    }, 60);
  }
}

/* ───────── Initialisierung ───────── */

/** Die Pull-to-Search-Geste initialisieren. */
export function initPullSearch() {
  if (!dom.content) return;

  /*
   * Touch-Events (Mobile): { passive: false } ist entscheidend – nur damit
   * darf preventDefault() aufgerufen werden, was das Chrome-eigene
   * Pull-to-Refresh unterdrückt.
   */
  dom.content.addEventListener("touchstart", onTouchStart, { passive: true });
  dom.content.addEventListener("touchmove", onTouchMove, { passive: false });
  dom.content.addEventListener("touchend", onTouchEnd);
  dom.content.addEventListener("touchcancel", onTouchEnd);

  /* Pointer-Events (Desktop / Maus) */
  dom.content.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerEnd);
  window.addEventListener("pointercancel", onPointerEnd);

  /* Unerwünschte Klicks unmittelbar nach dem Ziehen abfangen */
  document.addEventListener(
    "click",
    (event) => {
      if (Date.now() < ignoreClicksUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}
