# 2026-10-02-kalender-leere-liste

## Problem
In der Kalender-Listenansicht (Android) war der leere Zustand unfertig:
- Der Platzhalter scrollte unter die Trennlinie der Reiter, obwohl es keinen Eintrag gab; die Seite war grundlos zu lang.
- Das Emblem war immer der Kalender, auch bei Aufgaben und Projekten; die Pille trug nur ein Plus.
- Neue Einträge öffneten das untere Eingabeblatt statt einer Zeile in der Liste.

## Änderung
- `src/features/calendar/calendar-grid.js`: neue `androidListHeight()`. Die Mindesthöhe der Liste ist genau der Platz unter dem eingerasteten Kopf. Die Seite scrollt so nur bis der Kopf eingerastet ist; ein Eintrag oder der Platzhalter rutscht nie unter die Linie der Reiter. Erst bei mehr Einträgen als Platz wächst die Liste. iOS und Desktop rechnen wie bisher.
- `src/data/config-calendar.js` (neu): die drei Spalten mit Emblem (`icon`), Satz (`hint`), Pille (`add`, `addIcon`). `config.js` reicht sie per Re-Export weiter (die Datei wäre sonst über 400 Zeilen).
- `src/features/calendar/calendar-list.js`: Platzhalter mit Symbol der Kategorie (Aufgabe, Kalender, Rakete), kurzem Satz und Pille mit `task-plus` bzw. `rocket-plus`.
- `src/features/calendar/calendar-inline.js` (neu) und `src/data/mutations-calendar.js` (neu): Tipp in die freie Fläche oder auf die Pille öffnet eine Zeile mit Cursor; Enter legt den Eintrag am gewählten Tag an und öffnet die nächste Zeile. Leere Zeilen verschwinden. Eingebunden in `calendar.js`.
- `styles/calendar-panel.css`: Platzhalter tritt zurück, solange die Zeile offen ist (`.is-adding`); Stil des Satzes.

## Begründung
Das Anlegen per Tipp folgt den Seiten Aufgaben und Projekte, damit die Geste überall gleich ist. Ein Doppeltipp wurde verworfen. Die Mindesthöhe wird aus der echten Geometrie gerechnet (Innenabstand des Scrollbereichs plus `top` der Kopfzeile), nicht aus einer festen Zahl.

## Visualisierung
Vorher:
```
Aufgaben  Termine  Projekte
─────────────────────────
   [Kalender-Icon]
   Keine Aufgaben
 ( + Aufgabe hinzufügen )
 … Seite scrollt weiter, Platzhalter unter die Linie …
```

Nachher:
```
Aufgaben  Termine  Projekte
─────────────────────────
   [Aufgaben-Icon]
   Keine Aufgaben
 Tippe auf die freie Fläche, um
 direkt eine Aufgabe zu schreiben.
 ( ✓+ Aufgabe hinzufügen )
 (Scrollweg endet, wenn der Kopf einrastet)
Tipp → ○ Neue Aufgabe|
```

## Hinweise
- Abstand Suchleiste → Datumszeile: 40 px bis zur Zeile, die Schrift sitzt etwa 8 px tiefer. Nicht geändert.
- Zentrale Dateien: `src/data/config.js` (Re-Export) und `src/data/version.js`.
- Beim Testen mit mehr Einträgen als Platz prüfen, dass die Liste über dem Plus-Knopf endet; mit ausgeblendeter Suchleiste und auf echtem Touch nicht eigens geprüft.
