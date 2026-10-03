# 2026-10-03-statistiken-seite

## Problem
- Die Seite hinter der Level-Anzeige hieß „Fortschritt“ und begann mit dem großen Ring; die Analyse (Nutzungszeit, Serie) stand erst darunter.
- Der Pfeil auf der Karte „Meilensteine“ sah anders aus als der runde Pfeil-Knopf der beiden Analyse-Kacheln.
- Die Karte „Wo die Zeit hingeht“ trug das Ebenen-Icon, das auch für Arbeitsbereiche steht.
- Die Seite „Serie“ erklärte nicht, was gemessen wird; „1 T“ und „Längste“ waren nicht zu verstehen.

## Änderung
- `src/features/progress/progress.js`, `index.html`: Seitentitel und Zurück-Pfeil heißen „Statistiken“. Am Handy kommt zuerst „Analyse“ mit den zwei Kacheln, dann die Überschrift „Fortschritt“, dann Ring, Meilensteine, Verlauf, Nächste Stufen, Historie. Am Desktop bleibt die Reihenfolge.
- `src/features/progress/progress-milestones.js`, `styles/milestones.css`: Der Pfeil im Kopf der Karte „Meilensteine“ nutzt `.mini-go` (runder grauer Knopf).
- `styles/progress.css`, `styles/android-pages-content.css`, `styles/desk-progress.css`: Die Regel für Kopf-Icons der Karten gilt nur noch für das Symbol vor dem Titel (`.pcard-head > .icon`), damit der Pfeil-Knopf nicht mitvergrößert wird.
- `assets/icons/sprite.svg`, `src/ui/usage-split.js`: neues Icon `hourglass` (Sanduhr) für „Wo die Zeit hingeht“.
- `src/ui/usage-pages.js`, neu `src/ui/streak-legend.js` und `styles/streak-legend.css` (eingetragen in `index.html` und `styles/tokens.css`): Serie zeigt „1 Tag“/„2 Tage“ mit Hinweiszeile, „Längste Serie“ und unter dem Raster eine Erklärung (was gemessen wird, aktuelle und längste Serie, wofür, wie man das Raster liest, Skala).

## Begründung
- `insightsSection()` bleibt unverändert, weil das Desktop-Profil sie ebenfalls nutzt; die Überschrift „Fortschritt“ hängt deshalb nur an der Handy-Fassung.
- Der Menüpunkt „Fortschritt“ an der Level-Anzeige und die Texte „Fortschritt öffnen“ blieben, weil nur der Seitentitel gewünscht war.
- Die Erklärung steht in der Karte „Serie“ selbst, weil `streakCard()` auch im Desktop-Profil verwendet wird. Eine neue CSS-Datei, weil `profile.css` schon 369 Zeilen hat.

## Visualisierung
Vorher:
```
< Fortschritt                < Serie
┌──────────────┐             Aktuelle Serie   Längste
│  Ring 1 XP   │             1 T              2 T
└──────────────┘             [Raster]
Analyse                      Wochentage von Montag oben …
[Nutzung][Serie]
[Meilensteine  >]
```
Nachher:
```
< Statistiken                < Serie
Analyse                      Aktuelle Serie   Längste Serie
[Nutzung][Serie]             1 Tag            2 Tage
Fortschritt                  in Folge, bis…   in Folge, Bestwert
┌──────────────┐             [Raster]
│  Ring 1 XP   │             ─────────────
└──────────────┘             Was gemessen wird …
[Meilensteine (>)]           Aktuelle / Längste Serie …
                             So liest du das Raster  keine ●●●●● viel
```

## Hinweise
- Gemeinsam genutzte Dateien: `index.html`, `styles/tokens.css`, `assets/icons/sprite.svg`, drei Stildateien (davon eine für Android).
- Am Gerät prüfen: Kopf-Icons der Karten (Verlauf, Nächste Stufen, Historie, Nutzungszeit, Serie) unverändert, Desktop-Profil mit der neuen Serien-Erklärung, hell und dunkel.
- Im Browser-Pane erschienen vier `ERR_CONNECTION_RESET` in der Konsole; keine der Seiten-Dateien war als fehlgeschlagen eingetragen.
