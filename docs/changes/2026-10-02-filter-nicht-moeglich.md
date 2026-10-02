# 2026-10-02-filter-nicht-moeglich

## Problem
In der Karte „Ansicht“ stand bei „Alle“ hinter „Filtern“ nur „Keine“. Das klang unfein
und erklärte nicht, warum sich „Alle“ nicht filtern lässt. Außerdem ließ sich nicht
einstellen, wo neue Ansichten in der Pillenzeile erscheinen.

## Änderung
- `src/features/overview/project-settings.js`: bei „Alle“ steht „Nicht möglich“ (grau, mit ⓘ).
  Eigene Ansichten zeigen ohne Filter „Hinzufügen“, „Projekte wählen“ zeigt „Auswählen“.
  Das Blatt hinter dem ⓘ („Warum nicht filtern?“) erklärt: „Alle“ ist der Gesamtüberblick,
  Archiviertes liegt hinter „Archiv (n)“ und zählt nicht als Filter, eine eigene Ansicht
  beginnt als Kopie von „Alle“ und wird dort gefiltert und sortiert. Eine Zeile
  „Einstellungen › Tabs“ springt direkt in die Einstellungen.
- `src/ui/settings-link.js` (neu): öffnet Einstellungen › Tabs (Handy: Unterseite, Desktop: Punkt im Untermenü).
- `src/data/view-place.js` (neu), `src/core/storage.js`: Einstellung „Neue Ansichten erscheinen“
  (vor „Alle“ oder am Ende; Vorgabe am Ende).
- `src/features/profile/app-settings.js`: neue Gruppe in Einstellungen › Tabs.
- `src/data/project-views.js`, `src/data/task-views.js`, `src/data/state.js`: „Alle“ wird über
  das Merkmal `fixed` gefunden, nicht mehr über Platz 0; neue Ansichten nutzen die Einstellung.
- `src/features/overview/project-views.js`, `src/features/tasks/tasks-views.js`: „Nach links“
  im Pillen-Menü geht bis Platz 0.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die Einstellung gilt für Projekte und Aufgaben, weil beide dieselbe feste Ansicht „Alle“ haben.
Verworfen: ein Merkmal je Ansicht („steht vorn“), das die Reihenfolge doppelt gespeichert hätte.
„Neue Ansicht“ steht immer direkt hinter der letzten Pille und klebt nicht am Rand.
Bei Aufgaben bleibt der Filter-Text unverändert, dort darf „Alle“ nach Status filtern.

## Visualisierung
Vorher:
```
Filtern                    Keine  ⓘ
( Alle | + Neue Ansicht )
```

Nachher:
```
Alle:      Filtern          Nicht möglich  ⓘ
Eigene:    Filtern          Hinzufügen        (mit Filtern: Zahl)
Vor „Alle“: ( Ansicht 2 | Alle | + Neue Ansicht )
Am Ende:    ( Alle | Ansicht 2 | + Neue Ansicht )
```

## Hinweise
- Geprüft bei 413 px, dunkel, Konsole leer: Blatt, Sprung in die Einstellungen, Wahl „Vor Alle“,
  Reihenfolge nach Neuladen, Aufgaben-Ansichten.
- Nicht geprüft: hell, Desktop-Untermenü, Browser-Zurück, voller Speicher mit alten Daten
  (alte Stände haben „Alle“ vorn und laden unverändert).
- Gemeinsam genutzte Dateien: `src/data/state.js`, `src/core/storage.js`, `src/data/version.js`.
