# 2026-10-03-android-nav-zuerst-zurueck

## Problem
In der Android-Fassung kamen am Seitenende Suchleiste und Navigationsleiste
gemeinsam zurück, sobald man ganz unten angekommen war. Gewünscht: unten
erscheint nur die Navigationsleiste mit dem Plus-Knopf darüber. Die
Suchleiste kommt erst, wenn man danach den Inhalt wieder Richtung Anfang
zurückwischt (Finger von oben nach unten) — das ist die Bitte „ich will
oben etwas sehen“. Gilt für alle vier Reiter.

## Änderung
- `src/shell/android-bars.js`: Am Seitenende bleibt `is-bars-hidden` stehen,
  zusätzlich kommt `is-nav-back` an `.device` (neue Funktion `showNavOnly()`).
  Ein Wisch zurück Richtung Anfang entfernt beide Klassen, ein erneuter Wisch
  Richtung Ende entfernt `is-nav-back`. `showBars()` räumt beide Klassen ab.
  Kommentar-Header angepasst.
- `styles/android.css`: Die Leiste unten gleitet nur weg, solange
  `is-nav-back` fehlt (`:not(.is-nav-back)`).
- `styles/android-fab.css`: Der Plus-Knopf wird mit der Leiste wieder breit
  („Neu“), ebenfalls über `:not(.is-nav-back)`.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Suchleiste und das Nachrücken der Reiterzeile (`--m3-bar-shift` in
`styles/android-tabs.css`) hängen weiter nur an `is-bars-hidden` und bleiben
so oben unverändert weg. Nur die beiden Regeln für Leiste und Knopf bekommen
die Ausnahme. Verworfen: zwei getrennte Klassen für oben und unten — hätte
fünf CSS-Dateien und die Composer-Regel berührt, ohne Mehrwert.

## Visualisierung
Vorher (ganz unten angekommen):
```
┌────────────────────┐
│ (●)  [ Suchen ]  ◯ │  ← kam zurück
│ Projekt hinzufügen │
│                    │
│          [+ Neu]   │
│ ▣   ▢   ☑   ▤      │
└────────────────────┘
```

Nachher (ganz unten angekommen):
```
┌────────────────────┐
│ Alle  + Neue Ansicht│  ← Suchleiste bleibt weg
│ Projekt hinzufügen │
│                    │
│          [+ Neu]   │  ← kommt mit der Leiste hoch
│ ▣   ▢   ☑   ▤      │  ← schiebt sich von unten rein
└────────────────────┘
   ↓ Finger von oben nach unten → Suchleiste kommt zurück
```

## Hinweise
- Kurze Seiten, die kaum länger als der Bildschirm sind, erreichen das Ende
  sofort; dort fehlt die Suchleiste nach dem ersten Wisch, bis man zurückwischt.
- Im Testbrowser nur mit simuliertem Scrollen geprüft (375 px, hell und
  dunkel, Konsole leer, alle vier Reiter inkl. Kalender-Raster). Auf dem Gerät
  mit Schwung bis ganz unten wischen, auch auf der Eintragsseite.
- Zentrale Datei berührt: nur `src/data/version.js`.
