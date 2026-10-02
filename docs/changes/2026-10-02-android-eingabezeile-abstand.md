# 2026-10-02-android-eingabezeile-abstand

## Problem
In der Android-Fassung sitzt die Eingabezeile beim Anlegen eines neuen
Arbeitsbereichs links versetzt: Icon und Text stehen weiter links als in den
fertigen Zeilen darüber. Gemessen bei 375 px: Icon bei 16 px statt 20 px, Text
bei 48 px statt 60 px, Schrift 17 px in reinem Schwarz statt 16 px in der
Titelfarbe. Auch die Eingabezeile der Aufgabenliste wich ab (17 px, Trennlinie),
und die Projekt-Eingabezeile hatte reines Schwarz als Textfarbe.

## Änderung
- `src/ui/rows.js`: Die Eingabezeile eines Arbeitsbereichs bekommt die Klasse
  `workspace-edit` und die gleiche Icon-Fläche (`row-glyph`) wie die fertigen Zeilen.
- `styles/android-list.css`:
  - `.workspace-edit` rückt wie die übrigen Eingabezeilen ein (`--m3-tab-edge`).
  - Die Eingabefelder für Arbeitsbereich und Aufgabe (`.workspace-name-input`,
    `.task-inline-input`) haben 16 px und `--m3-on-surface`; der Vorgabetext
    steht in `--m3-on-surface-muted`.
  - Geister- und Eingabezeile der Aufgabenliste messen wie eine fertige Zeile
    (Höhe, Abstand, 16 px) und haben keine Trennlinie. Board-Zeilen bleiben außen vor.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die Eingabezeile war eine Sonderzeile, die keine der Android-Listenregeln
bekam. Statt das Icon einzeln zu verschieben, wird sie ins Raster zurückgeholt
und nutzt die vorhandenen Tokens. Neue Werte entstehen nicht. Die iOS-Fassung
bleibt gleich (Icon 18 px, Text 52 px in allen Zeilen).

## Visualisierung
Vorher:
```
 │  📁   Finanzen        ⋮  │  Icon 20, Text 60
 │ 📁  Arbeitsbereich 2     │  Icon 16, Text 48, Schrift 17, schwarz
 │  📁+  Arbeitsbereich hin…│  Icon 20, Text 60
```

Nachher:
```
 │  📁   Finanzen        ⋮  │  Icon 20, Text 60
 │  📁   Arbeitsbereich 2   │  Icon 20, Text 60, Schrift 16, Titelfarbe
 │  📁+  Arbeitsbereich hin…│  Icon 20, Text 60
```

## Hinweise
- Zu testen: Arbeitsbereich, Projekt und Aufgabe anlegen sowie einen
  Arbeitsbereich und einen Tab umbenennen (die Eingabezeile hat jetzt ein
  zusätzliches `span` um das Icon).
- Nicht angefasst: Board-Zeilen und die fertigen Aufgabenzeilen.
- `src/data/version.js` ist eine gemeinsam genutzte Datei; bei einem Konflikt
  `python3 tools/version.py` erneut laufen lassen.
