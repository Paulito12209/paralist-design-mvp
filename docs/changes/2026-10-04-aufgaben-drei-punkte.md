# 2026-10-04-aufgaben-drei-punkte

## Problem
- Die Zeilen der Aufgabenliste hatten kein Drei-Punkte-Menü wie die Projekte; das Menü ging nur über gedrückt Halten auf.
- Im Auswahlmodus standen vor jeder Zeile zwei Kreise: der Auswahlkreis und der Status-Haken der Aufgabe — doppelt gemoppelt.

## Änderung
- `src/ui/rows.js`: `rowMore()` wird exportiert.
- `src/features/tasks/tasks-list.js`: Die Aufgabenzeile bekommt `rowMore()` ganz rechts (nach dem Pfeil, der in Android ausgeblendet ist). Kopfkommentar ergänzt.
- `styles/android-list.css`: Block für die Punkte der Aufgabenliste — oben bei der ersten Titelzeile (auf Höhe des Hakens), seitlich bündig mit den Punkten der Projekte, ohne die Zeile höher zu machen; im Auswahlmodus ausgeblendet.
- `styles/tasks-select.css`: Im Auswahlmodus der Liste ist der Haken-Knopf ausgeblendet, der Auswahlkreis steht an seiner Stelle.
- Zentrale Dateien berührt: keine.

## Begründung
- Das Verhalten kommt aus dem vorhandenen Mechanismus (`hasRowMore`, `[data-row-more]` in `src/ui/list-clicks.js`): Ein Tipp auf die Punkte öffnet das Menü der Aufgabe, gedrückt Halten öffnet keines mehr. Dafür war kein neuer Code nötig. „Auswählen“ steht weiter ganz oben im Menü.
- Der Haken tut im Auswahlmodus ohnehin nichts (ein Tipp wählt die Zeile); der Kreis ersetzt ihn.
- **Geltungsbereich:** Die drei Punkte gibt es nur in der Android-Fassung (beide Varianten) unterhalb von 1024px, iOS und Desktop bleiben. Das Ausblenden des Haken-Knopfs im Auswahlmodus gilt in allen Fassungen der Liste. Das Board ist unverändert: dort öffnet gedrückt Halten weiter das Menü.
- Verworfen: Punkte mittig in der Zeile (bei mehrzeiligen Titeln nicht mehr auf Höhe des Hakens).

## Visualisierung
Vorher:
```
○ Gliederung mit Betreuerin
  abstimmen
  02.10. · Bachelorarbeit

Auswahl:  ◉ ◉ Gliederung mit Betreuerin      ⋮
```

Nachher:
```
○ Gliederung mit Betreuerin      ⋮
  abstimmen
  02.10. · Bachelorarbeit

Auswahl:  ◉ Gliederung mit Betreuerin abstimmen
```

## Hinweise
- Am Gerät prüfen: Tippfläche der Punkte neben langen Titeln (der Titel endet etwa 36px früher), Wischen und Haken-Tippen, Auswahlmodus (Punkte weg, Tipp wählt, Ziehen über die Kreise, „Alle“).
- Im Auswahlmodus ist der Status (offen, in Arbeit, Dringlichkeit) nicht mehr am Ring zu sehen.
- Gedrückt Halten auf eine Aufgabenzeile in der Liste tut nichts mehr.
