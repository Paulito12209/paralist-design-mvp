# 2026-10-03-reiter-pro-seite

## Problem
- In „Android (Experiment)“ stand „Projekt hinzufügen“ in der Übersicht auf einer dunklen Kachel wie ein echter Eintrag, obwohl es nur ein Hinweis ist.
- „Reiter anzeigen“ war eine einzige Einstellung für alle Seiten: Wer die Reiter in der Übersicht ausschaltete, hatte sie auch auf der Seite Projekte, bei den Aufgaben und in den Sammlungen weg.

## Änderung
- `styles/android-overview-sheet.css`: Die Zeile „Projekt hinzufügen“ hat keine eigene Kachelfläche mehr, sondern steht auf der Fläche des Containers; gedrückt tönt sie sich durchscheinend. Echte Projekte bleiben dunkle Kacheln. Kopfkommentar ergänzt.
- `src/data/tabs-visibility.js`: Die Wahl gilt je Seite einzeln (`home`, `projects`, `tasks`, `pages`) mit Vorgaben in `tabsDefaults`: Übersicht ohne Reiter, alle anderen mit Reitern.
- `src/ui/tabs-visibility.js`: `tabsScope()` bestimmt aus der offenen Seite, welcher Schalter gemeint ist; je Seite ein Merkmal an `<html>` (`data-tabs-home`, `-projects`, `-tasks`, `-pages`). Neu: `tabsOnHere()`.
- `styles/android-tabs-off.css`: Reiterzeilen und Lage der Werkzeugzeile je Seite statt global. Die Seite Projekte wird per `.page-body:has(> .project-views)` von den Sammlungen unterschieden.
- `src/core/storage.js`: Schlüssel `tabsHidden` ersetzt durch `tabsVisible` (`paralist-tabs-visible-<seite>`, Werte „on“/„off“). Ein früher gespeicherter globaler Wert wird bewusst nicht übernommen.
- `src/ui/pill-swipe.js`: Die Wischprüfung fragt die Reiter der offenen Seite ab.
- `src/ui/view-panel.js`: nur ein Kommentar („wirkt für die offene Seite“).
- `src/data/version.js`: neuer Versionsstempel.
- Zentrale Dateien berührt: `src/data/version.js`, `src/core/storage.js`, `src/ui/view-panel.js` (nur Kommentar).

## Begründung
- Der Platzhalter ist ein Hinweis und kein Eintrag; die Kachelfarbe bleibt echten Einträgen vorbehalten.
- Feste Vorgaben je Seite statt Übernahme des alten Werts, damit die Übersicht ohne Reiter startet und die Seite Projekte sie zeigt.
- Aufgaben und übrige Sammlungen sind ebenfalls getrennt, damit nichts mehr versehentlich mitzieht; sie bleiben standardmäßig an.
- Verworfen: ein Schalter nur für Übersicht und Projekte-Seite (Aufgaben und Sammlungen hingen weiter an einer gemeinsamen Wahl).

## Visualisierung
Vorher:
```
 Projekte                        ↗
 🗄 Archiv                  ⇅  ⛛
 ┌───────────────────────────────┐   ← dunkle Kachel,
 │ 🚀+ Projekt hinzufügen        │     sieht wie ein Eintrag aus
 └───────────────────────────────┘
```

Nachher:
```
 Projekte                        ↗
 🗄 Archiv                  ⇅  ⛛
   🚀+ Projekt hinzufügen            ← kein Kasten, Containerfarbe

Übersicht:       keine Reiter (Vorgabe)
Seite Projekte:  (Alle) (+ Neue Ansicht)   (Vorgabe)
```

## Hinweise
- Geprüft im Browser (375 px, hell und dunkel, leerer Speicher, Konsole leer): Vorgaben, Umlegen auf der Seite Projekte lässt die Übersicht unverändert, Übersicht einschalten lässt die Projekte-Seite unverändert.
- Nicht geprüft: Aufgaben und Sammlungen mit ausgeschalteten Reitern, Board-Modus; die einrastende Werkzeugzeile dort am Gerät ansehen.
- Wischen zwischen Projekt-Ansichten auf der Übersicht ohne Reiter soll wie bisher nichts wechseln.
- Ein früher umgelegtes „Reiter anzeigen“ gilt nicht mehr; alle Seiten starten mit den neuen Vorgaben.
