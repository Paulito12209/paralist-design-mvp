/*
 * Android-Fassung: beim Scrollen nach unten gleiten Suchleiste und
 * Navigationsleiste aus dem Bild, beim Scrollen nach oben kommen sie wieder —
 * wie in Google Mail. Hier wird nur die Klasse „is-bars-hidden“ an .device
 * gesetzt; die Richtung erkennt src/shell/scroll-direction.js, wie es aussieht,
 * steht in styles/android.css, styles/android-tabs.css und styles/android-fab.css.
 * Pfad: src/shell/android-bars.js
 *
 * Keine anpassbaren visuellen Werte: wie früh die Leisten reagieren, steht in
 * src/shell/scroll-direction.js, wie schnell sie gleiten, in
 * styles/tokens-android.css (--m3-hide-time).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { isMobileOs } from "./platform.js";
import { directionTracker } from "./scroll-direction.js";

const direction = directionTracker();

/** Ist gerade die Android-Fassung am Handy oder Tablet zu sehen? */
export function isAndroidMobile() {
  return isMobileOs("android");
}

/** Beide Leisten zurückholen — beim Seitenwechsel, Anlegen und Öffnen des Menüs. */
export function showBars() {
  dom.device.classList.remove("is-bars-hidden");
  direction.reset(dom.content.scrollTop);
}

/* Beim Suchen und Anlegen bleiben die Leisten stehen: dort stehen Knöpfe darin. */
function barsPinned() {
  return document.body.classList.contains("is-search") || !dom.composer.hidden;
}

function onScroll() {
  if (!isAndroidMobile() || barsPinned()) return;
  const hidden = dom.device.classList.contains("is-bars-hidden");
  const turn = direction.step(dom.content.scrollTop, hidden);
  if (turn === "away") dom.device.classList.add("is-bars-hidden");
  else if (turn === "back") dom.device.classList.remove("is-bars-hidden");
}

/** Den Zuhörer am Inhalt anmelden. */
export function initAndroidBars() {
  /* passive: der Zuhörer hält das Scrollen nie auf */
  dom.content.addEventListener("scroll", onScroll, { passive: true });
  on(events.viewOpened, showBars);
  on(events.overlayOpened, showBars);
}
