# 2026-10-02-kalender-unten-leisten

## Problem
Zwei Fehler im Kalender der Android-Fassung (Handy):
1. Unter dem letzten Stundenfeld (23:00) war ganz unten gescrollt eine große
   leere Fläche, etwa 150 px zu viel. Gewünscht ist weiterhin: der letzte
   Eintrag hat 16 px Abstand zum „Neu“-Knopf.
2. Wer im Stundenraster nach oben wischte, bekam Suchleiste und
   Navigationsleiste oft nicht zurück. Gewünscht: nur diese beiden Leisten
   kommen zurück, nicht der Kopf mit Titel und Datum.

## Änderung
- `styles/android-calendar.css` (neu): Raster und Liste enden ganz gescrollt
  genau `--m3-fab-gap` (16 px) über dem Plus-Knopf. Die drei sich
  stapelnden Reserven am Seitenende werden zu einer. Der 8-px-Innenabstand
  unter 23:00 entfällt.
- `src/shell/android-bars.js`: hört das Rollen des Rasters mit (`capture`),
  zählt dessen Strecke zur Seite dazu, sobald es frei rollt (`is-free`), und
  holt die Leisten am Ende von Raster und Liste zurück, wie auf der Eintragsseite.
- `index.html`: neue CSS-Datei eingebunden. (zentrale Datei)
- `styles/tokens.css`: Stil-Liste um `-calendar` ergänzt. (zentrale Datei)
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Das Raster rollt in sich selbst, und das Ereignis `scroll` steigt nicht
nach oben: die Leisten-Logik hörte nur die Seite. Beim Runterscrollen
rollt zuerst die Seite (daher klappte es), beim Hochwischen zuerst das
Raster (daher kam nichts an). Der Abstand unten folgt derselben Rechnung wie
die Eintragsseite (Leiste + Knopf + 2 Abstände), mit Leisten, die am Ende
zurückkommen. Verworfen: nur den Platz verkleinern — mit weggeglittener
Leiste säße der Knopf 64 px tiefer und die Lücke käme zurück; ein eigenes
Ereignis aus dem Kalender — hätte `shell` und `features/calendar` gekoppelt.
Das gesperrte Raster zählt nicht mit, sonst wirkt der Sprung zur Jetzt-Linie
beim Öffnen wie ein Wisch nach unten und versteckt die Leisten.

## Visualisierung
Vorher (ganz unten, Leisten weg):
```
┌────────────────────┐
│ 22:00 ──────────── │
│ 23:00 ──────────── │
│                    │  ← ~150 px leer
│                    │
│               [ + ]│
└────────────────────┘
```

Nachher (ganz unten, Leisten zurück):
```
┌────────────────────┐
│ 22:00 ──────────── │
│ 23:00 ──────────── │
│    ↕ 16 px         │
│          [+ Neu]   │
│ ▢  ▣  ☑  ▤         │
└────────────────────┘
```

## Hinweise
- Am Seitenende springen die Leisten von selbst wieder ein (Raster und Liste).
- Beim Hochwischen im Raster kommt der Kopf mit Titel und Datum erst, wenn
  das Raster ganz oben ist und die Seite selbst hochläuft.
- Im Testbrowser nur mit Mausrad geprüft; echtes Touch-Wischen auf dem Pixel testen.
- Zentrale Dateien berührt: `index.html`, `styles/tokens.css`, `src/data/version.js`.
