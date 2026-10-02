# 2026-10-02-board-griff-halten

## Problem
Im Board (Projekte, und das geteilte Ziehen der Aufgaben) griff der Griff mit den sechs Punkten sofort beim Aufsetzen des Fingers. Jeder Wisch über die rechte Zeilenhälfte schob den Eintrag in eine andere Spalte, statt das Board zu rollen.

## Änderung
- `src/ui/board-drag.js`: Mit dem Finger löst sich die Zeile erst nach kurzem Halten (`holdMs` 480 ms, wie beim Verschieben in der Liste). Wandert der Finger vorher mehr als `holdSlack` 8 px, ist es ein Wisch, und der Browser rollt Board oder Seite. Mit der Maus greift die Zeile sofort. Neu: kurzes Vibrieren beim Lösen (`liftBuzzMs`), Rahmen um die Kopfzeile der Zielspalte (`is-drop-over`), Kontextmenü am Griff unterdrückt, `touchmove` wird nur während eines Zugs abgefangen.
- `styles/tasks-board.css`: `touch-action: none` am Griff entfernt. Während des Haltens werden die Punkte dunkler (`is-grip-hold`). Sobald eine Zeile gelöst ist, zeigen alle Griffe den Doppelstrich „=“ (Material 3), die gelöste Zeile mit kräftigem Strich. Rahmen für die Zielspalte.
- `styles/android-reorder.css`: Die gelöste Board-Zeile sieht in der Android-Fassung aus wie die gezogene Zeile in der Liste (getönte Karte mit Schatten), die Lücke getönt statt gestrichelt.
- `src/features/overview/projects-board.js`: Kopfkommentar.
- Keine zentralen Dateien. Die Änderung wirkt auch im Board der Aufgaben.

## Begründung
Dasselbe Muster wie `src/ui/row-lift.js`, damit sich senkrechtes Verschieben in der Liste und Ziehen im Board gleich anfühlen. Die Maus rollt nicht durch Wischen, deshalb braucht sie kein Halten.
Verworfen: Halten irgendwo auf der Zeile (dort liegt schon das Eintrags-Menü). Verworfen: `src/ui/long-press.js` wiederverwenden (fest an die Menü-Öffner gekoppelt).

## Visualisierung
Vorher (Wisch über die Punkte verschiebt sofort):
```
🚀 Test 1        ⠿   ← Finger wischt → Zeile hängt am Finger, Spalte wechselt
   Später
```

Nachher (Wisch rollt, Halten löst):
```
🚀 Test 1        ⠿   ← Finger wischt → Board rollt zur nächsten Spalte

╔ Offen ═══════ 5 ╗   ← Rahmen: hier würde sie landen
┌──────────────────┐
│ 🚀 Test 5      ═ │   ← nach Halten: gelöste Karte, alle Richtungen
└──────────────────┘
🚀 Test 4        ═     ← alle Griffe zeigen „=“
```

## Hinweise
- Am echten Handy prüfen, ob 480 ms Halten passt und ob leichtes Zittern das Halten abbricht.
- Mitrollen am Rand ist wie bisher flott (`scrollSpeed` 12 px je Bild); bei Bedarf senken.
- Board der Aufgaben mit Auswahlmodus und Stapel nicht im Browser geklickt, nur dieselbe Logik.
- Nach dem Ablegen springt das Board auf die erste Spalte zurück (schon vorher so, Neuzeichnen).
