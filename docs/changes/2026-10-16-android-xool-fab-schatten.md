# 2026-10-16-android-xool-fab-schatten

## Problem
In „Android (Xool-DB)“ warf die Pille „Ansicht“ einen größeren Schatten nach unten als das runde Plus daneben; beide sollten gleich aussehen. Gilt nur für diese Fassung.

## Änderung
- **`styles/tokens-android-dark.css`:** neuer Wert `--m3-xo-fab-shadow` (0 2px 6px, 25 % Schwarz) für beide Knöpfe.
- **`styles/android-xool-nav.css`** (Plus) und **`styles/android-xool-pages.css`** (Regler, vorher 0 4px 12px): beide lesen den Wert. Fläche (`--m3-xo-ind`) und Höhe (56px) waren schon gleich; die Lage bleibt, wie sie ist.

## Begründung
Ein gemeinsamer Wert hält die zwei Knöpfe dauerhaft gleich, auch wenn man den Schatten später ändert.

## Visualisierung
Vorher:
```
 (✚)   ( ⚙ Ansicht )   Schatten der Pille deutlich größer
```

Nachher:
```
 (✚)   ( ⚙ Ansicht )   gleicher, kleiner Schatten
```

## Hinweise
- Am Gerät prüfen: beide Knöpfe nebeneinander bei weggeblendeter Leiste, hell und dunkel.
