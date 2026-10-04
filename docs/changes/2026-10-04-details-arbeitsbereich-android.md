# 2026-10-04-details-arbeitsbereich-android

## Problem
Auf Android zeigten Aufgabe, Projekt und die übrigen Einträge ihre Angaben nur
noch als Blatt (Info-Knopf neben „Kopieren“). Die Seite eines Arbeitsbereichs
hatte noch die Karte „Details“, die über der Navigation hervorschaute und den
Plus-Knopf anhob. In den übrigen Mobil-Fassungen (iOS, Erster Test) stand die
Karte auf beiden Seiten. Der zweite Reiter hieß „Verknüpfte Einträge“.

## Änderung
- `src/ui/details-sheet.js` (verschoben aus `src/features/entry/entry-details-sheet.js`):
  ein Blatt für Eintrag und Arbeitsbereich. Jede Seite meldet sich mit
  `registerDetailsSource(view, { subject, facts, actions })` an.
- `src/features/overview/workspace-page.js`: Info-Knopf neben „Kopieren“,
  „Einträge“ im Blatt wechselt zum Reiter „Verknüpfungen“.
- `src/features/overview/workspace-details.js` gelöscht (Karte und Platzreserve).
- `src/features/entry/entry-details.js`, `entry-tools.js`: auf das gemeinsame Blatt umgestellt.
- `styles/details-sheet.css` (neu, in `index.html` und `docs/styles-dateien.md`):
  Karte am Textende in allen Fassungen ausgeblendet, iOS-Optik des Blatts,
  Info-Knopf ab 1280px ausgeblendet (Details stehen rechts).
- `styles/android-entry.css`, `styles/android.css`: Android-Sonderregeln für
  das Ausblenden entfernt, die Anhebung des Plus-Knopfs über der Karte
  entfernt; Text eines Arbeitsbereichs endet wie bei Einträgen über dem Plus-Knopf.
- Reiter heißt überall „Verknüpfungen“ (`entry.js`, `workspace-page.js`).

## Begründung
Ein Aufbau in allen Fassungen: Kopieren und Info rechts neben den Reitern, die
Angaben im Blatt. Ein gemeinsames Blatt in `src/ui/` statt einer Kopie, weil
sich zwei Bereiche unter `features/` nicht gegenseitig importieren dürfen.
Verworfen: die Karte der Eintragsseite ganz entfernen — `entry-fold.js` und
`entry-lift.js` messen an ihr, das wäre eine eigene Aufgabe.
Geltungsbereich: alle Mobil-Fassungen (Android und Android (Experiment), iOS,
Erster Test); Desktop ab 1280px bleibt mit den Details in der rechten Spalte.

## Visualisierung
Vorher:
```
┌─────────────────────┐
│ Haushalt            │
│ (Inhalt|Verknüpfte…)⧉│
│ Schreib etwas …     │
│ Details          ⊟  │  ← Karte lugt hervor
│ (▢ ▢ ▢ ▢)    (+)    │
└─────────────────────┘
```

Nachher:
```
┌─────────────────────┐
│ Haushalt            │
│ (Inhalt|Verknüpfungen) ⧉ ⓘ │
│ Schreib etwas …     │
│                     │
│ (▢ ▢ ▢ ▢)    (+)    │
└─────────────────────┘
```

## Hinweise
- Die versteckte Karte auf Eintragsseiten ist toter Code (`entry-lift.js`,
  Teile von `entry-fold.js`); Entfernen wäre eine eigene Aufgabe.
- „Verknüpfte Einträge“ heißt noch der Kartentitel in `entry-rail.js` und die
  Überschrift in `dashboard-stage.js`.
- `src/data/version.js` nennt noch die alten Pfade; setzt der Git Commit Manager.
- Testen: langer Text mit „Mehr anzeigen“ auf iOS, Status-Tipp im Blatt,
  Zurück-Geste bei offenem Blatt, hell und dunkel.
