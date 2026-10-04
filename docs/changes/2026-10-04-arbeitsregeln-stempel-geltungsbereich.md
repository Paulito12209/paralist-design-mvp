# 2026-10-04-arbeitsregeln-stempel-geltungsbereich

## Problem
Rückblick auf den 03./04.10.2026 (#120–#142) im Git Commit Manager:
- Fast jedes Paar offener PRs kollidierte in `src/data/version.js`, weil jede Sitzung den Versionsstempel selbst setzte. Dadurch war fast immer ein Sammel-Branch nötig, obwohl die PRs sonst keine gemeinsamen Dateien hatten.
- #122 (Sammel-PR) blieb liegen, obwohl „merge alle offenen“ gesagt war — §6 sagte nur „Sammel-PR anlegen“.
- #124 hatte den Geltungsbereich bewusst eng gewählt („nur Experiment, nur Übersicht“); das fiel erst am Gerät auf und brauchte einen Nachbau (#132).
- #123/#124: #123 schaffte `data-tabs` ab, #124 nutzte es — ein Konflikt ohne Git-Meldung, die Linie wäre still nie erschienen.
- Lokale Worktrees ließen sich nicht entfernen, weil die zugehörigen Sitzungen in der Claude-App noch liefen („locked … claude session“).
- Eingefügte Befehle mit `#`-Kommentarzeilen scheiterten in der zsh.

## Änderung
- `CLAUDE.md`:
  - §1 Punkt 7 (neu): Geltungsbereich vorher klären, im Zweifel gilt eine Verbesserung überall.
  - §2, §4: Arbeits-Sitzungen fassen den Versionsstempel nicht mehr an; `check.py` muss mit „alles in Ordnung“ beginnen.
  - §5: Neue CSS-Datei steht an zwei Stellen (`index.html`, Liste in `styles/tokens.css`); die Dateiliste im Stempel ergänzt der Git Commit Manager.
  - §6: Sammel-PR wird im selben Durchgang gemergt; neuer Schritt „Konflikte ohne Git-Meldung suchen“ (`git grep` auf entfernte Namen); neuer Schritt „Versionsstempel setzen“ einmal am Ende des Durchgangs (im Sammel-Branch oder als eigener Stempel-PR); Abschlussliste nennt je PR den Geltungsbereich; kleine Fixes auf ausdrückliche Bitte erlaubt (mit Review, Freigabe, Doku).
  - §7: gesperrte Worktrees erklärt (Sitzung in der App schließen, `git worktree unlock`, nie `remove -f -f`).
  - §8: Befehle für mich ohne `#`-Kommentarzeilen.
- `tools/check.py`: veralteter Stempel ist ohne Schalter nur ein Hinweis („alles in Ordnung (Versionsstempel setzt der Git Commit Manager)“); mit `--stempel` zählt er als Fund.
- `tools/version.py`: Kopfkommentar — wer das Skript wann aufruft.
- `.claude/skills/paralist-clean-code/SKILL.md` (§7 Schritt 1, §8) und `README.md` (Prüfliste): an den neuen Ablauf angepasst.
- Zentrale Dateien: `CLAUDE.md`, Skill, `tools/check.py`.

## Begründung
Der Stempel ist ein Prüfwert über alle ausgelieferten Dateien. Setzt ihn jede Sitzung, kollidieren zwei PRs immer; setzt ihn einer am Ende, nie. Die meisten PRs lassen sich dann direkt auf GitHub mergen. Verworfen: eine Git-Einstellung (`.gitattributes` mit eigenem Merge-Treiber), die Konflikte in der Datei automatisch löst — sie wirkt nur lokal, nicht beim Mergen auf GitHub.

## Visualisierung
Vorher:
```
Sitzung A: Code + version.py ─┐
Sitzung B: Code + version.py ─┤
                              ▼
CM: #A direkt ✓
    #B Konflikt version.js ✗ → Sammel-Branch → Sammel-PR (blieb liegen)
```

Nachher:
```
Sitzung A: Code ─┐
Sitzung B: Code ─┤
                 ▼
CM: #A direkt ✓, #B direkt ✓
    → Stempel-PR: version.py + check.py --stempel → gleich mergen
```

## Hinweise
- Zwischen den Merges und dem Stempel-PR hat `main` kurz einen veralteten Stempel; erst nach dem Stempel-PR ausliefern (FTP), sonst zeigt die App kein „Neue Version verfügbar“.
- Ältere offene PRs, die den Stempel noch selbst setzen, löst der Git Commit Manager wie bisher mit `version.py`.
- Laufende Sitzungen kennen die neuen Regeln erst, wenn sie `origin/main` holen.
