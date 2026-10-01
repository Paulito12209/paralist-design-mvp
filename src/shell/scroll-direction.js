/*
 * Erkennt, ob man auf der Seite gerade nach unten oder nach oben scrollt —
 * mit etwas Spiel, damit Leisten nicht bei jedem Zittern des Fingers zucken.
 * Genutzt von der Android-Fassung (Leisten gleiten weg, src/shell/android-bars.js)
 * und der iOS-Fassung (Tab-Leiste schrumpft, src/shell/ios-bars.js).
 * Pfad: src/shell/scroll-direction.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * scrollSlack -> wie viele Pixel man in eine Richtung scrollen muss, bevor die
 *                Richtung zählt (kleiner = nervöser, größer = träger)
 * topZone     -> so nah am Seitenanfang gilt immer „oben“
 */

const scrollSlack = 12;
const topZone = 48;

/**
 * Einen Richtungsmesser anlegen. `step(y, away)` bekommt die Scrollhöhe und
 * ob die Leisten gerade weg sind, und gibt "away", "back" oder null zurück.
 */
export function directionTracker() {
  /* Wo die Richtung zuletzt gewechselt hat; erst ab scrollSlack Abstand dazu zählt sie. */
  let anchor = 0;
  return {
    reset(y) {
      anchor = y;
    },
    step(y, away) {
      if (y <= topZone) {
        anchor = y;
        return away ? "back" : null;
      }
      const moved = y - anchor;
      if (!away && moved > scrollSlack) {
        anchor = y;
        return "away";
      }
      if (away && moved < -scrollSlack) {
        anchor = y;
        return "back";
      }
      /* In der Richtung weitergescrollt, in der die Leisten schon stehen: der
         Bezugspunkt wandert mit, damit eine kleine Gegenbewegung genügt. */
      if ((away && moved > 0) || (!away && moved < 0)) anchor = y;
      return null;
    },
  };
}
