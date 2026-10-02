# 2026-10-02-leisten-am-seitenende

## Problem
In der Android-Fassung kamen Suchleiste und Navigationsleiste ganz unten
gescrollt nur auf der Eintragsseite und im Kalender zurück. Auf allen anderen
Seiten (Start mit Projekten, Aufgaben, Medien, Sammlungen) blieben sie weg,
bis man wieder ein Stück nach oben wischte.

## Änderung
- `src/shell/android-bars.js`: `atPageEnd()` prüft das Seitenende jetzt auf
  jeder Seite, nicht nur bei `entry` und `calendar`. Das Stundenraster des
  Kalenders behält seine eigene Prüfung. Kommentar-Header angepasst.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Ein- und Ausklappen der Leisten soll auf allen Seiten gleich funktionieren.
Alle übrigen Seiten enden schon mit genug Platz für Leiste, Plus-Knopf und
Abstände (`--m3-content-end`), darum verdeckt die zurückkehrende Leiste
nichts — eine CSS-Änderung war nicht nötig. Die Beschränkung auf zwei Seiten
stammte nur daher, dass das Verhalten dort zuerst gebraucht wurde.

## Visualisierung
Vorher (Startseite, ganz unten):
```
┌────────────────────┐
│ Test 7             │
│ Test 8             │
│ Test 9             │
│ Test 10            │
│                    │
│               [ + ]│
│                    │
└────────────────────┘
```

Nachher (Startseite, ganz unten):
```
┌────────────────────┐
│ (●)  [ Suchen ]  ◯ │
│ Test 7             │
│ Test 8             │
│ Test 9             │
│ Test 10            │
│          [+ Neu]   │
│ ▣   ▢   ☑   ▤      │
└────────────────────┘
```

## Hinweise
- Seiten, die nur knapp länger als der Bildschirm sind, verstecken die
  Leisten oft gar nicht mehr, weil man sofort am Ende ist.
- Im Testbrowser nur mit simuliertem Scrollen geprüft; auf dem Pixel echtes
  Wischen mit Schwung bis ganz unten testen.
