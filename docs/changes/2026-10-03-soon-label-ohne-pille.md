# 2026-10-03-soon-label-ohne-pille

## Problem
Die Schildchen „Demnächst verfügbar“ auf den Karten Personen und Pläne der Startseite hatten eine Pillenfläche mit hellgrauer Schrift und wirkten zu laut.

## Änderung
- `styles/overview-more.css`: Pillen-Hintergrund und Rundung von `.card-soon` entfernt; die Schrift nutzt `--soon-label-color`.
- `styles/tokens-pages.css`: neuer Wert `--soon-label-color` (35 % der Textfarbe auf transparent) samt Header-Eintrag.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die Pillenfläche fällt weg, die Schrift wird blasser und steht direkt auf der Kachel. Zuerst wurde exakt die alte Pillenfarbe (8 % der Textfarbe) als Schriftfarbe getestet, das war kaum lesbar; deshalb 35 %. `color-mix` passt die Farbe automatisch an Hell und Dunkel an. Der Wert steht zentral in `styles/tokens-pages.css` und lässt sich dort anpassen.

## Visualisierung
Vorher:
```
┌──────────────────┐
│ ( Demnächst verf.)│  <- Pille mit Hintergrund, hellgraue Schrift
│  👥               │
│  Personen ⓘ      │
└──────────────────┘
```

Nachher:
```
┌──────────────────┐
│   Demnächst verf. │  <- nur Schrift, blasser, kein Hintergrund
│  👥               │
│  Personen ⓘ      │
└──────────────────┘
```

## Hinweise
- Am Gerät prüfen, ob die 35 % im Dunkeln und Hellen gut lesbar sind.
- Der neue Versionsstempel zeigt offenen Apps einmal „Neue Version verfügbar“.
