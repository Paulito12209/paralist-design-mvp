# 2026-10-16-android-xool-kalender-scroll

## Problem
In „Android (Xool-DB)“ standen die Titel von Kalender und Aufgaben weiter unter der Suchleiste als „Übersicht“, im Kalender rollte der Titel nicht mehr wie in „Android“ weg (durch einen angeklebten Titel aus einem früheren Paket), „KW“ stand nicht mittig zu den Tageszahlen, und das „Heute“ neben dem Datum fehlte. Gilt nur für diese Fassung.

## Änderung
- **Scroll-Verhalten wie in „Android“** (`styles/android-xool-pages.css`): der angeklebte Titel entfällt. Der Titel „Kalender“ rollt mit der Seite nach oben weg, danach rastet der Kopf mit Datum und Wochenstreifen unter der Suchleiste ein; die Suchleiste gleitet wie dort aus und wieder ein.
- **„Heute“ neben dem Datum** (`index.html`, `src/features/calendar/calendar.js`, `src/features/calendar/calendar-settings.js`, `styles/calendar.css`, `styles/android-xool-pages.css`): ein Chip rechts in der Datumszeile springt zum heutigen Tag; er ist blau, solange die Jetzt-Linie zu sehen ist, sonst grau. In allen anderen Fassungen ist er ausgeblendet.
- **KW mittig:** „KW 42“ steht jetzt auf Höhe der Tageszahlen (52px hoch ab der Tageszeile) statt über Wochentage und Zahlen verteilt.
- **Titelabstand wie die Übersicht:** Kalender, Aufgaben und Medien beginnen 14px unter der Suchleiste (`--content-top: 14px`); der Kopf rastet entsprechend ein.

## Begründung
Das Verhalten stammt aus dem MVP („Android“) und bleibt unverändert; nur Abstand, Chip und KW sind neu. Verworfen: den Titel stehen lassen — der Auftrag war, das Rollen der Android-Fassung zu übernehmen.

## Visualisierung
Vorher:
```
 (Suche)
 Kalender   ← zu weit unten, klebt
 Freitag, 16. Oktober >
 KW MO DI …
```

Nachher (offen / eingerastet):
```
 (Suche)                      (Suche)
 Kalender                     Freitag, 16. Oktober > ( Heute )
 Freitag, 16. Oktober >       KW  MO DI …
 KW  MO DI …                  Raster
```

## Hinweise
- Testen am Gerät: Hoch- und Runterrollen im Stundenraster (Titel weg, Kopf rastet ein, Suche ein- und ausgleitend), „Heute“ an einem anderen Tag, Titelabstand in Aufgaben und Medien.
