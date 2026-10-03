# 2026-10-04-sammlungen-kopf-beschreibung

## Problem
- Der große Kopf mit Icon und Beschreibung musste bei jeder Sammlung einzeln eingeschaltet werden.
- Im Menü oben rechts fehlte bei Ressourcen, Projekten, Archiv, Arbeitsbereichen und Lesezeichen das „Alle … löschen“.
- Im Blatt war der Abstand zwischen „Einfacher Titel“ und „Mit Icon und Beschreibung“ größer als zu „Alle Einträge löschen“.
- Über der Zeile „Archiv / Sortieren / Filtern“ fehlte in der Android-Fassung eine Trennlinie.
- Lange Eintragstitel brachen ohne Grenze um.

## Änderung
- **Neu** `src/data/page-heads.js`: `headOn(key)`, `setHeadOn(key, on)`, `headAreas` (Sammlungen der Einstellungs-Gruppe). Von Haus aus zeigen alle Sammlungen den Kopf; gespeichert wird nur ein ausdrückliches „aus“ (`state.prefs.pageHeads[key] = false`).
- `src/data/state.js`: beim Laden bleiben nur `false`-Werte; alte `true`-Werte entfallen (sind jetzt die Vorgabe).
- `src/features/overview/page-hero.js`: nutzt `page-heads.js`; der Zusatzabstand (`gap`) über „Mit Icon und Beschreibung“ ist weg.
- `src/features/profile/app-settings.js`: neue Gruppe „Icon und Beschreibung in Sammlungen“ unter Einstellungen › Design, je Sammlung ein Haken.
- **Neu** `src/data/collection-delete.js`: `deleteCollection(kind)` und `deleteLabels` für Ressourcen, Projekte, Archiv, Arbeitsbereiche, Lesezeichen.
- `src/features/overview/page.js`: rote „Alle … löschen“-Zeile je Sammlung; der Kopf zeichnet sich bei `dataChanged` neu.
- `styles/android-card.css`, `styles/tokens-android.css`: Linie über der Werkzeugzeile ohne Reiter; Luft darüber 8 px.
- `src/ui/rows.js`, `styles/rows.css`: Eintragstitel enden nach drei Zeilen mit „…“.
- `src/data/collections.js`: nur Kommentar angepasst.

## Begründung
- „Aus“ statt „an“ speichern: neue Geräte und neue Sammlungen zeigen den Kopf automatisch.
- Eigene Löschtexte je Sammlung (wie „Alle Favoriten entfernen“), weil sie genauer sagen, was verschwindet.
- Lesezeichen: nur Einträge vom Typ „Lesezeichen“ werden gelöscht; eine Notiz mit Link-Karte bleibt.
- Verworfen: eigene Unterseite für sieben Haken; Rückfrage vor dem Löschen (die App hat keinen Dialog dafür, der Eingang löscht ebenfalls sofort).

## Visualisierung
Vorher:
```
Eingang                      Menü:
Archiv        ⇅  ≡  ⚟        Einfacher Titel
(keine Linie)                      ← 8 px Extra-Luft
Titel über 4+ Zeilen…        Mit Icon und Beschreibung
                             Alle Einträge löschen
```

Nachher:
```
      [ Icon ]               Menü:
Eingang                      Einfacher Titel
Alles, was du erfasst …      Mit Icon und Beschreibung   ✓
──────────────────────       Alle Einträge löschen
Archiv        ⇅  ≡  ⚟        (gleiche Abstände)
Ein sehr langer Titel für
einen Eintrag, … wie…

Einstellungen › Design
 Icon und Beschreibung in Sammlungen
 ⬇ Eingang ✓   ★ Favoriten ✓   🚀 Projekte ✓ …
```

## Hinweise
- Wer den Kopf früher abgeschaltet hatte, sieht ihn jetzt wieder.
- Die neuen Löschzeilen fragen nicht nach und lassen sich nicht rückgängig machen; „Alle Projekte löschen“ lässt die Inhalte der Projekte bestehen.
- „Alle Lesezeichen löschen“ lässt Notizen mit Link-Karten stehen.
- Am Gerät testen: Trennlinie auf jeder Sammlung, Archiv mit Pillen, sehr lange Wörter in Titeln.
- Zentrale Dateien: `styles/tokens-android.css`, `src/data/state.js`, `src/data/version.js`.
