/*
 * Meldet, ob das Plus einer Reiterzeile gerade am rechten Rand festgehalten
 * wird. Das Plus rastet per CSS ein (position: sticky, styles/android-tab-snap.css),
 * sobald die Reiter es sonst über den Rand hinausschieben würden; ob es dabei
 * wirklich über Reitern liegt, kann CSS nicht wissen. Dieses Skript setzt dann
 * die Klasse `is-snapped` am Plus — nur damit blendet die Ausblendung links
 * daneben ein. Gemessen wird die unsichtbare Marke hinter dem Plus
 * (src/ui/pill-add.js): steht sie rechts hinter dem Rand der Reiterleiste, ist
 * das Plus festgehalten.
 * Neu gezeichnete Zeilen entdeckt ein MutationObserver; Größenänderungen (auch
 * das Einblenden einer verborgenen Seite) ein ResizeObserver, Scrollen ein
 * Zuhörer in der Aufnahmephase (scroll steigt nicht auf).
 * Pfad: src/ui/pill-snap.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TOLERANCE_PX -> um so viel darf die Marke über den Rand ragen, bevor das Plus
 *                 als festgehalten gilt: --m3-snap-bleed (1px, so weit ragt das
 *                 festgehaltene Plus über den Rand) plus Rundung; sonst flackert
 *                 die Ausblendung am Ende der Leiste
 *
 * Aussehen der Ausblendung: styles/android-tab-snap.css.
 */

const TOLERANCE_PX = 1.5;
const SNAPPED = "is-snapped";

const watched = new WeakSet();
let queued = false;
let sizes = null;

/* Eine Zeile prüfen: Marke und Leiste messen, Klasse am Plus setzen. */
function updateRow(edge) {
  const scroller = edge.closest(".tab-pills");
  const plus = edge.previousElementSibling;
  if (!scroller || !plus) return;
  if (!watched.has(scroller)) {
    watched.add(scroller);
    sizes.observe(scroller);
  }
  /* Verborgene Seite: nichts messbar, der letzte Stand bleibt */
  if (scroller.clientWidth === 0) return;
  const stuck = edge.getBoundingClientRect().left - scroller.getBoundingClientRect().right > TOLERANCE_PX;
  plus.classList.toggle(SNAPPED, stuck);
}

function updateAll() {
  queued = false;
  document.querySelectorAll(".tab-pill-add-edge").forEach(updateRow);
}

/* Höchstens einmal je Bild messen, auch wenn Scrollen, Größe und Zeichnen zusammenfallen. */
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(updateAll);
}

/** Zuhörer anmelden; wird einmal in src/main.js aufgerufen. */
export function initPillSnap() {
  sizes = new ResizeObserver(schedule);
  document.addEventListener(
    "scroll",
    (event) => {
      if (event.target instanceof Element && event.target.classList.contains("tab-pills")) schedule();
    },
    { capture: true, passive: true }
  );
  /* Nur wenn Knoten dazukommen: Tippen in einem Namensfeld ändert Text, keine Struktur */
  new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length)) schedule();
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  schedule();
}
