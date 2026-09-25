/*
 * Gedrückt halten: nach kurzer Zeit öffnet sich das Kontextmenü eines Tabs,
 * Arbeitsbereichs oder Eintrags. Der Klick danach wird unterdrückt, damit die Seite
 * nicht zusätzlich aufgeht.
 * Pfad: src/ui/long-press.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * holdDelay    -> wie lange man halten muss, bis das Menü aufgeht (Millisekunden)
 * holdSlack    -> wie weit der Finger dabei wandern darf (Pixel)
 * clickBlockMs -> wie lange der Klick nach dem Menü ignoriert wird (Millisekunden)
 */

const holdDelay = 480;
const holdSlack = 8;
const clickBlockMs = 400;

let hold = null;
let blockClick = false;
/* Wird beim Start gesetzt: { tab, workspace, entry, copy } — je Art die Funktion, die das Menü öffnet. */
let openers = {};

/** Die Menü-Öffner hinterlegen. */
export function setLongPressMenus(handlers) {
  openers = handlers;
}

/** Laufendes Halten abbrechen (z.B. weil der Finger wandert oder gewischt wird). */
export function cancelHold() {
  if (!hold) return;
  clearTimeout(hold.timer);
  hold = null;
}

/** Halten beginnen. `kind` ist "tab", "workspace", "entry" oder "copy" (Kopier-Knopf einer Eintragsseite). */
export function startHold(event, target, kind) {
  cancelHold();
  hold = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    target,
    kind,
    fired: false,
    timer: setTimeout(() => {
      if (hold) hold.fired = true;
    }, holdDelay),
  };
}

/** Prüft beim Bewegen, ob der Finger zu weit gewandert ist. */
export function trackHold(event) {
  if (!hold || event.pointerId !== hold.pointerId) return;
  const moved = Math.hypot(event.clientX - hold.startX, event.clientY - hold.startY);
  if (moved > holdSlack) cancelHold();
}

/** Halten beenden. Gibt `true` zurück, wenn dadurch ein Menü aufgegangen ist. */
export function finishHold() {
  if (!hold) return false;
  const { fired, target, kind } = hold;
  cancelHold();
  if (!fired) return false;

  blockClick = true;
  setTimeout(() => {
    blockClick = false;
  }, clickBlockMs);

  const open = openers[kind];
  if (open) open(target);
  return true;
}

/** Soll der nächste Klick übersprungen werden? Verbraucht die Sperre. */
export function consumeClickBlock() {
  if (!blockClick) return false;
  blockClick = false;
  return true;
}

/** Gibt es ein laufendes Halten? */
export function isHolding() {
  return Boolean(hold);
}
