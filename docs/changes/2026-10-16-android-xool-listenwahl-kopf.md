# 2026-10-16-android-xool-listenwahl-kopf

## Problem
Der Regler der Übersicht (Projekte) sollte wie im Kalender und bei den Aufgaben ein Knopf über der Leiste werden. Damit wird der Platz im Kopf der Liste frei, und der Pfeil am aktiven Reiter („Listen ˅“) gehört besser in den Kopf. Gilt nur für „Android (Xool-DB)“.

## Änderung
- **Reiter ohne Pfeil** (`src/features/overview/home-xool.js`): der aktive Reiter zeigt nur noch seinen Namen, der ruhende das Icon seiner Liste.
- **Listenwahl im Kopf:** der Name der Liste trägt den Pfeil nach unten („Eingang ˅“); ein Tipp öffnet das Blatt „Liste wählen“. Rechts im Kopf steht der runde Pfeil zur Seite der Liste.
- **Regler als Knopf** (`styles/android-xool-pages.css`): bei Projekten ist er ein runder Knopf über der Leiste, bei weggeblendeter Leiste die Pille „Ansicht“ neben dem Plus — wie im Kalender; in der Werkzeugzeile entfällt „Ansicht“, „Sortieren“ bleibt (`styles/android-xool-overview.css`).

## Begründung
Name und Wahl gehören zusammen (wie „Projekte ˅“ im Experiment); der Regler gilt für die ganze Liste und steht dort, wo ihn der Daumen erreicht. Offen: andere Listen als Projekte haben keinen Regler, es steht dort kein Knopf.

## Visualisierung
Vorher:
```
 Markiert ☆    Listen ˅
 ╭ Eingang 11             ⚙ ╮
```

Nachher:
```
 Markiert ☆    Listen
 ╭ Eingang ˅ 11            ↗ ╮
                       (⚙)    Regler über der Leiste (Projekte)
```

## Hinweise
- Testen: Tipp auf den Namen öffnet die Listenwahl in beiden Reitern, der Pfeil rechts öffnet die Seite, Regler bei Projekten öffnet „Ansicht“, Pille bei weggeblendeter Leiste.
