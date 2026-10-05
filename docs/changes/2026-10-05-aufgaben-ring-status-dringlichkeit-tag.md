# 2026-10-05-aufgaben-ring-status-dringlichkeit-tag

## Problem
Der runde Haken einer offenen Aufgabe trug die bunte Farbe der Dringlichkeit, der Punkt darin hieß „In Arbeit“. Gewünscht war der neutrale graue Ring wie bei Google Tasks. Eine Begründung für die alte Aufteilung stand nirgends in `docs/changes/`, nur der Code-Kommentar „wie die Ringe um die Tage im Kalender“. Dazu waren die Feld-Icons für Status (Haken im Kreis) und Dringlichkeit (Flamme, die zugleich die Stufe „Jetzt“ war) nicht eindeutig.

## Änderung
- **Ring = Status, immer:** offen grau (`--status-open`), in Arbeit blau (`--cal-accent`), erledigt grün gefüllt mit Haken. Kein Punkt mehr im Ring (`src/ui/task-status.js`, `styles/tasks.css`). Die leere Zeile zum Anlegen trägt bei Gliederung nach Status die Spaltenfarbe, sonst Grau.
- **Dringlichkeit als Tag in der Nebenzeile** (`src/features/tasks/tasks-parts.js`): Reihenfolge Dringlichkeit (Flamme + Wort in Stufenfarbe), Fälligkeit, ein übergeordneter Ort. Bunt steht so nah am Ring, grauer Text folgt.
- **Nur ein Ort:** das Projekt, sonst der Arbeitsbereich. Liegt die Aufgabe in beiden, gewinnt das Projekt.
- **Gliederung nach Dringlichkeit** (Liste oder Board): das Dringlichkeits-Wort entfällt, der Spaltenkopf sagt es schon.
- **Icons** (`assets/icons/sprite-2.svg`, zentrale Datei): neu `status` (gestrichelter Punktkreis wie bei Notion) als Feld-Icon Status, `alarm` für die Stufe „Jetzt“; die Flamme ist das Feld-Icon der Dringlichkeit. Angepasst in `config-tasks.js`, `config-sorts.js`, `tasks-select-bar.js`, `filter-multi.js`, `details-rows.js`. Neu in den Icon-Packs (`icon-sets.js`): Alarm, Status, Priorität.
- **Vermerk:** `priority` (doppelter Pfeil nach oben) ist das Symbol für ein künftiges Feld „Priorität“, noch nirgends eingebaut, nicht mit der Dringlichkeit verwechseln.
- Zentrale Dateien berührt: `assets/icons/sprite-2.svg`.

## Begründung
Status bleibt immer der Ring, Dringlichkeit immer ein Tag: so ist die Bedeutung nie von der Gliederung abhängig. **Geltungsbereich:** alle Fassungen, Liste, Board und Desktop-Spalte. Verworfen: Punkt für die Dringlichkeit im Ring (auch nur im Board), Dringlichkeits-Icon je Stufe in der Nebenzeile, der Doppelpfeil als Dringlichkeits-Icon (das ist Priorität).

## Visualisierung
Vorher:
```
(◯ violett)  Irgendwann       (◉ rot) Jetzt, in Arbeit
 Bachelorarbeit · 03.10.
```

Nachher:
```
(◯ grau)  Literaturliste ergänzen
 🔥 Später · Bachelorarbeit
(◯ blau)  Gliederung mit Betreuerin
 🔥 Jetzt · 03.10. · Bachelorarbeit
Spaltenkopf:  ⏰ Jetzt
```

## Hinweise
- Mehrere Orte: nur einer wird gezeigt (Projekt vor Arbeitsbereich, sonst der erste).
- Am Gerät prüfen: Liste und Board nach Status und nach Dringlichkeit, hell und dunkel, Auswahlblatt mit dem Wecker bei „Jetzt“, Status-Icon in kleinen Größen.
