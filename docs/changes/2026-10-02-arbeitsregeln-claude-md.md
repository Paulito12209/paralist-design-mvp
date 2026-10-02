# 2026-10-02-arbeitsregeln-claude-md

## Problem
Die CLAUDE.md enthielt nur die Code-Regeln und verlangte „nach jeder Änderung
sofort committen“. Der gewünschte Ablauf (Sitzungsstart mit Datum und Titel,
eine Aufgabe je Sitzung, Review-Zusammenfassung vor dem Commit, Doku-Datei,
Pull Request, Sammel-Sitzung) fehlte und widersprach Abschnitt 8 des Skills.

## Änderung
- `CLAUDE.md` neu aufgebaut: Sitzungsstart, Arbeitsregeln, Review-Zusammenfassung,
  Ablauf nach Freigabe mit Doku-Vorlage, Kurzfassung der Code-Regeln,
  Sammel-Sitzung, Entwicklungsserver, Allgemeines.
- `.claude/skills/paralist-clean-code/SKILL.md`: Abschnitt 8 heißt jetzt
  „Committen erst nach Freigabe“ und verweist auf CLAUDE.md; die Beschreibung
  im Kopf sagt nicht mehr „Commit nach jeder Änderung“.
- Dieser Ordner `docs/changes/` entsteht mit dieser Datei.

## Begründung
Der Skill gilt als verbindlich. Ohne Anpassung hätte jede Sitzung zwei
widersprüchliche Anweisungen gelesen. Verworfen: die Code-Regeln ganz aus
CLAUDE.md streichen — die Kurzfassung bleibt, weil sie das Erste ist, was eine
Sitzung sieht.

## Visualisierung
Vorher:
```
CLAUDE.md: Projektzweck, 5 Code-Punkte, „sofort committen“, Server
Skill §8:  „Sofort committen, ohne nachzufragen.“
```

Nachher:
```
CLAUDE.md: 1 Sitzungsstart  2 Während der Arbeit (kein Commit)
           3 Review          4 Nach Freigabe: Doku + Commit + PR
           5 Code-Regeln     6 Sammel-Sitzung  7 Server  8 Allgemein
Skill §8:  „Committen erst nach Freigabe“ → verweist auf CLAUDE.md
```

## Hinweise
- Beide Dateien werden von allen Sitzungen gelesen; parallel laufende
  Sitzungen arbeiten bis zum Merge noch nach dem alten Ablauf.
- Die Cloud-Umgebung bindet in jeder Sitzung einen Stop-Hook ein
  (`~/.claude/launcher-settings.json` → `stop-hook-git-check.sh`), der am
  Ende jeder Antwort „please commit and push“ verlangt. Er liegt außerhalb
  des Repositories und lässt sich von hier nicht abschalten. CLAUDE.md und
  Skill sagen deshalb ausdrücklich: diese Meldung ist keine Freigabe.
- Cloud-Sitzungen haben vorgegebene Branch-Namen (`ccr-…`), daher „falls wählbar“.
