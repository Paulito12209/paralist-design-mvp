# 2026-10-02-tab-neue-ansicht-snap

## Problem
Bei vielen Reitern wurde „+ Neue Ansicht“ aus der Zeile geschoben, und das
Plus konnte angeschnitten werden. Außerdem war in „Android (Experiment)“ der
runde Knopf „Ansicht“ über der Leiste doppelt gemoppelt: das Blatt „Ansicht“
öffnet inzwischen auch das dritte Symbol der Werkzeugzeile unter den Reitern.

## Änderung
**Plus rastet ein** (Android und Android (Experiment), je im eigenen Stil):
Zuerst wird „Neue Ansicht“ am rechten Rand abgeschnitten. Würde auch das Plus
hinausgeschoben, rastet es am rechten Rand ein (`position: sticky`), die Reiter
laufen unter ihm durch. Links an der Tippfläche des Plus blendet ein Verlauf
(`--tab-pills-fade`, 16px) die Reiter aus — nur solange es wirklich einrastet.
Ins Bild gerollte Reiter bleiben links von Plus und Verlauf.

- `src/ui/pill-add.js`: Das Plus besteht aus drei Geschwistern (Plus, unsichtbare
  Marke, Beschriftung); nur so rastet das Plus allein ein. Neu `addPill()`.
- `src/ui/pill-snap.js` (neu): setzt `is-snapped` am Plus, wenn es festgehalten
  wird (misst die Marke gegen den Rand der Leiste).
- `src/main.js`: `initPillSnap()` angemeldet; `initAndroidViewBtn()` entfernt.
- `src/features/overview/tabs.js`: die Tabs der Arbeitsbereiche nutzen `addPill()`
  (dasselbe Einrasten, ohne Beschriftung).
- `src/ui/pill-swipe.js`: Tipp auf die Beschriftung rollt den neuen Reiter ins Bild.
- `styles/android-tab-snap.css` (neu): Einrasten, Verlauf, Beschriftung; Kapsel
  in Experiment mit Farben der Kapsel.
- `styles/tokens-android.css`: `--m3-snap-edge`, `--m3-snap-bleed`,
  `--m3-snap-reach`, `--m3-seg-snap-reach`; `--m3-view-btn-size` entfällt.
- `styles/android-tabs.css`, `styles/android-segmented.css`, `styles/overview.css`,
  `styles/ios-segmented.css`: an den neuen Aufbau des Plus angepasst
  (iOS sieht unverändert aus und bekommt das Einrasten nicht).
- `index.html`, `styles/tokens.css`: neue Stil-Datei eingebunden und gelistet.

**Knopf über der Leiste entfernt** (Experiment):
- `src/shell/android-view-btn.js` gelöscht; `styles/android-view-btn.css` auf die
  übrigen Regeln gekürzt (Symbole oben bleiben aus, außer im Kalender).
- `src/data/platform-versions.js`: Text der Unterschiede angepasst.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Einrasten macht reines CSS (`sticky`); das Skript ist nur für den Verlauf nötig,
weil CSS nicht erkennt, ob das Plus gerade über Reitern liegt. Verworfen: ein
Knopf, der als Ganzes einrastet (dann wäre „Neue Ansicht“ nie abgeschnitten
worden), und ein Verlauf, der immer an ist (er blendete bei wenigen Reitern den
letzten Reiter an). Der Kalender hat keine Werkzeugzeile und behält daher sein
Symbol „Ansicht“ neben „KW“. Die Gruppierung von Projekt-Ansichten (Status,
Dringlichkeit, Arbeitsbereich) ist bewusst nicht Teil dieser Änderung.

## Visualisierung
Vorher:
```
 ( Alle | Test | Ansicht 3 | Ansicht 4 | Ansich|+ Neue An
                                           Plus abgeschnitten / unsichtbar
 unten (Experiment):   (Archiv)    [≡]    [+ Neu]
```

Nachher:
```
 ( Alle | Test | + Neue Ansicht )                          wenige Reiter: wie bisher
 ( Alle | Ansicht 2 | Ansicht 3 | Ansich▒▒ + Neue An )     Text zuerst abgeschnitten
 ( Alle | Ansicht 2 | Ansicht 3 | Ansicht ░▒▓ +  )         Plus rastet ein, 16px Verlauf
 ( … Ansicht 7 | Ansicht 8 | + Neue Ansicht )              ganz rechts: alles sichtbar
 unten (Experiment):   (Archiv)           [+ Neu]
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer: Projekte (Android, Experiment,
  iOS), Aufgaben, Arbeitsbereiche, Kalender; Tippen auf Plus und Beschriftung,
  auch bei eingerastetem Plus; Umbenennen und Bestätigen eines neuen Reiters.
- Nicht geprüft: voller Speicher mit Migration, Zurück-Pfeil und Browser-Zurück,
  Desktop-Ansicht.
- Experiment, Projekte, Tab „Alle“: kein Weg mehr zum Blatt „Ansicht“, solange die
  Werkzeugzeile dort nur Sortieren zeigt.
- Am Rand der Kapsel kann beim eingerasteten Plus ein 1-Pixel-Rest eines Reiters
  durchblitzen (Glättung der runden Kante).
- Gemeinsam genutzte Dateien: `index.html`, `src/main.js`, `styles/tokens.css`,
  `styles/tokens-android.css`, `src/data/version.js`, `src/ui/pill-add.js`.
