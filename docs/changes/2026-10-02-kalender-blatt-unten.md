# 2026-10-02-kalender-blatt-unten

## Problem
Zwei Punkte im Kalender der Android-Fassung (Handy):
1. Wer hochwischte (Suche und Navigation gleiten weg) und dann im Stundenraster
   eine Stunde antippte, bekam das Blatt „Neuer Termin“ unten abgeschnitten.
   Die Leiste, in der das Blatt steckt, blieb um ihre Höhe (64 px) nach unten
   verschoben. Beim Fokussieren schob der Browser zusätzlich das ganze Gerät
   um 64 px hoch — auch nach dem Schließen fehlte oben die Datumszeile.
2. Damit „Kalender“ beim Einrasten nicht unter der Suchleiste durchscheint,
   war der Abstand Titel → Datumszeile auf 32 px gewachsen. Gewünscht: der
   gewohnte kurze Abstand, und der Kopf rastet genau dort ein, wo der Titel
   nicht mehr zu sehen ist.

## Änderung
- `styles/android-composer.css`: Solange das Blatt offen ist, wird die Leiste
  nicht verschoben (`transform: none`), auch wenn sie vorher weggeglitten war.
  Gilt für jeden Weg zum Blatt (Stunde, Liste, Plus). Suche und Kopf bleiben
  dabei weg.
- `styles/android-calendar.css`: Der Abstand Titel → Datumszeile steckt ganz
  im Kopf (`padding-top`), der Titel hat keinen Abstand nach unten, die
  Verlängerung des Kopfes um `--content-top` entfällt. Der Kopf rastet mit
  seiner Oberkante an der Suchleiste ein — in dem Moment liegt die Unterkante
  des Titels genau dort.
- `styles/tokens-android.css`: neuer Wert `--m3-cal-title-gap` (18 px).
- `styles/calendar.css`: Hinweis im Kommentar auf die Android-Lösung.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die Ursache des abgeschnittenen Blatts war das Verschieben der Leiste; es
abzuschalten, solange das Blatt offen ist, deckt alle Wege ab. Verworfen: beim
Öffnen die Leisten zurückholen — dann rutscht der Kopf um 64 px und die Seite
springt unter dem Schleier. Beim Kopf verworfen: dem Titel wieder eine eigene
Ebene geben (dann schien er eingerastet durch). Das Skript (`calendar-grid.js`)
blieb unverändert: es misst die Kopfhöhe, die Rechnung stimmt weiter.

## Visualisierung
Vorher (hochgewischt, Stunde getippt):
```
│ 15:00 ─────────────── │
│ 16:00 ─────────────── │
╭───────────────────────╮
│ Neuer Termin          │
└─── Rand ──────────────┘
  (+) [📅▾] [Eingang▾]  ← abgeschnitten
```

Nachher:
```
│ 15:00 ─────────────── │
│ 16:00 ─────────────── │
╭───────────────────────╮
│ Neuer Termin          │
│ (+) [📅▾] [Eingang▾]  Speichern │
└───────────────────────┘
```

Kopf in Ruhe, vorher → nachher:
```
│ Kalender          │      │ Kalender          │
│      ↕ 32 px      │      │      ↕ 18 px      │
│ Freitag, 2. Okt › │      │ Freitag, 2. Okt › │
```

Eingerastet, vorher → nachher:
```
│ [ Suchen ]        │      │ [ Suchen ]        │
│      ↕ 32 px      │      │      ↕ 18 px      │
│ Freitag, 2. Okt › │      │ Freitag, 2. Okt › │
│ MO DI MI DO …     │      │ MO DI MI DO …     │
```

## Hinweise
- Geprüft im Testbrowser: 412 und 375 px, hell und dunkel, Raster und Liste,
  Blatt öffnen und schließen; Konsole leer.
- Eingerastet steht die Datumszeile 14 px näher an der Suchleiste bzw. am
  oberen Rand.
- Nicht geprüft: echtes Wischen und Tastatur auf dem Gerät, Browser-Zurück,
  voller Speicher.
- Gemeinsam genutzte Dateien: `styles/tokens-android.css`, `styles/calendar.css`
  (nur Kommentar), `src/data/version.js`.
