# 2026-10-02-projekte-aus-ohne-alle-orte

## Problem
Im Blatt „Projekte aus“ (Filtern der Projekte-Ansicht) stand „Alle Orte“ als
eigene Zeile mit Haken. Das ist überflüssig: „Alle Orte“ ist der Ausgangszustand
ohne Filter, und ein Filter lässt sich ohnehin wieder abwählen.

## Änderung
- `src/features/overview/project-settings.js`: Die Zeile „Alle Orte“ ist aus
  dem Blatt entfernt. Tippt man den schon gewählten Ort (Haken) noch einmal an,
  wird `place` wieder auf `"alle"` gesetzt und der Filter ist aufgehoben.
  Kopfkommentare angepasst.
- Die Filter-Zeile in der Karte „Ansicht“ zeigt weiter „Alle Orte“, solange
  nichts gefiltert ist (reine Anzeige).

## Begründung
Der Ort-Filter ist eine Einfachwahl; „Alle Orte“ war nur sein „kein Filter“-Wert.
Erneutes Antippen des gewählten Orts ersetzt ihn, wie bei Mehrfachwahl-Filtern.
„Eingang“ bleibt, weil es ein echter Wert ist (Projekte ohne Ort). Verworfen:
ein eigener „Zurücksetzen“-Knopf im Blatt — das Antippen leistet dasselbe.
Bewusst nur hier geändert: das Aufgaben-Filterblatt (`tasks-filter.js`) und der
Filter der Sammlungen (`collection-filter.js`) behalten „Alle Orte“, bis die
Aufgaben-Seite fertig umgesetzt ist.

## Visualisierung
Vorher:
```
┌─────────────────────┐
│ Projekte aus        │
│ ▤ Alle Orte      ✓  │
│ ⤓ Eingang           │
│ 📁 Software Entw.   │
└─────────────────────┘
```

Nachher:
```
┌─────────────────────┐
│ Projekte aus        │
│ ⤓ Eingang           │
│ 📁 Software Entw.   │
│ 📁 VST 31           │
└─────────────────────┘
Ohne Filter: kein Haken.
Gewählten Ort noch einmal antippen = Filter aus.
```

## Hinweise
- Dass sich der Ort wieder abwählen lässt, zeigt nur der Haken an.
- Geprüft: 375 px, Konsole leer, Ort wählen und wieder abwählen. Nicht geprüft:
  Hell/Dunkel, Desktop-Ansicht, mehrere Arbeitsbereiche.
- Aufgaben- und Sammlungs-Filter sind unverändert und zeigen noch „Alle Orte“.
