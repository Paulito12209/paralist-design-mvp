/*
 * Die Unterseite „App-Einstellungen“ hinter „App › App-Einstellungen“ im
 * Einstellungs-Blatt; am Desktop der Punkt „App“ im Untermenü des Profils.
 * Zwei Gruppen mit je einer Haken-Zeile: „Namen unter den Reitern“
 * (src/features/profile/nav-labels.js) und „Tastatur sofort öffnen“ für die
 * Suche (src/data/search-keyboard.js). Klicks kommen aus
 * src/features/profile/profile.js über onAppSettingsClick.
 * Pfad: src/features/profile/app-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * navNote    -> grauer Satz unter „Navigation“
 * searchNote -> grauer Satz unter „Suche“: was ohne Haken passiert
 * deskNote   -> Zusatz am Desktop, wo das Suchfeld die Palette öffnet
 *
 * Aussehen der Zeilen und Hinweise in styles/settings.css.
 */

import { escapeHtml, icon } from "../../core/html.js";
import { searchKeyboardOn, setSearchKeyboardOn } from "../../data/search-keyboard.js";
import { isDesk } from "../../ui/desk-mode.js";
import { navLabelsRowMarkup, toggleNavLabels } from "./nav-labels.js";

const navNote = "Gilt für die Leiste unten am Handy und Tablet.";
const searchNote =
  "Aus: Die Suche zeigt erst, was du zuletzt geöffnet hast. Die Tastatur kommt mit der Pille „Suchen“ unten.";
const deskNote = "Am Computer öffnet das Suchfeld stattdessen die Such-Palette.";

/* Die Zeile der Suche; der Haken steht, wenn die Tastatur sofort aufgeht. */
function searchKeyboardRow() {
  const on = searchKeyboardOn();
  return `
    <div class="settings-group">
      <button class="settings-row${on ? " is-active" : ""}" type="button" data-search-keyboard-toggle="1" aria-pressed="${on}">
        ${icon("keyboard")}
        <span>Tastatur sofort öffnen</span>
        ${icon("check", "settings-check")}
      </button>
    </div>
  `;
}

function note(text) {
  return `<p class="settings-note">${escapeHtml(text)}</p>`;
}

/** Die ganze Unterseite: Navigation, darunter Suche. */
export function appSettingsCard() {
  const search = isDesk() ? `${searchNote} ${deskNote}` : searchNote;
  return `
    <p class="psection">Navigation</p>
    ${navLabelsRowMarkup()}
    ${note(navNote)}
    <p class="psection">Suche</p>
    ${searchKeyboardRow()}
    ${note(search)}
  `;
}

/** Klick auf eine der beiden Zeilen erledigen. Gibt true zurück, wenn er hierher gehörte. */
export function onAppSettingsClick(event) {
  if (event.target.closest("[data-nav-labels-toggle]")) {
    toggleNavLabels();
    return true;
  }
  if (event.target.closest("[data-search-keyboard-toggle]")) {
    setSearchKeyboardOn(!searchKeyboardOn());
    return true;
  }
  return false;
}
