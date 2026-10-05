# 2026-10-05-details-blatt-ebene-verknuepfen

## Problem
- Aus dem Blatt „Details“ heraus lag die Typ-Rolle („Aufgabe ▾“) hinter dem Blatt und war unsichtbar; dasselbe galt für Datum, Erinnerung und andere Rollen.
- Die Chips unter „Verknüpfen“ standen in der Reihenfolge des Verknüpfens, bei vielen Verknüpfungen wurde die Zeile endlos lang.
- Die Zeile hieß nur „Verknüpfen“.

## Änderung
- `styles/details-sheet.css`: `.sheet-backdrop.details-sheet` bekommt `z-index: 40` (vorher 50 von `.sheet-backdrop`). Über Navigation, Plus-Menü und Menü-Schleier, unter Rollen (44) und Auswahl-Blatt (50). Gilt in allen Fassungen.
- `src/ui/details-sheet.js`, `src/ui/type-wheel.js`: neu `isTypeWheelOpen()`. Escape schließt erst die Typ-Rolle, dann „Details“; Browser-Zurück schließt die Rolle mit dem Blatt.
- `src/ui/details-rows.js`: Zeile heißt „Verknüpfen mit“. Feste Reihenfolge der Chips: Arbeitsbereich (bzw. Eingang/Ressourcen), Projekt, dann der Rest in der Reihenfolge des Verknüpfens. Die ersten zwei Chips sind sichtbar, darunter „Mehr anzeigen (N)“ bzw. „Weniger anzeigen“. Beim Öffnen des Blatts ist wieder zugeklappt. Die Zeile ist eine Fläche mit Knopf für die Beschriftung (kein Knopf im Knopf); ein Tipp darauf öffnet weiter „Verknüpfen“.
- `src/ui/details-expand.js`: neu `expandDetailsFully()`; „Mehr anzeigen“ zieht das halb offene Blatt ganz auf.
- `styles/android-details.css`: Regeln für Beschriftung, „Mehr anzeigen“ und Drücken der Zeile.

## Begründung
- Das Details-Blatt lag auf Ebene 50 und damit über allen Rollen; es tiefer zu legen ist kleiner, als alle Rollen anzuheben.
- Verworfen: Knopf im Knopf (ungültiges HTML); feste Höhe der Chip-Zeile statt „Mehr anzeigen“.
- **Geltungsbereich:** Ebene und Escape/Zurück in allen Fassungen; Chips, Reihenfolge, „Mehr anzeigen“ und „Verknüpfen mit“ nur Android (iOS zeigt keine Chips).

## Visualisierung
Vorher:
```
┌──────────────────────┐
│ Kolloquium  Termin ▾ │  Tipp → Typ-Rolle liegt
│ Verknüpfen           │  HINTER dem Blatt
│ [Studium][Exposé]    │
│ [Umzug …][Sprachmemo]│
└──────────────────────┘
```

Nachher:
```
┌──────────────────────┐
│ Kolloquium  Termin ▾ │
│ Verknüpfen mit       │
│ [Studium][Umzug …]   │
│ Mehr anzeigen (2)    │
├──────────────────────┤
│ Typ ändern (sichtbar)│
│ [      Fertig      ] │
└──────────────────────┘
Reihenfolge: Arbeitsbereich → Projekt → Rest
```

## Hinweise
- Am Gerät testen: Zurück-Pfeil und Wischen nach unten bei offener Typ-Rolle; Erinnerung und Status über „Details“; Eintrag mit sehr vielen Verknüpfungen.
- Geändert sind nur die genannten Dateien, keine zentrale Datei, keine neue CSS-Datei.
