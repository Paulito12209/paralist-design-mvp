/*
 * Waagerecht wischen wechselt die Pille: nach links wischen zeigt die nächste
 * („Verknüpfte Einträge“), nach rechts die vorige („Inhalt“). Genutzt auf der
 * Seite eines Eintrags und eines Arbeitsbereichs, in der Suche, auf der
 * Übersicht für die Tabs der Arbeitsbereiche, auf Medien und Ressourcen.
 * Nach dem Wechsel — per Wischen oder Antippen (initPillTapReveal) — rollt
 * eine seitlich laufende Pillen-Leiste (.tab-pills) so,
 * dass die neue Pille ganz sichtbar ist und den Randabstand aus
 * `scroll-padding` (styles/overview.css, --content-side) zum Rand hält.
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

/* Die gewählte Pille ins Bild rollen. „nearest“ rollt nur, wenn sie ganz oder
   halb außerhalb steht, und beachtet dabei den Randabstand aus scroll-padding. */
export function revealActive(area) {
  area.querySelector(".tab-pills .is-active")
    ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

/**
 * Auch beim Antippen einer Pille die neue ins Bild rollen — ein Zuhörer für
 * alle Leisten. Erst im nächsten Bild: die Seite hat die Leiste dann schon neu
 * gezeichnet (die Ressourcen sogar erst nach dem Nachladen ihres Moduls).
 */
export function initPillTapReveal() {
  /* true: vor den Klick-Behandlungen der Seiten — die ersetzen die Pille, und
     danach fände sie ihre Ansicht nicht mehr. */
  document.addEventListener(
    "click",
    (event) => {
      if (!event.target.closest(".tab-pills :is(.tab-pill, .tab-pill-add)")) return;
      const view = event.target.closest(".view");
      if (view) requestAnimationFrame(() => revealActive(view));
    },
    true
  );
}

/* Wurde im Textfeld gerade Text markiert? Dann war das Ziehen eine Auswahl. */
function hasSelection() {
  const field = document.activeElement;
  if (field && field.tagName === "TEXTAREA") return field.selectionStart !== field.selectionEnd;
  return !document.getSelection()?.isCollapsed;
}

/**
 * Wischen auf `area` anmelden.
 * order   -> die Pillen-IDs von links nach rechts — oder eine Funktion, die sie
 *            liefert, wenn sich die Pillen ändern können (Tabs anlegen, löschen)
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
      const ids = typeof order === "function" ? order() : order;
      const next = ids.indexOf(current()) + (dx < 0 ? 1 : -1);
      if (next < 0 || next >= ids.length) return;
      select(ids[next]);
      revealActive(area);
    },
    { passive: true }
  );

  area.addEventListener("touchcancel", () => {
    start = null;
  });
}
