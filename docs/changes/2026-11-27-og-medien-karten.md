# 2026-11-27-og-medien-karten

## Problem
Die „OG Version“ soll bei Medien und Karteikarten wie die Swift-App Organi7er
aussehen. Karteikarten gab es in der Web-App noch gar nicht.

## Änderung
- Medien (nur CSS, `styles/og-media.css`, `og-media-bar.css`): großer Titel,
  Filter-Pillen mit Symbol, Zähler und Kategoriefarbe, Raster mit 14-pt-Kacheln,
  Audio/Dokument mit Farbverlauf, Aufnahmezeile als vier runde Glasknöpfe.
  `src/features/media/media.js` zeigt in OG immer das Pillen-Symbol,
  `src/ui/media-cell.js` setzt `data-kind` an die Kachel.
- Reiter „Karteikarten“ (`data-tab="cards"`) ersetzt in OG „Aufgaben“; Symbol
  `icon-cards` in `assets/icons/sprite.svg`.
- Neue Seite `src/features/cards/cards.js` (Stapelliste als braune Glaskarten,
  Leerzustand, Löschen, Import als Text) und `study.js` (Lernansicht mit
  Umdrehen, „Vergessen“/„Gewusst“, Zusammenfassung); Daten in
  `src/data/decks.js` unter eigenem Schlüssel `paralist-decks`.
- Gemeinsame Dateien: `index.html` (Reiter, Seite, Links; bei 399 Zeilen),
  `src/main.js`, `src/ui/views.js`, `src/ui/router.js`, `src/core/storage.js`,
  `docs/styles-dateien.md`.
- Neue Stile: `tokens-og-media.css`, `og-media.css`, `og-media-bar.css`,
  `og-cards.css`, `og-study.css`.

## Begründung
Alle Regeln hängen an `data-mobile-os="ios"` + `data-mobile-variant="og"`; die
Stapel liegen außerhalb von `state.js`, damit keine andere Fassung und kein
anderer Thread berührt wird. Verworfen: Stapel-Detailseite mit Kartenliste.
Gilt nur für die OG Version.

## Visualisierung
Vorher:
```
Medien Ressourcen   ┃Zuletzt│Bilder┃   eckige Kacheln, 3 px Fuge
Leiste: ▦ 📅 ＋ ☑ 🖼
```

Nachher:
```
Medien (34 px)   (◷ Zuletzt 13)(🖼 Bilder 7)   14-pt-Kacheln, 6 pt
        (📁)(🎤)(🎥)(📷)
Leiste: ▦ 📅 🖼 ▭▭Karteikarten
Stapel: ╭ Frankreich · 2 Karten · ☆ 2 neu ╮ (braune Glaskarte)
```

## Hinweise
- Offen: Lernansicht ohne Mehrfachauswahl-Karten, Wischen zum Bewerten, Bilder,
  Lernmodi „nur neue/falsche“, kein Verlaufseintrag (Browser-Zurück verlässt die Seite).
- Offen: Herkunfts-Pille (Name des Eintrags) auf Medien-Kacheln fehlt.
- Offen: `?demo=1` legt keine Demo-Stapel an; Stapel-Detailseite fehlt.
- Reihenfolge der Leiste hängt von der Leisten-Sitzung ab (PR #230) – nach dem Merge ansehen.
- Geprüft bei 375 px hell und dunkel, Browser-Zurück/-Vor, andere Fassungen zeigen „Aufgaben“.
