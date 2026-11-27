# 2026-11-27-og-suche-einstellungen

## Problem
Suche, Einstellungen und Fortschritt der „OG Version“ sahen noch wie die alte
iOS-Fassung aus. Sie sollen wie Organi7er-ios aussehen (GlobalSearchOverlay,
SettingsView, SettingsGlassSection, ExperienceStatsView).

## Änderung
- `styles/tokens-og-settings.css` (neu): Werte für Suche und Einstellungen, hell und dunkel
  (Gruppenfläche, Trennlinie, Grautöne, Zeilenhöhe 56, Symbol 28, Profilbild 68, Rot).
- `styles/og-search.css` (neu): Treffer als Glaskarten (Radius 20) mit Symbol in der Farbe
  der Eintragsart, Tagesmarken in Fußnoten-Größe, Reiter und Suchfeld als Glaskapseln,
  „Suchen“/„Abbrechen“ in der Akzentfarbe.
- `styles/og-settings.css` (neu): matte Gruppen (Radius 28) auf gruppiertem Grund,
  Profilkarte mit Bild links und Name daneben, Zeilen mit 28-px-Symbol, eingerückte
  Trennlinie, kleine hellgraue Pfeile, rote Löschen-/Abmelden-Zeilen; Fortschritt als Glaskarten.
- `src/features/search/search-rows.js`: Attribut `data-kind` an der Treffer-Zeile (Symbolfarbe).
- `index.html` (gemeinsame Datei): eine Zeile mit drei `<link>`; `docs/styles-dateien.md`: drei Einträge.

## Begründung
Alle Regeln hängen an `data-mobile-os="ios"` und `data-mobile-variant="og"` unter 1024 px,
die übrigen Fassungen bleiben unverändert. Nur Stile plus ein Attribut, keine Logik.
Gilt nur für die OG Version. Verworfen: die Zeilen „Zuletzt gesucht“/„Am häufigsten“ der
Vorlage als neues Markup; die vorhandenen Reiter sind als Glaskapsel gestaltet.

## Visualisierung
Vorher:
```
 🚀 Umzug nach Leipzig      >
 ───────────────────────────
 ✎  Einkaufsliste           >
```

Nachher:
```
 ╭───────────────────────────╮
 │ 🚀  Umzug nach Leipzig   > │
 │     Projekte · 21:47       │
 ╰───────────────────────────╯
 ╭ (DN)  Dein Name ──────────╮   Profilkarte, darunter matte Gruppen
```

## Hinweise
- Offen: Stufenring und Kennzahlen-Kacheln wie ExperienceStatsView, Logbuch, Sprachwahl
  (bräuchten neues Markup). Die Suche behält ihre Kopfzeile statt des Titels „Suchen“.
- Geprüft bei 375 px hell und dunkel, Konsole leer, Zurück-Pfeil und Browser-Zurück.
- Am Gerät testen: Suche mit Tastatur, Einstellungs-Unterseiten, „Konto löschen“.
