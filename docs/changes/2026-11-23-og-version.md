# 2026-11-23-og-version

## Problem
Die Web-App soll eine neue Fassung „OG Version“ bekommen, die aussieht und
funktioniert wie die Swift-App Organi7er (Aussehen, Abläufe, Funktionsumfang).
Dieser erste Schritt legt nur das Gerüst an.

## Änderung
- `src/data/platform-versions.js`: neue Zeile „OG Version“ in der Gruppe Mobil
  (Spielart von iOS: `os: "ios"`, `variant: "og"`), mit ⓘ-Unterschieden.
- `index.html`: Frühskript setzt für die Wahl `ios-og` `data-mobile-os="ios"` und
  `data-mobile-variant="og"`; `<link>` auf die zwei neuen Stildateien nach `ios*.css`.
- `styles/tokens-og.css` (neu): Kategoriefarben, Fläche, Rundungen, Abstände aus
  `DesignTokens.swift` von Organi7er, hell und dunkel.
- `styles/og.css` (neu): setzt vorerst die Seitenfläche auf die Organi7er-Farbe.
- `src/features/profile/versions.js`: Überschrift im ⓘ-Blatt „Anders als die Grundfassung“.
- `docs/styles-dateien.md`: beide neuen Dateien eingetragen.

## Begründung
Als Spielart von iOS erbt die OG Version Funktionen und Daten der bestehenden App,
nur die Optik wird überschrieben. Eine eigene Datenschicht wurde verworfen: Aufgaben,
Termine und Kalender gibt es schon. Gilt nur für die Gruppe Mobil, nicht für Desktop.

## Visualisierung
Vorher:
Mobil › Erster Test · Android · Android (Experiment) · Android (Xool-DB) · iOS

Nachher:
Mobil › … · iOS · OG Version  (`<html data-mobile-os="ios" data-mobile-variant="og">`)

## Hinweise
- Noch nicht umgesetzt: getrennter Speicher für die OG Version (sie nutzt vorerst
  denselben wie die anderen Fassungen), Übersicht, Navigation, Detailseite,
  Kalender, Karteikarten, Medien, Suche, Einstellungen, Erfahrung.
- Gemeinsame Dateien berührt: `index.html`, `platform-versions.js`.
- Wer „OG Version“ wählt, sieht bis zu den nächsten Schritten fast die iOS-Fassung.
