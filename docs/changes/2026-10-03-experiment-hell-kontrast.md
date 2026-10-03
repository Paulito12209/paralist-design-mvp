# 2026-10-03-experiment-hell-kontrast

## Problem
In „Android (Experiment)“ hob sich der Projekte-Container im Hellen kaum vom Seitengrund ab: Container und Navigationsleiste `#eef2f9` gegen Seitengrund `#f2f2f7`, dazu eine Suchleiste in `#e5eaf2` und graue Kacheln in `#d1d5db` — vier verschiedene Töne statt der drei ruhigen Stufen wie im Dunkeln. Unter „Projekte“ fehlte eine Trennung zur Werkzeugzeile.

## Änderung
- Neu: `styles/android-experiment-surface.css` (nur Experiment, unter 1024px): Kacheln der Übersicht, Projekte-Container und Navigationsleiste bekommen dieselbe Fläche; der runde Pfeil-Knopf neben „Projekte“ eine Stufe dunkler. Unter „Projekte“ steht eine leise Trennlinie, **nur bei ausgeblendeten Reitern** (`data-tabs="off"`), 16px vom linken und rechten Rand eingerückt, in durchscheinendem Schwarz.
- `styles/tokens-android.css`: neue Werte `--m3-xl-surface` (`#dde3ee` im Hellen), `--m3-xl-surface-high` (`#cdd5e3`), `--m3-xl-tile`, `--m3-xl-divider-color` (hell 10 %, dunkel 30 % Schwarz), `--m3-xl-divider-w` (2px), `--m3-xl-divider-inset` (16px). Im Dunkeln bleiben die bisherigen Töne.
- `index.html`: Stylesheet eingebunden (zentrale Datei). `styles/tokens.css`: Dateiliste ergänzt (zentrale Datei).
- `src/data/platform-versions.js`: Zeile „Farben (hell)“ unter `differences` des Experiments.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die drei Farben sind Seitengrund, gemeinsame Fläche und die Einträge im Container (wieder der Seitengrund). Die Suchleiste behält ihren Material-3-Ton (`#e5eaf2`), weil Material 3 für Suche und Navigationsleiste zwei Tonstufen vorsieht. Die Linie ist eine einfarbige Hintergrundfläche statt eines Schattens, damit sie sich seitlich einrücken lässt; durchscheinendes Schwarz passt sich jedem Container-Ton an. Mit eingeblendeten Reitern trennt schon die Reiterzeile, daher dort keine Linie. Verworfen: `--m3-surface-container` im ganzen Experiment ändern (hätte Einstellungen und Blätter mit eingefärbt). Die normale Android-Fassung bleibt unverändert.

## Visualisierung
Vorher (hell):
```
( Suchen )  #e5eaf2        Seitengrund #f2f2f7
[Kachel][Kachel]           grau #d1d5db
╭ Projekte ─────────(↗)╮   Container #eef2f9 ≈ Seitengrund
│ Archiv       ⇅  ☰    │   keine Trennung
[ Navigationsleiste ]      #eef2f9
```

Nachher (hell, Reiter aus):
```
( Suchen )  #e5eaf2        Material-3-Ton
[Kachel][Kachel]           #dde3ee
╭ Projekte ─────────(↗)╮   Container #dde3ee
│  ─────────────────   │   leise Linie, 16px Abstand
│ Archiv       ⇅  ☰    │
[ Navigationsleiste ]      #dde3ee
```
Mit eingeblendeten Reitern fehlt die Linie.

## Hinweise
- Die Navigationsleiste ist im Experiment jetzt auf allen Seiten dunkler (Kalender, Aufgaben, Medien).
- Das hellblaue „Neu“ steht auf dunklerem Grund: Gedrückt-Zustände von Kachel, Pfeil und „Neu“ am Gerät ansehen.
- Linie zu blass oder zu deutlich: nur `--m3-xl-divider-color` bzw. `--m3-xl-divider-w` ändern.
- Am Gerät testen: Schalter „Reiter anzeigen“ aus und ein — die Linie muss mit erscheinen und verschwinden; hell, dunkel und „System“.

## Nachtrag beim Zusammenführen
Zusammen mit #123 (`2026-10-03-reiter-pro-seite`) gemergt. Dort gilt „Reiter anzeigen“ je Seite, das globale Merkmal `data-tabs` gibt es nicht mehr, stattdessen `data-tabs-home`, `-projects`, `-tasks` und `-pages`. Die Trennlinie unter „Projekte“ in der Übersicht hängt deshalb in `styles/android-experiment-surface.css` jetzt an `data-tabs-home="off"`. Sonst wäre sie nie erschienen. Weil die Übersicht nach #123 ohne Reiter startet, ist die Linie dort jetzt standardmäßig zu sehen.
