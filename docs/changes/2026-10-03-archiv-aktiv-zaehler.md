# 2026-10-03-archiv-aktiv-zaehler

## Problem
- Im Archiv blieb die Zeile links über der Liste leer. In den aktiven Listen steht dort „Archiv (n)“, aber vom Archiv aus gab es keinen Rückweg zu den aktiven Listen.
- Die Reiter des Archivs ließen sich über „Ansicht → Tabs anzeigen“ ausblenden. Dann kam man im Archiv nicht mehr schnell zwischen den Kategorien hin und her.

## Änderung
- Neu `src/data/archive-active.js`: zählt die aktiven Dinge je Archiv-Pille und liefert Beschriftung und Symbol („Aktive Projekte“, bei „Alle“ „Aktive Einträge“).
- Neu `src/features/overview/archive-active.js`: öffnet die Sammlungsliste zur Pille (Projekte, Arbeitsbereiche, Ressourcen mit passender Pille, Reiter Aufgaben/Termine/Medien, Lesezeichen). Unter „Alle“ öffnet es ein Bottom Sheet mit allen Kategorien und ihrer Zahl.
- `src/ui/list-head.js`: neuer Knopf `data-open-active` („Aktive Projekte (2)“) an der Stelle von „Archiv (n)“, gleiche Klasse und damit gleiches Aussehen.
- `src/features/overview/page-list-head.js`: baut den Knopf im Archiv ein und behandelt den Tipp.
- `src/features/overview/archive.js`: `activePill` ist jetzt exportiert (nur diese Zeile).
- `styles/android-tabs-off.css`: die Archiv-Reiter (`.archive-pills`) werden nie ausgeblendet; Kopfkommentar ergänzt.
- `src/features/overview/collection-panel.js`: im Archiv fehlt die Zeile „Tabs anzeigen“.
- `src/data/version.js`: neuer Versionsstempel.
- Zentrale Dateien berührt: `src/data/version.js`, `styles/android-tabs-off.css`.

## Begründung
- Die Archiv-Reiter sind Navigation, kein Ansichtswunsch; deshalb gibt es dort keinen Schalter. Verworfen: den Schalter für das Archiv separat speichern, das wäre nur mehr Zustand für eine Einstellung, die niemand braucht.
- Der Knopf teilt die Klasse von „Archiv (n)“, daher kein neues CSS und keine neue Stildatei.
- Der Tipp führt immer zur Sammlungsliste, nie zur Übersichtsseite. Unter „Alle“ gibt es kein einzelnes Ziel, darum das Sheet (nutzt den vorhandenen Sheet-Baustein, sieht in Android und im Experiment wie die übrigen aus).
- Bei 0 aktiven Einträgen steht der Knopf trotzdem da, nur ohne Zahl.

## Visualisierung
Vorher:
```
 Archiv
 Alle 1  Arbeitsber.  Projekte  Aufg…      <- per „Tabs anzeigen“ ausblendbar
 ───────────────────────────────────
                         ⇅   ⛛   ⚙         <- links leer
 🚀 Test                              ⋮
```

Nachher:
```
 Archiv
 Alle 3  Arbeitsber.  [Projekte]  Aufg…    <- immer sichtbar
 ───────────────────────────────────
 🚀 Aktive Projekte (2)   ⇅   ⛛   ⚙       <- Tipp: Seite Projekte
 🚀 Test                              ⋮

 Unter „Alle“: ▦ Aktive Einträge (2)  -> Sheet:
 ┌───────────────────────────────┐
 │ Aktive Einträge               │
 │ ≋ Arbeitsbereiche             │
 │ 🚀 Projekte                 2 │
 │ ✓ Aufgaben                    │
 │ ✎ Notizen   … Lesezeichen     │
 └───────────────────────────────┘
```

## Hinweise
- Der Tipp auf „Aktive Notizen“, „Dokumente“ oder „Zeichnungen“ ändert die gemerkte Pille der Ressourcen-Seite.
- „Alle“ zählt alle nicht archivierten Einträge und Arbeitsbereiche; die Archiv-Filter wirken darauf nicht.
- Die Werkzeugzeile mit dem Knopf erscheint nur in Android und im Experiment.
- Geprüft im Browser (375 px, hell und dunkel, Android und Experiment, auch mit gespeichertem „Tabs aus“, Konsole leer). Am Gerät ansehen: das Sheet im Experiment-Stil sowie Zurück-Pfeil und Browser-Zurück nach einem Sprung vom Archiv in eine Liste.
- Dasselbe Ausblenden der Reiter könnte Ressourcen oder Lesezeichen betreffen; dort wurde nichts geändert.
