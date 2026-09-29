/*
 * Die Werkzeuge der Eintragsseite rechts in der Kopfzeile am Desktop
 * (ab 1024px): neben der Kategorie und dem Menü ein Stern für Favorit und ein
 * Knopf für das Cover — was am Handy im Menü hinter den drei Punkten steht,
 * ist hier mit einem Klick erreichbar. Am Handy sind beide Knöpfe
 * ausgeblendet (styles/entry-desk.css).
 * Pfad: src/features/entry/entry-head.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * labels -> Tooltips und Namen für Vorlesehilfen, je nach Zustand
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { setCover, toggleFavorite } from "../../data/mutations.js";
import { findEntry } from "../../data/queries.js";
import { ui } from "../../data/state.js";

const labels = {
  favoriteOn: "Aus Favoriten entfernen",
  favoriteOff: "Zu Favoriten",
  coverOn: "Cover entfernen",
  coverOff: "Cover hinzufügen",
};

let favorite = null;
let cover = null;

function headButton(className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `head-btn entry-head-tool ${className}`;
  return button;
}

/** Stern und Cover-Knopf passend zum offenen Eintrag zeigen. */
export function renderEntryHead(entry) {
  if (!favorite) return;
  const fav = Boolean(entry.favorite);
  favorite.innerHTML = icon(fav ? "star" : "star-outline");
  favorite.classList.toggle("is-on", fav);
  favorite.setAttribute("aria-pressed", String(fav));
  favorite.setAttribute("aria-label", fav ? labels.favoriteOn : labels.favoriteOff);
  favorite.title = favorite.getAttribute("aria-label");
  const on = Boolean(entry.cover);
  cover.innerHTML = icon("image");
  cover.classList.toggle("is-on", on);
  cover.setAttribute("aria-pressed", String(on));
  cover.setAttribute("aria-label", on ? labels.coverOn : labels.coverOff);
  cover.title = cover.getAttribute("aria-label");
}

/** Die zwei Knöpfe einmal vor das Menü hängen. Beide speichern und melden die Änderung selbst. */
export function initEntryHead() {
  favorite = headButton("entry-head-fav");
  cover = headButton("entry-head-cover");
  dom.entryMenu.before(favorite, cover);
  favorite.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (entry) toggleFavorite(entry);
  });
  cover.addEventListener("click", () => {
    const entry = findEntry(ui.currentEntryId);
    if (entry) setCover(entry, !entry.cover);
  });
}
