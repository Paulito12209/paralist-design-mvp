# 2026-10-04-details-blatt-google-tasks

## Problem
- „Details“ im Drei-Punkte-Menü einer Zeile (Aufgaben-Reiter, Projekte, Menü eines Arbeitsbereichs) öffnete ein eigenes, schlichtes Blatt mit wenigen Angaben. Der ⓘ-Knopf auf der Seite öffnete ein ganz anderes, ausführliches Blatt.
- Im Android-Blatt standen oben „Details“ und ein Symbol statt des Titels, die Werte in drei Spalten, der Rand an den Seiten war zu breit, und „Als erledigt markieren“ fehlte.
- Im Verknüpfen-Blatt standen Arbeitsbereiche und Projekte gemeinsam unter „Ablageort“, dazu eine eigene Zeile „Eingang“.

## Änderung
- `src/ui/details-sheet.js`: ein Blatt für Menü und ⓘ-Knopf. `openDetailsFor(kind, subject)` öffnet es aus einer Liste heraus. In der Android-Fassung: Kopf statt Überschrift, Zeilen statt Kennzahlen, Leiste unten, Blatt endet beim Öffnen mitten in der zweiten Zeile unter „Nutzung“. Jede Datenänderung zeichnet das offene Blatt neu. Escape schließt erst ein Blatt darüber.
- `src/ui/details-rows.js` (neu): Kopf (Icon, Titel einzeilig mit „…“, Tipp klappt auf; Kategorie, Tipp öffnet „Typ ändern“), Zeile „Verknüpfen“ mit Chips (ohne Ort „Eingang“, bei Medien „Ressourcen“), Zeilen Dringlichkeit, Fälligkeit, Status, Erinnerung usw., beim Arbeitsbereich sein Tab, Knopf „Als erledigt markieren“ / „Wieder öffnen“.
- `styles/android-details.css` (neu, in `index.html` nach `android-bottom-sheet.css` und in `docs/styles-dateien.md`): Material-3-Optik, Rand 16px, Trennlinie unter dem Kopf, Leiste unten mit je 16px Luft über und unter dem Knopf.
- `src/ui/link-sheet.js`: Reiter „Ablageort“ aufgeteilt in „Arbeitsbereiche“ (nach Tabs gruppiert) und „Projekte“ (fehlt bei Projekten). Keine Zeile „Eingang“ mehr: ohne angehakten Ort liegt der Eintrag im Eingang.
- `src/ui/entry-menu.js`, `src/features/overview/page.js`: „Details“ öffnet das gemeinsame Blatt.
- `src/ui/details.js` gelöscht, `src/data/details.js` auf `entryTypeName` verkleinert.
- `src/data/entry-facts.js`, `workspace-facts.js`, `entry-stats.js`: „Geöffnet“ heißt „Aufrufe“ und steht vor „Verweildauer“ (vorher „Zeit auf dieser Seite“), „Besuch davor“ heißt „Aufruf davor“, „Im Schnitt je Besuch“ heißt „Im Schnitt je Aufruf“.
- Zentrale Dateien berührt: `index.html` (eine `<link>`-Zeile), `docs/styles-dateien.md`.

## Begründung
- Vorbild sind die Aufgaben-Seite von Google Tasks und das Blatt eines Titels in der Sonos-App, ohne Kreise um die Icons.
- Das vorhandene Verknüpfen-Blatt wird wiederverwendet statt eigener Pillen für Arbeitsbereich und Projekt.
- Verworfen: ein Kopf nach Art einer Kinokarte mit Farbfläche und Kategorie-Emblem; getrennte Pillen „Mit Arbeitsbereich verknüpfen“ und „Mit Projekt verknüpfen“.
- **Geltungsbereich:** Aufbau des Blatts nur in der Android-Fassung (beide Varianten, unter 1024px). Neue Reiter im Verknüpfen-Blatt, die neuen Texte unter „Nutzung“ und das gemeinsame Blatt aus dem Menü gelten in allen Fassungen.

## Visualisierung
Vorher:
```
┌ Details ───────────────┐
│ Bachelorarbeit          │
│ Typ          Projekt    │
│ Speicherort  Studium    │
│ Fällig am    3. Dez.    │
└─────────────────────────┘
```

Nachher:
```
┌──────────────────────────────────┐
│ 🚀  Bachelorarbeit               │
│     Projekt ˅                    │
├──────────────────────────────────┤
│ 🔗  Verknüpfen                   │
│     [📁 Studium]                 │
│ 🔥  Als Nächstes / Dringlichkeit │
│ 📅  Do., 3. Dez. / Fälligkeit    │
│ ◎   Offen / Status               │
│ 🕒  Erinnerung hinzufügen        │
│ NUTZUNG                          │
│ Aufrufe                    4-mal │
│ Verweil▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
├──────────────────────────────────┤
│        ( Als erledigt markieren )│
└──────────────────────────────────┘

Verknüpfen-Blatt:
Zuletzt | Arbeitsbereiche | Projekte | Aufgaben …
  Meine: Studium, Haushalt …   Arbeit: Website-Relaunch …
```

## Hinweise
- Am Gerät prüfen: „Typ ändern“ aus dem Kopf (nach Zurück war das Detail-Blatt darunter zu), Datumsfeld bei „Fälligkeit“, Status-Blatt über dem Detail-Blatt, Zurück-Geste bei offenem Blatt.
- `clearPlaces` in `src/data/mutations.js` wird nicht mehr benutzt.
- `src/data/version.js` nennt noch `src/ui/details.js`; das setzt der Git Commit Manager.
- Offen in einer eigenen Aufgabe: selbst angelegte Dokumente erscheinen nicht unter „Eigene Dokumente“ bei den Ressourcen.
