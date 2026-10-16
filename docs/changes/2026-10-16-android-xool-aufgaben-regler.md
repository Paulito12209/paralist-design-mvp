# 2026-10-16-android-xool-aufgaben-regler

## Problem
Der Regler (Ansicht) der Aufgaben sollte wie im Kalender ein runder Knopf über der Leiste sein, der bei weggeglittener Leiste zur Pille neben dem Plus wird. Außerdem schloss in iOS Safari (Simulator) ein Tipp auf den Schleier hinter Plus-Blatt und Menü nichts. Gilt nur für „Android (Xool-DB)“.

## Änderung
- **`styles/android-xool-pages.css`:** die Regeln für den Regler gelten jetzt auch für den Knopf „Ansicht“ in der Werkzeugzeile der Aufgaben (`#view-tasks [data-card-tool="view"]`); „Sortieren“ bleibt in der Zeile.
- **`styles/android-xool-create.css`, `styles/android-xool-drawer.css`:** `cursor: pointer` auf dem Schleier (das Blatt selbst `cursor: default`) — iOS Safari meldet Tipper auf einer Fläche nur dann als Klick, wenn sie klickbar aussieht.
- `src/data/platform-versions.js`: Zeile „Kalender und Aufgaben“.

## Begründung
Dieselbe Mechanik wie im Kalender (ein Knopf, fest am Gerät, Pille per `left`); die Aufgaben haben dafür keinen eigenen Knopf nötig. Verworfen: den Sortierknopf ebenfalls auslagern.

## Visualisierung
Vorher:
```
 ▤ 1 | 9 Einträge        ⇅  ⚙
 ...Aufgaben...
 ▣  ▦  ✚  ☑  ☰
```

Nachher:
```
 ▤ 1 | 9 Einträge        ⇅
 ...Aufgaben...
          (⚙)             runder Regler
 ▣  ▦  ✚  ☑  ☰
 Leiste weg:  (✚)  ( ⚙ Ansicht )
```

## Hinweise
- Testen: Regler öffnet das Blatt „Ansicht“, Pille beim Wegscrollen, Schleier schließt Plus-Blatt und Menü auch in Safari.
