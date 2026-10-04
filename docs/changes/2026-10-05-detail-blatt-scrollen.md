# 2026-10-05-detail-blatt-scrollen

## Problem
- Im Android-Blatt „Details“ ließ sich der Inhalt waagerecht verschieben; links wurden Icons und Texte abgeschnitten („TZUNG“, „ifrufe“).
- Halb geöffnet rollte der Inhalt schon in sich, statt dass das Blatt beim Hochwischen größer wird.
- Der Knopf „Als erledigt markieren“ war dunkel mit heller Schrift, anders als in Google Tasks.

## Änderung
- `styles/android-details.css`: Der rollende Inhalt reicht bis an den Rand des Blatts und bringt die 16px Rand selbst mit (`margin: 0 -16px; padding-inline: 16px`), dazu `overflow-x: hidden`. Halb offen (Klasse `is-peek`) rollt er nicht in sich (`overflow-y: hidden`, `touch-action: none`). Knopf „Als erledigt markieren“ in `--m3-primary` / `--m3-on-primary` (Filled button).
- `src/ui/details-expand.js` (neu): Blatt öffnet halb (mitten in der zweiten Zeile der Abschnitte) oder ganz, wenn alles passt. Hochwischen zieht das Blatt mit dem Finger größer; ab 48px gleitet es ganz auf, sonst zurück. Mausrad nach unten öffnet ganz. Ganz offen rollt der Inhalt unter Kopf und Leiste.
- `src/ui/details-sheet.js`: alte Messung `fitPeek` ersetzt durch `fitDetailsPeek` aus der neuen Datei, Geste mit `bindDetailsExpand` angemeldet.

## Begründung
- Ursache des waagerechten Rollens: `.details-m3-row` ragt mit `margin: 0 -16px` über den rollenden Bereich hinaus, der selbst keinen Seitenrand hatte. Nur `overflow-x: hidden` hätte die Ursache versteckt.
- Verhalten nach dem Standard-Bottom-Sheet in Material 3: erst wächst das Blatt, dann rollt der Inhalt.
- Knopf: ein reiner Farbtausch hätte im Hellen Dunkelblau ergeben; Filled button entspricht Google Tasks in beiden Modi.
- Verworfen: Zwischenstufe „halb“ beim Nach-unten-Wischen aus dem ganz offenen Blatt — nach unten schließt wie bisher (`src/ui/modal-pull.js`).
- **Geltungsbereich:** nur Android-Fassung (beide Varianten, unter 1024px); iOS und Erster Test unverändert.

## Visualisierung
Vorher:
```
┌──────────────────────┐
│ 🚀 Paralist          │
├──────────────────────┤
│ter  ← seitlich       │
│ ) Fr│st  verschiebbar │
│TZUNG                 │
│ifrufe        2-mal   │
├──────────────────────┤
│  [▓ dunkel, hell Txt]│
└──────────────────────┘
```

Nachher:
```
halb                          hochgewischt
┌──────────────────────┐      ┌──────────────────────┐
│ 🚀 Bachelorarbeit    │      │ 🚀 Bachelorarbeit    │ ← bleibt
├──────────────────────┤      ├──────────────────────┤
│ 🔗 Verknüpfen        │      │ ◎  Offen             │
│ 🔥 Als Nächstes      │      │ NUTZUNG / VERLAUF    │
│ NUTZUNG              │      │ ABLAGE … (rollt)     │
│ Erstellt ▁▁▁ (halb)  │      │                      │
├──────────────────────┤      ├──────────────────────┤
│  [░ hell, dunkel Txt]│      │  [░ hell, dunkel Txt]│
└──────────────────────┘      └──────────────────────┘
  ↑ wischen = Blatt wächst      ↑ erst jetzt rollt der Inhalt
```

## Hinweise
- Halb offen rollt der Inhalt bewusst nicht; nur Hochwischen öffnet.
- Nach einem Hochwischen wird ein Tipp kurz geschluckt, damit keine Zeile aufgeht.
- Am Gerät testen: Wischen über den Chips unter „Verknüpfen“ und über der Leiste unten, Tipps auf Zeilen im halben Zustand.
