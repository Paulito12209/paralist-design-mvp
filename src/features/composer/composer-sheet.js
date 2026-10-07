/*
 * Android-Fassung: der Schleier hinter dem Eingabefeld, das dort als Blatt
 * von unten erscheint (styles/android-composer.css). Ein Tipp auf den
 * Schleier oder Browser-Zurück schließt das Blatt samt Entwurf — so wie
 * Google Tasks sein Blatt „Neue Aufgabe“ schließt. In den übrigen Fassungen
 * bleibt der Schleier unsichtbar; dort schließt das ✕ im Eingabefeld. Am
 * Desktop gibt es kein ✕ (styles/desk-composer.css): dort schließt Escape
 * und ein Klick daneben — dieser aber nur, solange nichts drinsteht, damit
 * ein Fehlklick keinen getippten Entwurf verwirft. Wechselt das Fenster
 * zwischen Handy- und Desktop-Breite, schließt das Eingabefeld.
 * Pfad: src/features/composer/composer-sheet.js
 *
 * Keine anpassbaren visuellen Werte: Farbe und Deckkraft des Schleiers stehen
 * in styles/android-composer.css (--m3-sheet-scrim-alpha).
 *
 * Außerdem: öffnet das Eingabefeld ein Auswahl-Blatt (Typ, Ablageort), klappt
 * die Tastatur ein, damit das Blatt Platz hat; schließt sich das Blatt
 * wieder — durch Wahl oder Tipp daneben —, kommt sie zurück.
 */

import { dom } from "../../core/dom.js";
import { isDesk, onDeskChange } from "../../ui/desk-mode.js";
import { isMobileOs } from "../../ui/platform.js";
import { registerOverlay } from "../../ui/router.js";
import { composer } from "./composer-state.js";

/* Klicks hier drin lassen das Eingabefeld am Desktop offen: es selbst, die
   Blätter und Menüs, die es öffnet, und Dialoge darüber. */
const keepOpenAreas = ".nav-shell, .sheet-backdrop, .ctx-backdrop, .modal-backdrop, .palette-backdrop, .viewer-backdrop, .update-backdrop";

let scrim = null;

/*
 * Desktop: ein Klick neben das leere Eingabefeld schließt es — wie ein
 * Tipp auf den Schleier am Handy. Steht Text darin oder hängt eine Datei
 * dran, bleibt es offen (Escape verwirft dann bewusst).
 */
function closeWhenClickedBeside(event, close) {
  if (!isDesk() || dom.composer.hidden) return;
  if (event.target instanceof Element && event.target.closest(keepOpenAreas)) return;
  if (dom.composerInput.value.trim() || composer.files.length) return;
  close();
}

/** Schleier zeigen, wenn das Eingabefeld als Blatt aufgeht (nur Android). */
export function showComposerScrim() {
  if (scrim) scrim.hidden = !isMobileOs("android");
}

/** Schleier wieder wegnehmen. */
export function hideComposerScrim() {
  if (scrim) scrim.hidden = true;
}

/**
 * Schleier einhängen.
 * @param close schließt das Eingabefeld und verwirft den Entwurf.
 */
export function initComposerSheet(close) {
  scrim = document.createElement("div");
  scrim.className = "composer-scrim";
  scrim.hidden = true;
  scrim.addEventListener("click", close);
  dom.device.append(scrim);
  /* Browser-Zurück schließt alle angemeldeten Blätter, das Eingabefeld mit */
  registerOverlay("composer", { open: () => {}, hide: close });
  document.addEventListener("pointerdown", (event) => closeWhenClickedBeside(event, close), true);
  /* Über die Grenze von 1024px gezogen: Handy und Desktop haben andere Typ-Knöpfe — der offene
     Entwurf ginge mit den alten Knöpfen nicht mehr richtig, darum schließt er. onDeskChange meldet
     auch die Grenze der rechten Spalte (1280px); dort bleibt der Entwurf offen. */
  let wasDesk = isDesk();
  onDeskChange(() => {
    if (isDesk() === wasDesk) return;
    wasDesk = isDesk();
    close();
  });
}

/**
 * Ein Auswahl-Blatt über dem Eingabefeld öffnen und die Tastatur solange
 * einklappen. Wenn das Blatt zugeht, egal wie, steht der Cursor wieder im
 * Feld — es sei denn, das Eingabefeld selbst ist inzwischen zu (etwa nach
 * „Arbeitsbereich“).
 * @param open öffnet das Blatt.
 */
export function openOverComposer(open) {
  dom.composerInput.blur();
  open();
  /* Das Blatt wird nur über sein hidden-Attribut zu — dafür gibt es kein Ereignis */
  const watcher = new MutationObserver(() => {
    if (!dom.sheet.hidden) return;
    watcher.disconnect();
    if (!dom.composer.hidden) dom.composerInput.focus();
  });
  watcher.observe(dom.sheet, { attributes: true, attributeFilter: ["hidden"] });
}
