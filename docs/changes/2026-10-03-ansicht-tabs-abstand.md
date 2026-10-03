# 2026-10-03-ansicht-tabs-abstand

## Problem
- Im Blatt „Ansicht“ hieß die Zeile „Reiter anzeigen“, obwohl das Blatt schon „Ansicht“ heißt; „Tabs anzeigen“ ist verständlicher.
- In „Android (Experiment)“ war der Platz unter dem letzten Projekt der Übersicht bis zur Navigationsleiste zu groß. Er war für den früheren Platzhalter „Projekt hinzufügen“ gedacht, der bei mehreren Einträgen nicht mehr kollidiert.

## Änderung
- `src/ui/tabs-visibility.js`: `rowLabel` ist jetzt „Tabs anzeigen“; Kopfkommentar angepasst.
- Nur Kommentare, die die Zeile beim Namen nennen: `src/ui/view-panel.js`, `src/ui/pill-swipe.js`, `src/core/bus.js`, `styles/android-tabs-off.css`.
- `styles/tokens-android.css`: neu `--m3-ov-end-trim` (24px) und `--m3-ov-content-end` (= `--m3-content-end` minus Kürzung).
- `styles/android-overview-sheet.css`: Seitenende der Übersicht und der Container unter der Liste nutzen `--m3-ov-content-end`.
- `src/data/version.js`: neuer Versionsstempel.
- Zentrale Dateien berührt: `src/data/version.js`, `src/core/bus.js` (nur Kommentar), `src/ui/view-panel.js` (nur Kommentar), `styles/tokens-android.css`.

## Begründung
- Nur die Beschriftung wurde geändert; der Schalter hängt an `data-settings="tabs"`, nicht am Text.
- Die Kürzung ist ein eigener Token nur für die Übersicht. Aufgaben, Seite Projekte, Kalender und Archiv behalten `--m3-content-end`.
- Seitenende und Container-Unterkante müssen sich gleich ändern, sonst bliebe unter dem Container ein Streifen Seitengrund.
- Nicht angefasst: die Release-Notiz in `src/data/platform-versions.js` (beschreibt den alten Stand) und andere „Reiter“-Texte der App.

## Visualisierung
Vorher:
```
 Ansicht
 Reiter anzeigen        (o  )

 ┌ Projekt 8 ─────────┐
 └────────────────────┘
        ↕ 48 px
                [+ Neu]
```

Nachher:
```
 Ansicht
 Tabs anzeigen          (o  )

 ┌ Projekt 8 ─────────┐
 └────────────────────┘
        ↕ 24 px
                [+ Neu]
```

## Hinweise
- Geprüft im Browser (375 px, hell und dunkel, Konsole leer, Android (Experiment)): Beschriftung im Blatt; mit 8 Projekten endet das letzte am Seitenende bei y = 584 statt 560, der Container reicht weiter bis y = 744.
- Am Gerät ansehen: ob 24px Abstand zu „Neu“ gut aussieht und ob bei langer Liste das Ein- und Ausblenden der Navigationsleiste normal bleibt.
- Der Versionsstempel ändert sich, jede offene App zeigt einmal „Neue Version verfügbar“.
