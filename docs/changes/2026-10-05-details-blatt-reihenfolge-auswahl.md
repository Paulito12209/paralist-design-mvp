# 2026-10-05-details-blatt-reihenfolge-auswahl

## Problem
- Im Details-Blatt (Android) hatte „Verknüpfen mit“ ein anderes Icon (Kettenglied) als überall sonst in der App.
- „Frist hinzufügen“ stand zwischen Dringlichkeit und Status.
- Ein Tipp auf Status oder Dringlichkeit öffnete ein zweites Blatt mit dem Namen des Eintrags und den Tabs Status | Dringlichkeit | Typ.
- „Typ ändern“ war in Android eine iOS-artige Rolle zum Ziehen, mit Trennlinien und dem Arbeitsbereich ganz unten.

## Änderung
- `src/ui/details-rows.js`: Zeile „Verknüpfen mit“ nutzt das universelle Icon `link` (wie Drei-Punkte-Menü, Verknüpfen-Menü, Viewer). Reihenfolge der Zeilen: Verknüpfen mit, Dringlichkeit, Status, dann Frist und Erinnerung zusammen (`timeFields`, stabile Sortierung, der Rest behält seine Reihenfolge).
- `src/ui/task-status.js`: `openTaskSheet(entry, field)` öffnet ein schlankes Blatt nur mit der Überschrift „Status“ bzw. „Dringlichkeit“ und den Stufen. Kein Name, kein Icon, keine Tabs. Der Tab-Code (`sheetTabs`) und nicht mehr genutzte Imports sind entfernt.
- `src/ui/type-menu.js`: `openTypeChangeSheet` öffnet in der Android-Fassung ein Material-Blatt mit allen Typen untereinander, ohne Trennlinien, nach Hierarchie: Arbeitsbereich, Projekt, Notiz, Aufgabe, Termin, Dokument. Sonst bleibt die Rolle.

## Begründung
- Das Icon `link` gab es schon im Sprite; nur der Name wurde getauscht.
- Jede Auswahl hat ihr eigenes Blatt; „Typ ändern“ ist weiter über die Kategorie im Kopf („Aufgabe ▾“) erreichbar, deshalb entfällt der Tab „Typ“.
- Verworfen: die Zeilenreihenfolge in den Daten ändern (würde andere Fassungen berühren); die Tabs nur in Android entfernen.
- **Geltungsbereich:** Reihenfolge und Icon nur im Details-Blatt (nur Android). Das schlanke Status-/Dringlichkeits-Blatt in allen Fassungen (die Karte „Details“ nutzt es überall). Das Material-Blatt für „Typ ändern“ nur Android; iOS und Desktop behalten die Rolle.

## Visualisierung
Vorher:
```
⛓ Verknüpfen mit        ┌──────────────────┐
🔥 Jetzt  Dringlichkeit │ 🚀 Paralist      │
📅 Frist hinzufügen     │ Status Dringl. Typ│
◌  Offen  Status        │ ○ Offen        ✓ │
🕐 Erinnerung           └──────────────────┘
```

Nachher:
```
⑂ Verknüpfen mit        ┌──────────────────┐   Typ ändern
🔥 Später Dringlichkeit │ Status           │   Arbeitsbereich
◌  Offen  Status        │ ○ Offen        ✓ │   Projekt
📅 Frist hinzufügen     │ ◔ In Arbeit      │   Notiz
🕐 Erinnerung           │ ✓ Erledigt       │   Aufgabe ✓
                        └──────────────────┘   Termin / Dokument
```

## Hinweise
- Testen: Details einer Aufgabe, eines Projekts und eines Dokuments; Status und Dringlichkeit antippen; „Typ ändern“ bei Arbeitsbereich und Eintrag (Rückfrage bei Wanderungen); dunkel.
- Die Rolle in iOS/Desktop ist unverändert.
