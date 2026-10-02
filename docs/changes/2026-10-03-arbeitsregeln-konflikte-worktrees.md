# 2026-10-03-arbeitsregeln-konflikte-worktrees

## Problem
Am 2. Oktober liefen rund 50 Pull Requests durch den „Git Commit Manager“.
Dabei fielen vier Muster auf, die Arbeit und Nachfragen gekostet haben:
- Echte Merge-Konflikte entstanden, weil Threads von einem alten `main`
  abzweigten (#84 gegen #80/#81, #113 gegen #104, #115 gegen #111).
- Zwei Threads schrieben in denselben Branch und damit in denselben PR (#104),
  weil beide im selben lokalen Ordner liefen; der Versionsstempel zählte dabei
  fremde Dateien mit.
- Zwei Threads bauten dasselbe (Anlegen per Tipp in der Kalenderliste, #104 und
  #113), weil die zweite Sitzung die offenen PRs nicht kannte.
- Kleinigkeiten ohne Prüfung: neue CSS-Datei nicht in der Liste in
  `styles/tokens.css` (#117), PR-Titel ohne Beschreibung, Dateien knapp unter
  der 400-Zeilen-Grenze (`profile.js` bei 395).
Außerdem sollte der Git Commit Manager Konflikte selbst nach der Doku lösen,
statt vorher zu fragen, und „merge alle offenen“ verstehen.

## Änderung
Nur `CLAUDE.md` und ein Absatz im Skill, kein Code:
- **Abschnitt 1, Punkt 6 (neu):** Branch vom frischen `origin/main` beginnen;
  offene PRs lesen und Überschneidungen melden.
- **Abschnitt 2:** „Ein Thread, ein Branch, ein Ordner“ — fremde Dateien aus
  `git status` nicht anfassen, `version.py` erst bei sauberem Status; vor dem
  Review `origin/main` in den Branch holen und Konflikte dort lösen.
- **Abschnitt 4, Punkt 5:** PR-Titel ist die Commit-Message mit Beschreibung.
- **Abschnitt 5:** Dateien über 360 Zeilen zuerst teilen; jede neue CSS-Datei
  steht an drei Stellen (`index.html`, Liste in `styles/tokens.css`,
  Versionsstempel), überstimmende Android-Dateien werden danach geladen.
- **Abschnitt 6:** „merge alle offenen“; je PR genau ein Commit und eine
  Doku-Datei prüfen; PRs ohne Konflikt direkt mergen, sonst Sammel-PR;
  Konflikte nach der Doku beider Änderungen lösen, bei Dubletten die Lösung in
  `main` behalten und einen „Nachtrag beim Zusammenführen“ in die andere Doku
  schreiben; nachfragen nur bei echtem Widerspruch; Browser-Prüfung nach den
  Merges; im Ergebnis je Konflikt Dateien, Herkunft und Testhinweis nennen.
  Änderungen an `CLAUDE.md`/Skill bekommen eine Doku-Datei.
- **Abschnitt 7:** Notiz zum Anlegen von Sitzungen (Cloud oder Worktree) und
  zum Aufräumen lokaler Worktrees.
- **Skill, Abschnitt 8:** Absatz zum Git Commit Manager entsprechend ergänzt.

## Begründung
Die Arbeits-Sitzung kennt ihre Änderung am besten, darum soll sie den Abgleich
mit `main` machen; der Git Commit Manager bekommt dann konfliktfreie PRs und
löst den Rest nach der Doku. Verworfen: `tools/check.py` um die Prüfung der
CSS-Liste und der 360-Zeilen-Warnung zu erweitern — sinnvoll, aber eine eigene
Code-Aufgabe für einen Arbeits-Thread.

## Visualisierung
Vorher (Ablauf eines Threads):
```
Thread startet auf altem main ──► arbeitet ──► PR
                                               └─► Commit Manager: Konflikt,
                                                   fragt nach, löst
```

Nachher:
```
Thread holt origin/main ──► liest offene PRs ──► arbeitet
   ──► holt origin/main noch einmal, löst Konflikte selbst ──► PR
                                                └─► Commit Manager: merged,
                                                    löst Reste nach Doku
```

## Hinweise
- Zentrale Dateien: `CLAUDE.md`, `.claude/skills/paralist-clean-code/SKILL.md`.
- Die Regeln wirken erst in Sitzungen, die nach diesem Merge starten.
- Offen für einen eigenen Thread: `tools/check.py` prüft die Dateiliste in
  `styles/tokens.css` gegen `index.html` und warnt ab 360 Zeilen.
