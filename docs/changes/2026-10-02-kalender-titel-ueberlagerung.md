# 2026-10-02-kalender-titel-ueberlagerung

## Problem
Beim Hochwischen im Kalender (Android-Fassung) blieb der Titel „Kalender“
abgeschnitten unter der noch sichtbaren Suchleiste stehen. Er lag mit
`z-index: 4` über der Kopffläche (`z-index: 3`) und schimmerte durch deren
Verlängerung (`--content-top`, 32 px) durch.

## Änderung
- `styles/calendar.css`: `#view-calendar .screen-title` hat keine eigene Ebene
  mehr (`position: relative` und `z-index: 4` entfernt). Der Abstand nach unten
  ist `max(18px, var(--content-top))`. Kopfkommentar angepasst.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Der Kopf liegt jetzt unmittelbar unter dem Titel. Rastet er ein, ist der Titel
komplett hinter Suchleiste oder Kopffläche verschwunden (gemessen bei 412 px:
Titelunterkante = Kopfoberkante = 72 px). Verworfen: den Titel per Maske oder
`clip-path` zu kappen (aufwendig) und den 40-px-Abstand zu verkleinern (nicht
die Ursache). Gemessener Abstand Suche → Datumszeile im eingerasteten Zustand:
40 px (64 → 104 px).

## Visualisierung
Vorher (hochgewischt):
```
│  [   Suchen   ] (o) │
│ Kalender (abgeschn.)│
│ Freitag, 2. Okt  ⚙  │
│ MO DI MI DO FR SA SO│
```

Nachher (hochgewischt):
```
│  [   Suchen   ] (o) │
│                     │
│ Freitag, 2. Okt  ⚙  │
│ MO DI MI DO FR SA SO│
```

## Hinweise
- Android in Ruhe: „Kalender“ → Datumszeile 32 statt 18 px, die Seite darunter
  rutscht 14 px nach unten. iOS bleibt bei 18 px (`--content-top` = 12 px).
- Nicht geprüft: Desktop, iOS, dunkler Modus, echtes Wischen auf dem Gerät.
- Bei einem Stopp mitten im Scrollen vor dem Einrasten ist der Titel noch
  teilweise unter der Suchleiste zu sehen (normales Scrollen).
