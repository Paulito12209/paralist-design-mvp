# 2026-10-02-kalender-android-tabs

## Problem
Die Kalenderseite sprach in den Android-Fassungen noch die iOS-Sprache:
- Die Reiter Aufgaben / Termine / Projekte der Listenansicht waren große,
  über die Breite verteilte Pillen — nicht wie die Reiter der Übersicht.
- Oben neben „KW“ stand das Aufklapp-Symbol statt des Symbols „Ansicht“.
- Datum, Reiter und Titel standen links unterschiedlich weit vom Rand.
- Die Wochentage (MO, DI …) standen weiter über den Kreisen als im Google-Kalender.
- Die Tage im Wochenstreifen hatten keine Material-Optik (gewählter Tag, heute).

## Änderung
- `styles/android-calendar-tabs.css` (neu), beide Android-Fassungen:
  - „Android“: Reiter wie auf der Übersicht (14px, aktiver in Akzentfarbe mit
    Linie, Trennlinie unter der Zeile, erster Reiter auf `--m3-tab-edge`).
  - „Android (Experiment)“: Reiter in der grauen Kapsel wie iOS (13px).
  - Rechts in der Reiterzeile das Symbol „Ansicht“ (Regler, 48px Tippfläche);
    kein Sortieren/Filtern. „KW“ steht in der Liste allein oben rechts, im
    Stundenraster (ohne Reiter) bleibt das Symbol neben „KW“.
  - Datum auf `--m3-title-edge` wie der Titel „Kalender“.
  - Wochentage 4px statt 7px über den Kreisen (`--m3-cal-weekday-tighten`).
- `styles/android-calendar-rings.css` (neu), nur „Android“: Tage nach dem
  Material-3-Datumswähler — gewählter Tag als gefüllter Kreis in der
  Akzentfarbe (mit Ring innen im Ring), heute in Akzentfarbe (ohne Ring mit
  1px-Kreis), Drücken als getönter Kreis. Ringe und Murmeln unverändert.
- `src/features/calendar/calendar-list.js`: Hülle `cal-seg-tabs` um die Reiter,
  Symbol „Ansicht“ (`data-view-panel-open`) am Ende der Zeile.
- `styles/calendar-panel.css`: Hülle außerhalb von Android ohne eigene Box
  (`display: contents`), iOS und „Erster Test“ bleiben unverändert.
- `styles/tokens-android.css`: `--m3-cal-weekday-tighten`, `--m3-cal-day-inset`,
  `--m3-cal-ring-gap`.
- `index.html`: Symbol oben ist „tune“ statt „panel-open“, zwei neue Stil-Dateien. (zentral)
- `styles/tokens.css`: Stil-Liste ergänzt. (zentral)
- `src/data/platform-versions.js`, `styles/android-view-btn.css`: Texte zum
  Symbol „Ansicht“ im Kalender angepasst.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Sortieren und Filtern passen neben drei Reitern auf kleinen Geräten nicht in
die Zeile; das Blatt „Ansicht“ enthält ohnehin alles (Darstellung, Zeitspanne,
Woche). Abstände folgen der Übersicht (Titel/Datum 24px, Reitertext 20px).
Das Symbol oben wird in der Liste nur unsichtbar statt entfernt, damit der
Wochenstreifen beim Wechsel Raster/Liste nicht springt. Der Wochenstreifen
selbst wurde nicht nach links verschoben, die Wochentage stehen mittig in
sieben gleichen Spalten. Die Ringbreite blieb unangetastet: sie wird im Skript
gemerkt (`cssNumber`) und wäre beim Wechsel der Fassung ohne Neuladen falsch.

## Visualisierung
Vorher:
```
Freitag, 2. Oktober >         KW 40  ⎍
  MO  DI  MI  DO  FR  SA  SO
     ↕ 7 px
 ((28))  29 ((30)) ((1))  2 …        ← heute/gewählt nur blaue Zahl
 ─────────────────────────────────
 Aufgaben     ( Termine )    Projekte
```

Nachher („Android“):
```
  Freitag, 2. Oktober >           KW 40
  MO  DI  MI  DO  FR  SA  SO
     ↕ 4 px
 ((28))  29 ((30)) ((1)) ((●2)) …    ← gewählter Tag gefüllt, im Ring innen
 Aufgaben  Termine  Projekte          ⫶⫶
           ‾‾‾‾‾‾‾
══════════════════════════════════════
```
Nachher („Android (Experiment)“): `(Aufgaben [Termine] Projekte)        ⫶⫶`

## Hinweise
- Geprüft bei 375px, hell und dunkel, Konsole leer: Reiter wechseln, Blatt
  „Ansicht“ in Liste und Raster, Raster/Liste umschalten, Browser-Zurück,
  Ringe mit Test-Einträgen; iOS unverändert.
- Nicht geprüft: Zähler an den Reitern im Bild, voller Speicher mit Migration,
  echtes Wischen auf dem Gerät.
- Im dunklen Design ist „heute mit Ring, nicht gewählt“ nur schwach hervorgehoben
  (helle Material-Akzentfarbe).
- Die Reiterzeile rastet beim Scrollen nicht unter dem Streifen ein.
- Zentrale Dateien: `index.html`, `styles/tokens.css`, `styles/tokens-android.css`,
  `src/data/version.js`.
