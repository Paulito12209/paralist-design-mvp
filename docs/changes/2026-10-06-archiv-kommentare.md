# 2026-10-06-archiv-kommentare

## Problem
PR #196 (2026-10-05-aufgaben-zeilen-ziehen-kopf) hat `src/shell/android-archive.js` und den Archiv-Knopf links unten in der Android-Fassung entfernt. Zwei Kopfkommentare verwiesen noch auf die gelöschte Datei und den Knopf.

## Änderung
Nur Kommentare, kein Code:
- `src/features/overview/projects.js`: In der Android-Fassung ist die Pille „Zum Archiv“ ausgeblendet (`styles/android-archive.css`); ins Archiv führen „Archiv (n)“ in der Werkzeugzeile und die Karte „Archiv“ der Übersicht.
- `src/features/overview/workspace-collection.js`: „Zum Archiv“ ist in der Android-Fassung ausgeblendet (`styles/android-archive.css`); dort führt die Karte „Archiv“ der Übersicht ins Archiv.

## Begründung
Die Kommentare beschreiben, was der Code heute tut: Beide Seiten bauen die Pille „Zum Archiv“ weiter, `styles/android-archive.css` blendet sie in Android aus. Die Seite Projekte hat dort die Werkzeugzeile mit „Archiv (n)“, die Seite Arbeitsbereiche nicht — dort bleibt nur die Karte „Archiv“ der Übersicht, wie in der Doku von PR #196 beschrieben. `git grep -n "android-archive.js" -- src styles` findet danach nichts mehr. **Geltungsbereich:** nur Kommentare, kein sichtbares Verhalten.

## Visualisierung
Vorher (projects.js):
```
die Pille „Zum Archiv“ ersetzt dort der Archiv-Knopf links unten
(src/shell/android-archive.js), die Karte „Ansicht“ kommt als Blatt von unten.
```

Nachher:
```
die Pille „Zum Archiv“ ist dort ausgeblendet (styles/android-archive.css), ins Archiv
führen „Archiv (n)“ und die Karte „Archiv“ der Übersicht. Die Karte
„Ansicht“ kommt dort als Blatt von unten.
```

Vorher (workspace-collection.js):
```
(in der Android-Fassung der Archiv-Knopf links unten, src/shell/android-archive.js).
```

Nachher:
```
(in der Android-Fassung ausgeblendet, styles/android-archive.css — dort
führt die Karte „Archiv“ der Übersicht ins Archiv).
```

## Hinweise
Kein Risiko: keine Codezeile geändert, keine zentrale Datei berührt. `python3 tools/check.py` meldet „alles in Ordnung“.
