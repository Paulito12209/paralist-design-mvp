# 2026-10-02-sortieren-google-tasks

## Problem
Auf Android hatten manche Blätter von unten einen Griff, andere nicht: die Karte
„Ansicht“ und das Details-Blatt zeigten ihn, Sortieren, Filtern und die
Auswahl-Blätter nicht. Auf Aufgaben und Projekten öffnet das Filter-Symbol
zuerst die Karte „Ansicht“ (mit Griff); das Filter-Blatt ohne Griff schob sich
davor, und je nach Höhe war der Griff dahinter zu sehen oder nicht. Außerdem
wich das Blatt „Sortieren“ (Rollen, große Überschrift, „Fertig“) vom Muster in
Google Tasks ab (kleine Überschrift „Sortieren nach“, Haken links, Tipp wählt
und schließt).

## Änderung
- `src/ui/sort-sheet.js`: auf Android öffnet `openSortSheet` jetzt die neue
  Funktion `openSortList` — ein Auswahl-Blatt im Stil von Google Tasks mit der
  Überschrift „Sortieren nach“, den Möglichkeiten mit Haken links und darunter
  „Reihenfolge“ mit den zwei Richtungen. Ein Tipp wählt und schließt. iOS und
  Desktop behalten die Rollen.
- `src/ui/sheet.js`: neue Option `leadCheck` (Haken links statt Icon, übrige
  Zeilen lassen dort Platz).
- `styles/android-bottom-sheet.css`: Stile für den Haken links; Kopfkommentar
  nennt jetzt „ohne Griff“.
- `styles/android-sheet.css`: Griff der Karte „Ansicht“ entfernt, Abstand oben
  über der Überschrift 24px.
- `styles/android-entry.css`: Griff des Details-Blatts entfernt, Abstand oben 24px.
- `styles/tokens-android.css`: `--m3-sheet-handle-zone` entfällt (wird nicht
  mehr gelesen).
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Material 3 stellt den Griff bei modalen Blättern frei (optional); Google Tasks
zeigt keinen. Ein einheitliches „ohne Griff“ entspricht dem gewünschten
Vorbild und beseitigt das Aufblitzen des Griffs der Karte hinter dem
Filter-Blatt. Weil jede Sortierung eine Richtung hat (Google Tasks nicht),
steht „Reihenfolge“ als zweiter Abschnitt im selben Blatt. Wechselt man die
Möglichkeit, gilt ihre natürliche Richtung (Namen von A, Daten vom neuesten an).
Verworfen: Richtung durch erneutes Antippen der gewählten Zeile umschalten
(nicht erkennbar), und das Blatt nach jedem Tipp offen lassen (anders als
Google Tasks). Ebenfalls verworfen: den Griff überall zeigen — nicht gewünscht.

## Visualisierung
Vorher:
```
 ╭──────────────────────────╮
 │ Sortieren                │
 │  WONACH    REIHENFOLGE   │
 │ [Fällig ][Früheste zu.]  │   Rollen
 │ [  Fertig  ]             │
```

Nachher:
```
 ╭──────────────────────────╮
 │ Sortieren nach           │
 │     Erstellt             │
 │  ✓  Fällig               │
 │     Titel                │
 │ Reihenfolge              │
 │     Früheste zuerst      │
 │  ✓  Späteste zuerst      │
```

## Hinweise
- `src/data/version.js` steht auf `main` schon bei der Grenze von 400 Zeilen
  (eine Zeile je ausgelieferter Datei). Deshalb ist die Android-Liste in
  `sort-sheet.js` und keine neue Datei: jede weitere neue Datei im Projekt lässt
  `tools/check.py` die Zeilengrenze melden, bis das Skript oder die Regel
  angepasst ist — das sollte eine eigene Sitzung klären.
- Gilt für jede Seite, die `openSortSheet` nutzt (Aufgaben, Projekte,
  Sammlungen, Suche); geprüft wurde nur Aufgaben, hell und dunkel, 375 px.
- Das Filter-Blatt liegt weiter vor der geöffneten Karte „Ansicht“; deren
  Überschrift lugt oben hervor. Offen: Karte beim Öffnen des Filters schließen?
- Die Richtung zu ändern braucht zwei Antippen (Blatt öffnen, Richtung wählen).
- Nicht geprüft: Datum-Blatt im Kalender, Schließen per Ziehen oder Schleier
  auf einem echten Handy, Zurück-Pfeil und Browser-Zurück.
