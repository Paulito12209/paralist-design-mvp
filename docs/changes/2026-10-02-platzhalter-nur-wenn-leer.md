# 2026-10-02-platzhalter-nur-wenn-leer

## Problem
In der Android-Fassung stand „Projekt hinzufügen“ immer unter der Projektliste, im Board als abgetrennte Zeile unter allen Spalten. Das wirkte isoliert und war neben „Neu“ und dem Tipp in die freie Fläche überflüssig.

## Änderung
- `src/features/overview/projects.js`: Die Zeile „Projekt hinzufügen“ steht auf Android nur, solange die gewählte Ansicht kein Projekt zeigt; kein Satz mehr darüber. Im Board entfällt der Bereich unter den Spalten.
- `src/features/overview/projects-board.js`, `styles/projects-board.css`: In einer leeren Spalte steht statt „Nichts hier“ die blasse Zeile „Projekt hinzufügen“; sie verschwindet, sobald ein Projekt darin liegt.
- `src/features/overview/project-inline.js`, `src/data/mutations-tasks.js`: Ein Tipp auf die Zeile öffnet die Eingabezeile (Liste oder Spalte). Ein Projekt aus einer Spalte bekommt deren Status bzw. Dringlichkeit (`createProjectInline(title, viewId, column)`).
- `src/features/tasks/tasks-board.js`, `src/features/tasks/tasks-inline.js`, `styles/tasks-board.css`: Im Aufgaben-Board dieselbe blasse Zeile „Neue Aufgabe“ in leeren Spalten (nicht in „Archiviert“, nicht im Auswahlmodus).
- `src/features/tasks/tasks-list.js`: Siebt der Filter alles aus, steht auf Android wieder die Geisterzeile statt des Satzes.
- `src/data/version.js`: neuer Versionsstempel.
- Zentrale Datei berührt: nur `src/data/version.js`.

## Begründung
- Der Platzhalter erscheint nur dort, wo nichts liegt; alles Weitere läuft über „Neu“ und den Tipp in die freie Fläche.
- iOS bleibt unverändert (Zeile unter der Liste, „Nichts hier“, Satz).
- Verworfen: ein Hinweistext unter der leeren Liste; ein Tipp in die freie Fläche unter dem Projekt-Board (dort steht keine Liste mehr).

## Visualisierung
Vorher:
```
 Offen 7        │ In Arbeit      │
 🚀 Test 1   ⠿  │ Nichts hier    │
 🚀 Test 2   ⠿  │                │
────────────────────────────────────
 🚀+ Projekt hinzufügen   ← abgetrennt
```

Nachher:
```
 Offen 7        │ In Arbeit 0    │ Erledigt 0
 🚀 Test 1   ⠿  │ 🚀+ Projekt    │ 🚀+ Projekt
 🚀 Test 2   ⠿  │   hinzufügen   │   hinzufügen
```
Leere Projektliste:
```
Archiv                 ⇅  ⛛
🚀+ Projekt hinzufügen
```

## Hinweise
- Nicht geprüft: Ziehen im Board mit Platzhalter in der Zielspalte, Board nach Dringlichkeit, „Android (Experiment)“.
- Ein Projekt, das in „Erledigt“ angelegt wird, entsteht direkt als erledigt (`applyTaskStatus`).
- Task-Zeile heißt „Neue Aufgabe“, Projekt-Zeile „Projekt hinzufügen“ — bei Bedarf angleichen.
- Der Ring im Aufgaben-Board ist etwas größer als das Symbol im Projekt-Board.
