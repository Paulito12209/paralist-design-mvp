/*
 * Tippen und Schreiben auf der Seite eines Eintrags oder Arbeitsbereichs,
 * solange unter der Pille „Inhalt“ das Textfeld steht:
 *
 * - Ein Tipp in die freie Fläche unter dem Text — bis hinunter zur
 *   Navigation — wirkt wie ein Tipp ins Textfeld: die Tastatur geht auf, der
 *   Cursor steht am Ende des Textes. Der Daumen muss nicht erst nach oben zu
 *   „Schreib etwas …“. Nur ein echter Tipp zählt: wer wischt (Pillen
 *   wechseln, src/ui/pill-swipe.js) oder scrollt, schreibt nicht.
 * - Solange geschrieben wird, schließt ein Tipp irgendwo auf der Seite — auch
 *   mitten in den Text — nur die Tastatur. Der Cursor bleibt, wo er war, und
 *   sonst passiert nichts. Nur die Kopfzeile (Zurück, Menü) wirkt sofort.
 *   Scrollen und langes Drücken (Markieren, Einfügen) bleiben, wie sie sind.
 *
 * Mit der Maus (Desktop) bleibt der Klick in den Text, wie er ist; ein Klick
 * unter den Text setzt auch dort den Cursor ans Ende.
 * Pfad: src/ui/write-tap.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TAP_SLOP_PX -> so weit darf der Finger beim Tippen wandern; wer weiter
 *                zieht, wischt oder scrollt und schreibt nicht (Wischen für die
 *                Pillen beginnt erst bei 60px, src/ui/pill-swipe.js)
 */

import { dom, el, isTextField } from "../core/dom.js";
import { ui } from "../data/state.js";
import { isViewActive } from "./views.js";

const TAP_SLOP_PX = 20;

/* Angemeldete Seiten: { view, field, isOpen } — siehe addWritePage unten. */
const pages = [];

/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Der Klick nach einem Tipp, der nur die Tastatur geschlossen hat, verpufft. */
let swallowClick = false;

function activePage() {
  return pages.find((page) => isViewActive(page.view) && page.isOpen()) || null;
}

/* Das Feld auf der offenen Seite, in dem gerade geschrieben wird, sonst null. */
function writingField(page) {
  const active = document.activeElement;
  return isTextField(active) && el(`view-${page.view}`).contains(active) ? active : null;
}

function onPointerDown(event) {
  /* Ein neuer Tipp beginnt: ein liegengebliebenes Verpuffen gilt nicht mehr. */
  swallowClick = false;
  down = {
    x: event.clientX,
    y: event.clientY,
    touch: event.pointerType === "touch",
    keyboard: ui.keyboardOpen,
    focused: document.activeElement,
  };
}

/*
 * Schon bei `mousedown` eingreifen: dort setzt der Browser den Cursor und
 * verschiebt den Fokus. preventDefault verhindert beides — das Feld behält
 * seine Cursor-Stelle, und blur schließt die Tastatur. Nach einem Wischen
 * oder Scrollen schickt der Browser kein mousedown, das bleibt also frei.
 */
function onMouseDown(event) {
  const page = activePage();
  const field = page && writingField(page);
  if (!field || !(ui.keyboardOpen || down?.touch)) return;
  /* Zurück-Pfeil und Menü sind ausdrückliche Knöpfe: sie wirken sofort, das
     Feld verliert den Fokus dabei von selbst. */
  if (event.target.closest(".page-head")) return;
  event.preventDefault();
  swallowClick = true;
  field.blur();
}

function onClickCapture(event) {
  if (!swallowClick) return;
  swallowClick = false;
  event.preventDefault();
  event.stopPropagation();
}

/* Tipp auf die freie Fläche unter dem Text: dort weiterschreiben, wo er endet. */
function onClick(event) {
  const page = activePage();
  const field = page && page.field();
  const start = down;
  down = null;
  if (!field || !start) return;
  /* Nur die Fläche um das Feld herum zählt — nicht Pillen, Titel oder Kopfzeile. */
  if (event.target === field || !event.target.contains(field)) return;
  if (event.clientY <= field.getBoundingClientRect().bottom) return;
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  /* War die Tastatur offen oder stand der Cursor in einem anderen Feld, hat
     dieser Tipp nur das beendet. */
  if (start.keyboard || (isTextField(start.focused) && start.focused !== field)) return;
  /* preventScroll: nicht erst zum Anfang des Textes springen; die Tastatur
     holt das Textende von selbst in den Blick. */
  field.focus({ preventScroll: true });
  const end = field.value.length;
  field.setSelectionRange(end, end);
}

/**
 * Eine Seite anmelden.
 * view   -> Name der Ansicht (src/ui/views.js), z.B. "entry"
 * field  -> liefert das Textfeld unter „Inhalt“, oder null, wenn gerade keines
 *           zu sehen ist (andere Pille, Zeichnung)
 * isOpen -> optional: zeigt die Ansicht gerade wirklich diese Seite? „page“
 *           zeigt auch Sammlungen wie die Favoriten — dort gilt das hier nicht
 */
export function addWritePage({ view, field, isOpen = () => true }) {
  if (!pages.length) {
    const { content } = dom;
    /* Aufnahmephase: vor list-clicks.js und den Pillen, damit ein Tipp, der
       nur die Tastatur schließt, dort gar nicht erst ankommt. */
    content.addEventListener("pointerdown", onPointerDown, true);
    content.addEventListener("mousedown", onMouseDown, true);
    content.addEventListener("click", onClickCapture, true);
    content.addEventListener("click", onClick);
  }
  pages.push({ view, field, isOpen });
}
