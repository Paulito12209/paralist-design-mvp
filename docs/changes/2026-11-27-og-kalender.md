# 2026-11-27-og-kalender

## Problem
Der Kalender-Reiter der „OG Version“ sah noch wie die alte iOS-Fassung aus. Er soll
aussehen wie in der Swift-App Organi7er (CalendarView, CalendarGrid,
CalendarSpanPicker, CalendarDayTimeline, TabCustomizationButton).

## Änderung
- `styles/tokens-og-calendar.css` (neu): Werte des Kalenders, hell und dunkel.
- `styles/og-calendar.css` (neu): großer Titel, Monatsknopf, Wochenraster mit KW-Spalte,
  Ring 32 pt, gewählte Zahl als Farbverlauf, drei Knöpfe, drei Reiter, Materialfläche
  (oben 36 pt rund); der Kopf scrollt mit der Seite.
- `styles/og-calendar-grid.css` (neu): Stundenraster in voller Länge, Einträge in
  Kategoriefarbe, Band „Ganztägig“, leerer Tag, „Kalender anpassen“.
- `src/features/calendar/calendar-og.js` (neu): Knopfzeile (Umschalter, Heute, Zeitspanne
  mit Menü), Monatstitel, „Kalender anpassen“.
- `src/features/calendar/calendar-og-grid.js` (neu): Spalten für überschneidende Einträge,
  Chips für ganztägige Einträge.
- `calendar-strip.js`, `calendar-grid.js`, `calendar-list.js`, `calendar.js`: kleine
  Verzweigungen, die nur in der OG Version greifen (KW-Zelle, Raster ohne eigenes Fenster,
  alle Kategorien, „Nichts geplant“).
- Gemeinsame Dateien: `index.html` (drei `<link>`), `docs/styles-dateien.md`.

## Begründung
Das bestehende Streifen-/Raster-/Listensystem bleibt, nur Optik und Anordnung folgen der
Vorlage; Daten, Gesten und Speicher bleiben gleich. Alle Regeln hängen an
`data-mobile-os="ios"` + `data-mobile-variant="og"`; andere Fassungen sind unverändert.
Verworfen: einrastender Kopf (die Vorlage scrollt alles mit). Gilt nur für die OG Version.

## Visualisierung
Vorher:
```
Kalender
Freitag, 27. November >   KW 48
MO DI … / Wochenstreifen
15:00 ── (Raster in eigenem Fenster)
[Ansicht ▾ Heute]  (Panel unten)
```
Nachher:
```
Kalender (34 pt)
November 2026 ›
KW MO DI MI DO FR SA SO
48 23 24 25 26 [27] 28 29
(▤)      ( Heute )      ( 1 W )
╭─ Material ──────────────────╮
│ Aufgaben  (Termine 1) Projekte
│ Ganztägig [Chip] [Chip]
│ 15:00 ▌Zahnarzt
│ ( ⚙ Kalender anpassen )
```

## Hinweise
- Einträge haben nur eine Startzeit: Blöcke sind 22 pt hoch (15 Minuten), nur Titel.
- „Kalender anpassen“ öffnet das Blatt „Ansicht“ (in der Vorlage ohne Aktion).
- Monatsraster zeigt die Wochen des gewählten Monats, nicht die endlose Bahn; erste
  Stundenlinie 10 statt 8 pt unter dem Rand.
- Nicht umgesetzt: Glühhintergrund (`paraBackdrop`); Listenzeilen unverändert.
- Geprüft bei 375 px hell und dunkel, leer und mit `?demo=1`-Daten, Konsole leer.

## Nachtrag beim Zusammenführen
`index.html`: Konflikt in der OG-Zeile mit PR „og-leiste“ (`tokens-og-leiste.css`,
`og-accessory.css`, `og-lists.css`). Beide Listen sind übernommen, die drei Kalender-Dateien
stehen dahinter.
