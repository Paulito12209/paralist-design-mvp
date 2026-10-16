# 2026-10-16-android-xool-plus-x

## Problem
Beim offenen Anlege-Blatt in „Android (Xool-DB)“ blieb die Leiste sichtbar und nur das Plus-Zeichen drehte sich. Gewünscht war es wie bei Spotify: die ganze App samt Leiste im Hintergrund, nur ein runder, gehobener ✕-Knopf an der Stelle des Plus, das Blatt darüber rundum abgerundet. Gilt nur für diese Fassung.

## Änderung
- **`styles/android-xool-create.css`:** der Schleier deckt wieder das ganze Gerät ab, auch die Leiste. Das Blatt endet 16px über der Oberkante der Leiste (8px Rand an den Seiten, rundum 28px gerundet). Neu ist der runde ✕-Knopf (56px, Kartenfläche, Schatten wie Plus und Regler) genau an der Stelle des Plus; beim Öffnen dreht sich das Plus-Zeichen darin zum ✕.
- **`src/shell/android-xool-create.js`:** der ✕-Knopf im Blatt; ein Tipp schließt wie der Schleier.
- **`styles/android-xool-nav.css`:** das Drehen des Plus in der Leiste entfällt (das ✕ liegt jetzt darüber).
- `src/data/platform-versions.js`: Zeile „Navigationsleiste“.

## Begründung
Nach dem Spotify-Vorbild aus dem Auftrag: die App tritt zurück, sichtbar bleiben nur Blatt und ✕. Verworfen: die Leiste frei lassen (das ✕ ging in der Leiste unter).

## Visualisierung
Vorher:
```
  ╭ Blatt ╮
 ▣  ▦  ✕  ☑  ☰   Leiste sichtbar, Plus gedreht
```

Nachher:
```
  ╭──────── Blatt ────────╮
  ╰───────────────────────╯
   (Leiste im Schleier)
            (✕)              runder Knopf an der Stelle des Plus
```

## Hinweise
- Testen: Plus tippen, ✕ tippen, Schleier tippen, Zurück, Chips; hell und dunkel; in Safari.
