# 2026-10-07-android-nav-namen

## Problem
In „Android (Experiment)“ sah die schwebende Navigationsleiste (siehe
2026-10-07-android-nav-pille) mit eingeschalteten Namen unter den Icons nicht
gut aus: Die Pille des aktiven Reiters umschloss Icon und Namen, und auf
schmalen Geräten überlagerten sich die Namen („ÜbersichtKalenderufgaben…“).
Gewünscht: Pille nur um das Icon, Name darunter, oben und unten derselbe
Rand, Leiste nicht höher als ohne Namen — und auch auf kleinen Geräten sauber.

## Änderung
- **`styles/android-experiment-nav.css`**, neuer Abschnitt „Mit Namen unter den Icons“
  (gilt nur mit `.tab-bar.show-labels`):
  - Reiter in zwei Zeilen: oben die Pille (als `::before` hinter dem Icon, so breit
    wie der Reiter), darunter der Name.
  - Leiste bleibt 64 px: 2 × Rand 10 px + Pille 30 px + Luft 2 px + Zeile 12 px.
  - Icon 18 px, Namen 10 px ohne Zusatz-Buchstabenabstand; der gewählte Name
    halbfett statt fett.
  - Reiter sind mindestens so breit wie ihr Name (`flex: 1 1 auto`), der Rest
    wird gleich verteilt — so überlagern sich die Namen nicht.
- **`styles/tokens-android-dark.css`**: neue Werte `--m3-xl-label-icon`, `-size`,
  `-line`, `-pill-h`, `-gap`, `-edge` im Abschnitt EXPERIMENT.

## Begründung
Ohne Namen bleibt alles wie bisher. Verworfen: die Leiste mit Namen auf 72 px
erhöhen (soll nicht höher werden); gleich breite Reiter (bei schmalen Geräten
überlagern sich dann die langen Namen); „Neu“ mit Namen schmaler machen
(nicht nötig ab 360 px).

## Visualisierung
Vorher:
```
╭──────────────────────────╮
│ (▣)  ▦  ☑  ▨             │
│Übersicht Kalender ufgabenMedien   ← überlagert
╰──────────────────────────╯
```

Nachher:
```
╭──────────────────────────╮  64 px
│╭───────╮                 │  Rand 10
││  ▣    │  ▦    ☑    ▨    │  Pille 30
│╰───────╯                 │  Luft 2
│Übersicht Kalender Aufgaben Medien │  Name 12
╰──────────────────────────╯  Rand 10
```

## Hinweise
- Abstand zwischen den Namen: 412 px Breite 14 px, 375 px knapp 5 px, 360 px 1 px;
  bei 320 px reicht der Platz nicht.
- Am Pixel prüfen: Lesbarkeit der 10-px-Namen, Größe der 18-px-Icons.
