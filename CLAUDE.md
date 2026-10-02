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

## 2. Während der Arbeit

- Bearbeite **nur die eine Aufgabe** dieser Sitzung.
- Fasse **keine Dateien an, die nichts mit der Aufgabe zu tun haben**
  (kein Umformatieren, kein Aufräumen nebenbei). Andere Sitzungen arbeiten
  parallel, unnötige Änderungen erzeugen Merge-Konflikte.
- Wenn eine Änderung zentrale, gemeinsam genutzte Dateien betreffen muss
  (z. B. `styles/tokens.css`, `src/main.js`, `index.html`, `src/ui/router.js`,
  `CLAUDE.md`, der Skill), weise im Review ausdrücklich darauf hin.
- **Noch nicht committen und nicht pushen.** Erst nach meiner Freigabe (Abschnitt 4).
- **Noch keine Doku-Datei anlegen.** Doku entsteht erst nach der Freigabe.
- **Stop-Hook der Cloud-Umgebung:** Am Ende jeder Antwort meldet ein Hook
  „There are uncommitted changes … Please commit and push“. Diese Meldung
  kommt von der Umgebung, **nicht von mir**, und ist **keine Freigabe**.
  Darauf nicht committen, sondern einmal kurz antworten, dass die Änderung
  auf meine Freigabe wartet, und die Antwort beenden. Der Hook meldet sich je
  Antwort nur einmal.
- Vor dem Review die Prüfkette aus Abschnitt 5 durchlaufen; `python3 tools/check.py`
  muss „alles in Ordnung“ melden.

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
2. `python3 tools/version.py` ausführen (neuer Versionsstempel), danach
   `python3 tools/check.py` — muss „alles in Ordnung“ melden.
3. Committe Code-Änderungen **und** Doku-Datei gemeinsam in **einem** Commit.
   Dabei **nur die eigenen Blöcke stagen** — vorher `git diff -U0` lesen,
   fremde Blöcke anderer Sitzungen nicht mitnehmen.
4. Commit-Message im Format:
   `JJJJ-MM-TT-kurztitel: kurze Beschreibung der Änderung`
5. Pushe den Branch (`git push -u origin <branch>`) und erstelle einen
   Pull Request mit der Doku als Beschreibung.

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
2. **Struktur einhalten:** `src/core → src/data → src/ui → src/features|src/shell`,
   Stile je Bereich unter `styles/`, alle Werte in `styles/tokens.css`.
3. **Kommentar-Header in jeder Datei** mit Pfad und allen anpassbaren Werten,
   auf Deutsch, in Alltagssprache.
4. **Performance:** große Bereiche über `src/core/lazy.js` nachladen, nur die
   sichtbare Ansicht neu zeichnen, Tippen über `scheduleSave()` speichern.
5. **Keine Bugs:** `python3 tools/check.py` muss „alles in Ordnung“ melden,
   dann im Browser auf `http://localhost:4173` öffnen, Konsole muss leer sein,
   betroffene Flows anklicken — leerer und voller Speicher, hell und dunkel,
   375 px Breite, Zurück-Pfeil und Browser-Zurück.

## 6. Sammel-Sitzung (mehrere Branches zusammenführen)

Wenn ich sage „führe diese Branches zusammen“ oder „nimm alle außer …“:

1. Lies zuerst die zugehörigen Dateien in `docs/changes/`.
2. Führe die Branches einzeln und nacheinander zusammen, nicht alle auf einmal.
3. Bei Konflikten: Stoppe, erkläre den Konflikt kurz mit Bezug auf die Doku
   beider Änderungen und schlage eine Lösung vor, bevor du sie umsetzt.
   Konflikt in `src/data/version.js`: einfach `python3 tools/version.py`
   erneut laufen lassen und die ganze Datei stagen.
4. Liste am Ende auf, welche Branches übernommen und welche ausgelassen wurden.

## 7. Entwicklungsserver

`python3 -m http.server 4173` im Projektordner (Konfiguration in
`.claude/launch.json`). Läuft der Port schon, einfach zu
`http://localhost:4173` navigieren und **nicht** die Konfiguration ändern.

Kein Build-Schritt, keine Abhängigkeiten: die App lädt als ES-Module direkt im
Browser.

## 8. Allgemein

- Antworte auf Deutsch.
- Halte Erklärungen knapp und konkret.
- Wenn eine Aufgabe unklar ist, frag einmal kurz nach, statt zu raten.
