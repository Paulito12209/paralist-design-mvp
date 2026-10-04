# 2026-10-04-statistiken-nach-oben-platz

## Problem
In den Statistiken lag der runde Nach-oben-Knopf unten rechts auf der letzten
Karte („Historie“ bzw. „Mehr anzeigen“) und war dort kaum zu erkennen. In den
Einstellungen sitzt er dagegen neben der Versionszeile unter der letzten Zeile.

## Änderung
- `src/features/progress/progress.js`: Am Ende der Seite steht eine leere Fläche
  (`.modal-top-room`), auch auf den Unterseiten Meilensteine, Nutzungszeit und
  Serie. Am Desktop entfällt sie, dort gibt es den Knopf nicht und im Raster
  entstünde eine leere Zeile.
- `styles/modal-top.css`: neue Klasse `.modal-top-room`, so hoch wie der Knopf
  (`--modal-top-size`).
- `styles/android-pages-content.css`: In der Android-Fassung hat die Fläche zur
  letzten Karte denselben Abstand wie die Versionszeile in den Einstellungen
  (`--modal-top-gap`, 16 px, abzüglich der Fuge des Blatts).

## Begründung
Der Knopf bleibt an seiner Stelle wie in den Einstellungen, die Seite lässt ihm
Platz. Verworfen: eine Versionszeile in den Statistiken (gehört dort nicht hin).
Gilt für alle Mobil-Fassungen; gemessen 16 px (Android) bzw. 14 px (iOS) Abstand.

## Visualisierung
Vorher:
```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │ Historie         │ │
│ │              (^) │ │
│ └──────────────────┘ │
└──────────────────────┘
```

Nachher:
```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │ Historie         │ │
│ └──────────────────┘ │
│                  (^) │
└──────────────────────┘
```

## Hinweise
Auf einer sehr kurzen Unterseite kann die Seite durch die 42 px leicht
scrollbar werden (wie die Einstellungen mit der Versionszeile). Testen:
Statistiken ganz nach unten scrollen, Unterseiten, Zurück-Pfeil und
Browser-Zurück, lange Historie mit „Mehr anzeigen“.
