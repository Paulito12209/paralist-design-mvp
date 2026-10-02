# 2026-10-02-tipp-unter-liste-anlegen

## Problem
In der Android-Fassung sollten alle Listen mit Einträgen gleich funktionieren:
Ist die Liste leer, steht der Platzhalter. Steht etwas darin, gibt es keine Zeile
„… hinzufügen“ mehr — ein Tipp unter den letzten Eintrag legt an, was die Liste
vorschlägt (Eingang eine Notiz, Zeichnungen eine Zeichnung, Arbeitsbereiche
einen Arbeitsbereich). Die leere Aufgabenliste sollte den Platzhalter wie am
leeren Kalendertag zeigen statt der Geisterzeile. Die Projekte der Übersicht
bleiben ausgenommen.

## Änderung
- `src/ui/inline-add.js` (neu): erkennt den Tipp in die freie Fläche unter der
  sichtbaren Liste und öffnet dort eine leere Zeile mit Icon und Cursor. Enter
  legt an und öffnet die nächste Zeile, eine leere Zeile verschwindet. Kein
  Anlegen beim Scrollen, im Auswahlmodus oder bei offener Tastatur. Nur Android.
- `src/data/mutations-inline.js` (neu): `createEntryInline({ title, type, place, link, fields })`
  mit denselben Vorgaben und XP wie das Eingabefeld.
- Angemeldete Listen:
  - `src/features/overview/page-inline.js` (neu): Eingang (Notiz), Seite
    Arbeitsbereiche (Arbeitsbereich mit Namensfeld), Arbeitsbereich ›
    „Verknüpfte Einträge“ (Notiz an diesem Ort); schaltet den Empfänger ein.
  - `src/features/entry/entry-inline.js` (neu): Eintragsseite › „Verknüpfte
    Einträge“ (im Projekt eine Aufgabe, sonst eine verknüpfte Notiz).
  - `src/features/resources/resources.js`: Typ der aktiven Pille.
  - `src/features/bookmarks/bookmarks.js`: Lesezeichen.
  - `src/features/calendar/calendar-list.js`: Typ der Spalte am gezeigten Tag
    (Termin um jetzt bzw. 09:00).
- `src/features/overview/workspace-collection.js`: Zeile „Arbeitsbereich
  hinzufügen“ entfällt auf Android.
- `src/features/tasks/tasks-list.js`, `styles/tasks.css`: ohne eine Aufgabe
  steht auf Android der schlichte Platzhalter („Keine Aufgaben“, Pille
  „Aufgabe hinzufügen“); er verschwindet, solange eine Zeile getippt wird.
- `src/ui/empty-state.js`, `styles/empty-state.css`: Variante `plain` (großes
  graues Icon wie `.cal-empty`), neue Werte `--empty-plain-icon`,
  `--empty-plain-title`, `--empty-plain-pad-top`.
- `styles/android-list.css`: Einzug der neuen Zeile (`.inline-add-row`).
- `src/features/overview/page.js`, `src/features/entry/entry.js`: Anmeldung.
- `src/data/version.js`: neuer Versionsstempel (zentrale Datei).

## Begründung
Ein gemeinsamer Baustein statt einer Kopie je Liste; jede Seite sagt nur, welche
Liste sichtbar ist und was entsteht. Eine per Tipp angelegte Zeichnung öffnet
sich nicht gleich — die Vorschau bleibt leer, ein Tipp auf die Zeile öffnet die
Zeichnungsseite. Projekte und Aufgaben behalten ihre eigene Fassung
(`project-inline.js`, `tasks-inline.js`). Favoriten und Archiv legen nichts an.
iOS bleibt unverändert.

## Visualisierung
Vorher:
```
Arbeitsbereiche              Aufgaben (leer)
│ 📁 Finanzen          ⋮ │   │ ○ Neue Aufgabe        │ ← Geisterzeile
│ 📁+ Arbeitsbereich hin…│   │                       │
```

Nachher:
```
Arbeitsbereiche              Aufgaben (leer)
│ 📁 Finanzen          ⋮ │   │          ✓            │
│ 📁 Gesundheit▏         │   │    Keine Aufgaben     │
│   ← Tipp legt an       │   │ (+ Aufgabe hinzufügen)│

Ressourcen › Zeichnungen
│ Oktober 2026           │
│ 〰 Skizze A          ⋮ │
│ 〰 Neue Zeichnung▏     │ ← nach Tipp, Enter legt an
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer: Eingang leer/voll,
  Zeichnungen anlegen und öffnen, Arbeitsbereiche, Arbeitsbereich › „Verknüpfte
  Einträge“, Aufgaben leer, Kalenderliste.
- Nicht geprüft: Lesezeichen, Eintragsseite › „Verknüpfte Einträge“, iOS,
  „Android (Experiment)“, voller Speicher mit Migration, echtes Gerät.
- Im Eingang steht der neue Eintrag nach Enter oben (neueste zuerst), die
  Eingabezeile unten. Bei Monaten und Gruppen steht die Zeile etwas abgesetzt.
- Siebt der Filter in Aufgaben alles aus, bleibt die Geisterzeile.
