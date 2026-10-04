# 2026-10-04-aufgaben-alle-ohne-chips

## Problem
Nachbesserung zu 2026-10-04-aufgaben-alle-filter-sperren (PR 180): Bei „Alle“ stand unter „Filtern · Nicht möglich“ weiter ein Chip „Status 3“, der das Filter-Blatt öffnete und die Sperre umging. `allFilterOff` setzt „Archiviert“ auf aus, und `filterChips` zählte das als Status-Filter.

## Änderung
- `src/features/tasks/tasks-filter.js`: `filterChips` liefert bei der festen Ansicht „Alle“ keine Chips. Das gilt auch für das Akzent-Symbol der Werkzeugzeile.

## Begründung
Eine Sperre an der Quelle der Chips deckt Karte und Werkzeugzeile ab. Verworfen: „Archiviert ausgeblendet“ nicht mehr als Filter zählen — das hätte die Zählung für alle Ansichten verändert. Geltungsbereich: alle Fassungen.

## Visualisierung
Vorher:
```
Filtern   Nicht möglich  ⓘ
[ Status 3 ]
```

Nachher:
```
Filtern   Nicht möglich  ⓘ
```

## Hinweise
- Geprüft: dunkel, Konsole leer, Chip weg bei „Alle“. Eigene Ansichten mit Filter sind vom Code nicht berührt.
