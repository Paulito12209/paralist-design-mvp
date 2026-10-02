# 2026-10-02-board-kopf-einrasten

## Problem
Im Aufgaben-Board (Android-Fassung) schnitt die Werkzeugzeile (Archiv, Sortieren,
Filtern, Ansicht) den oberen Rand der Spaltenköpfe ab. Außerdem liefen die Köpfe
beim Scrollen nach oben weg; bei vielen Einträgen ist dann nicht mehr erkennbar,
welche Spalte welche ist.

## Änderung
- `styles/android-card.css`: Die Werkzeugzeile zieht den Inhalt um
  `--m3-card-head-pull` (4 px) unter sich. Das Board rückt um dasselbe Maß nach
  unten, damit nichts vom Kopf verdeckt wird.
- `styles/tasks-board.css`: Der Kopf liegt über den Zeilen und folgt
  `--board-head-shift`; solange er festgehalten ist (`data-board-stuck`), deckt
  die Fuge unter ihm die durchlaufenden Zeilen ab. Kopfkommentar ergänzt.
- `src/shell/board-heads.js` (neu): misst beim Scrollen der Seite, beim Gleiten der
  Werkzeugzeile, beim Neuzeichnen und beim Drehen, wie weit die Köpfe nach unten
  müssen, und schreibt den Wert an den Behälter des Boards. Gilt auch für das
  Projekte-Board (gleiche Klassen).
- `src/main.js`: meldet `initBoardHeads()` an. `src/data/version.js`: neuer
  Versionsstempel.
- Zentrale Dateien: `src/main.js`, `src/data/version.js`.

## Begründung
`position: sticky` im Kopf greift nicht, weil das Board seitlich scrollt und damit
selbst Scrollbereich ist: der Kopf hielte sich am Board statt an der Seite fest.
Das Skript misst daher die Unterkante der Werkzeugzeile; das stimmt auch, während
sie mit der Suchleiste ein- oder ausgleitet (dann gibt es kein Scroll-Ereignis,
deshalb wird so lange jedes Bild nachgemessen, bis die Zeile steht).
Verworfen: das Board zum eigenen senkrechten Scrollbereich machen (Titel und
Suchleiste würden nicht mehr wegscrollen) und die Köpfe als eigene Zeile außerhalb
des Boards führen (müsste beim Wischen mitgeführt werden, Ziehen und Auswahl
müssten umgebaut werden).

## Visualisierung
Vorher:
```
 Archiv          ⇅   ≡   ⎍
 ╭─ Offen 30 ──╮ ╭─ In Arbe…      ← oberste 4 px verdeckt
 ○ Aufgabe 1
 ○ Aufgabe 17                       ← Kopf weg, Spalte unklar
```

Nachher:
```
 Archiv          ⇅   ≡   ⎍
 ╭─ Offen 30 ──╮ ╭─ In Arbeit 0 ─  ← bleibt stehen
 ○ Aufgabe 6                        ← läuft unter dem Kopf durch
 ○ Aufgabe 17
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer; Köpfe sitzen exakt unter der
  Werkzeugzeile, auch während die Suchleiste ein- und ausgleitet.
- Nur mit sichtbarer Werkzeugzeile (Android-Fassung, unter 1024 px); iOS und
  Desktop unverändert.
- Der Kopf wird per Skript bewegt und kann beim schnellen Wischen auf einem echten
  Handy ein Bild hinterherhinken.
- Nicht geprüft: Projekte-Board, Ziehen einer Zeile bei festgehaltenem Kopf,
  Auswahlmodus, Desktop und iOS, voller Speicher mit Migration, Zurück-Pfeil und
  Browser-Zurück, echtes Gerät.
