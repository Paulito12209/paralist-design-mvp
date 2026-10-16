# 2026-10-16-android-xool-plus-blatt-2

## Problem
Das Anlege-Blatt hinter dem Plus in „Android (Xool-DB)“ sollte mehr wie bei Spotify wirken (schwebend, rundum abgerundet), das Plus sollte sich zum ✕ drehen und sichtbar bleiben, die Abschnitte und Chips mussten überarbeitet werden. Gilt nur für diese Fassung.

## Änderung
- **Schwebendes Blatt** (`styles/android-xool-create.css`): 8px Rand an den Seiten und unten, rundum 28px gerundet; der Schleier deckt nur das Gerät bis zur Leiste ab, die Leiste bleibt frei.
- **Plus wird ✕** (`styles/android-xool-nav.css`): bei offenem Blatt dreht sich das Plus um 45°, auch bei weggeblendeter Leiste; der Regler blendet aus, solange Blatt oder Menü offen sind (`styles/android-xool-pages.css`).
- **Abschnitte** (`src/shell/android-xool-create.js`): „PARA“ heißt „Organisieren“; „Medien“ entfällt, dafür steht „Datei“ (Medium) bei den Ressourcen. Reihenfolge: Lernen, Organisieren, Ressourcen, Schnell erfassen.
- **Chips kleiner:** 34px statt 40px hoch, 15px Schrift, 8px Luft — kürzere Wege für den Daumen.
- **Icons für Lernen** (`assets/icons/sprite-2.svg`): `icon-mini-cards` (zwei Karten, Kartendeck) und `icon-mini-card` (eine Karte, Karteikarte) nach dem Zeichen der Xool-App.

## Begründung
Die Leiste frei zu lassen zeigt das ✕ und hält es tippbar; „Organisieren“ beschreibt Projekt und Arbeitsbereich besser als das Kürzel PARA. Verworfen: Foto, Video und Audio als eigene Chips (das Eingabefeld kennt nur „Medium“).

## Visualisierung
Vorher:
```
╭─────────────────────────────╮ Blatt bis an den Rand
│ Lernen … PARA … Medien … … │
╰─────────────────────────────╯ Leiste vom Schleier verdeckt
```

Nachher:
```
  ╭───────────────────────────╮  schwebend, 28px rund
  │ Lernen  (Karteikarte)(Kartendeck)
  │ Organisieren  (Projekt)(Arbeitsbereich)
  │ Ressourcen  (Dokument)(Zeichnung)(Lesezeichen)(Datei)
  │ Schnell erfassen  (Aufgabe)(Notiz)(Termin)
  ╰───────────────────────────╯
  ▣    ▦    ✕    ☑    ☰     Plus als ✕
```

## Hinweise
- Testen: Plus tippen (✕ erscheint), Schleier tippen schließt, ✕ tippen schließt, Chips öffnen das Eingabefeld, kleine Geräte (Blatt scrollt), hell und dunkel.
