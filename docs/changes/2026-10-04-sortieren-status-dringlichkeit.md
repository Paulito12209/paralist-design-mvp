# 2026-10-04-sortieren-status-dringlichkeit

## Problem
Das Blatt „Sortieren nach“ bot nur Erstellt, Fällig und Titel (bzw. Name,
Einträge …). Status und Dringlichkeit ließen sich nicht als Sortierung wählen,
obwohl Aufgaben, Projekte und Termine beides haben.

## Änderung
In jeder Liste mit Sortierblatt gibt es jetzt **Status** und **Dringlichkeit**,
beide in beiden Richtungen. Gilt für alle Fassungen (Android-Liste und
Rollenblatt nutzen dieselben Optionen).

| Liste | Status | Dringlichkeit |
|---|---|---|
| Aufgaben | ja | ja |
| Projekte (Übersicht, Seite Projekte) | ja | ja |
| Eingang, Favoriten, Archiv (mit Terminen) | ja | ja |
| Ressourcen | ja | nein (Dokument, Notiz, Zeichnung haben keine) |
| Lesezeichen | nein | nein |
| Suche | ja | ja |

Wortlaut: Status „Offen zuerst“ / „Erledigt zuerst“ (bei Aufgaben „Offen
zuerst“ / „In Arbeit zuerst“, weil Erledigtes dort immer unten steht);
Dringlichkeit „Dringendste zuerst“ / „Am wenigsten dringend zuerst“.
Einträge ohne Status bzw. Dringlichkeit (Notiz, Medien …) stehen in beiden
Richtungen unten.

Dateien:
- `src/data/config-sorts.js` (neu): Wortlaut von Status und Dringlichkeit,
  `projectSorts` (aus `config.js` hierher verschoben).
- `src/data/config.js`: nur verkleinert (`projectSorts` ausgelagert, war 367 Zeilen).
- `src/data/config-tasks.js`: `taskSorts` um beide Arten, `statusRankOf`, `priorityRankOf`.
- `src/data/queries.js`: `sortTasks` kennt „status“; Gleichstand immer nach Anlegen.
- `src/data/collection-sorts.js`: Sortierarten und Schlüssel für Sammlungen und
  Projekte; `unavailableSorts` blendet Unpassendes je Sammlung aus.
- `src/features/search/search-refine.js`: Sortierung der Suchtreffer.
- `src/data/project-views.js`, `src/features/overview/project-settings.js`: nur Import.

## Begründung
`config.js` lag über 360 Zeilen, daher zuerst `projectSorts` ausgelagert.
Überall eingebaut, wo es ein Sortierblatt gibt, weil „für alle Listen“
gewünscht war. Die Rangfolge kommt aus den vorhandenen Listen (`taskStatuses`,
`docStatuses`, `taskPriorities`). Bei Gleichstand gilt die Reihenfolge des
Anlegens (Sammlungen: Name), auch absteigend — sonst kippten gleich dringende
Aufgaben mit um. Das gilt jetzt für alle Sortierungen der Aufgaben-Seite
(bei Titel und Fällig galt bisher die Listenreihenfolge).
Verworfen: Einträge ohne Status mitsortieren (stünden absteigend oben).

## Visualisierung
Vorher:
```
Sortieren nach
  ✓ Erstellt
    Fällig
    Titel
```

Nachher:
```
Sortieren nach
    Erstellt
    Fällig
    Status
  ✓ Dringlichkeit
    Titel
Reihenfolge
  ✓ Dringendste zuerst
    Am wenigsten dringend zuerst
```

## Hinweise
- In gemischten Sammlungen zählt die Stufe in der eigenen Liste: ein Dokument
  „Fertig“ steht neben „In Arbeit“-Aufgaben, „Geprüft“ neben „Erledigt“.
- Geprüft bei 375 px (Android-Fassung, `?demo=1`), Konsole leer. Am Gerät
  testen: Sortieren in Aufgaben, Projekten, Eingang/Favoriten, Suche; alter
  Speicherstand mit gespeicherter Sortierung.
