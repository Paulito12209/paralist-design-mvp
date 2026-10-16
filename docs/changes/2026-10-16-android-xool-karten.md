# 2026-10-16-android-xool-karten

## Problem
Die Übersicht in „Android (Xool-DB)“ sah nach Paket 2 noch wie das Experiment aus (farbiger Container, Pille „Liste“, Reiter- und Pfeil-Knopf). Gewünscht: sie soll aussehen wie die Übersicht der Xool-App. Gilt nur für diese Fassung.

## Änderung
- **`styles/android-xool-overview.css`:** neu geschrieben nach `styles/home-overview/` der Xool-App: kein Container mehr, sondern Karten auf dem Seitengrund. Reiter „Markiert · Listen“ je halbe Breite, Name mittig 16px, Icon/Pfeil rechts daneben, Linie unter dem Namen. Kopf als Karte (56px, oben 16px gerundet, unten 4px), Zeilen als Karten (56px, 12px gerundet, Fuge 4px, die letzte unten 16px), Werkzeugzeile der Projekte als Karte dazwischen, Kacheln mit 18px Rundung in derselben Kartenfläche.
- **`styles/tokens-android-dark.css`:** neue Werte `--m3-xo-*` (Kartenfläche hell/dunkel, Rundungen, Fuge, Randabstand, Reiter-Schrift).
- **`src/features/overview/home-xool.js` / `home-list.js`:** Kopf in Xool: der Name ist der Knopf zur Seite der Liste, rechts nur der Regler (Blatt „Ansicht“ bei Projekten mit Layout, Sortierung, Filter, „Tabs anzeigen“); Pille, Reiter-Knopf und Pfeil entfallen dort.
- `src/data/platform-versions.js`: Zeile „Übersicht“ ergänzt.

## Begründung
Maße und Farben aus der Xool-App übernommen (`_projects.scss`, `_rows.scss`, `_tiles.scss`, `_Material.scss`). Die Logik bleibt die des MVP. Verworfen: die Seitenfarbe der ganzen App auf die Xool-Farbe umstellen (wirkte auf alle Seiten).

## Visualisierung
Vorher:
```
 Markiert ☆   Listen ˅
╭──────────────────────────────╮  farbiger Container
│ Projekte 7   [Liste] [▭] [↗] │
│ ▸ Umzug nach Leipzig       ⋮ │
```

Nachher:
```
     Markiert ☆        Listen ˅
                       ──────
 ╭────────────────────────────╮
 │ Projekte 7               ⚙ │   Karte
 ╰────────────────────────────╯
 ┌────────────────────────────┐
 │ ▤ 1 | 7 Einträge      ⇅ ☰ │
 └────────────────────────────┘
 ┌────────────────────────────┐
 │ 🚀 Umzug nach Leipzig     ⋮ │
 └────────────────────────────┘
```

## Hinweise
- Testen: hell und dunkel, Reiterwechsel, Tipp auf den Namen (öffnet die Seite), Regler bei Projekten, Reiter (Ansichten) ein und aus.
- Der Regler steht bei Projekten zweimal (Kopf und Werkzeugzeile); offen, ob die Werkzeugzeile ihn abgeben soll.
