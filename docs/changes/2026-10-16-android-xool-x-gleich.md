# 2026-10-16-android-xool-x-gleich

## Problem
Der ✕-Knopf des Anlege-Blatts in „Android (Xool-DB)“ sollte Größe und Farbe des Plus-Zeichens behalten, aus dem er wird. Gilt nur für diese Fassung.

## Änderung
- **`styles/android-xool-create.css`:** das Zeichen im ✕-Knopf hat die Farbe des Plus in der Leiste (`--m3-xo-level`, Silberblau) statt der Schriftfarbe; es bleibt 24px groß wie das Plus und wird nur um 45° gedreht.

## Begründung
Gemessen: Plus und ✕ haben dieselbe Farbe (rgb 169, 201, 255 im Dunkeln) und dasselbe 24px-Zeichen.

## Visualisierung
Vorher:
```
 Plus: silberblau, ✕: schwarz
```

Nachher:
```
 Plus: silberblau, ✕: silberblau, gleiche Größe
```

## Hinweise
- Hell und dunkel ansehen: das ✕ folgt der Farbe des Plus in beiden Themes.
