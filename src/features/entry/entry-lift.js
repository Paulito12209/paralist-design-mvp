/*
 * Hochklappen der Karte „Details“ auf einer Eintragsseite — wie die Karte
 * „Ansicht“ auf der Aufgaben-Seite: ein Tipp auf „Details“ oder
 * das Symbol rechts im Kopf holt die Karte über die Navigation, ein zweiter
 * Tipp legt sie zurück.
 *
 * Die Seite selbst bewegt sich dabei nicht: die Karte gleitet nur als Ebene
 * über den Text (transform). Sie hört immer unter dem Titel auf — ist er
 * weggescrollt, unter der Kopfzeile. Passt sie nicht ganz dazwischen, wird sie
 * so hoch wie der Platz und scrollt in sich.
 *
 * Zurück geht sie auch mit dem Finger: steht ihr Inhalt ganz oben, zieht ein
 * Wischen nach unten die Karte mit und legt sie ab einer Strecke zurück —
 * wie ein Blatt von unten. Steht der Inhalt weiter unten, scrollt dasselbe
 * Wischen erst den Inhalt nach oben.
 *
 * Wer die Seite scrollt, in den Text tippt oder die Pille wechselt, legt die
 * Karte wieder zurück — sie hinge sonst losgelöst über einer anderen Stelle.
 * Gemessen wird nur beim Umschalten und wenn sich der Inhalt der Karte
 * ändert, nie beim Scrollen.
 *
 * Schwebt über der Leiste ein Knopf (Plus-Knopf der Android-Fassung), endet
 * die hochgeklappte Karte über ihm — sonst läge er auf ihren letzten Zeilen.
 * Pfad: src/features/entry/entry-lift.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TITLE_GAP_PX  -> so viel Luft bleibt mindestens zwischen Titel und hochgeklappter Karte
 * SCROLL_DROP_PX -> so weit darf die Seite bei hochgeklappter Karte scrollen, bevor sie zurückgeht
 * DRAG_START_PX  -> so weit muss der Finger nach unten wandern, bevor die Karte ihm folgt
 * SNAP_PX        -> so weit muss man sie nach unten ziehen, damit sie zurückgeht (sonst springt sie wieder hoch)
 *
 * Luft zur Navigation und Geschwindigkeit teilt sich die Karte mit der
 * Aufgaben-Seite: --tasks-panel-gap und --tasks-panel-slide in
 * styles/tokens-pages.css. Aussehen in styles/entry-details.css.
 */

import { cssNumber } from "../../core/css-vars.js";
import { dom, el } from "../../core/dom.js";

const TITLE_GAP_PX = 12;
const SCROLL_DROP_PX = 4;
const DRAG_START_PX = 6;
const SNAP_PX = 60;

let card = null;
let lifted = false;
/* Scrollstand beim Hochklappen — weicht er ab, geht die Karte zurück */
let liftScroll = 0;
/* Wie weit die Karte hochgeschoben ist, in px — der Finger zieht von hier aus */
let shift = 0;
/* Beim Wischen: { x, y, atTop, dy, active } — atTop: Inhalt stand beim Aufsetzen ganz oben */
let pull = null;

/* Oberkante dessen, was unten über der Seite liegt: die Navigation — am
   Desktop ohne Navigation der untere Rand der Anzeigefläche. */
function coveredFrom() {
  const rect = dom.navShell ? dom.navShell.getBoundingClientRect() : null;
  return rect && rect.height ? rect.top : dom.content.getBoundingClientRect().bottom;
}

/* Bis hierhin darf die Karte nach unten reichen: über der Navigation und über
   dem Plus-Knopf, falls er zu sehen ist (nur in der Android-Fassung; sonst
   ist er ausgeblendet und hat keine Höhe). */
function floor() {
  const fab = dom.navShell?.querySelector(".m3-fab")?.getBoundingClientRect();
  const covered = coveredFrom();
  return fab && fab.height ? Math.min(covered, fab.top) : covered;
}

/* Höher als bis hierhin darf die Karte nicht: unter dem Titel, und nie in die Kopfzeile. */
function ceiling() {
  const head = el("entry-head").getBoundingClientRect().bottom;
  return Math.max(head, dom.entryTitle.getBoundingClientRect().bottom) + TITLE_GAP_PX;
}

/*
 * Lage und Höhe der hochgeklappten Karte setzen. Gerechnet wird mit der Lage
 * ohne Verschiebung (offsetTop im umgebenden Reiter) und der ganzen Höhe
 * (scrollHeight) — so muss nichts erst zurückgesetzt werden, nichts ruckelt,
 * und auch eine gerade laufende Bewegung zählt nicht mit.
 */
function place() {
  const top = card.offsetParent.getBoundingClientRect().top + card.offsetTop;
  const full = card.scrollHeight;
  const bottom = floor() - cssNumber("--tasks-panel-gap", 12);
  const limit = ceiling();
  const target = Math.max(limit, bottom - full);
  shift = Math.max(0, top - target);
  const room = Math.max(0, bottom - target);
  /* Zu hoch für den Platz: die Karte wird kürzer und scrollt in sich. Der
     Rand darunter gleicht die fehlende Höhe aus — die Seite wird nicht
     kürzer und springt darum nicht. */
  const cut = shift && full > room ? full - room : 0;
  card.style.maxHeight = cut ? `${room}px` : "";
  card.style.marginBottom = cut ? `${cut}px` : "";
  card.style.transform = shift ? `translateY(${-shift}px)` : "";
}

function setLifted(next) {
  lifted = next;
  card.classList.toggle("is-lifted", next);
  card.querySelector(".details-toggle").setAttribute("aria-expanded", String(next));
  if (next) {
    liftScroll = dom.content.scrollTop;
    place();
    return;
  }
  shift = 0;
  card.scrollTop = 0;
  card.style.transform = "";
  /* Höhe erst nach dem Zurückgleiten freigeben — sonst springt die Karte
     während der Bewegung auf ihre ganze Länge */
  card.addEventListener("transitionend", release);
}

/* Nur das Ende der eigenen Bewegung zählt — das Einblenden der Kennzahlen
   meldet sich über dasselbe Ereignis. */
function release(event) {
  if (event.target !== card) return;
  card.removeEventListener("transitionend", release);
  if (lifted) return;
  card.style.maxHeight = "";
  card.style.marginBottom = "";
}

function onTouchStart(event) {
  pull = lifted && event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY, atTop: card.scrollTop <= 0, dy: 0, active: false }
    : null;
}

/* Nach unten bei Inhalt ganz oben: die Karte folgt dem Finger. Alles andere
   (nach oben, seitlich, oder Inhalt nicht oben) bleibt normales Scrollen in der Karte. */
function onTouchMove(event) {
  if (!pull) return;
  const touch = event.touches[0];
  const dy = touch.clientY - pull.y;
  if (!pull.active) {
    if (!pull.atTop || dy < 0 || Math.abs(touch.clientX - pull.x) > dy) {
      pull = null;
      return;
    }
    /* Schon vor DRAG_START_PX festhalten: Safari entscheidet bei der ersten
       Bewegung, ob es selbst scrollt — danach wirkt preventDefault nicht mehr,
       und die Karte hinge halb gezogen, während darunter die Seite rollt. */
    event.preventDefault();
    if (dy < DRAG_START_PX) return;
    pull.active = true;
    card.classList.add("is-dragging");
  }
  /* Sonst scrollt der Browser zugleich die Seite oder federt die Karte */
  event.preventDefault();
  pull.dy = Math.max(0, dy);
  card.style.transform = `translateY(${pull.dy - shift}px)`;
}

function onTouchEnd() {
  const done = pull;
  pull = null;
  if (!done || !done.active) return;
  card.classList.remove("is-dragging");
  if (done.dy >= SNAP_PX) setLifted(false);
  else card.style.transform = `translateY(${-shift}px)`;
}

/** Karte hoch- bzw. zurückklappen. */
export function toggleLift() {
  if (card) setLifted(!lifted);
}

/** Karte zurücklegen, falls sie hochgeklappt ist (Seite öffnen, Pille wechseln, Schreiben). */
export function dropLift() {
  if (card && lifted) setLifted(false);
}

/** Der Inhalt der Karte hat sich geändert: hochgeklappt neu einpassen. */
export function refreshLift() {
  if (card && lifted) place();
}

/** Die Karte übernehmen und die Anlässe zum Zurücklegen anmelden. */
export function initEntryLift(detailsCard) {
  card = detailsCard;
  card.addEventListener("touchstart", onTouchStart, { passive: true });
  /* passive: false — nur so darf onTouchMove das Scrollen beim Ziehen anhalten */
  card.addEventListener("touchmove", onTouchMove, { passive: false });
  card.addEventListener("touchend", onTouchEnd);
  card.addEventListener("touchcancel", onTouchEnd);
  /* passive: der Zuhörer hält das Scrollen nie auf */
  dom.content.addEventListener(
    "scroll",
    () => {
      if (lifted && Math.abs(dom.content.scrollTop - liftScroll) > SCROLL_DROP_PX) setLifted(false);
    },
    { passive: true }
  );
  /* Wer in Titel oder Text tippt, will schreiben — nicht unter der Karte */
  el("view-entry").addEventListener("focusin", (event) => {
    if (event.target.closest(".entry-title, .nb-edit")) dropLift();
  });
}
