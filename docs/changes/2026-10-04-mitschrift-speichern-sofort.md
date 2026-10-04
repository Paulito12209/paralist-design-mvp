# 2026-10-04-mitschrift-speichern-sofort

## Problem
Im Sprachmemo-Overlay blieb „Speichern“ im Modus „Nur Mitschrift“ (aus #143, `2026-10-04-aufnahme-android-mikrofon`) grau, solange die Aufnahme lief — obwohl der Text schon unter „Mitschrift“ stand. Erst nach „Stoppen“ wurde der Knopf frei. Im Modus „Aufnahme + Mitschrift“ ist „Speichern“ während der Aufnahme dagegen tippbar.

Ursache: Ob „Speichern“ frei ist, berechnet `canSave()` nur bei einem Zustandswechsel (`setState`). Im Modus „Nur Mitschrift“ hängt die Antwort aber am Text, und das Ankommen von Text löste keine Auffrischung aus.

## Änderung
- `src/features/media/recorder.js`, `newSpeech()`: Kommt im Modus „Nur Mitschrift“ während der Aufnahme oder Pause Text an, frischt `setState(state)` die Knöpfe auf. Nach einem Fehler der Spracherkennung (`fail(...)`) endet die Rückmeldung sofort, damit der Fehlerzustand nicht überschrieben wird.
- Gefunden beim Zusammenführen von #143 und #146 im Git Commit Manager; kleiner Fix auf ausdrückliche Bitte (CLAUDE.md, Abschnitt 6).

## Begründung
`setState(state)` ist der vorhandene Weg, Knöpfe und Hinweise nach dem Zustand neu zu setzen — kein zweiter Weg für dieselbe Aufgabe. Die Auffrischung läuft nur im Modus „Nur Mitschrift“ und nur während Aufnahme oder Pause, damit sich am Modus mit Aufnahme nichts ändert. Verworfen: „Speichern“ im Modus „Nur Mitschrift“ immer freigeben — dann legte ein Tipp ohne Text nichts an, ohne dass man sieht, warum.

## Visualisierung
Vorher:
```
Mitschrift
Hallo das ist ein Test
[■]  ╭❚❚ ╭Speichern╮╮  Abbrechen     ← „Speichern“ grau bis „Stoppen“
```

Nachher:
```
Mitschrift
Hallo das ist ein Test
[■]  ╭❚❚ ╭Speichern╮╮  Abbrechen     ← tippbar, sobald das erste Wort da ist
```

## Hinweise
- Geprüft mit simuliertem Mikrofon und simulierter Spracherkennung bei 375 px: vor dem ersten Wort grau, mit Text frei; Speichern während der Aufnahme legt eine Notiz an, ohne „Aufnahme verwerfen?“ zu fragen; ohne Text bleibt der Knopf grau; Modus mit Aufnahme unverändert (Abbrechen ab 3 s fragt, Speichern legt Medien-Eintrag mit Mitschrift an). Konsole leer.
- `src/features/media/recorder.js` hat jetzt 394 Zeilen und liegt über der 360-Zeilen-Schwelle: vor der nächsten Änderung teilen (eigene Aufgabe „recorder.js teilen“).
- Am Android-Gerät testen: Modus „Nur Mitschrift“ wählen (⚙ → „Mikrofon nutzen für“), sprechen, während der Aufnahme „Speichern“ tippen.
