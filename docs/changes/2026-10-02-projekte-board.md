# 2026-10-02-projekte-board

## Problem
Die Aufgaben-Seite hat ein Layout „Liste | Board“, die Projekte nur die Liste. Projekte tragen schon Status und Dringlichkeit, ließen sich aber nicht als Kanban-Board ansehen und verschieben.

## Änderung
- Neu: `src/ui/board-drag.js` (das Ziehen aus `tasks-drag.js`, jetzt gemeinsam), `src/data/project-board.js` (Spalten aus `visibleProjects(view)`, Ablegen setzt Status/Dringlichkeit und merkt die Reihenfolge), `src/features/overview/projects-board.js` (Karten, Klick, Ziehen), `styles/projects-board.css`.
- Geändert: `src/features/tasks/tasks-drag.js` (nur noch Adapter, Verhalten unverändert), `src/features/overview/projects.js` (Board statt Zeilen bei `layout === "board"`), `src/features/overview/project-settings.js` (Zeilen „Layout“ und „Spalten nach“), `src/features/overview/project-card.js` (Symbol „Ansicht“ auch bei „Alle“), `src/data/config.js` und `src/data/project-views.js` (Felder `layout`, `group`), `index.html` und `styles/tokens.css` (neues Stylesheet).
- Zentrale Dateien: `index.html`, `styles/tokens.css`, `src/data/config.js`, `src/data/project-views.js`.

## Begründung
- Spalten nach Status (Vorgabe) oder Dringlichkeit, wie `taskGroupings` bei den Aufgaben.
- Das Ziehen wird geteilt statt kopiert; es liegt in `src/ui`, weil Features sich nicht gegenseitig importieren dürfen.
- Das Board setzt auf `visibleProjects(view)` auf, die Filter der Ansicht wirken also automatisch mit.
- „Erledigt“ setzt bei Projekten nur den Status, archiviert nicht.
- „Alle“ filtert weiter nicht, merkt sich aber Layout und Spalten; dafür hat „Alle“ in der Android-Werkzeugzeile jetzt das Symbol „Ansicht“. Handverlesene Ansichten (`ids`) zeigen genau diese Projekte.
- Verworfen: Anlegen per Tipp in die Spalte; neue Projekte entstehen über „Projekt hinzufügen“ unter dem Board.

## Visualisierung
Vorher:
```
Archiv          ⇅   ⛛
🚀 Website relaunch
🚀 Umzug
🚀 Steuer 2026
+ Projekt hinzufügen
```

Nachher:
```
Archiv          ⇅   ⛛
○ Offen 2   │ ◔ In Arbeit 2 │ ✓ Erledigt
🚀 Steuer ⠿ │ 🚀 Buch   ⠿   │
🚀 Umzug  ⠿ │ 🚀 Website ⠿  │
+ Projekt hinzufügen
```

## Hinweise
- Nicht geprüft: Desktop, iOS-Layout, „Android (Experiment)“, Wischen am Board-Rand, Tippen in die freie Fläche im Board.
- Ziehen im Board stellt die Ansicht auf „Eigene Reihenfolge“, wie das Verschieben in der Liste.
- Zu testen: Ziehen mit dem Finger, weite Wege (Mitrollen), Wechsel Liste/Board, Browser-Zurück, alter Speicherstand ohne `layout`/`group`.
