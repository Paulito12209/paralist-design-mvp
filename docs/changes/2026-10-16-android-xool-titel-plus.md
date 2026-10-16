# 2026-10-16-android-xool-titel-plus

## Problem
In „Android (Xool-DB)“ fehlte im Kalender der Titel „Kalender“ über dem Datum (er rollte beim Öffnen am Gerät sofort weg), die Schrift der Seitentitel war nicht überall die der Übersicht, und das runde Plus bei weggeblendeter Leiste war in Safari oben abgeschnitten. Gilt nur für diese Fassung.

## Änderung
- **Titel „Kalender“ bleibt stehen** (`styles/android-xool-pages.css`): der Titel klebt unter der Suchleiste (ohne sie oben am Rand), der Kopf mit Datum und Wochenstreifen rastet 28px darunter ein; beide rücken mit der Suchleiste nach.
- **Schrift überall wie in der Übersicht** (`styles/android-xool-top.css`): alle Seitentitel (Übersicht, Kalender, Aufgaben, Medien) in DM Sans 22px, Gewicht 500; Knöpfe und Felder erben die Schrift der Seite.
- **Plus nicht mehr abgeschnitten** (`styles/android-xool-nav.css`): das Plus ist bei weggeblendeter Leiste ein echter Kreis von 56px (Innenabstand statt Schatten-Ring), mittig in den 70px der Leiste (`translateY`), nur mit einem kleinen Schatten; der Ring ragte vorher über die Leiste hinaus und wurde in Safari oben beschnitten. Die Pille „Ansicht“ steht dazu 7px über dem Rand (`styles/android-xool-pages.css`).

## Begründung
Die Leiste liegt als eigener Teil über der Seite; alles, was über ihre 70px hinausragt, schnitt Safari ab. Verworfen: den Titel nur kurz einblenden (er soll wie in Xool immer da sein).

## Visualisierung
Vorher:
```
 (Suche)
 (Lücke, kein Titel)
 Freitag, 16. Oktober >
```

Nachher:
```
 (Suche)
 Kalender
 Freitag, 16. Oktober >
 KW  MO DI MI …
   …          (✚)
```

## Hinweise
- Testen: Kalender öffnen und im Stundenraster hoch- und runterrollen (Titel und Kopf bleiben), Plus bei weggeblendeter Leiste in Safari, Titel der anderen Seiten.
