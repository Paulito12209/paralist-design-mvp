/*
 * Die Karte „Details“ schaut beim Öffnen einer Seite mit ihrem Kopf gerade
 * über der Navigation hervor; Kennzahlen und Abschnitte erscheinen erst, wenn
 * sie beim Hochscrollen darüber auftauchen. Die Messungen dafür teilen sich
 * die Seite eines Eintrags (src/features/entry/entry-fold.js) und die eines
 * Arbeitsbereichs (src/features/overview/workspace-details.js).
 *
 * Die Bildschirmtastatur verschiebt nichts davon: gemessen wird immer gegen
 * die Lage der Navigation bei geschlossener Tastatur — die Karte bleibt beim
 * Tippen unter der Tastatur, per Scrollen erreichbar, statt mit ihr
 * hochzurutschen und die Fläche zum Schreiben zusammenzudrücken.
 * Pfad: src/ui/details-peek.js
 *
 * Keine anpassbaren visuellen Werte: Einblenden in styles/entry-details.css
 * (Klasse is-revealed).
 */

import { dom } from "../core/dom.js";
import { ui } from "../data/state.js";

/* Abstand von der Oberkante der Anzeigefläche bis zur Navigation, zuletzt
   bei geschlossener Tastatur gemessen (null: noch nie ohne Tastatur gemessen) */
let restingCover = null;

/**
 * Oberkante dessen, was unten über der Seite liegt: die Navigation. Ist sie
 * nicht zu sehen (Desktop), zählt der untere Rand der Anzeigefläche.
 * Bei offener Tastatur zählt die Lage ohne Tastatur: die Leiste steht dann
 * unsichtbar über der Tastatur (styles/navigation.css), und Android macht
 * zusätzlich die ganze Anzeigefläche kürzer — beides würde die Karte
 * hochziehen und den Text auf die Mindesthöhe stauchen.
 */
export function coveredFrom() {
  const contentTop = dom.content.getBoundingClientRect().top;
  if (ui.keyboardOpen && restingCover !== null) return contentTop + restingCover;
  const rect = dom.navShell ? dom.navShell.getBoundingClientRect() : null;
  const covered = rect && rect.height ? rect.top : dom.content.getBoundingClientRect().bottom;
  if (!ui.keyboardOpen) restingCover = covered - contentTop;
  return covered;
}

/**
 * Ein Beobachter für eine Karte: sie bekommt „is-revealed“, sobald ihre
 * Kennzahlen oberhalb dessen auftauchen, was unten über der Seite liegt, und
 * behält es, solange sie oben aus dem Bild gescrollt sind.
 * Der Rand des Beobachters zieht genau diese verdeckte Zone vom unteren Rand
 * der Anzeigefläche ab — und einen Pixel mehr: beim Öffnen beginnen die
 * Kennzahlen genau an dieser Kante, und eine bloße Berührung zählt für den
 * Beobachter schon als sichtbar. Neu angelegt wird er nur, wenn sich der
 * Rand ändert (IntersectionObserver, kein Messen beim Scrollen).
 * @returns watch(coveredTop) — nach jedem Messen aufrufen
 */
export function revealWatcher(card) {
  let observer = null;
  let margin = "";
  return (coveredTop) => {
    const covered = Math.max(0, Math.ceil(dom.content.getBoundingClientRect().bottom - coveredTop) + 1);
    const next = `0px 0px -${covered}px 0px`;
    if (observer && next === margin) return;
    if (observer) observer.disconnect();
    margin = next;
    /* Sichtbar heißt: Kennzahlen oder Abschnitte stehen im freien Bereich —
       oder die Kennzahlen sind schon oben hinausgescrollt. Beobachtet werden
       beide: ein schneller Wisch springt sonst in einem Bild an den
       Kennzahlen vorbei, der Beobachter meldet keinen Wechsel, und die Karte
       bliebe leer. */
    const seen = new Map();
    const reveal = (hits) => {
      hits.forEach((hit) => seen.set(hit.target, hit.isIntersecting || hit.boundingClientRect.top < hit.rootBounds.top));
      card.classList.toggle("is-revealed", [...seen.values()].some(Boolean));
    };
    observer = new IntersectionObserver(reveal, {
      root: dom.content,
      rootMargin: next,
    });
    card.querySelectorAll(".details-stats, .details-list").forEach((part) => observer.observe(part));
  };
}
