/*
 * Die vier Unterseiten unter „App“ im Einstellungs-Blatt — Navigation, Suche,
 * Design, Tabs; am Desktop je ein Punkt im Untermenü des Profils.
 * - Navigation: „Namen unter den Reitern“ (src/features/profile/nav-labels.js)
 * - Suche: „Tastatur sofort öffnen“ (src/data/search-keyboard.js)
 * - Design: der Verlauf hinter Leiste und Eingabefeld, womit neue Seiten
 *   beginnen, Cover oder Icon (src/data/design-prefs.js), und je Sammlung der
 *   große Kopf mit Icon und Beschreibung (src/data/page-heads.js)
 * - Tabs: je Sammlung, ob ihre Pillen oben Icons zeigen (src/data/tab-icons.js),
 *   und ob neue Ansichten vor „Alle“ oder am Ende erscheinen (src/data/view-place.js)
 * Klicks kommen aus src/features/profile/profile.js über onAppSettingsClick.
 * Pfad: src/features/profile/app-settings.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * notes      -> die grauen Sätze unter den Gruppen
 * headRows   -> die beiden Zeilen „Neue Seiten beginnen mit“: Name und Icon
 * viewPlaceRows -> die beiden Zeilen „Neue Ansichten erscheinen“: vor „Alle“ oder am Ende
 *                   (flip: das Icon wird gespiegelt)
 *
 * Aussehen der Zeilen und Hinweise in styles/settings.css.
 */

import { emit, events } from "../../core/bus.js";
import { escapeHtml, icon } from "../../core/html.js";
import {
  emptyExplainOn,
  navGlowOn,
  pageHeadChoice,
  setEmptyExplainOn,
  setNavGlowOn,
  setPageHeadChoice,
} from "../../data/design-prefs.js";
import { headAreas, headOn, setHeadOn } from "../../data/page-heads.js";
import { searchKeyboardOn, setSearchKeyboardOn } from "../../data/search-keyboard.js";
import { setTabIconsOn, tabIconAreas, tabIconsOn } from "../../data/tab-icons.js";
import { newViewAtStart, setNewViewAtStart } from "../../data/view-place.js";
import { isDesk } from "../../ui/desk-mode.js";
import { navLabelsRowMarkup, toggleNavLabels } from "./nav-labels.js";

const notes = {
  nav: "Gilt für die Leiste unten am Handy und Tablet.",
  search: "Aus: Die Suche zeigt erst, was du zuletzt geöffnet hast. Die Tastatur kommt mit der Pille „Suchen“ unten.",
  searchDesk: "Am Computer öffnet das Suchfeld stattdessen die Such-Palette.",
  glow: "Heller Verlauf am unteren Rand der Hauptreiter, der Leiste und Eingabefeld vom Inhalt abhebt. Nur am Handy und Tablet.",
  explain: "Mit Haken zeigt eine leere Sammlung — Projekte, Arbeitsbereiche, Medien, Ressourcen, Lesezeichen, Archiv — ein Emblem und sagt in einem Satz, was hier hingehört. Ohne Haken bleiben nur Überschrift und Knopf.",
  collectionHead: "Mit Haken steht oben auf der Seite ein großes Icon mit einem Satz, was hier hingehört. Ohne Haken nur der Titel. Im Menü oben rechts der Sammlung lässt es sich auch dort umschalten. Die Aufgaben-Seite hat keinen solchen Kopf.",
  head: "Ohne Haken beginnen neue Einträge und Arbeitsbereiche nur mit dem Titel. Icon und Cover lassen sich je Seite im Menü oben rechts ein- und ausschalten.",
  tabs: "Mit Haken steht vor dem Namen jeder Pille oben ein kleines Icon, ohne Haken nur Text. Ein eigenes Icon gibst du einer Ansicht, indem du ihre Pille gedrückt hältst.",
  viewPlace: "Gilt für Projekte und Aufgaben. „Neue Ansicht“ bleibt in beiden Fällen hinter der letzten Pille. Einzelne Pillen verschiebst du, indem du sie gedrückt hältst.",
};

const viewPlaceRows = [
  /* Derselbe Pfeil wie rechts, nur gespiegelt: so lesen sich beide Zeilen als Paar */
  { id: "start", label: "Vor „Alle“", icon: "arrow-right", flip: true },
  { id: "end", label: "Am Ende, rechts", icon: "arrow-right" },
];

const headRows = [
  { id: "icon", label: "Icon", icon: "smile" },
  { id: "cover", label: "Cover", icon: "image" },
];

/* Eine Haken-Zeile; `attr` ist das data-Attribut, an dem der Klick sie erkennt. */
function toggleRow(attr, iconName, label, on, flip = false) {
  return `
      <button class="settings-row${on ? " is-active" : ""}" type="button" ${attr} aria-pressed="${on}">
        ${icon(iconName, flip ? "is-flipped" : "")}
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
  const explain = toggleRow('data-empty-explain-toggle="1"', "note", "Erklärung zeigen", emptyExplainOn());
  const chosen = pageHeadChoice();
  const heads = headRows
    .map((row) => toggleRow(`data-page-head="${row.id}"`, row.icon, row.label, row.id === chosen))
    .join("");
  const collectionHeads = headAreas
    .map((area) => toggleRow(`data-collection-head="${area.id}"`, area.icon, area.label, headOn(area.id)))
    .join("");
  return `
    ${title ? heading(title) : ""}
    ${group(glow)}${note(notes.glow)}
    ${heading("Neue Seiten beginnen mit")}
    ${group(heads)}${note(notes.head)}
    ${heading("Icon und Beschreibung in Sammlungen")}
    ${group(collectionHeads)}${note(notes.collectionHead)}
    ${heading("Leere Sammlungen")}
    ${group(explain)}${note(notes.explain)}
  `;
}

/** Unterseite Tabs: je Sammlung eine Haken-Zeile. */
export function tabsCard(title = "") {
  const rows = tabIconAreas
    .map((area) => toggleRow(`data-tab-icons="${area.id}"`, area.icon, area.label, tabIconsOn(area.id)))
    .join("");
  const atStart = newViewAtStart();
  const places = viewPlaceRows
    .map((row) => toggleRow(`data-view-place="${row.id}"`, row.icon, row.label, (row.id === "start") === atStart, row.flip))
    .join("");
  /* Am Desktop steht „Tabs“ schon als Überschrift; ein zweiter Titel darunter wäre doppelt */
  return `${heading(title || "Icons in den Tabs")}${group(rows)}${note(notes.tabs)}
    ${heading("Neue Ansichten erscheinen")}${group(places)}${note(notes.viewPlace)}`;
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
  if (event.target.closest("[data-empty-explain-toggle]")) {
    setEmptyExplainOn(!emptyExplainOn());
    /* Eine offene leere Sammlung dahinter soll sofort folgen */
    emit(events.dataChanged);
    return true;
  }
  const collection = event.target.closest("[data-collection-head]");
  if (collection) {
    const area = collection.dataset.collectionHead;
    setHeadOn(area, !headOn(area));
    /* Eine offene Sammlung dahinter soll ihren Kopf sofort zeigen oder verlieren */
    emit(events.dataChanged);
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
  const place = event.target.closest("[data-view-place]");
  if (place) {
    setNewViewAtStart(place.dataset.viewPlace === "start");
    return true;
  }
  const head = event.target.closest("[data-page-head]");
  if (head) {
    /* Zweiter Tipp auf die gewählte Zeile nimmt den Haken wieder weg */
    setPageHeadChoice(head.dataset.pageHead === pageHeadChoice() ? "" : head.dataset.pageHead);
    return true;
  }
  return false;
}
