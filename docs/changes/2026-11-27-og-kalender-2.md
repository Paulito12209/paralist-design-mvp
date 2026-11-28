# 2026-11-27-og-kalender-2

## Problem
Der Kalender der „OG Version“ wich noch vom iPhone-Screenshot `03-ios-kalender.png` ab: Titel eine Zeile unter Stufenring und Profilbild, Wochentage ohne Punkt, Fläche zu dunkel, Datum im leeren Zustand zu klein.

## Änderung
- `styles/og-calendar.css`: Titel in einer Zeile mit Ring und Profilbild (Zeilenhöhe 44, Kopfabstand wie Übersicht); Wochentage „MO. DI. …“ per `::after`.
- `styles/tokens-og-calendar.css`: dunkle Fläche `#21232a` (Wert aus dem Screenshot).
- `styles/og-calendar-grid.css`: Datum im leeren Zustand 20 px, Symbol 10 pt höher.

## Begründung
Alle Maße darunter lagen schon auf der Vorlage, nur die Titelzeile verschob sie um 55 px. Nur OG Version.

## Visualisierung
Vorher:
```
(1)(👤)
Kalender
November 2026 ›
```
Nachher:
```
Kalender      (1)(👤)
November 2026 ›
KW MO. DI. MI. …
```

## Hinweise
- Umschalt-Symbol links und gefülltes Kalendersymbol im leeren Zustand weichen noch leicht ab.
- Listenzeilen sitzen auf einem Band in Seitenfarbe (nicht Teil dieser Änderung).
