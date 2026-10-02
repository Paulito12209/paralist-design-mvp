/*
 * Android-Fassung: beim Scrollen nach unten gleiten Suchleiste und
 * Navigationsleiste aus dem Bild, beim Scrollen nach oben kommen sie wieder —
 * wie in Google Mail. Hier wird nur die Klasse „is-bars-hidden“ an .device
 * gesetzt; die Richtung erkennt src/shell/scroll-direction.js, wie es aussieht,
 * steht in styles/android.css, styles/android-tabs.css und styles/android-fab.css.
 *
 * Auf jeder Seite kommen die Leisten am Seitenende zurück, auch ohne
 * Hochwischen — so steht man unten nie ohne Navigation da. Das Seitenende ist
 * dafür so bemessen, dass der Inhalt über Plus-Knopf und Leiste endet
 * (styles/android.css, --m3-content-end; Eintragsseite eigens berechnet).
 *
 * Kalender: das Stundenraster rollt in sich selbst, sobald die Seite oben
 * eingerastet ist. Dessen Rollen zählt hier mit: wer im Raster nach oben
 * wischt, holt Suche und Navigation zurück — der Kopf mit Titel und Datum
 * bleibt dabei stehen. Auch im Kalender (Raster wie Liste) kommen die Leisten
 * am Ende zurück (styles/android-calendar.css).
 * Pfad: src/shell/android-bars.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * END_SLACK_PX -> so nah am Seitenende gilt die Seite als ganz gescrollt
 *
 * Wie früh die Leisten reagieren, steht in
 * src/shell/scroll-direction.js, wie schnell sie gleiten, in
 * styles/tokens-android.css (--m3-hide-time).
 */

import { events, on } from "../core/bus.js";
import { dom } from "../core/dom.js";
import { isViewActive } from "../ui/views.js";
import { isMobileOs } from "../ui/platform.js";
import { directionTracker } from "./scroll-direction.js";

const direction = directionTracker();
/* So nah am Seitenende gilt die Seite als ganz gescrollt (Rundung bei krummer Pixeldichte) */
const END_SLACK_PX = 2;

/** Ist gerade die Android-Fassung am Handy oder Tablet zu sehen? */
export function isAndroidMobile() {
  return isMobileOs("android");
}

/** Beide Leisten zurückholen — beim Seitenwechsel, Anlegen und Öffnen des Menüs. */
export function showBars() {
  dom.device.classList.remove("is-bars-hidden");
  direction.reset(scrolled());
}

/* Beim Suchen und Anlegen bleiben die Leisten stehen: dort stehen Knöpfe darin. */
function barsPinned() {
  return document.body.classList.contains("is-search") || !dom.composer.hidden;
}

/* Rollt gerade das Stundenraster des Kalenders in sich selbst? Das darf es nur
   mit der Klasse is-free (src/features/calendar/calendar.js): vorher gehört
   das Rollen der Seite. */
function gridIsFree() {
  return isViewActive("calendar") && dom.calPanel.classList.contains("is-free");
}

/* Wie weit ist man gescrollt? Rollt das Raster im Kalender in sich selbst, zählt
   es zur Seite dazu, damit Hoch und Runter über beide Bereiche ohne Sprung
   gemessen wird. Gesperrt zählt es nicht: sein Stand springt dann von selbst
   (Jetzt-Linie beim Öffnen) und würde sonst wie ein Wisch nach unten wirken. */
function scrolled() {
  const box = dom.content;
  return gridIsFree() ? box.scrollTop + dom.calPanel.scrollTop : box.scrollTop;
}

/* Ist ganz unten angekommen — auf jeder Seite; im Kalender-Raster zählt dessen eigenes Ende. */
function atPageEnd() {
  if (isViewActive("calendar") && dom.calPanel.classList.contains("is-grid")) {
    if (!gridIsFree()) return false;
    const grid = dom.calPanel;
    return grid.scrollTop + grid.clientHeight >= grid.scrollHeight - END_SLACK_PX;
  }
  const box = dom.content;
  return box.scrollTop + box.clientHeight >= box.scrollHeight - END_SLACK_PX;
}

function onScroll(event) {
  if (!isAndroidMobile() || barsPinned()) return;
  /* Springt das Raster von selbst (beim Öffnen zur Jetzt-Linie), während die
     Seite noch rollt, ist das keine Bewegung der Hand: nur den Bezugspunkt nachziehen. */
  if (event.target === dom.calPanel && !gridIsFree()) {
    direction.reset(scrolled());
    return;
  }
  const hidden = dom.device.classList.contains("is-bars-hidden");
  if (atPageEnd()) {
    if (hidden) showBars();
    return;
  }
  const turn = direction.step(scrolled(), hidden);
  if (turn === "away") dom.device.classList.add("is-bars-hidden");
  else if (turn === "back") dom.device.classList.remove("is-bars-hidden");
}

/** Den Zuhörer am Inhalt anmelden. */
export function initAndroidBars() {
  /* passive: der Zuhörer hält das Scrollen nie auf; capture: das Ereignis „scroll“
     steigt nicht auf, so hört der Inhalt auch das Raster im Kalender mit */
  dom.content.addEventListener("scroll", onScroll, { passive: true, capture: true });
  on(events.viewOpened, showBars);
  on(events.overlayOpened, showBars);
}
