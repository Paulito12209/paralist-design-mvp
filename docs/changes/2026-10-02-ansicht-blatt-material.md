# 2026-10-02-ansicht-blatt-material

## Problem
In der Android-Fassung hatte die Karte „Ansicht“ (Projekte, Aufgaben, Sammlungen,
Kalender) noch den iOS-Look: das Segment „Layout“ war eine graue Kapsel mit zwei
Symbolen ohne Wörter — man sah nicht, was Liste und was Board ist. Rand, Linie unter
der Überschrift und Schalter passten nicht zum Blatt „Filtern“ (Material 3).

## Änderung
- `src/ui/panel-rows.js`: jeder Segment-Knopf trägt Haken, Icon und Wort im Markup
  (Klassen `tasks-seg-check`, `tasks-seg-icon`, `tasks-seg-label`, `has-icon`).
- `styles/tasks-settings.css`: iOS und Desktop blenden Haken und Wort neben dem Icon
  aus — Aussehen dort unverändert.
- `styles/android-sheet.css` (nur Android):
  - Segment wie „ist | ist nicht“ (Material 3 „Segmented button“): umrandet,
    gewählter Knopf getönt mit ✓ und Wort, der andere mit Icon und Wort.
  - Schalter „Nur Favoriten“ als Material-3-„Switch“.
  - Filter-Chips unter „Filtern“ wie die gewählten Chips im Filter-Blatt.
  - Rand 24px wie „Filtern“, keine Linie unter „Ansicht“, Werte rechts 14px,
    Bezeichnungen ohne Umbruch, Abstand 8px, getöntes Band beim Drücken einer Zeile.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Dieselbe Material-3-Form wie „ist | ist nicht“ macht beide Blätter einheitlich.
Ein gemeinsames Markup mit getrenntem CSS lässt iOS und Desktop unberührt; eine eigene
Android-Funktion hätte die Logik verdoppelt. Sortieren und Filtern waren bereits
Material 3 (frühere Sitzungen) und blieben unverändert.

## Visualisierung
Vorher:
```
╭──────────────────────────────────╮
│ Ansicht                          │
│──────────────────────────────────│
│ Layout              (▣☰ | ┃┃)    │  graue Kapsel, nur Symbole
│ Sortieren  Zuletzt geöffnet ·    │
│                  Neueste zuerst  │
│ Nur Favoriten          (  ●)     │  iOS-Schalter
```

Nachher:
```
╭──────────────────────────────────╮
│ Ansicht                          │
│                                  │
│ Layout       [✓ Liste | ┃┃ Board]│  umrandet, gewählt getönt
│ Spalten nach [✓ Status|Dringl.]  │  (nur im Board)
│ Sortieren  Zuletzt geöffnet · N… │  eine Zeile, 14px
│ Filtern                        1 │
│ (◎ Status 1)                     │  M3-Chip
│ Nur Favoriten          [●    ]   │  M3-Schalter
```

## Hinweise
- Gilt für jede Karte „Ansicht“ auf Android, auch Aufgaben, Sammlungen und Kalender
  („✓ Stundenraster | ☰ Liste“, „1 W | 2 W | 1 M“).
- Bei 375px passen „Darstellung“ (Kalender) und „Spalten nach“ knapp; schmaler kann
  das Segment über den Rand ragen.
- „Heute“ im Kalender-Blatt ist noch iOS-blau (nicht Teil dieser Änderung).
- Geprüft: Android hell/dunkel 375px, iOS und Desktop (Segment unverändert), Konsole leer.
  Nicht geprüft: voller Speicher, Zurück-Pfeil/Browser-Zurück, echtes Handy.
