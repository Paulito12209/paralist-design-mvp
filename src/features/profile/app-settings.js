/*
 * Die vier Unterseiten unter „App“ im Einstellungs-Blatt — Navigation, Suche,
 * Design, Tabs; am Desktop je ein Punkt im Untermenü des Profils.
 * - Navigation: „Namen unter den Reitern“ (src/features/profile/nav-labels.js)
 * - Suche: „Tastatur sofort öffnen“ (src/data/search-keyboard.js)
 * - Design: der Verlauf hinter Leiste und Eingabefeld und womit neue Seiten
 *   beginnen, Cover oder Icon (src/data/design-prefs.js)
 * - Tabs: je Sammlung, ob ihre Pillen oben Icons zeigen (src/data/tab-icons.js)
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
import { setTabIconsOn, tabIconAreas, tabIconsOn } from "../../data/tab-icons.js";
import { isDesk } from "../../ui/desk-mode.js";
import { navLabelsRowMarkup, toggleNavLabels } from "./nav-labels.js";

const notes = {
  nav: "Gilt für die Leiste unten am Handy und Tablet.",
  search: "Aus: Die Suche zeigt erst, was du zuletzt geöffnet hast. Die Tastatur kommt mit der Pille „Suchen“ unten.",
  searchDesk: "Am Computer öffnet das Suchfeld stattdessen die Such-Palette.",
  glow: "Heller Verlauf am unteren Rand der Hauptreiter, der Leiste und Eingabefeld vom Inhalt abhebt. Nur am Handy und Tablet.",
  head: "Gilt für neue Einträge und Arbeitsbereiche. Ändern lässt sich beides je Seite im Menü oben rechts.",
  tabs: "Mit Haken steht vor dem Namen jeder Pille oben ein kleines Icon, ohne Haken nur Text. Ein eigenes Icon gibst du einer Ansicht, indem du ihre Pille gedrückt hältst.",
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

/** Unterseite Tabs: je Sammlung eine Haken-Zeile. */
export function tabsCard(title = "") {
  const rows = tabIconAreas
    .map((area) => toggleRow(`data-tab-icons="${area.id}"`, area.icon, area.label, tabIconsOn(area.id)))
    .join("");
  /* Am Desktop steht „Tabs“ schon als Überschrift; ein zweiter Titel darunter wäre doppelt */
  return `${heading(title || "Icons in den Tabs")}${group(rows)}${note(notes.tabs)}`;
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
  const tabs = event.target.closest("[data-tab-icons]");
  if (tabs) {
    const area = tabs.dataset.tabIcons;
    setTabIconsOn(area, !tabIconsOn(area));
    /* Die Pillen der offenen Sammlung sollen sofort folgen, nicht erst beim nächsten Zeichnen */
    emit(events.dataChanged);
    return true;
  }
  const head = event.target.closest("[data-page-head]");
  if (head) {
    setPageHeadChoice(head.dataset.pageHead);
    return true;
  }
  return false;
}
