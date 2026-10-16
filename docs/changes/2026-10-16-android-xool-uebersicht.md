# 2026-10-16-android-xool-uebersicht

## Problem
Die Übersicht der Xool-App (zwei Reiter „Markiert · Listen“ über dem Container, Name und Anzahl im Kopf) sollte in „Android (Xool-DB)“ nachgebaut werden, mit der Logik des MVP. Gilt nur für diese Fassung (Folge von 2026-10-16-android-xool-nav).

## Änderung
- **`src/features/overview/home-xool.js` (neu):** die Reiter „Markiert · Listen“, ihre Listenwahl (Blatt „Liste wählen“) und die Zeile mit Name und Anzahl. Gemerkt werden der Reiter und je Reiter die Liste (`storageKeys.homeTab`, `homeMarked` in `src/core/storage.js`; `homeList` gilt für „Listen“).
- **`src/features/overview/home-list.js`:** die Listenwahl der Übersicht gilt jetzt auch in „Xool-DB“; Liste „Favoriten“ (Zeilen: favorisierte Arbeitsbereiche und Einträge), Anzahl je Liste, Kopf mit Reitern und Zeile für Xool.
- **`styles/android-xool-overview.css` (neu, `index.html` und `docs/styles-dateien.md` eingetragen):** Reiter mit Linie in der Primärfarbe, Zeile mit Name und Anzahl als oberer Teil des Containers.
- **Container, Kachelgruppe, Flächen:** die Regeln für „Android (Experiment)“ in `android-overview-sheet.css`, `android-experiment-surface.css`, `android-tabs-off.css` und `tokens-android-dark.css` gelten nun auch mit `data-mobile-variant="xool"` (Selektor nur erweitert, Werte unverändert).
- `src/data/tabs-visibility.js`: Reiter der Übersicht starten in „Xool-DB“ wie im Experiment ausgeblendet. `platform-versions.js`: Zeile „Übersicht“ in `differences`.

## Begründung
Die Xool-Übersicht stammt aus dem Experiment (Container, Kachelgruppe, Listenwahl); darauf aufbauend ist nur die Reiterzeile neu. Verworfen: die Experiment-Dateien kopieren (doppelte Regeln). Lesezeichen stehen unter „Markiert“, weil es im MVP kein „Angepinnt“ gibt. Offen: das Blatt „Einstellungen/Anpassen“ der Xool-Zeile (Sortierung, Filter, Archiv) ist hier die vorhandene Werkzeugzeile unter dem Kopf.

## Visualisierung
Vorher („Xool-DB“ nach Paket 1, wie Android):
```
 Projekte ↗
 Alle | Neue Ansicht
 Archiv           ⇅ ☰
```

Nachher:
```
 Markiert ☆   Listen ˅
 ───────────
╭──────────────────────────────╮
│ Projekte 7   [Liste] [▭] [↗] │
│ Alle  Kanban  + Neue Ansicht │
```

## Hinweise
- Testen: Reiterwechsel, Listenwahl je Reiter (Blatt), Favoriten und Lesezeichen mit Daten (`?demo=1`), leerer Speicher, hell und dunkel, 375 px.
- Betrifft gemeinsam genutzte Stildateien (Selektoren erweitert); „Android (Experiment)“ muss unverändert aussehen.
