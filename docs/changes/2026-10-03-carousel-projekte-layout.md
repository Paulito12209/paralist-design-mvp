# 2026-10-03-carousel-projekte-layout

## Problem
In „Android (Experiment)“ lief die Kartenreihe der Übersicht seitenweise mit einer Linie darunter, „Projekte“ samt Reitern und Einträgen stand lose auf dem Seitengrund, und die Reiter ließen sich nicht ausblenden.

## Änderung
Alles gilt nur in „Android (Experiment)“ (`data-mobile-variant="experiment"`, unter 1024px); die normale Android-Fassung, iOS und Desktop bleiben unverändert.
- Neu: `styles/android-overview-sheet.css` — Kartenreihe mit 24px Peek bis zum Geräterand (letzte Seite rastet rechts ein, die Seitenlinie entfällt); Container von Rand zu Rand, oben abgerundet, in der Farbe der Navigationsleiste, bis zur Leiste hinunter, aus Überschrift, Reiterzeile und Liste zusammengesetzt (kein neues HTML); runder Pfeil-Knopf gegenüber von „Projekte“, oben/unten/rechts gleich weit vom Rand; Einträge als Kachelgruppe wie die Einstellungen (außen 20px, innen 4px, 2px Fuge) in der Farbe des Seitengrunds.
- Neu: `styles/android-tabs-off.css`, `src/data/tabs-visibility.js`, `src/ui/tabs-visibility.js` — Schalter „Reiter anzeigen“ oben im Blatt „Ansicht“ (Projekte, Aufgaben, Sammlungen); aus = Reiterzeilen weg, Werkzeugzeile rastet an ihrer Stelle ein. Kalender und Medien bleiben.
- `src/features/overview/overview.js`: zweite Kartenseite im Experiment als Lesezeichen / Personen / Archiv / Pläne (Lesezeichen und Archiv links übereinander).
- `src/ui/view-panel.js`, `project-settings.js`, `tasks-settings.js`, `collection-panel.js`: Zeile mit Schalter, Klick gemeinsam behandelt. `src/ui/pill-swipe.js`: ohne sichtbare Reiter kein Ansichtswechsel durch Wischen.
- `src/core/bus.js`, `src/core/storage.js`, `src/data/platform-versions.js`, `styles/tokens-android.css`, `styles/tokens.css`, `index.html` (zwei Stylesheets eingebunden).

## Begründung
Der Container wird aus den drei vorhandenen Geschwistern gebaut, weil ein Wrapper die Abstandsregeln der anderen Fassungen (`.overview-pager + .section-head`) gebrochen hätte. Der Schalter liegt im Blatt „Ansicht“, weil das Symbol dort schon die Werkzeugzeile ersetzt, und gilt global statt je Liste (einfacher). Die Kartenreihenfolge wird nur im Experiment in `overview.js` geändert, damit `moreCards` für Desktop und die anderen Fassungen gleich bleibt.

## Visualisierung
Vorher:
```
[Eingang][Favoriten]
[Arbeitsb.][Ressourcen]
              ▬▬▬▬
Projekte
Alle  + Neue Ansicht
──────────────────
Archiv        ⇅  ≡
```
Nachher:
```
[Eingang ][Favoriten][Pe     ← 24px Peek
[Arbeitsb.][Ressourcen][Le
╭──────────────────────╮
│ Projekte         (↗) │
│ (Alle) + Neue Ansicht│
│ Archiv         ⇅  ≡  │
│ ╭──────────────────╮ │
│ │ 🚀 Alpha       ⋮ │ │
│ ╰──────────────────╯ │
```

## Hinweise
- Die Seite „Projekte“ (über den Pfeil) hat weiter die alten Zeilen ohne Kacheln; das Board-Layout ist im Container nicht umgestaltet.
- Zu testen am Gerät: Wischen der Karten, Halten und Verschieben von Zeilen in den Kacheln, Schalter auf Aufgaben und Sammlungen, hell und dunkel (hell nur oberflächlich gesehen).
- Die Kartenreihenfolge wechselt beim Fassungswechsel erst beim nächsten Zeichnen der Übersicht.
