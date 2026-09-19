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

function canStartPull(event) {
  /* Suche ist bereits aktiv: kein erneuter Pull nötig */
  if (isViewActive("search")) return false;
  /* Auf Unterseiten gibt es keine Standard-Kopfzeile */
  if (document.body.classList.contains("is-subpage")) return false;
  /* Liegt ein Blatt oder Modal darüber, gehört die Geste nicht der Suche */
  if (!dom.sheet.hidden) return false;
  const activeModal = document.querySelector(".modal-backdrop:not([hidden])");
  if (activeModal) return false;

  /* Nur mit linker Maustaste oder Touch */
  if (event.button) return false;

  /* Formular- und Klick-Elemente behalten ihre eigene Interaktion */
  if (event.target.closest("button, input, textarea, select, a, .tab-pills, .cal-strip, .drawing-canvas")) {
    return false;
  }

  /* Der Inhalt muss ganz oben stehen und darf nicht weiter nach oben scrollbar sein */
  return !dom.content || dom.content.scrollTop <= 0;
}

function onPointerDown(event) {
  if (!canStartPull(event)) return;

  pull = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    distance: 0,
  };
}

function onPointerMove(event) {
  if (!pull || event.pointerId !== pull.pointerId) return;

  const dy = event.clientY - pull.startY;
  const dx = event.clientX - pull.startX;

  if (!pull.active) {
    if (Math.abs(dx) < startSlack && Math.abs(dy) < startSlack) return;

    /* Nur nach unten und eindeutig senkrechter als waagerechter Zug */
    if (dy <= 0 || dy <= Math.abs(dx) * 1.1) {
      pull = null;
      return;
    }

    /* Sobald schon nach oben gescrollt wurde, greift normales Scrollen */
    if (dom.content && dom.content.scrollTop > 0) {
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

  /* Elastischer Widerstand beim Mitziehen des Inhalts */
  const visualShift =
    pullDistance < pullThreshold
      ? pullDistance * resistance
      : pullThreshold * resistance + (pullDistance - pullThreshold) * (resistance * 0.4);

  if (dom.content) {
    dom.content.style.transform = `translateY(${visualShift.toFixed(1)}px)`;
  }

  /* Optische Rückmeldung, sobald die 120px-Schwelle erreicht ist */
  document.body.classList.toggle("is-pull-search-ready", pullDistance >= pullThreshold);

  if (event.cancelable) event.preventDefault();
}

function onPointerEnd(event) {
  if (!pull || (event && event.pointerId !== pull.pointerId)) return;

  const { active, distance } = pull;
  pull = null;

  if (!active) return;

  /* Verhindert versehentliche Klicks auf Karten nach dem Ziehen */
  ignoreClicksUntil = Date.now() + resetAnimMs + 100;
  document.body.classList.remove("is-pull-search-ready");

  const triggered = distance >= pullThreshold;

  if (dom.content) {
    dom.content.style.transition = `transform ${resetAnimMs}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
    dom.content.style.transform = "";
    setTimeout(() => {
      if (dom.content) dom.content.style.transition = "";
    }, resetAnimMs);
  }

  if (triggered) {
    showSearch();
    setTimeout(() => {
      dom.searchInput.focus();
    }, 60);
  }
}

/** Die Pull-to-Search-Geste initialisieren. */
export function initPullSearch() {
  if (!dom.content) return;

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
