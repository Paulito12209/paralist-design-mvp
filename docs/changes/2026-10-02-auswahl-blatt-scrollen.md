# 2026-10-02-auswahl-blatt-scrollen

## Problem
Auf Android scrollte die Liste im Auswahl-Blatt (z. B. „Sortieren“) schon ab
52 % der Bildschirmhöhe, das Blatt wuchs nicht mit. Hatte man die Liste nach
unten gescrollt, schloss ein Wisch nach unten das ganze Blatt, statt die Liste
zurück nach oben zu rollen — der obere Inhalt war nicht mehr erreichbar.

## Änderung
- `src/ui/modal-pull.js`: `bodyOf` erkennt jetzt auch die Liste `.sheet-options`
  als scrollende Fläche. Zuvor galt das Auswahl-Blatt immer als „oben“ und jeder
  Wisch nach unten startete das Schließen. Kopfkommentar ergänzt.
- `styles/android-bottom-sheet.css`: das Android-Auswahl-Blatt ist eine Flex-Spalte
  mit `max-height: var(--m3-sheet-max)` (80 %); Titel und Reiter behalten ihre
  Höhe, die Liste nimmt den Rest und scrollt erst darüber. Die feste Grenze
  `--sheet-options-max` (52vh) gilt dort nicht mehr. Kopfkommentar nennt
  `--m3-sheet-max`.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die Ursache lag in der Wischgeste, nicht nur in der Höhe. Deshalb beides: die
Geste korrigiert, und die übliche Sortierliste (4 Möglichkeiten + 2 Richtungen)
passt jetzt ganz ins Blatt (432 px statt ~350 px mit Scrollen). Verworfen:
`--sheet-options-max` in `overlays.css` erhöhen — das würde iOS und Desktop
mitändern.

## Visualisierung
Vorher:
```
 ╭──────────────────────╮   Blatt nur 52 % hoch
 │ ⋮ Zuletzt geändert   │ ← abgeschnitten
 │ ✓ Zuletzt geöffnet   │
 │ Reihenfolge          │   Liste scrollt in sich
 ╰──────────────────────╯
 Wisch nach unten → Blatt schließt, Liste bleibt unten
```

Nachher:
```
 ╭──────────────────────╮   Blatt wächst bis 80 %
 │ Sortieren nach       │
 │   Zuletzt geändert   │
 │ ✓ Zuletzt geöffnet   │
 │ Reihenfolge          │
 │ ✓ Neueste zuerst     │
 │   Älteste zuerst     │   alles sichtbar
 ╰──────────────────────╯
 Lange Liste: Wisch nach unten rollt sie hoch; erst oben schließt der Wisch.
```

## Hinweise
- `modal-pull.js` ist gemeinsam genutzt: gilt für alle Auswahl-Blätter, auch iOS
  und Desktop (Liste gescrollt → Wisch nach unten rollt zuerst die Liste).
- Die neue Höhe gilt auf Android für alle Auswahl-Blätter (Verknüpfen, Typ wählen,
  Icon wählen, Erinnerung, Blatt einer Aufgabe mit Reitern) — bitte ansehen.
- Wer am Titel oder an den Reitern zieht, während die Liste gescrollt ist,
  schließt das Blatt nicht; erst bei Liste oben.
- Geprüft: 375×667, Touch-Wischen, Konsole leer. Nicht geprüft: Dunkelmodus,
  iOS, echtes Handy.
