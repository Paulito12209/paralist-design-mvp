# 2026-10-16-android-xool-kalender-aufgaben

## Problem
Kalender und Aufgaben in „Android (Xool-DB)“ sollten äußerlich wie die Xool-App aussehen (nur Farblogik und Äußeres, keine Funktionen): Stundenraster als Karte, „KW“ links neben den Wochentagen, der Regler als Knopf über der Leiste, der bei weggeglittener Leiste zur Pille neben dem Plus wird. Gilt nur für diese Fassung.

## Änderung
- **`styles/android-xool-pages.css` (neu, in `index.html` und `docs/styles-dateien.md`):**
  - Kalender: Stundenraster auf einer Karte (`--m3-xo-card`, ab den Linien, 8px gerundet; `isolation` hält sie hinter Linien und Terminen).
  - „KW 42“ links neben den Wochentagen in zwei Zeilen (Wochenzeile 34px eingerückt).
  - Regler (Ansicht): runder Knopf 56px über der Leiste rechts; bei weggeglittener Leiste wird er zur Pille „Ansicht“ von 12px neben dem runden Plus bis zum rechten Rand.
  - Aufgaben: Werkzeugzeile und Zeilen als Karten mit 2px Fuge, die letzte unten stärker gerundet, wie die Übersicht.
- `src/data/platform-versions.js`: Zeile „Kalender und Aufgaben“.

## Begründung
Maße und Farben wie in `calendar-screen/` der Xool-App (Raster in der Kartenfarbe, KW in der Stundenspalte, Pille über der Leiste). Layout und Funktionen des MVP bleiben. Verworfen: Wochenstreifen und Datumszeile umbauen.

## Visualisierung
Vorher:
```
 Freitag, 16. Oktober >     KW 42  ⚙
 MO DI MI DO FR SA SO
 11:00 ──────────────   Raster ohne Fläche
```

Nachher:
```
 Freitag, 16. Oktober >
 KW  MO DI MI DO FR SA SO
 42
 11:00 ╭───────────────╮
 12:00 │  (Karte)      │
       ╰──────(⚙)─────╯   Regler rund über der Leiste
 ▣  ▦  ✚  ☑  ☰
 Leiste weg:  (✚) ( ⚙ Ansicht )
```

## Hinweise
- Testen: Regler öffnet weiter das Blatt „Ansicht“, Pille beim Wegscrollen und Zurückkommen, Raster hell und dunkel, KW antippen (Datums-Rolle), Aufgaben-Zeilen wischen.
- Das Verschwinden des Plus im Kalender beim Hochscrollen im Stundenraster ließ sich im Browser-Pane nicht nachstellen; das Plus bleibt dort in jedem Zustand sichtbar. Tritt es am Gerät auf, bitte mit Screenshot melden.
- Der Regler der Aufgaben bleibt in der Werkzeugzeile.
