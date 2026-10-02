# 2026-10-02-kalender-kopf-einrasten

## Problem
Beim Hochwischen im Kalender (Handy) rastete nur der Wochenstreifen (MO bis SO
mit den Tageszahlen) oben ein. Die Zeile mit dem gewählten Tag, der KW und dem
Symbol „Ansicht“ scrollte weg. Wer durch die Stunden gescrollt hatte, musste
erst wieder ganz nach oben, um die Ansicht umzustellen oder das Blatt „Datum“
zu öffnen. In der Listenansicht verschwanden zudem die Reiter (Aufgaben,
Termine, Projekte) beim Scrollen unter dem eingerasteten Kopf.

## Änderung
- `index.html` (zentral): Die Datumszeile `.cal-date-row` liegt jetzt im
  einrastenden Kopf `.cal-head`, direkt über dem Wochenstreifen. Nur der Titel
  „Kalender“ scrollt noch weg.
- `styles/calendar.css`: Der Titel bekommt die eigene Ebene (`position: relative`,
  `z-index: 4`), die vorher die Datumszeile hatte, damit die nach oben
  verlängerte Kopffläche seine Unterkante nicht verdeckt. Kopfkommentare angepasst.
- `styles/calendar-panel.css`: Die Reiterzeile der Liste `.cal-seg` ist
  `position: sticky` und rastet unter dem Kopf ein; wie weit unter dem Rand,
  sagt die Variable `--cal-head-stuck`.
- `src/features/calendar/calendar-grid.js`: `sizeList()` schreibt
  `--cal-head-stuck` (sichtbare Höhe des eingerasteten Kopfes) an die Fläche;
  die Höhe hängt von der Zeitspanne ab (1 W, 2 W, 1 M).
- `styles/android-calendar-tabs.css`: Auf Android rückt die Reiterzeile mit dem
  Kopf nach, wenn die Suchleiste weggleitet (`--m3-bar-shift`), mit derselben
  Übergangszeit.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Der Kopf rastet schon über `position: sticky` ein; die Datumszeile hineinzulegen
ist die kleinste Änderung. Die Rasterhöhe (`sizeGrid`) misst den Kopf ohnehin
und rechnet die höhere Zeile automatisch ein. Für die Reiterzeile der Liste
reicht reines CSS nicht, weil die Kopfhöhe mit der Zeitspanne wechselt; darum
setzt das Skript eine Variable, die das CSS liest. Verworfen: eine eigene
Sticky-Regel für die Datumszeile allein (zwei Zeilen, deren Höhen aufeinander
abgestimmt werden müssten) und die Reiter in den Kopf zu verschieben (die
Liste zeichnet sie bei jedem Wechsel neu).
Gilt für alle Handy-Fassungen; am Desktop ist die Datumszeile ausgeblendet.

## Visualisierung
Vorher (hochgewischt, Stundenraster):
```
┌──────────────────────────────┐
│ MO  DI  MI  DO  FR  SA  SO   │  ← bleibt
│ 28  29  30   1  (2)  3   4   │  ← bleibt
├──────────────────────────────┤
│ 17:00 ────────────────────   │
│ 18:00 ────────────────────   │
```

Nachher (hochgewischt, Stundenraster):
```
┌──────────────────────────────┐
│ Freitag, 2. Oktober >  KW 40 ⚙│  ← bleibt jetzt auch
│ MO  DI  MI  DO  FR  SA  SO   │  ← bleibt
│ 28  29  30   1  (2)  3   4   │  ← bleibt
├──────────────────────────────┤
│ 17:00 ────────────────────   │
│ 18:00 ────────────────────   │
```

Nachher (hochgewischt, Liste):
```
┌──────────────────────────────┐
│ Freitag, 2. Oktober >   KW 40│  ← bleibt
│ 28  29  30   1  (2)  3   4   │  ← bleibt
│ Aufgaben  Termine  Projekte ⚙│  ← bleibt jetzt auch
├──────────────────────────────┤
│ Eintrag …                    │  ← läuft darunter durch
```
In Ruhe sieht die Seite unverändert aus. Suchleiste und Navigation gleiten wie
bisher weg und kommen beim Runterwischen zurück.

## Hinweise
- Geprüft bei 375 px, Android und iOS, hell und dunkel, Konsole leer: Raster
  und Liste in Ruhe und hochgewischt, mit und ohne Leisten, Zeitspanne 1 W und 1 M.
- Der eingerastete Kopf ist rund 50 px höher; im Stundenraster bleiben bei
  812 px Höhe etwa sechs Stunden sichtbar.
- Ist der Bildschirm sehr niedrig und die Liste kurz (z. B. 560 px Höhe mit
  Zeitspanne 1 M), kann die Seite am Ende Kopf und Reiterzeile ein Stück
  hochschieben; das gab es für den Kopf schon vorher.
- Nicht geprüft: voller Speicher mit Migration, Browser-Zurück, echtes Wischen
  auf dem Gerät.
- Zentrale Datei berührt: `index.html`.
