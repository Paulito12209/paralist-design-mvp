/*
 * Der Titel auf der Seite eines Eintrags (Notiz, Aufgabe, Projekt, …):
 * direkt antippen und umbenennen, mehrzeilig. Ohne Fokus endet ein langer
 * Titel nach --page-title-lines Zeilen mit „…“ — wie beim Arbeitsbereich.
 * Enter oder Wegtippen beendet das Umbenennen, Escape stellt den alten
 * Titel wieder her.
 * Pfad: src/features/entry/entry-title.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen steht in styles/entry.css
 * (Klasse .entry-title), die Zeilenzahl in styles/tokens.css.
 */

import { dom, el } from "../../core/dom.js";
import { findEntry } from "../../data/queries.js";
import { scheduleSave, ui } from "../../data/state.js";

/* Titel beim Öffnen, damit Escape ihn zurückholen kann */
let before = "";

/* Das Feld ist ein Textblock (contenteditable), kein input: nur so kann ein
   Titel umbrechen und nach einigen Zeilen mit „…“ enden. */
function typedTitle() {
  return dom.entryTitle.textContent.replace(/\s+/g, " ");
}

/** Den Titel eines Eintrags ins Feld schreiben. */
export function showEntryTitle(entry) {
  before = entry.title || "";
  dom.entryTitle.textContent = before;
}

/* Den kleinen Titel oben in der Kopfzeile mitziehen */
function syncHeadTitle(text) {
  const small = el("entry-head").querySelector(".head-title-main");
  if (small) small.textContent = text || "Ohne Titel";
}

/** Tippen, Enter, Escape und Wegtippen am Titel anmelden. */
export function initEntryTitle() {
  const title = dom.entryTitle;

  title.addEventListener("input", () => {
    const entry = findEntry(ui.currentEntryId);
    if (!entry) return;
    entry.title = typedTitle().trim();
    syncHeadTitle(entry.title);
    scheduleSave();
  });

  title.addEventListener("focus", () => {
    before = typedTitle().trim();
  });

  title.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      title.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      title.textContent = before;
      title.dispatchEvent(new Event("input"));
      title.blur();
    }
  });

  /* Beim Verlassen Leerzeichen aufräumen; ein ganz leeres Feld zeigt den
     grauen Platzhalter „Ohne Titel“ (:empty in styles/entry.css). */
  title.addEventListener("blur", () => {
    title.textContent = typedTitle().trim();
  });
}
