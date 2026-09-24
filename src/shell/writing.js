/*
 * Schreiben auf der Seite selbst: Titel und Text eines Eintrags, Name und
 * Inhalt eines Arbeitsbereichs, Umbenennen eines Tabs oder Arbeitsbereichs.
 * Solange dort geschrieben wird, tritt die untere Leiste zurück — über der
 * Tastatur hätte die Navigation nichts zu tun (Klasse is-writing, siehe
 * styles/navigation.css). Das Eingabefeld unten und das Suchfeld oben sind
 * nicht gemeint: zu ihnen gehört die Leiste mit ihren Knöpfen.
 *
 * Die Leiste kommt erst zurück, wenn die Tastatur zu ist — sonst stünde sie
 * kurz mitten im Bild, dort, wo eben noch die Tastatur anfing. Wird die
 * Tastatur weggewischt, gibt das Feld den Cursor ab, wie das Suchfeld auch.
 * Pfad: src/shell/writing.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * KEYBOARD_CLOSE_WAIT_MS -> so lange wartet die Leiste nach dem Schreiben
 *                           höchstens darauf, dass die Tastatur zu ist
 * KEYBOARD_SETTLE_MS     -> so lange muss die Tastatur zu bleiben, bis das Feld
 *                           den Cursor abgibt; geht sie vorher wieder auf (schnell
 *                           nochmal getippt), bleibt er stehen
 */

import { events, on } from "../core/bus.js";
import { dom, isTextField } from "../core/dom.js";
import { ui } from "../data/state.js";

const KEYBOARD_CLOSE_WAIT_MS = 800;
const KEYBOARD_SETTLE_MS = 250;

let showTimer = null;
let blurTimer = null;

/* Ein Textfeld auf der Seite — nicht unten im Eingabefeld, nicht oben in der Suche. */
function isPageField(node) {
  return isTextField(node) && dom.content.contains(node);
}

function setWriting(writing) {
  clearTimeout(showTimer);
  document.body.classList.toggle("is-writing", writing);
}

/* Der Fokus hat gewechselt: bleibt er auf der Seite, geht das Schreiben weiter. */
function afterFocusChange() {
  const active = document.activeElement;
  if (isPageField(active)) {
    setWriting(true);
    return;
  }
  /* Kein Feld mehr: die Tastatur geht gerade zu, bis dahin bleibt die Leiste
     weg. Ein Feld unten oder oben braucht seine Leiste dagegen sofort. */
  if (!isTextField(active) && ui.keyboardOpen && document.body.classList.contains("is-writing")) {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => setWriting(false), KEYBOARD_CLOSE_WAIT_MS);
    return;
  }
  setWriting(false);
}

/** Fokus und Tastatur beobachten. Wird einmal beim Start aufgerufen. */
export function initWriting() {
  const body = document.body;
  document.addEventListener("focusin", afterFocusChange);
  /* blur in der Aufnahmephase statt focusout: übernimmt ein Feld beim Verlassen
     seinen Text und wird dabei neu gezeichnet (Umbenennen), käme focusout hier
     nie an. Wohin der Fokus geht, steht erst nach dem Ereignis fest. */
  document.addEventListener("blur", () => setTimeout(afterFocusChange), true);
  /* Verschwindet ein Feld ganz ohne blur (Enter beim Umbenennen zeichnet die
     Liste neu), holt spätestens der nächste Tipp die Leiste zurück. */
  document.addEventListener(
    "pointerdown",
    () => {
      if (body.classList.contains("is-writing")) afterFocusChange();
    },
    true
  );

  on(events.keyboardOpened, () => {
    clearTimeout(blurTimer);
    if (isPageField(document.activeElement)) setWriting(true);
  });

  on(events.keyboardClosed, () => {
    setWriting(false);
    if (!isPageField(document.activeElement)) return;
    /* Weggewischt statt weggetippt: der Cursor steht noch im Feld, aber es
       gibt keine Tastatur mehr dazu. */
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      if (!ui.keyboardOpen && isPageField(document.activeElement)) document.activeElement.blur();
    }, KEYBOARD_SETTLE_MS);
  });
}
