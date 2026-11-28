# 2026-11-28-og-medien-karten-2

## Problem
Medien und Karteikarten der „OG Version“ sahen noch nicht aus wie die iOS-Screenshots
`04-ios-medien` und `05-ios-karteikarten`: Titel unter Ring und Profilbild, zu breite
Ränder, zu dunkle Dokument-Kacheln, fehlender Name beim ersten Dokument jeder Gruppe,
Stapel keine großen Karten, `?demo=1` ohne Stapel.

## Änderung
- Medien (`styles/og-media.css`, `og-media-bar.css`, `tokens-og-media.css`): Titel in der
  Zeile mit Ring und Profilbild, Rand 16 pt, Fuge 6,5 pt, Pillenschrift 16 px, Dokument-Kacheln
  mit senkrechtem Blauverlauf (30 % → 10 %) und Namen, vier Glasknöpfe mit Weichzeichner,
  Import mit Ablagefach-Symbol (`index.html`, zweites SVG, CSS blendet je Fassung eins aus).
- Karteikarten (`styles/og-cards.css`, `src/features/cards/cards.js`): Stapel als große Karte
  (Verlauf braun → grau, untere Hälfte dunkler, weißes Symbol), Zeile „N Karten · ✨ neu · ↺ offen“,
  Knopf „Karteikarten anpassen“ mit Blatt für Import und Löschen (mit Rückfrage); Papierkorb auf
  der Karte entfällt.
- Demo: `src/data/demo-decks.js`, je eine Zeile in `src/data/demo-data.js` und `src/shell/demo-load.js`.
- Fix `src/features/media/media.js`: `map(mediaCell)` gab den Index als `showName` weiter.
- `assets/icons/sprite.svg`: Symbole `refresh`, `sparkle`.

## Begründung
Maße und Farben aus den Referenzbildern abgelesen. Verworfen: Papierkorb auf der Karte (nicht im
Screenshot), Löschen per Halten (auf iOS-Safari nicht einheitlich). Gilt nur für die OG Version.

## Visualisierung
Vorher:
```
Medien unter dem Ring · Rand 20 pt · Doc ohne Name · Stapel mit Papierkorb
```
Nachher:
```
Medien            (Ring)(Bild)
(⟲ Zuletzt erstellt 13)(🖼 Bilder 7)
▢ ▢ ▢   Doc: ▤ + Name
╭ ▭▭ Statistik-Begriffe · 2 Karten ↺ 1 offen ╮   ( ⚙ Karteikarten anpassen )
```

## Hinweise
- Gemeinsame Dateien: `index.html`, `sprite.svg`, `demo-data.js`, `demo-load.js`, `media.js`.
- Löschen läuft über „Karteikarten anpassen“; am Gerät testen. `backdrop-filter` kann am Gerät anders wirken.
- Vergleich mit den Screenshots nach Augenmaß und abgelesenen Farben.
