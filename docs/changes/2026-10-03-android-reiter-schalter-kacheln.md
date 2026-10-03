# 2026-10-03-android-reiter-schalter-kacheln

## Problem
In der normalen Android-Fassung fehlte, was das Experiment schon hatte: Von den Kacheln 5 und 6 schaute rechts nichts hervor (stattdessen eine Seitenlinie), die Reiter ließen sich im Blatt „Ansicht“ nicht ausschalten, und die zweite Kartenseite stand in anderer Reihenfolge als im Experiment.

## Änderung
- `styles/android-overview-sheet.css`, `styles/tokens-android.css`: Die Kartenreihe mit Peek gilt jetzt in beiden Android-Fassungen. „Android“ zeigt 20 px (`--m3-ov-peek`), das Experiment bleibt bei 24 px (neu: `--m3-ov-peek-experiment`). Die Seitenlinie unter den Kacheln entfällt in beiden Fassungen; der Abstand zu „Projekte“ bleibt gleich (die Überschrift trägt ihn jetzt allein). Der Container der Übersicht bleibt nur im Experiment.
- `styles/android-tabs-off.css`: Der Schalter „Reiter anzeigen“ und das Ausblenden der Reiterzeilen gelten für `data-mobile-os="android"`. Sind die Reiter der Übersicht aus, steht über der Werkzeugzeile eine durchgehende Linie in der Farbe der Reiterlinie (nur „Android“; das Experiment hat seine eigene).
- `src/data/tabs-visibility.js`: Vorgaben je Fassung. „Android“: Reiter überall an; Experiment: Übersicht ohne Reiter wie bisher. Die gespeicherte Wahl gilt in beiden Fassungen gemeinsam.
- `src/ui/tabs-visibility.js`, `src/features/profile/versions.js`: `applyTabs()` wird exportiert und beim Fassungswechsel aufgerufen, damit die Vorgaben sofort greifen.
- `src/features/overview/overview.js`: Die zweite Kartenseite steht in beiden Android-Fassungen als Lesezeichen / Personen / Archiv / Pläne (Lesezeichen neben Favoriten, Archiv neben Ressourcen).
- `src/data/platform-versions.js`: Unterschiede des Experiments an den neuen Stand angepasst. `styles/tokens.css`: Stil-Liste angepasst. `src/data/version.js`: neuer Versionsstempel.
- Zentrale Dateien berührt: `styles/tokens.css` (nur Textzeile), `styles/tokens-android.css`, `src/data/version.js`.

## Begründung
Die gemeinsame Basis lag schon bei `data-mobile-os="android"`, nur die Selektoren standen auf „experiment“; eine Selektoränderung vermeidet doppelte Regeln. Der Peek zeigt schon, dass es weitergeht, deshalb entfällt die Seitenlinie. Bei ausgeschalteten Reitern trennt die durchgehende Linie weiter, wie die Reiterlinie es sonst tut. Verworfen: eine zweite Kopie der Peek- und Reiter-Regeln für „Android“; der Projekte-Container in „Android“ (ausdrücklich nicht gewünscht).

## Visualisierung
Vorher:
```
[Eingang ][Favoriten]
[Arbeitsb.][Ressourcen]
          ▬▬▬▬
Projekte
Alle  + Neue Ansicht
══════════════════════
```
Nachher:
```
[Eingang ][Favoriten][L│     20 px Peek: Lesezeichen / Archiv
[Arbeitsb.][Ressourcen][A│
Projekte
Alle  + Neue Ansicht          Reiter an
══════════════════════

Projekte
══════════════════════        Reiter aus: Linie bleibt
Archiv         ⇅  ⚙
```

## Hinweise
- Geprüft im Browser (375 px, hell und dunkel, Konsole leer): Peek, Schalter auf Übersicht und Seite Projekte, Fassungswechsel im laufenden Betrieb, iOS ohne Schalter, Experiment pixelgleich.
- Nicht geprüft: Aufgaben und Sammlungen mit ausgeschalteten Reitern, Board, Wischen der Kachelreihe und einrastende Werkzeugzeile am Gerät.
- Auf der leeren Seite Projekte ist der Schalter bei ausgeschalteten Reitern unerreichbar, bis ein Projekt existiert (gilt auch im Experiment).
- Die Linie bei ausgeschalteten Reitern gibt es nur auf der Übersicht; die Kartenreihenfolge wechselt beim Fassungswechsel erst beim nächsten Zeichnen.
