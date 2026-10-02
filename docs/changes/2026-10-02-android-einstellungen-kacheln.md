# 2026-10-02-android-einstellungen-kacheln

## Problem
Die Einstellungen der Android-Fassung zeigten flache Zeilen ohne Kasten. Gewünscht
war die Material-Optik: jede Zeile eine abgesetzte Kachel, dazwischen die
Abschnittsüberschriften.

## Änderung
- Neu: `styles/android-settings-tiles.css` — jede Zeile (`.plist-row`, `.settings-row`)
  ist eine Kachel in `--m3-surface-container` mit 16 dp Rundung; Gruppen als Spalte
  mit Fuge; Abschnittstitel und Hinweise rücken 16 px ein; Drücken tönt die Kachel.
  Gilt nur für `#profile`, nicht im „Android (Experiment)“, nur unter 1024 px.
- `styles/tokens-android.css`: neuer Wert `--m3-page-tile-gap` (4px).
- `index.html`: Stil-Datei eingebunden. `styles/tokens.css`: Dateiliste ergänzt.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Vorhandene Material-Werte (16 dp, 56 dp) wiederverwendet; eigene Datei statt
Überschreiben in `android-pages-content.css`. Fuge 4 px statt der ca. 8 px im
Vorbild, damit die Seite nicht sehr lang wird. Der Fortschritt bleibt unberührt.

## Visualisierung
Vorher:
```
 Darstellung
 🖥  System            ✓
 ☀  Hell
```

Nachher:
```
 Darstellung
 ╭────────────────────────╮
 │ 🖥  System           ✓ │
 ╰────────────────────────╯
 ╭────────────────────────╮
 │ ☀  Hell                │
 ╰────────────────────────╯
```

## Hinweise
- Alle Einstellungs-Unterseiten teilen die Kachel-Optik; geprüft wurde „Navigation“.
- „Abmelden“ und Versionszeile bleiben unverändert.
- Gemeinsam genutzte Dateien: `index.html`, `styles/tokens.css`, `styles/tokens-android.css`,
  `src/data/version.js`.
