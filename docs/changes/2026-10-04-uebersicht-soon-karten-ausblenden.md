# 2026-10-04-uebersicht-soon-karten-ausblenden

## Problem
Die zweite Kartenseite der Übersicht zeigte neben Lesezeichen und Archiv die zwei Karten Personen und Pläne („Demnächst verfügbar“). Sie sollen vorerst nicht zu sehen sein, ohne dass rechts ein breiter Abstand zum Rand entsteht.

## Änderung
- `src/data/collections.js`: Personen und Pläne bekommen `hidden: true` und bleiben in `moreCards`. Die Desktop-Seitenleiste zeigt sie weiter unter „Mehr anzeigen“.
- `src/features/overview/overview.js`: Karten mit `hidden` werden auf dem Handy nicht gezeichnet. Sind höchstens `narrowLimit` (2) Karten sichtbar, bekommt die zweite Seite die Klasse `overview-page-narrow`.
- `styles/overview-more.css`: `.overview-page-narrow` ist eine Spalte, so breit wie eine Karte der ersten Seite, und rastet am rechten Rand ein.
- `styles/android-overview-sheet.css`: dieselbe Breite für beide Android-Fassungen, gerechnet mit dem Peek.

## Begründung
Nur ausblenden statt löschen: die Features Personen und Pläne werden später gebaut, dann genügt es, bei der Karte `soon` und `hidden` zu streichen. Code und Werte der „Demnächst“-Karten (Schildchen, `--soon-opacity`, `--soon-label-color`) bleiben daher unverändert. Die schmale Seite lässt Lesezeichen und Archiv bündig am rechten Rand enden, links daneben steht die zweite Spalte der ersten Seite. Verworfen: die beiden Karten in die rechte Hälfte einer breiten Seite setzen — links bliebe eine leere Spalte. Gilt auf dem Handy in allen drei Fassungen (Android, Android (Experiment), iOS); die Desktop-Seitenleiste bleibt bewusst unverändert.

## Visualisierung
Vorher (ganz hineingewischt):
```
 ▕┌────────┐ ┌────────┐ ┌────────┐▏
 ▕│Favorit.│ │Lesezei.│ │Personen│▏
 ▕└────────┘ └────────┘ └────────┘▏
 ▕┌────────┐ ┌────────┐ ┌────────┐▏
 ▕│Ressour.│ │Archiv  │ │Pläne   │▏
 ▕└────────┘ └────────┘ └────────┘▏
```

Nachher (ganz hineingewischt):
```
 ▕┐ ┌────────┐ ┌────────┐ ▏
 ▕│ │Favorit.│ │Lesezei.│ ▏
 ▕┘ └────────┘ └────────┘ ▏
 ▕┐ ┌────────┐ ┌────────┐ ▏
 ▕│ │Ressour.│ │Archiv  │ ▏
 ▕┘ └────────┘ └────────┘ ▏
```

## Hinweise
- Am Gerät wischen: die schmale zweite Seite soll sauber einrasten (Peek am Anfang, rechts bündig am Ende).
- iOS-Fassung: am Ende steht Favoriten/Ressourcen links neben Lesezeichen/Archiv, vorher stand dort eine ganze 2×2-Seite.
- Ohne `hidden` kehrt das 2×2-Raster mit Personen und Pläne automatisch zurück (getestet).
