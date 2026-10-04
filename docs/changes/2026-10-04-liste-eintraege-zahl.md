# 2026-10-04-liste-eintraege-zahl

## Problem
Über der Projektliste (Übersicht, Seite Projekte) und über den Aufgaben stand in
der Werkzeugzeile der Android-Fassung nur „Archiv (2)“. Im Kanban-Board liegen
volle Spalten (z. B. „Später“, wo neue Aufgaben landen) oft rechts außerhalb
des Bildschirms — man sah also nur die Zahl der archivierten Einträge, aber
nicht, wie viele aktive Einträge die Ansicht hat, und konnte meinen, es gäbe
keine.

## Änderung
- `src/ui/list-head.js`: Der Archiv-Knopf nimmt optional die Zahl der aktiven
  Einträge (`entries`). Ist sie größer als 0, wird der Knopf kurz (nur Icon und
  Archiv-Zahl, Vorlesetext weiter „Archiv (n)“), dahinter stehen eine feine
  senkrechte Linie und „n Einträge“ („1 Eintrag“). Ohne aktive Einträge bleibt
  es bei „Archiv (n)“.
- `src/features/overview/project-card.js`: reicht die Zahl der Projekte der
  gewählten Ansicht herein (`visibleProjects`).
- `src/features/tasks/tasks-settings.js`: reicht die Zahl der aktiven Aufgaben
  der Ansicht herein (ohne Archiviertes bzw. die Spalte „Archiviert“).
- `styles/android-card.css`: Stil für Linie (`.project-card-divider`) und Text
  (`.project-card-count`), kürzerer Innenabstand des kurzen Knopfs.
- `styles/tokens-android.css` (zentrale Datei): neue Werte
  `--m3-card-count-gap` (10px), `--m3-card-divider-h` (14px),
  `--m3-card-divider-color` (`--m3-outline-variant`, leises Grau hell/dunkel).

### Nachbesserung: Archiv-Icon größer, Tippfläche wie Sortieren
- `styles/android-card.css`: Icon des Archiv-Knopfs 22px statt 18px (neuer Wert
  `--m3-card-archive-icon` in `styles/tokens-android.css`), weil es neben den
  24px-Symbolen rechts kleiner wirkte. Der Knopf ist jetzt 48px hoch
  (`--m3-card-tool-size`, wie Sortieren) mit 48px Mindestbreite; mit Icon und
  Archiv-Zahl ergibt sich daraus etwa 60px Breite (Inhalt, keine feste Breite).
  Ohne aktive Einträge bleibt es bei Icon + „Archiv (n)“ in 48px Höhe.
  Gilt überall, wo der Knopf links in der Werkzeugzeile steht (auch „Aktive …“ im Archiv).
- `--m3-text-btn-h` bleibt unverändert (wird von anderen Stellen genutzt).

## Begründung
Das Wort „Archiv“ bleibt, solange die Ansicht leer ist — so lernt man, wohin
der Knopf führt. Sobald es Einträge gibt, ist die Zahl der aktiven Einträge
wichtiger; die Archiv-Zahl bleibt als Ziffer neben dem Icon. Gezählt wird, was
die Ansicht zeigt (nach Filter), damit die Zahl zur Liste/zum Board passt.
„n Einträge“ ist reiner Text, kein Knopf.
Geltungsbereich: nur Android-Fassung (die Werkzeugzeile gibt es nur dort),
nur Projekte und Aufgaben. Die Sammlungen (Eingang, Favoriten, Ressourcen,
Lesezeichen, Arbeitsbereiche) behalten „Archiv (n)“ — dort wird je Reiter sehr
unterschiedlich gezählt; das wäre ein eigener Schritt.

## Visualisierung
Vorher:
```
[▭] Archiv (2)                       ⇅   ≡   ⫶
```

Nachher:
```
mit Einträgen:        [▭] 2 │ 4 Einträge     ⇅   ≡   ⫶
nichts im Archiv:     [▭] │ 4 Einträge       ⇅   ≡   ⫶
Ansicht leer:         [▭] Archiv (2)         ⇅   ≡   ⫶
```

## Hinweise
- Mit „Erledigte anzeigen“ zählen abgehakte Aufgaben mit, weil die Ansicht sie zeigt.
- Testen: Aufgabe anlegen/abhaken — die Zahl muss sich sofort ändern; Tipp aufs
  kurze Icon öffnet das Archiv.
- Abstand und Linienhöhe in `styles/tokens-android.css` anpassbar.
