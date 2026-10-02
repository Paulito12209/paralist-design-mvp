# 2026-10-03-android-experiment-einstellungen-google

## Problem
Die Einstellungen in „Android (Experiment)“ hatten noch den iOS-Inhalt: großer mittiger Profilkopf, Icons vor jeder Zeile, Pfeile hinten, kleiner Titel in der Leiste.

## Änderung
- Neu: `styles/android-settings-google.css` (nur Experiment, unter 1024px, nur `#profile`): runder Zurück-Knopf, Seitenname groß darunter, Bild/Name/Mail als schlichte Zeile, graue Abschnittsüberschriften, Zeilen ohne Icons und Pfeile in Gruppen (Außenecken 28px, Zwischenecken 4px, 4px Fuge).
- `styles/tokens-android.css`: vier neue Werte (`--m3-settings-title`, `-group-radius`, `-inner-radius`, `-back-size`).
- `index.html`: Stylesheet eingebunden (zentrale Datei).
- `src/data/platform-versions.js`: Zeile unter `differences` des Experiments.

## Begründung
Vorbild: Google-Einstellungen („Google-Dienste“). Reines CSS, HTML bleibt unverändert. Nicht übernommen: Pillen „Empfohlen | Alle Dienste“, ⋮-Menü und Pfeil an der Konto-Zeile, weil es dafür keine Funktion gibt.

## Visualisierung
Vorher:
```
‹ Einstellungen
      (PA)
  Paul Angeles
Darstellung
▭ System   ✓
```
Nachher:
```
(‹)
Einstellungen
(PA) Paul Angeles
Darstellung
╭──────────────╮
│ System     ✓ │
├──────────────┤
│ Hell         │
╰──────────────╯
```

## Hinweise
Ohne Icons und Pfeile ist weniger erkennbar, ob eine Zeile weiterführt. „Pro · Dabei seit …“ ist im Kopf ausgeblendet. Auf dem Handy lange Unterseiten und Konto-Seiten prüfen.
