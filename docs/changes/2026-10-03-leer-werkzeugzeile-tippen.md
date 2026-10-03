# 2026-10-03-leer-werkzeugzeile-tippen

## Problem
Auf der Seite Projekte fehlte die Werkzeugzeile (Archiv, Sortieren, Ansicht),
solange es noch kein Projekt gab — der Leerzustand hatte einen eigenen
Rückweg, der älter ist als die Werkzeugzeile. Außerdem legte ein Tipp in der
leeren Sammlung (Fläche mit dem Platzhalter) nichts an; laut
`2026-10-02-tipp-unter-liste-anlegen` gab es dort bewusst „keine Liste, unter
die man tippen könnte“. Gewünscht: Werkzeugzeile immer sichtbar, ein Tipp in
die leere Fläche legt direkt eine Zeile in der aktuellen Sammlung an.

## Änderung
- `src/features/overview/projects.js`: auch ohne ein einziges Projekt stehen
  Werkzeugzeile und ein leerer Listen-Behälter über dem Platzhalter — das
  vorhandene Anlegen per Tipp (`project-inline.js`) greift damit.
- `src/ui/inline-add.js`: eine angemeldete Liste darf bei leerer Sammlung ihren
  Platzhalter zurückgeben (`addablePlaceholder`). Ein Tipp auf ihn oder darunter
  öffnet die erste Zeile in einem eigenen Kasten über ihm; Escape entfernt den
  Kasten wieder.
- `src/ui/empty-state.js`: Klasse `is-addable`, wenn die Pille des Platzhalters
  anlegt (nicht beim Platzhalter „Kein Eintrag passt zu den Filtern“).
- Angemeldet: Eingang und Arbeitsbereiche (`src/features/overview/page-inline.js`),
  Ressourcen (`src/features/resources/resources.js`), Lesezeichen
  (`src/features/bookmarks/bookmarks.js`).
- `styles/empty-state.css`: der Platzhalter weicht, solange die erste Zeile
  getippt wird.
- `src/data/version.js`: neuer Versionsstempel (zentrale Datei).

## Begründung
Ein gemeinsamer Mechanismus in `inline-add.js` statt eines Umbaus je Seite:
jede Liste sagt nur, dass ihr Platzhalter anlegen darf. Verworfen: die
Reihenfolge der Elemente je Seite umstellen (Sonderfall auf jeder Seite). Die
Pillen im Platzhalter („Projekt anlegen“ …) bleiben und öffnen weiter das
volle Eingabefeld.

## Visualisierung
Vorher:
```
Projekte
Alle  + Neue Ansicht
──────────────────────────
                            ← keine Werkzeugzeile
      [Emblem Rakete]
   Noch keine Projekte
   (+ Projekt anlegen)      ← Tipp daneben: nichts
```

Nachher:
```
Projekte
Alle  + Neue Ansicht
──────────────────────────
🗄 Archiv           ⇅   ⎍   ← Werkzeugzeile immer da
      [Emblem Rakete]
   Noch keine Projekte      ← Tipp irgendwo hier …
   (+ Projekt anlegen)

        ↓ nach dem Tipp
🗄 Archiv           ⇅   ⎍
🚀 Neues Projekt▏           ← Enter legt an, nächste Zeile öffnet sich
                            (Escape: Platzhalter kommt zurück)
```

Gleich bei Eingang (Notiz), Ressourcen (Typ der gewählten Pille), Lesezeichen
und Arbeitsbereichen (Arbeitsbereich mit Namensfeld).

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer, leerer Speicher:
  Projekte, Eingang, Ressourcen › Zeichnungen, Lesezeichen, Arbeitsbereiche —
  jeweils Tipp, Enter-Kette und Escape.
- Arbeitsbereiche: der Tipp legt den Arbeitsbereich sofort an (wie die Pille);
  Escape lässt ihn mit Vorgabenamen stehen.
- iOS, Seite Projekte: das Projekt-Anlegen per Tipp läuft auch dort, ein Tipp
  auf den leeren Platzhalter öffnet also auch auf iOS eine Zeile.
- Nicht geprüft: echtes Gerät, voller Speicher mit Migration, Board-Layout bei
  null Projekten. Favoriten und Archiv legen weiterhin nichts an.
