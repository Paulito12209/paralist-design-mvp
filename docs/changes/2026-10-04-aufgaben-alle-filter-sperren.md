# 2026-10-04-aufgaben-alle-filter-sperren

## Problem
Bei den Projekten ist „Alle“ nicht filterbar, bei den Aufgaben ließ sich „Alle“ noch nach Status und Dringlichkeit filtern. Eine feste Ansicht sollte überall gleich sein. Eine Begründung für den Unterschied stand nirgends in `docs/changes/`; er war ein Nebenbefund von `2026-10-02-filter-nicht-moeglich`.

## Änderung
- `src/features/tasks/tasks-settings.js`: bei „Alle“ ist die Zeile „Filtern“ gesperrt („Nicht möglich“, blass) mit ⓘ; das Blatt „Warum nicht filtern?“ erklärt, dass man dafür eine eigene Ansicht anlegt, und führt in Einstellungen › Tabs. Das Filter-Symbol der Werkzeugzeile und der Filter-Knopf am Desktop fehlen bei „Alle“.
- `src/data/config-tasks.js`: neu `allFilterOff` (alle Filter-Werte aus).
- `src/data/state.js`, `src/data/task-views.js`: „Alle“ bekommt `allFilterOff` beim Laden und bei jeder Änderung, auch aus alten Ständen, in denen „Alle“ gefiltert war.

## Begründung
Gleiche Gestaltung wie bei den Projekten (Klassen `tasks-filter-row`, `is-locked`, `tasks-info`). „Erledigte zeigen“ bleibt bei „Alle“ wählbar, weil es kein Filter ist. Geltungsbereich: alle Fassungen (gemeinsamer Speicher und Code). Verworfen: einen gemeinsamen Baustein mit den Projekten bauen — hätte `project-settings.js` ohne Not berührt.

## Visualisierung
Vorher:
```
Filtern                  Keine  >     Werkzeugzeile: ⇅  ⛛  ⚙
```

Nachher:
```
Filtern    Nicht möglich (blass)  ⓘ   Werkzeugzeile: ⇅  ⚙
```

## Hinweise
- Wer „Alle“ bisher filterte, verliert diesen Filter beim nächsten Laden.
- Geprüft: dunkel, Konsole leer, Zeile, Blatt, Werkzeugzeile. Nicht geprüft: hell, Desktop, voller Speicher, Browser-Zurück.
- Gemeinsam genutzte Datei: `src/data/state.js`.
