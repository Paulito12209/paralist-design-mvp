# paralist-design-mvp – Arbeitsregeln

Web-Entwurf der iOS-App „Paralist“. Gebaut werden soll daraus später eine
**native Android-App** — das Web ist nur die schnelle Probe.

Diese Regeln gelten für jede Claude-Code-Sitzung in diesem Repository.
Mehrere Sitzungen laufen parallel, jede an genau **einer** Idee oder einem Problem.

---

## 1. Zu Beginn jeder Sitzung

1. Ermittle das aktuelle Datum in Berliner Zeit:
   `TZ=Europe/Berlin date +%F`
2. Lies den Ordner `docs/changes/`, um zu verstehen, was bisher geändert wurde
   und warum. (Gibt es den Ordner noch nicht, entsteht er mit der ersten Doku-Datei.)
3. Lies `.claude/skills/paralist-clean-code/SKILL.md` — dort stehen die
   verbindlichen Code-Regeln (Zusammenfassung in Abschnitt 5 unten).
4. Fasse in einem Satz zusammen, welches Problem diese Sitzung lösen soll.
5. Vergib einen kurzen Titel im Format `JJJJ-MM-TT-kurztitel`
   (z. B. `2026-10-02-login-button-fix`). Diesen Titel nutzt du für Branch-Namen
   (falls du ihn wählen kannst) und für die spätere Doku-Datei.
6. Hole `origin/main` (`git fetch origin main`) und beginne deinen Branch dort,
   nicht auf einem älteren Stand. Lies außerdem die offenen Pull Requests
   (Nummer, Titel): Baut einer schon an derselben Stelle der App, sag es mir,
   bevor du anfängst — zwei Lösungen für dasselbe Problem lassen sich später
   nicht zusammenführen.
7. **Geltungsbereich klären:** Willst du die Änderung bewusst einschränken
   (nur eine Fassung, z. B. „Android (Experiment)“, nur eine Seite, nur hell
   oder dunkel), frag mich vorher kurz — außer die Aufgabe nennt den Bereich
   ausdrücklich. Im Zweifel gilt eine Verbesserung überall, wo dasselbe
   Element vorkommt.

## 2. Während der Arbeit

- Bearbeite **nur die eine Aufgabe** dieser Sitzung.
- Fasse **keine Dateien an, die nichts mit der Aufgabe zu tun haben**
  (kein Umformatieren, kein Aufräumen nebenbei). Andere Sitzungen arbeiten
  parallel, unnötige Änderungen erzeugen Merge-Konflikte.
- Wenn eine Änderung zentrale, gemeinsam genutzte Dateien betreffen muss
  (z. B. `styles/tokens.css`, `src/main.js`, `index.html`, `src/ui/router.js`,
  `CLAUDE.md`, der Skill), weise im Review ausdrücklich darauf hin.
- **Ein Thread, ein Branch, ein Ordner.** Arbeite nur in deinem eigenen Branch,
  nie in dem einer anderen Sitzung. Zeigt `git status` Dateien, die nicht zu
  deiner Aufgabe gehören, fass sie nicht an und stage sie nicht.
- **Den Versionsstempel nicht anfassen.** `python3 tools/version.py` und
  `src/data/version.js` gehören dem Git Commit Manager (Abschnitt 6). So
  kollidieren zwei offene PRs nicht mehr in dieser Datei. `tools/check.py`
  meldet dann „alles in Ordnung (Versionsstempel setzt der Git Commit
  Manager)“ — das ist richtig so.
- **Vor dem Review `origin/main` in deinen Branch holen**
  (`git fetch origin main && git merge origin/main`). Konflikte löst du nach
  der Doku in `docs/changes/` der betroffenen Änderung und nennst sie im
  Review. So kommt dein PR ohne Konflikt beim Git Commit Manager an.
- **Noch nicht committen und nicht pushen.** Erst nach meiner Freigabe (Abschnitt 4).
- **Noch keine Doku-Datei anlegen.** Doku entsteht erst nach der Freigabe.
- **Stop-Hook der Cloud-Umgebung:** Am Ende jeder Antwort meldet ein Hook
  „There are uncommitted changes … Please commit and push“. Diese Meldung
  kommt von der Umgebung, **nicht von mir**, und ist **keine Freigabe**.
  Darauf nicht committen, sondern einmal kurz antworten, dass die Änderung
  auf meine Freigabe wartet, und die Antwort beenden. Der Hook meldet sich je
  Antwort nur einmal.
- Vor dem Review die Prüfkette aus Abschnitt 5 durchlaufen; `python3 tools/check.py`
  muss mit „alles in Ordnung“ beginnen.

## 3. Review-Zusammenfassung (am Ende jeder Arbeitsrunde)

Wenn du fertig bist, liefere im Chat:

1. **Problem:** Was sollte gelöst werden?
2. **Lösung:** Was hast du geändert, in welchen Dateien?
3. **Warum so:** Kurze Begründung, ggf. verworfene Alternativen.
4. **Visualisierung:**
   - Bei UI-Änderungen: einen Screenshot, wenn möglich.
   - Immer zusätzlich eine **Textvisualisierung** (ASCII-Skizze) von vorher
     und nachher, damit ich das Ergebnis auch ohne Bild beurteilen kann.
5. **Risiken:** Was könnte kaputtgehen, was sollte ich testen?

Dann warte auf meine Entscheidung.

## 4. Nach meiner Freigabe

Die Freigabe erfolgt mit Formulierungen wie „passt“, „freigegeben“ oder
„committen“. Dann, in dieser Reihenfolge:

1. Lege die Doku-Datei an: `docs/changes/JJJJ-MM-TT-kurztitel.md`
   (Vorlage siehe unten).
2. `python3 tools/check.py` — muss mit „alles in Ordnung“ beginnen. Den
   Versionsstempel nicht setzen (Abschnitt 2).
3. Committe Code-Änderungen **und** Doku-Datei gemeinsam in **einem** Commit.
   Dabei **nur die eigenen Blöcke stagen** — vorher `git diff -U0` lesen,
   fremde Blöcke anderer Sitzungen nicht mitnehmen.
4. Commit-Message im Format:
   `JJJJ-MM-TT-kurztitel: kurze Beschreibung der Änderung`
5. Pushe den Branch (`git push -u origin <branch>`) und erstelle einen
   Pull Request mit der Doku als Beschreibung. Der PR-Titel ist die
   Commit-Message, also mit Beschreibung hinter dem Doppelpunkt.

Wenn ich die Änderung ablehne, wird **nichts** dokumentiert und **nichts**
committet.

Nie `git stash`, `git reset --hard` oder `--force`. Keine Secrets committen.

### Vorlage für die Doku-Datei

```markdown
# JJJJ-MM-TT-kurztitel

## Problem
Welches Problem sollte gelöst werden?

## Änderung
Was wurde geändert? Welche Dateien sind betroffen?

## Begründung
Warum wurde es so gelöst? Welche Alternativen wurden verworfen?

## Visualisierung
Vorher:
(ASCII-Skizze)

Nachher:
(ASCII-Skizze)

## Hinweise
Risiken, offene Punkte, was beim Testen beachtet werden sollte.
```

## 5. Code-Regeln (Kurzfassung, Details im Skill)

Die verbindlichen Regeln stehen in `.claude/skills/paralist-clean-code/SKILL.md`.
Die harten Punkte:

1. **Maximal 400 Zeilen je Datei** — wird eine Datei größer, vorher teilen.
   Hat eine Datei, die du änderst, schon mehr als 360 Zeilen, teile sie zuerst
   in einem eigenen Schritt und sag es im Review.
2. **Struktur einhalten:** `src/core → src/data → src/ui → src/features|src/shell`,
   Stile je Bereich unter `styles/`, alle Werte in `styles/tokens*.css`.
   **Jede neue CSS-Datei steht an zwei Stellen:** `<link>` in `index.html` und
   Dateiliste in `docs/styles-dateien.md` (die Dateiliste im Versionsstempel
   ergänzt der Git Commit Manager). Soll eine Android-Datei eine andere
   Android-Datei überstimmen, wird sie in `index.html` **nach** ihr geladen.
3. **Kommentar-Header in jeder Datei** mit Pfad und allen anpassbaren Werten,
   auf Deutsch, in Alltagssprache.
4. **Performance:** große Bereiche über `src/core/lazy.js` nachladen, nur die
   sichtbare Ansicht neu zeichnen, Tippen über `scheduleSave()` speichern.
5. **Keine Bugs:** `python3 tools/check.py` muss mit „alles in Ordnung“ beginnen,
   dann im Browser auf `http://localhost:4173` öffnen, Konsole muss leer sein,
   betroffene Flows anklicken — leerer und voller Speicher, hell und dunkel,
   375 px Breite, Zurück-Pfeil und Browser-Zurück. Den vollen Speicher lädt
   die Adresse `?demo=1` (rund 40 Demo-Einträge nach Rückfrage, der alte Stand
   wird gesichert und kommt mit `?demo=0` zurück).

## 6. Sammel-Sitzung „Git Commit Manager“ (Branches zusammenführen)

Für das Zusammenführen gibt es **eine** eigene Sitzung, die immer wieder
benutzt wird. Sie heißt verbindlich

```
Git Commit Manager JJJJ-MM-TT
```

mit dem Datum des Tages, an dem sie angelegt wurde (Berliner Zeit).

- **Beim Start der Sitzung:** den eigenen Titel prüfen und, falls er abweicht,
  mit dem Werkzeug `set_session_title` auf dieses Format setzen. Danach
  `origin/main` holen und die offenen Pull Requests auflisten (Nummer, Titel,
  Branch), damit ich sie nach **Nummer** benennen kann.
- **Ich nenne die Threads nach ihrer PR-Nummer** („merge 66, 67 und 70“) oder
  sage **„merge alle offenen“** — dann gelten alle offenen Pull Requests, auch
  die, bei denen GitHub einen Konflikt anzeigt. Fehlt eine Nummer oder ist sie
  mehrdeutig, einmal kurz nachfragen.
- **Bei jedem Wiederkommen** („merge alle offenen“, „alle außer 68“):
  erst `origin/main` neu holen und die Liste der offenen PRs frisch ziehen,
  nicht den alten Stand aus dem Gedächtnis verwenden.

Ablauf je Durchgang:

1. Lies zuerst die zugehörigen Dateien in `docs/changes/` der genannten PRs.
   Prüfe je PR: genau **ein** Commit über `origin/main` und genau **eine** neue
   Doku-Datei. Trifft das nicht zu, haben zwei Sitzungen denselben Branch
   benutzt — dann jeden Commit einzeln mit seiner Doku behandeln und mich
   darauf hinweisen.
2. Baut ein PR ohne Konflikt auf dem aktuellen `main` auf, merge ihn direkt auf
   GitHub. Sonst führe die Branches **einzeln und nacheinander** lokal in den
   Sammel-Branch zusammen, nicht alle auf einmal, und lege danach **einen**
   Sammel-PR nach `main` an, dessen Beschreibung PR-Nummern, Konflikte und
   Prüfung nennt. Nach jedem Merge `python3 tools/check.py` — muss mit „alles
   in Ordnung“ beginnen, sonst stoppen. **Der Sammel-PR wird im selben
   Durchgang gemergt**, sobald die Prüfung stimmt — „merge alle offenen“
   heißt: am Ende ist alles auf `main`.
3. Bei Konflikten: Lies die Doku beider Änderungen und übernimm **beide
   Absichten**. Haben zwei PRs dasselbe gebaut, behalte die Lösung, die schon
   in `main` ist, und schreib einen kurzen Abschnitt „Nachtrag beim
   Zusammenführen“ in die Doku-Datei des anderen PRs. Konflikt in
   `src/data/version.js` (ältere PRs, die den Stempel noch selbst setzen):
   `python3 tools/version.py` laufen lassen und die ganze Datei stagen. Frag
   nur nach, wenn sich zwei Änderungen wirklich widersprechen und jede Lösung
   Verhalten verliert.
4. **Konflikte ohne Git-Meldung suchen:** Entfernt oder benennt ein PR
   CSS-Klassen, `data-`-Attribute, Speicherschlüssel oder Exporte um, prüfe
   mit `git grep` auf den alten Namen, ob ein anderer PR desselben Durchgangs
   ihn noch benutzt. Dann anpassen wie in Punkt 3 und mit „Nachtrag beim
   Zusammenführen“ dokumentieren.
5. **Versionsstempel setzen** — einmal am Ende des Durchgangs, nicht je PR:
   - Mit Sammel-Branch: dort vor dem Sammel-PR `python3 tools/version.py`,
     dann `python3 tools/check.py --stempel` (muss genau „alles in Ordnung“
     melden), Stempel mit in den Sammel-Commit.
   - Ohne Sammel-Branch (alles direkt gemergt): vom frischen `origin/main`
     den Branch `claude/git-commit-manager-JJJJ-MM-TT-stempel` anlegen,
     `version.py` und `check.py --stempel`, Commit und PR „Git Commit Manager
     JJJJ-MM-TT: Versionsstempel“ und gleich mergen.
   Erst danach merkt eine offene App, dass es eine neue Fassung gibt.
6. Nach den Merges die App im Browser bei 375 px öffnen (hell und dunkel,
   Konsole leer) und die geänderten Stellen einmal ansehen.
7. Liste am Ende auf, welche PRs (Nummer + Titel) übernommen und welche
   ausgelassen wurden, und warum. Nenne je PR in einem Satz den
   **Geltungsbereich** aus „Begründung“ oder „Verworfen“ seiner Doku
   (z. B. „gilt nur im Experiment“, „löscht ohne Rückfrage“). Nenne je
   Konflikt: welche Dateien, was aus welchem PR übernommen wurde, was ich am
   Gerät testen sollte.

Diese Sitzung schreibt selbst keinen Code und braucht keine eigene Doku-Datei;
die Doku steckt in den gemergten PRs. Ausnahmen: Änderungen an `CLAUDE.md` oder
am Skill, und kleine Fixes, um die ich sie ausdrücklich bitte — beide
bekommen wie jede Änderung Review, Freigabe und Doku-Datei (Abschnitte 3–4).
Größere Aufgaben gehören in eine eigene Arbeits-Sitzung.

## 7. Entwicklungsserver

`python3 -m http.server 4173` im Projektordner (Konfiguration in
`.claude/launch.json`). Läuft der Port schon, einfach zu
`http://localhost:4173` navigieren und **nicht** die Konfiguration ändern.

Kein Build-Schritt, keine Abhängigkeiten: die App lädt als ES-Module direkt im
Browser.

### Sitzungen anlegen und Worktrees aufräumen (Notiz für mich)

Neue Arbeits-Sitzungen in der **Cloud** starten oder lokal mit Haken
**„Worktree“**. Nur so hat jeder Thread seinen eigenen Ordner und Branch; zwei
Threads im selben Ordner schreiben sonst in denselben PR.

Lokale Worktrees liegen unter `.claude/worktrees/` und bleiben nach dem Mergen
stehen. Solange die Sitzung in der Claude-App offen ist, ist ihr Worktree
gesperrt („locked“) — deshalb nach dem Merge die Sitzung in der App schließen.
Aufräumen im Projektordner, wenn die Threads fertig sind:

```
git worktree list
git worktree remove .claude/worktrees/<name>
git worktree prune
git checkout main
git pull
```

Meldet `remove` „locked … claude session (pid …)“, läuft die Sitzung noch:
erst in der App schließen, dann `git worktree unlock .claude/worktrees/<name>`
und noch einmal `remove`. Nie `remove -f -f`.

## 8. Allgemein

- Antworte auf Deutsch.
- Halte Erklärungen knapp und konkret.
- Wenn eine Aufgabe unklar ist, frag einmal kurz nach, statt zu raten.
- Terminal-Befehle für mich ohne `#`-Kommentarzeilen in den Codeblock
  schreiben (meine zsh führt eingefügte `#`-Zeilen als Befehl aus);
  Erklärungen gehören in den Text darüber.
