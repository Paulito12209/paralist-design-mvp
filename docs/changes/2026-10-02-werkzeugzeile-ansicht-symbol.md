# 2026-10-02-werkzeugzeile-ansicht-symbol

## Problem
Die Werkzeugzeile über den Listen (Android-Fassung) hatte nur Sortieren und
Filtern. Filtern öffnete bei Projekten und Aufgaben das ganze Blatt „Ansicht“.
Dort sollen später auch Layout-Einstellungen wie das Kanban-Board hin, also
braucht „Ansicht“ ein eigenes Symbol und Filtern ein eigenes Blatt.

## Änderung
Ab dem zweiten Tab stehen rechts drei Symbole:
Sortieren (`swap-vert`), Filtern (`filter`) und Ansicht (Material „tune“, neu).

- `assets/icons/sprite-2.svg`: neues Symbol `icon-tune` (Material-Icons-Pfad).
- `src/ui/list-head.js`: drittes Symbol `view`, Parameter `view` in
  `listHeadMarkup`, Klick-Zuordnung `{ sort, filter, view }`.
- `src/features/overview/project-card.js`: Filtern öffnet `openProjectFilter`,
  Ansicht öffnet das Blatt „Ansicht“; beides nicht auf der festen Ansicht „Alle“.
- `src/features/overview/project-settings.js`: neu `openProjectFilter(view)` —
  Blatt „Projekte aus“ (bei handverlesenen Projekten die Auswahl).
- `src/features/tasks/tasks-settings.js`: Filtern öffnet `openTaskFilter()`,
  Ansicht das Blatt „Ansicht“.
- `src/features/overview/page-list-head.js`: Sammlungen bekommen das dritte Symbol.
- `src/features/overview/projects.js`: Klick-Empfänger am Seiteninhalt gilt nur
  noch auf der Seite Projekte (`isProjectsPageOpen()`).
- `styles/android-card.css`, `styles/android-quiet-tools.css`: nur Kommentare.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Das Material-Icons-„tune“ passt zum vorhandenen `swap-vert`. Ein eigenes,
kombiniertes Filter-Blatt für Projekte (Ort, Favoriten, Auswahl) wurde verworfen,
weil es ein größerer Umbau wäre; „Nur Favoriten“ und „Projekte wählen“ liegen im
Blatt „Ansicht“. Der Klick-Empfänger der Projekte hing am gemeinsamen
Seiteninhalt (`dom.pageBody`) und feuerte auch auf Eingang & Co.; das ließ dort
beim Filtern zwei Blätter übereinander aufgehen. Beim Sortieren gab es die
Doppelung schon vorher, nur ohne sichtbare Folge.

## Visualisierung
Vorher (Tab „Ansicht 2“):
```
 🗄 Archiv                         ⇅     ≡
                                  sort  filter ─► Blatt „Ansicht“
```

Nachher:
```
 🗄 Archiv                    ⇅     ≡     ⎍
                             sort  filter  ansicht
                              │      │       └─► Blatt „Ansicht“ (alles, später Kanban)
                              │      └─► Filter-Blatt direkt („Projekte aus“ / „Filter“)
                              └─► Blatt „Sortieren“
Tab „Alle“ (Projekte):  🗄 Archiv                    ⇅      (nur Sortieren)
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer: Projekte (Übersicht und
  Seite), Aufgaben, Eingang.
- Nicht geprüft: voller Speicher mit Migration, Zurück-Pfeil und Browser-Zurück,
  die übrigen Sammlungen.
- Aufgaben zeigen alle drei Symbole auch auf „Alle“, weil dort das Layout
  (Liste/Board) im Blatt „Ansicht“ liegt.
- In Sammlungen enthält die Karte „Ansicht“ bisher nur Sortieren und Filter.
- Gemeinsam genutzte Dateien: `src/ui/list-head.js`, `assets/icons/sprite-2.svg`,
  `src/data/version.js`.
