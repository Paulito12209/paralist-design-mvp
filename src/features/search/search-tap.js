/*
 * Tippen oder Scrollen auf der Suchseite unterscheiden — auch bei offener
 * Tastatur. Ein echter Tipp auf eine Zeile öffnet sie sofort; die Tastatur
 * geht dabei zu. Wer dagegen scrollt, öffnet nichts: der Finger ist zu weit
 * gewandert oder die Liste hat sich unter ihm bewegt (auch ein Tipp, der nur
 * ein noch laufendes Nachrollen anhält, zählt nicht als Auswahl).
 * Ein Tipp auf eine Pille wechselt die Liste und lässt die Tastatur offen.
 * Pfad: src/features/search/search-tap.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TAP_SLOP_PX -> so weit darf der Finger beim Tippen wandern; wer weiter
 *                zieht, scrollt und öffnet nichts
 */

import { dom } from "../../core/dom.js";
import { ui } from "../../data/state.js";

const TAP_SLOP_PX = 10;

/* Zeilen, die eine Seite öffnen oder einen Suchbegriff einsetzen. */
const ROWS = "[data-open-entry], [data-open-workspace], [data-open-overview], [data-search-query]";

/* Der laufende Finger: Startpunkt und ob gewandert oder gescrollt wurde. */
let touch = null;

function onTouchStart(event) {
  if (event.touches.length !== 1) {
    touch = null;
    return;
  }
  const { clientX, clientY } = event.touches[0];
  touch = { x: clientX, y: clientY, moved: false, scrolled: false };
}

function onTouchMove(event) {
  if (!touch || touch.moved) return;
  const { clientX, clientY } = event.touches[0];
  touch.moved = Math.hypot(clientX - touch.x, clientY - touch.y) > TAP_SLOP_PX;
}

/* Jede Bewegung einer Rollfläche während des Fingers macht aus ihm ein Scrollen. */
function onAnyScroll() {
  if (touch) touch.scrolled = true;
}

/*
 * Bei `mousedown` würde der Browser (Android) einer Pille den Fokus geben —
 * das Suchfeld verlöre ihn und die Tastatur ginge zu. Pillen sollen sie aber
 * offen lassen, darum dort den Fokuswechsel verhindern.
 */
function onMouseDown(event) {
  if (ui.searchTyping && event.target.closest(".tab-pill")) event.preventDefault();
}

/*
 * Vor allen übrigen Klick-Behandlungen (Einfangphase): ein Scrollen verpufft
 * hier, ein echter Tipp auf eine Zeile schließt zuerst die Tastatur und geht
 * dann weiter an search.js und src/ui/list-clicks.js, die die Zeile öffnen.
 */
function onClickCapture(event) {
  const finger = touch;
  touch = null;
  if (finger && (finger.moved || finger.scrolled)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (ui.searchTyping && event.target.closest(ROWS)) dom.searchInput.blur();
}

/** Die Unterscheidung auf der Suchseite `view` anmelden. */
export function initSearchTap(view) {
  /* passive: nur mitlesen, das Scrollen selbst bleibt flüssig */
  view.addEventListener("touchstart", onTouchStart, { passive: true });
  view.addEventListener("touchmove", onTouchMove, { passive: true });
  /* scroll steigt nicht auf; in der Einfangphase am Fenster kommt es trotzdem an,
     egal welche Fläche rollt */
  window.addEventListener("scroll", onAnyScroll, { capture: true, passive: true });
  view.addEventListener("mousedown", onMouseDown);
  view.addEventListener("click", onClickCapture, true);
}
