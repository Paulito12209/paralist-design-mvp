/*
 * Die drei Spalten der Kalenderliste (Aufgaben, Termine, Projekte) und was der
 * leere Tag in jeder zeigt. config.js reicht sie weiter, Importe bleiben gleich.
 * Pfad: src/data/config-calendar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * calendarSegments[*].label   -> Name des Reiters
 * calendarSegments[*].empty   -> Überschrift des leeren Tages
 * calendarSegments[*].hint    -> kurzer Satz darunter, nennt den schnellsten Weg (Tippen)
 * calendarSegments[*].icon    -> Emblem des leeren Tages: das Symbol der Kategorie
 * calendarSegments[*].add     -> Beschriftung der Pille
 * calendarSegments[*].addIcon -> Symbol links in der Pille
 * calendarSegments[*].pick    -> welchen Typ das Eingabefeld vorwählt
 */

/**
 * Die drei Spalten der Kalenderliste. `pick` sagt, welchen Typ das Eingabefeld
 * vorwählt, wenn man am leeren Tag auf die Pille zum Anlegen tippt. `icon` ist
 * das Emblem des leeren Tages (das Symbol der Kategorie), `addIcon` das Symbol
 * der Pille, `hint` der kurze Satz darunter — er nennt den schnellsten Weg.
 */
export const calendarSegments = [
  {
    id: "aufgaben",
    label: "Aufgaben",
    empty: "Keine Aufgaben",
    hint: "Tippe auf die freie Fläche, um direkt eine Aufgabe zu schreiben.",
    icon: "task",
    pick: "aufgabe",
    add: "Aufgabe hinzufügen",
    addIcon: "task-plus",
  },
  {
    id: "termine",
    label: "Termine",
    empty: "Nichts geplant",
    hint: "Tippe auf die freie Fläche, um direkt einen Termin zu schreiben.",
    icon: "calendar",
    pick: "termin",
    add: "Termin eintragen",
    addIcon: "plus",
  },
  {
    id: "projekte",
    label: "Projekte",
    empty: "Keine Projekte",
    hint: "Tippe auf die freie Fläche, um direkt ein Projekt zu schreiben.",
    icon: "rocket",
    pick: "projekt",
    add: "Projekt anlegen",
    addIcon: "rocket-plus",
  },
];
