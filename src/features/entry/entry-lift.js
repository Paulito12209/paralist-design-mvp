/*
 * Hochklappen der Karte „Details“ auf einer Eintragsseite — wie die Karte
 * „Ansicht konfigurieren“ auf der Aufgaben-Seite: ein Tipp auf „Details“ oder
 * das Symbol rechts im Kopf holt die Karte über die Navigation, ein zweiter
 * Tipp legt sie zurück.
 *
 * Die Seite selbst bewegt sich dabei nicht: die Karte gleitet nur als Ebene
 * über den Text (transform). Sie hört immer unter dem Titel auf — ist er
 * weggescrollt, unter der Kopfzeile. Passt sie nicht ganz dazwischen, wird sie
 * so hoch wie der Platz und scrollt in sich.
 *
 * Wer die Seite scrollt, in den Text tippt oder die Pille wechselt, legt die
 * Karte wieder zurück — sie hinge sonst losgelöst über einer anderen Stelle.
 * Gemessen wird nur beim Umschalten und wenn sich der Inhalt der Karte
 * ändert, nie beim Scrollen.
 * Pfad: src/features/entry/entry-lift.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TITLE_GAP_PX  -> so viel Luft bleibt mindestens zwischen Titel und hochgeklappter Karte
 * SCROLL_DROP_PX -> so weit darf die Seite bei hochgeklappter Karte scrollen, bevor sie zurückgeht
 *
 * Luft zur Navigation und Geschwindigkeit teilt sich die Karte mit der
 * Aufgaben-Seite: --tasks-panel-gap und --tasks-panel-slide in
 * styles/tokens-pages.css. Aussehen in styles/entry-details.css.
 */

import { cssNumber } from "../../core/css-vars.js";
import { dom, el } from "../../core/dom.js";

const TITLE_GAP_PX = 12;
const SCROLL_DROP_PX = 4;

let card = null;
let lifted = false;
/* Scrollstand beim Hochklappen — weicht er ab, geht die Karte zurück */
let liftScroll = 0;

/* Oberkante dessen, was unten über der Seite liegt: die Navigation — am
   Desktop ohne Navigation der untere Rand der Anzeigefläche. */
function coveredFrom() {
  const rect = dom.navShell ? dom.navShell.getBoundingClientRect() : null;
  return rect && rect.height ? rect.top : dom.content.getBoundingClientRect().bottom;
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
  const bottom = coveredFrom() - cssNumber("--tasks-panel-gap", 12);
  const limit = ceiling();
  const target = Math.max(limit, bottom - full);
  const shift = Math.max(0, top - target);
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
