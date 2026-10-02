# 2026-10-02-projekt-tipp-flaeche

## Problem
Ein Tipp in die freie Fläche unter „Projekt hinzufügen“ legte keine neue
Projektzeile mehr an (Übersicht und Seite Projekte, Android-Fassung). Seit
2026-10-02-werkzeugzeile-einrasten ist die Seite nur so hoch wie ihre Liste;
die Fläche darunter bis zur Leiste ist nur noch das Polster des Scrollbereichs
(`--m3-content-end`), und dort kam der Tipp beim Zuhörer nicht an.

## Änderung
- `src/features/overview/project-inline.js`: die Zuhörer für das Anlegen per
  Tipp hängen am ganzen Scrollbereich (`dom.content`) statt an `#view-home`
  und `#view-page`. Welche Liste gemeint ist, entscheidet wie bisher
  `visibleList()`; gezählt wird nur ein Tipp unterhalb der Liste.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die erzwungene Mindesthöhe zurückzuholen hätte die Seite wieder grundlos
scrollbar gemacht. Verworfen nach Rückfrage: „Projekt hinzufügen“ bei langen
Listen unten über der Leiste einrasten lassen — gewünscht ist, dass die Zeile
einfach das Ende der Liste bleibt und man bei vielen Projekten bis zu ihr scrollt.

## Visualisierung
Vorher (ein Projekt):
```
│ Test                  ⋮ │
│ Projekt hinzufügen      │
│                         │ ← Tipp: nichts passiert
│                 [+ Neu] │
│ ▢   ▦   ☑   ▣           │
```

Nachher:
```
Wenig Einträge                 Viele Einträge, ganz unten
│ Test                  ⋮ │    │ Alle  + Neue Ansicht    │
│ Projekt hinzufügen      │    │ Archiv          ⇅       │
│                         │    │ …                       │
│  ← Tipp: neue Zeile     │    │ Projekt 1             ⋮ │
│                 [+ Neu] │    │ Projekt hinzufügen      │ ← Ende der Liste
│ ▢   ▦   ☑   ▣           │    │                     [+] │
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer: Übersicht und Seite
  Projekte mit einem und mit 15 Projekten, Tipp knapp über der Leiste,
  Browser-Zurück.
- Ganz unten bleibt unter „Projekt hinzufügen“ das Polster für den Knopf „Neu“;
  ein Tipp dorthin legt ebenfalls eine Zeile an.
- Nicht geprüft: echtes Gerät mit Tastatur, voller Speicher mit Migration.
- Keine zentrale Datei außer `src/data/version.js`.
