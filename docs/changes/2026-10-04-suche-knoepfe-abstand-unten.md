# 2026-10-04-suche-knoepfe-abstand-unten

## Problem
Auf der Suche standen die Knöpfe unten (Mikrofon, Suchen, Abbrechen) in der
Android-Fassung nur 12 px über dem unteren Rand. Das ist mit dem Daumen
schlecht zu erreichen. Bei offener Tastatur dagegen reicht ein kleiner Abstand
zur Tastatur.

## Änderung
- `styles/tokens-android.css`: neue Werte `--m3-search-actions-bottom` (24 px,
  Abstand zum unteren Rand) und `--m3-search-actions-bottom-keyboard` (12 px,
  Abstand zur Tastatur).
- `styles/search-overlay.css` (nur Android): Der Abstand unter den Knöpfen
  kommt aus `--m3-search-actions-bottom`. Dieselbe Variable bestimmt die Höhe
  der dunklen Leiste unter den Knöpfen (das bisher dort mitgerechnete
  `--nav-bottom` entfällt) und das Ende der Liste, damit der letzte Treffer
  nicht verdeckt wird. Bei offener Tastatur (`body.is-keyboard-open`) gilt der
  kleinere Wert.
- `src/shell/keyboard-inset.js`: setzt die Klasse `is-keyboard-open` auf
  `<body>`, solange die Tastatur offen ist (nutzt die vorhandene Erkennung
  `ui.keyboardOpen`).

## Begründung
Die Knöpfe rücken schon mit der Tastatur nach oben (`--keyboard-inset`), also
genügt es, den Abstand darunter zu ändern. Ein reiner CSS-Weg über
`max(12px, 24px - var(--keyboard-inset))` wurde verworfen: bei kleinen
Rundungswerten ergäben sich falsche Zwischenabstände. iOS bleibt unverändert,
dort liegt der Abstand durch die Navigationsleiste schon bei etwa 22–26 px.

## Visualisierung
Vorher:
```
[ Mic|Suchen ] Abbrechen
        ↕ 12px
──── Geräterand ────
```

Nachher (Tastatur zu):
```
[ Mic|Suchen ] Abbrechen
        ↕ 24px
──── Geräterand ────
```

Nachher (Tastatur offen):
```
[ Mic|Suchen ] Abbrechen
        ↕ 12px
──── Tastatur ────
```

## Hinweise
- `src/shell/keyboard-inset.js` ist eine zentrale Datei, die Änderung ist eine
  einzelne Zeile.
- Mit simulierter Klasse gemessen (24 px zu, 12 px offen); bitte auf einem
  echten Android-Handy beim Öffnen und Schließen der Tastatur prüfen.
