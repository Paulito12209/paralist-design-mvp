/*
 * Die drei Unterseiten unter „App“ im Einstellungs-Blatt — Navigation, Suche,
 * Design; am Desktop je ein Punkt im Untermenü des Profils.
 * - Navigation: „Namen unter den Reitern“ (src/features/profile/nav-labels.js)
 * - Suche: „Tastatur sofort öffnen“ (src/data/search-keyboard.js)
 * - Design: der Verlauf hinter Leiste und Eingabefeld und womit neue Seiten
 *   beginnen, Cover oder Icon (src/data/design-prefs.js)
 * Klicks kommen aus src/features/profile/profile.js über onAppSettingsClick.
 * Pfad: src/features/profile/app-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * notes      -> die grauen Sätze unter den Gruppen
 * headRows   -> die beiden Zeilen „Neue Seiten beginnen mit“: Name und Icon
 *
 * Aussehen der Zeilen und Hinweise in styles/settings.css.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import { navGlowOn, pageHeadChoice, setNavGlowOn, setPageHeadChoice } from "../../data/design-prefs.js";
import { searchKeyboardOn, setSearchKeyboardOn } from "../../data/search-keyboard.js";
import { isDesk } from "../../ui/desk-mode.js";
import { navLabelsRowMarkup, toggleNavLabels } from "./nav-labels.js";

const notes = {
  nav: "Gilt für die Leiste unten am Handy und Tablet.",
  search: "Aus: Die Suche zeigt erst, was du zuletzt geöffnet hast. Die Tastatur kommt mit der Pille „Suchen“ unten.",
  searchDesk: "Am Computer öffnet das Suchfeld stattdessen die Such-Palette.",
  glow: "Heller Verlauf am unteren Rand der Hauptreiter, der Leiste und Eingabefeld vom Inhalt abhebt. Nur am Handy und Tablet.",
  head: "Gilt für neue Einträge und Arbeitsbereiche. Ändern lässt sich beides je Seite im Menü oben rechts.",
};

const headRows = [
  { id: "icon", label: "Icon", icon: "smile" },
  { id: "cover", label: "Cover", icon: "image" },
];

/* Eine Haken-Zeile; `attr` ist das data-Attribut, an dem der Klick sie erkennt. */
function toggleRow(attr, iconName, label, on) {
  return `
      <button class="settings-row${on ? " is-active" : ""}" type="button" ${attr} aria-pressed="${on}">
        ${icon(iconName)}
        <span>${escapeHtml(label)}</span>
        ${icon("check", "settings-check")}
      </button>`;
}

const group = (rows) => `<div class="settings-group">${rows}</div>`;
const note = (text) => `<p class="settings-note">${escapeHtml(text)}</p>`;
const heading = (text) => `<p class="psection">${escapeHtml(text)}</p>`;

/** Unterseite Navigation. `title` setzt am Desktop die Überschrift darüber. */
export function navigationCard(title = "") {
  return `${title ? heading(title) : ""}${navLabelsRowMarkup()}${note(notes.nav)}`;
}

/** Unterseite Suche. */
export function searchCard(title = "") {
  const row = toggleRow('data-search-keyboard-toggle="1"', "keyboard", "Tastatur sofort öffnen", searchKeyboardOn());
  const text = isDesk() ? `${notes.search} ${notes.searchDesk}` : notes.search;
  return `${title ? heading(title) : ""}${group(row)}${note(text)}`;
}

/** Unterseite Design: zuerst der Verlauf, darunter der Kopf neuer Seiten. */
export function designCard(title = "") {
  const glow = toggleRow('data-nav-glow-toggle="1"', "sidebar", "Verlauf hinter der Leiste", navGlowOn());
  const chosen = pageHeadChoice();
  const heads = headRows
    .map((row) => toggleRow(`data-page-head="${row.id}"`, row.icon, row.label, row.id === chosen))
    .join("");
  return `
    ${title ? heading(title) : ""}
    ${group(glow)}${note(notes.glow)}
    ${heading("Neue Seiten beginnen mit")}
    ${group(heads)}${note(notes.head)}
  `;
}

/** Klick auf eine der Zeilen erledigen. Gibt true zurück, wenn er hierher gehörte. */
export function onAppSettingsClick(event) {
  if (event.target.closest("[data-nav-labels-toggle]")) {
    toggleNavLabels();
    return true;
  }
  if (event.target.closest("[data-search-keyboard-toggle]")) {
    setSearchKeyboardOn(!searchKeyboardOn());
    return true;
  }
  if (event.target.closest("[data-nav-glow-toggle]")) {
    const next = !navGlowOn();
    setNavGlowOn(next);
    emit(events.navGlowChanged, next);
    return true;
  }
  const head = event.target.closest("[data-page-head]");
  if (head) {
    setPageHeadChoice(head.dataset.pageHead);
    return true;
  }
  return false;
}
