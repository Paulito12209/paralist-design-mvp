# 2026-10-06-cloud-statt-worktree

## Problem
Die Notiz „Sitzungen anlegen und Worktrees aufräumen“ in `CLAUDE.md` nannte die
Cloud nur „am besten“ und empfahl lokal den Haken „Worktree“. Trotzdem entstanden
Worktrees auch ohne Haken: einer über eine Aufgaben-Karte, die lokal gestartet
wurde, einer offenbar von der Sitzung selbst angelegt. Jeder musste auf dem Mac
von Hand aufgeräumt werden; die automatische Aufräum-Zeile scheiterte an den
Leerzeichen im Projektpfad.

## Änderung
Nur `CLAUDE.md` (zentrale Datei), Abschnitt 7, Notiz „Sitzungen anlegen und
Worktrees aufräumen“:
- Arbeits-Sitzungen laufen grundsätzlich in der Cloud, vom Handy wie vom Laptop.
  Kollisionen löst der Git Commit Manager, der Mac-Ordner bleibt auf `main` und
  holt den Stand nur mit `git pull origin main`.
- Lokal ist die Ausnahme. Neue Regel für jede Sitzung: keinen Worktree selbst
  anlegen, Aufgaben-Vorschläge (Karten) mit „in der Cloud starten“ versehen.
- Aufräum-Befehle: Hinweis auf den Ordnernamen (Pfad mit Leerzeichen) und
  zusätzlich `git branch -d <branch>`.

## Begründung
Eine Einstellung, die neue Worktrees abschaltet, gibt es laut Doku von Claude
Code nicht; der Haken wird je Sitzung gesetzt. Die Cloud vermeidet das Problem
ganz. Die Regel steht in der Notiz, die ich ohnehin lese, und gilt zugleich für
jede Sitzung. Verworfen: eine automatische Aufräum-Zeile über alle Worktrees
(scheitert an Leerzeichen im Pfad), zwei lokale Threads im selben Ordner (ein
Ordner hat nur einen Branch, zentrale Dateien kollidieren).
**Geltungsbereich:** nur Arbeitsregeln, kein Code, keine Fassung der App.

## Visualisierung
Vorher:
```
Neue Sitzungen am besten in der Cloud.
Lokal nur mit Haken „Worktree“, nie direkt im Hauptordner.
Aufräumen: worktree list / remove / prune, checkout main / pull
```

Nachher:
```
Arbeits-Sitzungen laufen in der Cloud (Handy und Laptop).
Mac bleibt auf main, nur „git pull origin main“.
Lokal = Ausnahme. Jede Sitzung: keinen Worktree selbst anlegen,
Karten mit „in der Cloud starten“.
Aufräumen (Ordnername, Pfad hat Leerzeichen):
  worktree list / remove / prune, checkout main / pull, branch -d <branch>
```

## Hinweise
Kein Code betroffen. Eine lokale Sitzung bleibt möglich, gilt aber als Ausnahme.
