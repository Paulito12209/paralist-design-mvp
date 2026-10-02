# 2026-10-02-git-commit-manager-sitzung

## Problem
Die Sammel-Sitzung zum Zusammenführen mehrerer Branches hatte keinen festen
Namen und keinen Ablauf für das Wiederkommen mit neuen Threads. Da immer
dieselbe Sitzung für alle Merges genutzt wird, braucht sie eine erkennbare
Namenskonvention und eine Regel, den Stand bei jedem Besuch frisch zu holen.

## Änderung
`CLAUDE.md`, Abschnitt 6 „Sammel-Sitzung ‚Git Commit Manager‘“:
- Name verbindlich `Git Commit Manager JJJJ-MM-TT` (Anlagedatum, Berliner Zeit);
  die Sitzung setzt ihren Titel beim Start selbst mit `set_session_title`.
- Threads werden nach PR-Nummer benannt; beim Start und bei jedem Wiederkommen
  wird `origin/main` neu geholt und die Liste offener PRs frisch gezogen.
- Je Durchgang: Doku lesen, einzeln mergen, nach jedem Merge `tools/check.py`,
  bei Konflikt stoppen, am Ende Liste übernommen/ausgelassen mit Nummer und Titel.
- Die Sitzung schreibt keinen Code und braucht keine eigene Doku-Datei.

## Begründung
Der Titel ist das Einzige, was sich aus dem Repository heraus vorschreiben
lässt; die Sitzung muss ihn selbst setzen. „Bei jedem Wiederkommen frisch
holen“ ist nötig, weil zwischen zwei Besuchen andere Threads gemergt haben.

## Visualisierung
Vorher:
```
Thread A, B, C ─► irgendeine Sitzung: „führe zusammen“
```

Nachher:
```
PR 66, 67, 70 ─► „Git Commit Manager 2026-10-02“: merge 66, 67, 70
                        │ später:
PR 71, 72     ─► dieselbe Sitzung: „merge die neuen außer 72“
```

## Hinweise
Keine Code-Änderung. `CLAUDE.md` wird von allen Sitzungen gelesen.
