# 2026-10-07-composer-typ-chip-rechts

## Problem
Im Eingabeblatt der Android-Fassung (z. B. „Neuer Termin“) stand der Typ-Chip
(Icon + Pfeil nach unten) links in der Knopfzeile, vor dem Ort-Chip „Eingang ▾“.
Er sollte rechts in die Zeile des Textfelds, weiterhin als ein Chip.

## Änderung
Nur `styles/android-composer.css` (rein CSS, kein Markup, kein JS):
- Textfeld füllt den Platz links vom Typ-Chip (`flex: 1 1 0`, `min-width: 0`).
- Typ-Chip steht rechts daneben in derselben Zeile (`order: 2`).
- `.composer::after` ist ein leerer Umbruch (12 px hoch) nach der Textzeile; Plus,
  Ort-Chip und „Speichern“ bzw. Mikrofon + Pfeil (Experiment) stehen darunter.
- `order`-Werte neu durchnummeriert, `row-gap: 0`, Datei-Header angepasst.

## Begründung
Das Markup bleibt unverändert, der Chip öffnet weiter dasselbe Typ-Menü; iOS und
Desktop sind unberührt. Gilt für „Android“ und „Android (Experiment)“, da es dort
dasselbe Element ist. Verworfen: CSS-Grid und Markup umbauen (berührt andere Fassungen).

## Visualisierung
Vorher:
```
┌──────────────────────────────────────┐
│ Neuer Termin                         │
│ (+) [📅 ▾] [⑂ Eingang ▾]   Speichern │
└──────────────────────────────────────┘
```

Nachher:
```
┌──────────────────────────────────────┐
│ Neuer Termin               [📅 ▾]   │
│ (+) [⑂ Eingang ▾]          Speichern │
└──────────────────────────────────────┘
```

## Hinweise
Am Gerät prüfen: Typ-Menü öffnet sich, Typwechsel (bei „Medium“ wird der Chip
breiter), langer Text im Feld. Die Textzeile ist durch den Chip (32 px) minimal höher.
