# 2026-10-16-android-xool-plus-blatt

## Problem
In „Android (Xool-DB)“ glitt das Plus beim Scrollen mit der Leiste weg (in Xool bleibt es als runder Knopf stehen), und das Plus öffnete die Knopf-Spalte aus „Android“. Gewünscht: Plus bleibt stehen, und das Anlegen soll ein Blatt nach Spotify-Vorbild („Erstellen“) werden, mit Abschnitten und Chips. Gilt nur für diese Fassung.

## Änderung
- **Plus bleibt stehen** (`styles/android-xool-nav.css`): beim Wegscrollen der Leiste gleitet das Plus um deren Weg zurück und wird zum runden Knopf in der Silbergrau-Fläche (`--m3-xo-ind`, 56px, Schein darunter); der Name „Neu“ blendet aus. Am Seitenende kommt die Leiste samt Plus zurück.
- **Anlege-Blatt** (`src/shell/android-xool-create.js`, `styles/android-xool-create.css`, neu): Blatt von unten über der Leiste mit Schleier. Abschnitte von oben nach unten: **Lernen** (Karteikarte, Kartendeck — abgeblendet, gibt es noch nicht), **PARA** (Projekt, Arbeitsbereich), **Medien** (Medium), **Ressourcen** (Dokument, Zeichnung, Lesezeichen), **Schnell erfassen** (Aufgabe, Notiz, Termin) ganz unten am Daumen. Ein Chip schließt das Blatt und öffnet das Eingabefeld mit der Art (`createFromMenu`, wie bisher).
- `src/shell/android-xool-nav.js`: Plus öffnet das neue Blatt statt der Knopf-Spalte; `index.html`, `docs/styles-dateien.md`, `platform-versions.js` angepasst.

## Begründung
Die Chips folgen den Material-3-Filterchips (40px, voll gerundet, Fläche wie der aktive Reiter); die Reihenfolge bringt das Häufigste unten in Daumenreichweite. Verworfen: Medien in Foto/Video/Audio/Datei zerlegen (das Eingabefeld kennt nur „Medium“; Bilder sollen laut Auftrag anders laufen). Offen: Karteikarten und Kartendecks gibt es im MVP nicht, die Chips sind darum abgeblendet.

## Visualisierung
Vorher:
```
         ┌──────────┐
         │ Medium   │
         │ ...      │  Spalte von Knöpfen
         │ Termin   │
         └─( ✕ )────┘
```

Nachher:
```
 ╭───────────────────────────╮
 │ Lernen                    │
 │ (Karteikarte)(Kartendeck) │  abgeblendet
 │ PARA                      │
 │ (Projekt)(Arbeitsbereich) │
 │ Medien · Ressourcen       │
 │ Schnell erfassen          │
 │ (Aufgabe)(Notiz)(Termin)  │
 ╰───────────────────────────╯
 ▣   ▦   ✚   ☑   ☰
```

## Hinweise
- Testen: Chips (öffnen das Eingabefeld mit der richtigen Art), Schleier und Zurück schließen, Plus nach dem Wegscrollen (rund, grau) und am Seitenende, hell und dunkel, kleine Geräte (Blatt scrollt).
- Auf sehr niedrigen Geräten scrollt das Blatt; die Reihenfolge der Abschnitte steht in `sections`.
