# 2026-10-06-zeichnen-leiste-kompakt

## Problem
Nachbesserungen an der Werkzeugleiste der Zeichnung am Desktop
(2026-10-06-zeichnen-werkzeugleiste-desktop):
- Die Leiste zog ihre Knöpfe über die ganze Länge der Fläche auseinander
  (große Lücken).
- Der Ring um die gewählte Farbe war bei Schwarz im Dunkelmodus unsichtbar.
- Wie am iPad sollen Auswählen, Stifte und Farben erst über einen Stift-Knopf
  aufklappen; vorher wird nicht gemalt. Eingeklappt bleibt die Leiste klein.
- Auf Tablets ohne angeschlossene Tastatur stauchte die Bildschirmtastatur
  die Zeichenfläche, und die linke Leiste wechselte ihre Form.

## Änderung
- `styles/drawing-desk.css`: Leiste kompakt und mittig zur Fläche (unten
  waagerecht, links senkrecht); `is-ink-open` blendet den Zeichenteil ein.
- `src/features/drawing/draw-desk-bar.js`: Stift-Knopf (`data-draw-ink`) mit
  Apple-ähnlichem Markup-Symbol; `startTool()` — am Desktop startet jede
  Zeichnung eingeklappt mit „Auswählen“, am Handy wie bisher mit dem Stift.
- `src/features/drawing/draw-state.js`: `inkMode`, `lastInk`; Text, Notiz und
  Form beenden den Zeichenmodus.
- `src/features/drawing/draw-icons.js`: Symbol `markup` (Kreis mit
  Füllerspitze nach unten).
- `src/features/drawing/draw-bar-fit.js`: misst nicht, solange die
  Bildschirmtastatur offen ist; nach dem Schließen neu.
- `src/features/entry/entry-fold.js`: Zeichenfläche behält bei offener
  Bildschirmtastatur ihre Höhe (gemeinsame Datei).
- `src/features/drawing/draw-paint.js` (neu): Strichmalen aus `drawing.js`
  ausgelagert (363 → 316 Zeilen).
- `styles/drawing.css`, `drawing-pop.css`, `tokens-entry.css`: neuer Wert
  `--draw-active-ring` (Textfarbe) für den Ring der gewählten Farbe.

## Begründung
Kompakt statt gestreckt, wie gewünscht; „⋯“ nur, wenn selbst die kompakte
Leiste nicht passt. Der Ring in Textfarbe ist in Hell und Dunkel immer zu
sehen. Die Tastatur-Sperre nutzt `ui.keyboardOpen` aus
`src/shell/keyboard-inset.js` und greift nur bei einer Zeichnung.
**Geltungsbereich:** Desktop-Ansicht ab 1024 px (auch Tablets im Querformat);
das Handy behält die schlanke Leiste.

## Visualisierung
Vorher:
```
(⠿    ↶ ↷    ➚ ✎ 🖍 ⌫    ●●●●● ◍    ◇ T 🗒 📎)   ← über die ganze Breite gestreckt
```

Nachher:
```
Eingeklappt:  ⠿ │ ↶ ↷ │ (▽) │ ◇ T 🗒 📎
Aufgeklappt:  ⠿ │ ↶ ↷ │ (▽) │ ➚ ✎ 🖍 ⌫ │ (●)●●●● ◍ │ ◇ T 🗒 📎
              (▽) = Stift-Knopf, (●) = Ring um die gewählte Farbe
```

## Hinweise
- Malen am Desktop erst nach Klick auf den Stift-Knopf — so gewollt.
- Die echte Bildschirmtastatur ließ sich im Browser nicht auslösen; bitte am
  Tablet im Querformat einen Zettel beschriften und prüfen, dass Fläche und
  Leiste stehen bleiben.
