# 2026-10-02-skill-git-commit-manager

## Problem
Die Regel zur Sammel-Sitzung „Git Commit Manager JJJJ-MM-TT“ stand nur in
`CLAUDE.md`, Abschnitt 6. Der Skill-Abschnitt 8 zum Committen erwähnte das
Zusammenführen nicht, und nirgends stand ausdrücklich, dass Arbeits-Sitzungen
nicht selbst mergen.

## Änderung
`.claude/skills/paralist-clean-code/SKILL.md`, Abschnitt 8: neuer Punkt
„Zusammenführen nur in der Sammel-Sitzung ‚Git Commit Manager JJJJ-MM-TT‘“
mit Kurzfassung des Ablaufs (Titel setzen, `origin/main` holen, offene PRs
listen, nach Nummer einzeln mergen, `tools/check.py` nach jedem Merge) und dem
Satz „Arbeits-Sitzungen mergen nie selbst“.

## Begründung
Kurzfassung mit Verweis statt Kopie, damit die Regel nur in CLAUDE.md gepflegt
wird. Der Satz zu Arbeits-Sitzungen schließt eine Lücke, die bisher nicht
ausdrücklich geregelt war.

## Visualisierung
Vorher:
```
Skill §8: nicht selbst committen · nach Freigabe Doku + PR ·
          eigene Blöcke stagen · Ablehnung: nichts · kein stash/reset/force
```

Nachher:
```
Skill §8: … · Ablehnung: nichts ·
          Mergen nur im „Git Commit Manager“, Arbeits-Sitzungen mergen nie  ← neu
          · kein stash/reset/force
```

## Hinweise
Keine Code-Änderung. Der Skill wird von allen Sitzungen gelesen.
