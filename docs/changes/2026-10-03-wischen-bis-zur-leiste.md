# 2026-10-03-wischen-bis-zur-leiste

## Problem
In der Android-Fassung ließ sich unter dem letzten Eintrag einer Liste weder
zwischen den Reitern (Ansichten) wischen noch im Kanban-Board seitlich durch
die Spalten rollen. Die Fläche zwischen Listenende und Leiste ist das
Seitenende des Scrollbereichs (Platz für Leiste und Plus-Knopf) und gehörte
nicht zur Seite — Berührungen dort erreichten weder den Reiter-Wechsel noch
das Board noch das Anlegen per Tipp.

Außerdem stand in einer leeren Spalte des Aufgaben-Boards „Neue Aufgabe“ mit
leerem Ring — das sah aus wie eine Aufgabe, nicht wie ein Platzhalter zum
Anlegen. Im Projekt-Board legte ein Tipp in die freie Fläche unter den
Projekten einer Spalte gar nichts an.

## Änderung
- `styles/android.css`, `styles/android-overview-sheet.css`, `styles/media.css`,
  `styles/search.css`: wo das Seitenende des Scrollbereichs gesetzt wird, steht
  derselbe Wert zusätzlich als `--content-end`.
- `styles/android-archive.css`: jede Seite (`.view`) reicht über dieses
  Seitenende bis an die Leiste (Mindesthöhe, Innenabstand und gleich großer
  negativer Rand — die Seite wird nicht länger). Das Aufgaben-Board reicht
  ebenso bis zur Leiste.
- `src/ui/pill-swipe.js`: Wischen **unter** einer seitlich rollenden Fläche
  (`data-edge-swipe`, das Projekt-Board endet mit seiner längsten Spalte) rollt
  sie um eine Spalte weiter; erst am Rand wechselt die Pille.
- `src/features/overview/project-inline.js`: ein Tipp in die freie Fläche des
  Projekt-Boards (unter den Projekten einer Spalte oder unter dem Board bis zur
  Leiste) öffnet die Eingabezeile in der Spalte unter dem Finger; das Projekt
  bekommt Status bzw. Dringlichkeit dieser Spalte.
- `src/features/tasks/tasks-board.js`, `styles/tasks-board.css`: die blasse
  Zeile in leeren Spalten heißt „Aufgabe hinzufügen“ mit ✓+-Symbol — gebaut wie
  „Projekt hinzufügen“ im Projekt-Board.
- `src/data/version.js`: neuer Versionsstempel.
- Zentrale Dateien berührt: `styles/android.css` (gilt für alle Android-Seiten),
  `src/data/version.js`.

## Begründung
Die Seite zu verlängern statt jede Geste einzeln umzubauen, repariert alle
Listen auf einmal (Übersicht, Eingang, Arbeitsbereiche, Ressourcen, Aufgaben,
Projekte, Medien, Suche). Im Aufgaben-Board rollt der Browser die Spalten dann
selbst, der Finger zieht sie mit. Das Projekt-Board bis zur Leiste zu strecken
hätte den Aufbau der Übersicht in einen Flex-Stapel umgestellt (Ränder
verhalten sich dort anders) — verworfen; dort übernimmt der Wisch das Rollen um
genau eine Spalte. Den Wert des Seitenendes nur zu kopieren war verworfen: er
unterscheidet sich je Seite (Eintragsseite, Medien, Suche, Übersicht im
Experiment), eine zu große Kopie hätte die Seiten länger scrollen lassen.

## Visualisierung
Vorher:
```
│ Offen 1        │ In Arbeit      │
│ ○ Test      ⠿  │ ○ Neue Aufgabe │ ← sieht aus wie eine Aufgabe
│                │                │
├────────────────┴────────────────┤ ← Seite endet hier
│   (tot: kein Wischen, kein Tipp)│
│                       [+ Neu]   │
└─ Leiste ────────────────────────┘
```

Nachher:
```
│ Offen 1        │ In Arbeit 0          │
│ ○ Test      ⠿  │ ✓+ Aufgabe hinzufügen│
│                │                      │
│ ← Wischen: Spalten │ Tipp: Zeile in   │
│   (bis zur Leiste) │ „In Arbeit“      │
│                       [+ Neu]         │
└─ Leiste ──────────────────────────────┘
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer, mit echten Touch-Gesten:
  Wischen unter dem letzten Eintrag wechselt den Reiter (Übersicht, Aufgaben);
  unter den Spalten rollt Wischen das Board, am Rand wechselt es den Reiter;
  Tipp unter „In Arbeit“ legt Aufgabe bzw. Projekt mit Status „In Arbeit“ an.
- Gegen den alten Stand verglichen: Scroll-Länge gleich (leerer und voller
  Speicher, Android und Android (Experiment), auch Eintrags- und
  Sammlungsseite); Pixelvergleich oben und unten auf Übersicht, Aufgaben,
  Kalender und Medien ohne Unterschied.
- Nicht geprüft: echtes Gerät, Suche, iOS (dort unverändert — dieselbe tote
  Fläche besteht dort weiter).
- Am Gerät testen: unten im Board seitlich wischen gegen senkrechtes Scrollen;
  Kalender kurz ansehen (seine Fläche reichte schon bis unten).
- Den beschriebenen Text „Keine Aufgabe“ in einer Board-Spalte konnte ich nicht
  nachstellen; dort stand immer die blasse Zeile.
