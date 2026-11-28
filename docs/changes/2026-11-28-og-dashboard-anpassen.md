# 2026-11-28-og-dashboard-anpassen

## Problem
Der Knopf „Dashboard anpassen“ am Ende der OG-Übersicht (PR 239) war nur gezeichnet, ohne Blatt dahinter.

## Änderung
- Der Knopf öffnet das vorhandene Blatt „Spalten“ (`src/ui/columns-sheet.js`) mit eigener Überschrift
  („Dashboard anpassen“): Griff „=“ ordnet die vier Abschnitte, das Auge blendet sie aus.
- `src/data/home-dash.js`: `dashSections`, `homeLayout()`, `setHomeLayout()`.
- `src/data/state.js`: neue Einstellung `prefs.homeDash` ({ order, hidden }), gespeichert und geladen.
- `src/features/overview/home-og.js`: zeichnet die Abschnitte in der gewählten Reihenfolge, öffnet das Blatt.
- `src/ui/columns-sheet.js`: optionaler Parameter `title`.

## Begründung
Das Blatt der Board-Spalten kann schon Ziehen und Ausblenden samt Speichern; ein zweites Blatt wäre doppelt.
Geltungsbereich: nur OG Version (der Knopf erscheint nur dort).

## Visualisierung
Vorher:
```
( Dashboard anpassen )   → nichts
```

Nachher:
```
 Dashboard anpassen            (x)
 Übersicht · Halten und ziehen …
 =  📍 Im Blick               👁
 =  ✎  Zuletzt erstellt       🚫  (blass)
 =  👁 Zuletzt geöffnet       👁
 =  ✎  Zuletzt bearbeitet     👁
```

## Hinweise
- Anders als in der App: vier statt sieben Abschnitte, keine Wahl „Form der Kacheln“.
- Geprüft dunkel bei 375 px: Blatt öffnen, Abschnitt ausblenden, Neuladen. Ziehen am Griff nicht geprüft.
- Gemeinsame Dateien: `state.js`, `columns-sheet.js`.
