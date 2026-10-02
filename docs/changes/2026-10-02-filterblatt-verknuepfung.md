# 2026-10-02-filterblatt-verknuepfung

## Problem
Das Filterblatt der Android-Fassung war halb Material 3, halb iOS: Chevron-Zeilen
mit Unterseiten, ein Segment mit eigenen Maßen und ein blaues „Alle Filter
zurücksetzen“ (`--link-color`, iOS-Blau statt `--m3-primary`). Es gab keinen
Filter nach Verknüpfungen, und die Projekte konnten nur nach Ort und Favoriten
filtern — nicht nach Status und Dringlichkeit wie die Aufgaben.

## Änderung
**Chips-Blatt (Android):** `src/ui/filter-sheet.js` zeigt mit `chips: true` alle
Abschnitte auf einer Seite (`src/ui/filter-sheet-chips.js`,
`styles/android-filter-sheet.css`): Überschrift mit Segment, darunter Filter-Chips,
Eingabe-Chips (gewählte Einträge, mit ✕) und ein Hilfs-Chip „Eintrag wählen“.
„Zurücksetzen“ steht oben rechts, unten zeigt der Knopf die Trefferzahl und bleibt
beim Rollen stehen. Nichts angetippt heißt nicht gefiltert
(`chipItems`/`chipToggle`/`chipMode` in `src/ui/filter-multi.js`). iOS und Desktop
behalten Übersicht und Unterseiten. Neue Werte `--m3-filter-gap` und
`--m3-filter-section-gap` in `styles/tokens-android.css`.

**Neuer Abschnitt „Verknüpft mit“** (enthält | enthält nicht): Sammel-Chips
(Irgendwas, Eingang, Arbeitsbereiche, je Typ) und bestimmte Einträge.
- Daten: `src/data/link-filter-fields.js` (Felder `linkKinds`, `linkRefs`,
  `linkNot`, Übernahme des alten `place`), `src/data/link-filter.js` (Abgleich),
  `src/data/link-filter-options.js` (Chips, Auswahlliste); Vorgaben
  `linkFilterDefaults` in `src/data/config.js`.
- Oberfläche: `src/ui/filter-link-section.js`, `src/ui/filter-link-pick.js`
  (Auswahl-Blatt mit Pillen wie „Verknüpfen“).
- Regel: mehrere Werte = ODER, zwischen Abschnitten UND. Ablageorte,
  Verknüpfungen und bei einem Projekt sein Inhalt zählen als Verbindung;
  Archiviertes zählt nicht.

**Aufgaben:** `src/features/tasks/tasks-filter.js` nutzt die gemeinsamen Bausteine
(Status, Dringlichkeit, Verknüpft mit); `visibleTasks` in `src/data/queries.js`
filtert über `filterByLinks`. Der Abschnitt „Ort“ und `taskPlaces` entfallen.

**Projekte:** neues `src/features/overview/project-filter.js` (Status,
Dringlichkeit, Verknüpft mit); `src/data/project-views.js` filtert danach
(`visibleProjects`), die Karte „Ansicht“ (`project-settings.js`) zeigt Chips,
`project-card.js` erkennt den Filter. `projectViewDefaults` bekommt
`hiddenStatuses`, `hiddenPriorities`, `statusNot`, `priorityNot`.

**Altes Feld `place` entfällt** in Aufgaben- und Projekt-Ansichten: Übernahme in
`src/data/state.js` und `project-views.js`; angepasst `src/data/convert.js`,
`src/data/task-views.js`, `src/features/composer/composer-defaults.js`
(`draftSpace` in `project-views.js`).

## Begründung
Ein Datenmodell mit zwei Darstellungen, damit die iOS-Fassung unverändert bleibt.
Chips statt Unterseiten ist das Material-3-Muster („Filter chip“, „Input chip“,
„Segmented button“). „Ort“ ist als eigener Abschnitt überflüssig: ohne Auswahl ist
alles zu sehen, und Orte sind jetzt Werte von „Verknüpft mit“. Das Auswahl-Blatt
nutzt das vorhandene Blatt mit Pillen statt eines neuen. Verworfen: Suchfeld im
Auswahl-Blatt (eigener Schritt), Kanban für Projekte (eigene Sitzung
`2026-10-02-projekte-kanban`).

## Visualisierung
Vorher:
```
╭────────────────────╮
│ Filtern            │
│ ◉ Status  Offen… > │
│ 🔥 Dringl.  Alle > │
│ Alle Filter zur.   │   (blau)
│ [     Fertig     ] │
╰────────────────────╯
```

Nachher:
```
╭────────────────────────────╮
│ Filtern      Zurücksetzen  │
│ Status         [ist|ist n.]│
│ (✓Offen)(✓In Arb.)(Erl.)…  │
│ Dringlichkeit  [ist|ist n.]│
│ (Jetzt)(Als Nächstes)…     │
│ Verknüpft mit [enthält|…]  │
│ (Irgendwas)(✓Medien)(Proj.)│
│ (Umzug ✕)(＋ Eintrag wählen)│
│ [  2 Aufgaben anzeigen   ] │
╰────────────────────────────╯
```

## Hinweise
- Zentrale Dateien berührt: `state.js`, `config.js`, `config-tasks.js`, `queries.js`,
  `index.html`, `styles/tokens.css`, `styles/tokens-android.css`.
- Geprüft im Browser (Android, hell/dunkel, 375 px und 560 px Höhe, iOS, Desktop):
  Trefferzahlen für Aufgaben und Projekte, Übernahme alter Ansichten mit `place`,
  Konsole leer. Nicht geprüft: echtes Handy, Browser-Zurück bei offenem Blatt.
- Eingang, Favoriten, Archiv, Lesezeichen und die Suche nutzen weiter das alte
  Blatt (`src/features/overview/collection-filter.js`, `src/features/search/search-sheet.js`).
- „Arbeitsbereiche“ zählt nur direkt abgelegte Einträge, nicht über ein Projekt hindurch.
- „Alle Filter zurücksetzen“ zeigt bei Aufgaben auch Erledigtes und Archiviertes
  (wie bisher).
- Offen: Suchfeld im Auswahl-Blatt; Blatt auch für die Sammlungen; Kanban für
  Projekte (eigene Sitzung).
