# 2026-10-05-aufgaben-zeilen-ziehen-kopf

## Problem
Auf der Aufgaben-Seite (Android) passte vieles nicht zusammen:
- Beim Halten einer Aufgabe zeigte die angehobene Zeile noch den Pfeil, war schmal und ohne Ring; bei Projekten sah dasselbe besser aus. Beim Ziehen erschien unten links der Archiv-Knopf als Ablageziel, der nicht mehr gewollt ist.
- Die Werkzeugzeile (Archiv, Sortieren, Filtern, Ansicht) war schmaler als die Zeilen darunter, schob sich 4px über die Liste und schnitt „Offen“ bzw. die Spaltenköpfe oben an.
- Das Board hatte dauerhaft den Griff mit sechs Punkten, kein Menü, keine Möglichkeit, Spalten auszublenden oder umzuordnen.
- Dringlichkeits-Icon, Kreis von „Offen“, ⓘ hinter „Alle“ und die Zahl im Gruppenkopf passten nicht.

## Änderung
- **Archiv-Knopf unten entfernt:** `src/shell/android-archive.js` gelöscht, Aufruf in `src/main.js` (zentral) raus. `src/ui/row-lift.js` kennt keine Ablageziele mehr, nur noch das Verschieben; `styles/android-archive.css` enthält nur noch die Seitenende-Regeln.
- **Aufgaben-Liste verschiebbar wie Projekte:** `data-reorder` an der Liste (`tasks-list.js`), Speichern über `setReorderSaver` (`row-reorder.js`) und `reorderTask` (`mutations-tasks.js`) mit derselben Sortiernummer wie im Board. Die Kopie der Zeile umfasst Ring und Inhalt und geht über die volle Breite (`row-lift.js`, `android-reorder.css`).
- **Werkzeugzeile:** reicht bis an den Geräterand, greift nicht mehr über die Liste (`android-card.css`); `--m3-card-head-pull` entfällt. Neu `--m3-card-head-group-gap` (4px) für die Luft vor „Offen“ und den Spaltenköpfen (`tokens-android.css`, zentral).
- **Gruppierte Liste:** Zahl steht direkt hinter dem Titel; ein Tipp auf die Überschrift klappt die Gruppe zu und auf (`tasks-list.js`, `tasks.js`, `tasks.css`), gemerkt bis zum Neuladen.
- **Icons** (`assets/icons/sprite-2.svg`, `sprite.svg`, zentral): neues Symbol `urgency` (Feuer) für Dringlichkeit überall, die Flamme bleibt für „Serie“; Kreis `circle` auf Radius 8.5 wie `check-circle`; neu `eye`, `eye-off`.
- **Board in Android:** drei Punkte rechts öffnen das Menü, der Griff „=“ erscheint nur beim Ziehen; gehalten wird die ganze Zeile (`tasks-board.js`, `projects-board.js`, `board-drag.js`, `list-clicks.js`, `swipe.js`, `android-reorder.css`). Kopf „Offen“ mit der Fläche der Navigationsleiste (`tasks-board.css`).
- **Blatt „Spalten“:** Halten auf einen Spaltenkopf öffnet ein Blatt mit allen Spalten, Griff zum Umordnen, Auge zum Ein-/Ausblenden, auch „Archiviert“ (anfangs aus). Neu `src/ui/columns-sheet.js`, `src/data/board-columns.js`, `styles/columns-sheet.css` (eingetragen in `index.html`, zentral, und `docs/styles-dateien.md`); gespeichert je Ansicht als `boardColumns` (`state.js`, zentral, `project-views.js`, `project-board.js`).
- **ⓘ hinter „Alle“** entfernt samt Klick, Text und Stilen; `--m3-tab-info-w` entfällt.
- Zentrale Dateien berührt: `src/main.js`, `index.html`, `src/data/state.js`, `styles/tokens-android.css`, `assets/icons/sprite.svg`, `assets/icons/sprite-2.svg`.

## Begründung
Zeilen verschieben, Menü und Ziehen im Board folgen nun einer Regel: Punkte für das Menü, Halten zum Verschieben, wie in den Listen. Ein eigenes Icon `urgency` lässt die Serie-Flamme unberührt. Ein Blatt für Spalten zeigt auch ausgeblendete, so kommt man immer an alle heran. **Geltungsbereich:** Verschieben, Punkte, Griff, Werkzeugzeilen-Abstand und Kopf „Offen“ nur in der Android-Fassung (unter 1024px); Spalten-Blatt in Aufgaben- und Projekt-Board; Icons, Zuklappen und ⓘ-Entfernung in allen Fassungen. Verworfen: Ablageziel Archiv beibehalten, Spaltensteuerung nur über die Karte „Ansicht“, ein Abstand von 12px über „Offen“.

## Visualisierung
Vorher:
```
[▭] 2 │ 8 Einträge     ⇅  ≡  ⫶     (schmaler als die Zeilen)
▔○ Offen▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ 7▔     (angeschnitten, Zahl rechts)
Board:  ○ Aufgabe              ⠿   (Griff immer sichtbar)
Halten: Pfeil ›, Archiv-Knopf unten links
```

Nachher:
```
[▭] 2 │ 8 Einträge     ⇅  ≡  ⫶     (volle Breite)
                                    ← 4px
◯ Offen 7 ⌄                         (klappbar)
Board:  ○ Aufgabe              ⋮   (Menü)
Halten: volle Karte mit Ring, Griff „=“, kein Archiv-Knopf
Halten auf Spaltenkopf → Blatt „Spalten“: = ◯ Offen 👁 · = ⟲ In Arbeit 👁 · = ▭ Archiviert 👁̸
```

## Hinweise
- Der Archiv-Knopf war auf der Seite eines Arbeitsbereichs der einzige Weg ins Archiv; dort geht es jetzt nur über die Karte „Archiv“ der Übersicht.
- Ziehen in der Liste schaltet die Sortierung auf „Erstellt“, wie im Board.
- Zugeklappte Gruppen werden nicht dauerhaft gemerkt; die Spalten des Boards lassen sich nicht zuklappen; „n Einträge“ zählt ausgeblendete Spalten mit.
- Am Gerät testen: Halten und Ziehen im Board (versehentliches Auslösen beim Wischen), Ziehen am Griff im Blatt „Spalten“, ⋮ in beiden Boards, Einrasten der Werkzeugzeile beim Scrollen, Feuer-Icon klein, hell und dunkel.
