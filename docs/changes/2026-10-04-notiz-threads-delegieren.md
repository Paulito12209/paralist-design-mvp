# 2026-10-04-notiz-threads-delegieren

## Problem
Wie ich Aufgaben parallel an Claude-Threads gebe und am Ende alles über den Git Commit Manager nach `main` bringe, stand nur im Chat. Dazu kam der Wunsch, nichts mehr auf dem Mac aufräumen zu müssen (gesperrte Worktrees, ein Thread direkt im Hauptordner bei #143). Außerdem stand in der Doku von #147 fälschlich „ausliefern (FTP)“ — FTP gehört zu einem anderen Repository; dieses Projekt wird vom Hosting automatisch aus `main` übernommen.

## Änderung
- `CLAUDE.md` §7, neu „Aufgaben an Threads delegieren (Notiz für mich)“: Ablauf in vier Schritten (Idee → Cloud-Thread, „passt“, „merge alle offenen“, App-Adresse öffnen und aktualisieren), Vorlage für den Auftrag mit Geltungsbereich, „merge alle offenen“ nimmt nur Threads mit PR, ein Thread je Thema, Ausliefern passiert von selbst und der Hinweis „Neue Version verfügbar“ kommt nach dem Stempel.
- `CLAUDE.md` §7, „Sitzungen anlegen und Worktrees aufräumen“: Cloud-Threads als Standard empfohlen; lokal nur mit Haken „Worktree“, nie direkt im Hauptordner.
- `docs/changes/2026-10-04-arbeitsregeln-stempel-geltungsbereich.md`: Hinweis ohne FTP — das Hosting übernimmt `main` selbst, „Neue Version verfügbar“ erscheint nach dem Stempel-PR.
- Zentrale Datei: `CLAUDE.md` (nur Abschnitt 7, die Regeln in §1–6 bleiben unverändert).
- Außerhalb des Repositorys: Notion-Seite „Paralist (Android) – Arbeitsablauf: Threads delegieren & Git Commit Manager“ (Ressourcen, verknüpft mit dem Projekt „Paralist (Android)“) mit der ausführlichen Fassung, inklusive des Befehls zum Tagesabschluss bei lokalem Arbeiten.

## Begründung
Die Kurzfassung steht dort, wo die übrigen Notizen für mich stehen (§7), damit jede Sitzung sie kennt; die ausführliche Fassung mit Befehlen und Meldungen liegt in Notion, damit `CLAUDE.md` kurz bleibt. Cloud-Threads als Standard, weil dort keine Worktrees auf dem Mac entstehen, die gesperrt sind und aufgeräumt werden müssen. Verworfen: den Aufräum-Befehl in `CLAUDE.md` aufnehmen — zu lang und bei Cloud-Threads überflüssig.

## Visualisierung
Vorher:
```
§7 Entwicklungsserver
   └ Sitzungen anlegen und Worktrees aufräumen   (Cloud oder lokal mit Worktree)
```

Nachher:
```
§7 Entwicklungsserver
   ├ Aufgaben an Threads delegieren   ← neu
   │    Idee → Cloud-Thread → „passt“ → „merge alle offenen“ → Adresse öffnen, aktualisieren
   └ Sitzungen anlegen und Worktrees aufräumen   (Cloud zuerst, nie im Hauptordner)
```

## Hinweise
- Nur Text, keine ausgelieferte Datei — deshalb kein neuer Versionsstempel nötig.
- Laufende Sitzungen kennen die Notiz erst, wenn sie `origin/main` holen.
