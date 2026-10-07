# 2026-10-07-aufgaben-spalten-direkt-bearbeiten

## Problem
In der Aufgaben-Liste („Alle“) standen am Desktop Datum, Dringlichkeit und Verknüpfung weit auseinander, rechts in jeder Zeile saß ein Pfeil, obwohl ein Klick auf den Titel die Aufgabe ohnehin öffnet. Keine Angabe ließ sich direkt in der Liste ändern.

## Änderung
- `src/features/tasks/tasks-parts.js`: Die drei Spalten sind eigene Knöpfe in der Reihenfolge Datum, Dringlichkeit, Verknüpfung. Fehlt eine Angabe, steht ein blasses Icon da, sichtbar erst beim Überfahren der Zeile (so lässt sich auch ein fehlendes Datum oder ein fehlender Ort setzen). `mainPlace()` ist exportiert, damit Liste und Ort-Wähler dieselbe Regel nutzen.
- `src/features/tasks/tasks-list.js`: Die Spalten stehen neben dem Zeilen-Knopf statt darin (ein Knopf im Knopf wäre ungültiges HTML).
- `src/features/tasks/tasks-col-edit.js` (neu): Ein Klick öffnet die vorhandene Auswahl — Datum: `openDateField` (wie in der Karte „Details“, an der Spalte aufgeklappt); Dringlichkeit: das kleine Menü `openCtxMenu` direkt daneben; Verknüpfung: `openPlacePicker` („Ablegen in“) mit `placeEntries`.
- `src/ui/task-status.js`: neue Funktion `openPriorityMenu`, dieselben Stufen wie im Blatt.
- `src/features/tasks/tasks.js`: nimmt den Klick auf eine Spalte an, nach dem Auswahlmodus (dort wählt ein Klick weiter aus).
- `styles/tasks-desk.css`: ab 1024px kein Pfeil, Spalten schmaler (60/104/140 statt 72/104/150) und ganz rechts, Datum rechtsbündig dicht vor der Dringlichkeit, Tönung je Angabe beim Überfahren. Neue Werte `--task-col-gap`, `--task-col-pad`, `--task-col-h`.
- Keine zentralen Dateien berührt.

## Begründung
Feste Spaltenbreiten halten die Angaben untereinander bündig; das rechtsbündige Datum rückt sie trotzdem eng zusammen. **Geltungsbereich:** nur Desktop ab 1024px, alle Fassungen; am Handy bleibt alles wie bisher (iPhone mit Pfeil, Android mit drei Punkten). Verworfen: Spalten nach Inhalt breit (nicht mehr bündig), ein eigenes kleines Menü für Orte (wäre eine zweite Ort-Logik, bei vielen Orten zu lang), eine neue Datumsauswahl mit wirklich optionaler Uhrzeit (zweite Logik).

## Visualisierung
Vorher:
```
◯ Gliederung mit Betreu…   05.10.      🔥Jetzt       Bachelorarbeit      ›
◯ Bad putzen                           🔥Irgendwann  Haushalt            ›
```

Nachher:
```
◯ Gliederung mit Betreuerin…   05.10. 🔥Jetzt        Bachelorarbeit
◯ Bad putzen                  [📅]    🔥Irgendwann  Haushalt
                                ↑ blass, nur beim Überfahren
Klick „Jetzt“          → kleines Menü daneben: Jetzt / Als Nächstes / ✓ Später / Irgendwann
Klick „05.10.“         → Auswahl Tag + Uhrzeit an der Spalte
Klick „Bachelorarbeit“ → Blatt „Ablegen in“
```

## Hinweise
- Die Datumsauswahl wählt Tag und Uhrzeit in einem Zug; ohne Uhrzeit schlägt sie 09:00 vor und speichert diese mit (wie in der Karte „Details“).
- „Ablegen in“ ersetzt alle Orte der Aufgabe (wie bei mehreren gewählten Aufgaben), ohne „Rückgängig“.
- Am Mac testen: Datumsauswahl des Systems an der Spalte, Menü der Dringlichkeit, Ort wechseln, Auswahlmodus (Klick auf Spalte wählt die Zeile), hell und dunkel.
