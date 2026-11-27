# 2026-11-27-og-uebersicht

## Problem
Die „OG Version“ sah noch wie die alte iOS-Fassung aus: kleiner Titel,
flache Kacheln, blauer Plusknopf. Sie soll die Oberfläche der Swift-App
Organi7er übernehmen.

## Änderung
- `styles/tokens-og.css`: neue Werte aus `DesignTokens.swift`, `GlassBackdrop.swift`
  und `ExperienceLevelBadge.swift` — Kartenverlauf, Kartenrand, Akzent (iceBlue),
  Titelgröße 34 pt, Kapselhöhe 62 pt, Symbolgröße, Plusknopf 44 pt; hell und dunkel.
- `styles/og-home.css` (neu): Übersicht mit großem Titel, Kacheln als Glaskarten
  (Radius 20 pt, Verlauf, feiner Rand), Symbole in Systemfarben, Abschnittsüberschriften.
- `styles/og-nav.css` (neu): Reiterkapsel als schwebende Glaskarte, gewählter Reiter
  auf Pille in der Akzentfarbe; runder Plusknopf als 44-pt-Glasknopf statt blauem Kreis.
- `index.html`: zwei `<link>` nach `styles/og.css` (gemeinsame Datei).
- `docs/styles-dateien.md`: beide neuen Dateien eingetragen.

## Begründung
Alle Regeln hängen an `data-mobile-os="ios"` und `data-mobile-variant="og"`,
die übrigen Fassungen bleiben unverändert. Die Werte stammen direkt aus den
Swift-Quellen von Organi7er. Gilt nur für die OG Version, nur Übersicht und Leiste.

## Visualisierung
Vorher:
```
 Übersicht  (klein)
 [ Eingang ]  [ Favoriten ]          flache Kacheln
 [ ◉  ▢  ✓  ▣ ]          (●+)        blauer Kreis 62 pt
```

Nachher:
```
 Übersicht  (34 px, fett)
 ╭─────────╮ ╭─────────╮
 │ ⬇       │ │ ☆       │             Glasverlauf, 20 pt Radius
 │ Eingang │ │Favoriten│
 ╰─────────╯ ╰─────────╯
 ╭ ◉ ▢ ✓ ▣ ╮ (+)                     Glaskapsel, Plus 44 pt
```

## Hinweise
- Noch anders als die Vorlage: Listen als waagerechte Reihe (80 × 116 pt),
  Reiter „Karteikarten“ statt „Aufgaben“, Suche rechts in der Leiste,
  Anlege-Zubehör mit Kategorie-Pille und Mikrofon, alle übrigen Seiten.
- Farbe von „Eingang“ (Blau) ist angenommen, die Vorlage nennt keine.
- Geprüft bei 375 px hell und dunkel, Konsole leer.
