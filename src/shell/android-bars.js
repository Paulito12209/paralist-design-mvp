/*
 * Android-Fassung: beim Scrollen nach unten gleiten Suchleiste und
 * Navigationsleiste aus dem Bild, beim Scrollen nach oben kommen sie wieder —
 * wie in Google Mail. Hier wird nur die Richtung erkannt und die Klasse
 * „is-bars-hidden“ an .device gesetzt; wie es aussieht, steht in
 * styles/android.css, styles/android-tabs.css und styles/android-fab.css.
 * Pfad: src/shell/android-bars.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * scrollSlack -> wie viele Pixel man in eine Richtung scrollen muss, bevor die
 *                Leisten reagieren (kleiner = nervöser, größer = träger)
 * topZone     -> so nah am Seitenanfang bleiben die Leisten immer stehen
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { isDesk } from "../ui/desk-mode.js";

const scrollSlack = 12;
const topZone = 48;

/* Wo die Richtung zuletzt gewechselt hat; erst ab scrollSlack Abstand dazu zählt sie. */
let anchor = 0;

/** Ist gerade die Android-Fassung am Handy oder Tablet zu sehen? */
export function isAndroidMobile() {
  return document.documentElement.dataset.mobileOs === "android" && !isDesk();
}

/** Beide Leisten zurückholen — beim Seitenwechsel, Anlegen und Öffnen des Menüs. */
export function showBars() {
  dom.device.classList.remove("is-bars-hidden");
  anchor = dom.content.scrollTop;
}

/* Beim Suchen und Anlegen bleiben die Leisten stehen: dort stehen Knöpfe darin. */
function barsPinned() {
  return document.body.classList.contains("is-search") || !dom.composer.hidden;
}

function onScroll() {
  if (!isAndroidMobile() || barsPinned()) return;
  const y = dom.content.scrollTop;
  const hidden = dom.device.classList.contains("is-bars-hidden");
  if (y <= topZone) {
    if (hidden) showBars();
    anchor = y;
    return;
  }
  const moved = y - anchor;
  if (!hidden && moved > scrollSlack) {
    dom.device.classList.add("is-bars-hidden");
    anchor = y;
  } else if (hidden && moved < -scrollSlack) {
    showBars();
  } else if ((hidden && moved > 0) || (!hidden && moved < 0)) {
    /* In der Richtung weitergescrollt, in der die Leisten schon stehen: der
       Bezugspunkt wandert mit, damit eine kleine Gegenbewegung genügt. */
    anchor = y;
  }
}

/** Den Zuhörer am Inhalt anmelden. */
export function initAndroidBars() {
  /* passive: der Zuhörer hält das Scrollen nie auf */
  dom.content.addEventListener("scroll", onScroll, { passive: true });
  on(events.viewOpened, showBars);
  on(events.overlayOpened, showBars);
}
