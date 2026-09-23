/*
 * Waagerecht wischen wechselt die Pille: nach links wischen zeigt die nächste
 * („Verknüpfte Einträge“), nach rechts die vorige („Inhalt“). Genutzt auf der
 * Seite eines Eintrags und eines Arbeitsbereichs.
 * Pfad: src/ui/pill-swipe.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * SWIPE_MIN_PX -> so weit muss der Finger waagerecht wandern, bis gewechselt wird
 * AXIS_RATIO   -> um so viel weiter waagerecht als senkrecht, sonst gilt es als Scrollen
 * EDGE_PX      -> Wischen, das so nah am Bildschirmrand beginnt, bleibt der
 *                 Zurück-Geste des Systems (Android, iOS)
 */

const SWIPE_MIN_PX = 60;
const AXIS_RATIO = 1.5;
const EDGE_PX = 24;

/* Dort hat Wischen schon eine eigene Bedeutung: Zeilen aufwischen, zeichnen,
   Pillen-Leiste schieben, im Titel den Cursor setzen. */
const OWN_GESTURES = ".swipe, .draw-pad, .tab-pills, input";

/* Wurde im Textfeld gerade Text markiert? Dann war das Ziehen eine Auswahl. */
function hasSelection() {
  const field = document.activeElement;
  if (field && field.tagName === "TEXTAREA") return field.selectionStart !== field.selectionEnd;
  return !document.getSelection()?.isCollapsed;
}

/**
 * Wischen auf `area` anmelden.
 * order   -> die Pillen-IDs von links nach rechts
 * current -> liefert die gerade aktive ID
 * select  -> zeigt die gewählte ID (Pillen und Fläche neu zeichnen)
 * enabled -> optional: nur wischen, wenn die Seite gerade Pillen hat
 */
export function initPillSwipe(area, { order, current, select, enabled = () => true }) {
  let start = null;

  /* Touch-Ereignisse statt Pointer: der Browser bricht Pointer ab, sobald er
     senkrecht scrollt — touchend kommt trotzdem an. passive: Scrollen bleibt flüssig. */
  area.addEventListener(
    "touchstart",
    (event) => {
      start = null;
      if (event.touches.length !== 1 || !enabled()) return;
      const touch = event.touches[0];
      if (event.target.closest(OWN_GESTURES)) return;
      if (touch.clientX < EDGE_PX || touch.clientX > window.innerWidth - EDGE_PX) return;
      start = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true }
  );

  area.addEventListener(
    "touchend",
    (event) => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < AXIS_RATIO * Math.abs(dy)) return;
      if (hasSelection()) return;
      const next = order.indexOf(current()) + (dx < 0 ? 1 : -1);
      if (next >= 0 && next < order.length) select(order[next]);
    },
    { passive: true }
  );

  area.addEventListener("touchcancel", () => {
    start = null;
  });
}
