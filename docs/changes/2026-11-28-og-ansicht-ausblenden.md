# 2026-11-28-og-ansicht-ausblenden

## Problem
In der OG Version schaute hinter Anlege-Zubehör und Reiterleiste ein dunkler
Kasten hervor: der Kopf der eingeklappten Karte „Ansicht“ der iOS-Fassung
(Projekte, Aufgaben, Sammlungen, Kalender). Organi7er hat dort nichts.

## Änderung
- `styles/og.css`: `.view-panel:not(.is-expanded)` ist in der OG Version unter
  1024 px unsichtbar (`visibility: hidden`).

## Begründung
„Kalender anpassen“ öffnet in der OG Version genau diese Karte; aufgeklappt
(`is-expanded`) bleibt sie deshalb sichtbar. `visibility` statt `display`, damit die
Karte beim Aufklappen ohne Sprung von ihrer Stelle kommt. Verworfen: die Karte
ganz entfernen — dann hätte „Kalender anpassen“ keine Funktion mehr.
Gilt nur für die OG Version.

## Visualisierung
Vorher:
```
│ Steuererklärung 2025         │
╭──────────────────────────────╮
│▓▓[✓ Aufgabe ˅]    +   ılıl ▓▓│
│▓▓╭ Übersicht … Suchen ╮▓▓▓▓▓▓│
╰▓▓ dunkler Kasten „Ansicht“ ▓▓╯
```

Nachher:
```
│ Steuererklärung 2025         │
╭──────────────────────────────╮
│  [✓ Aufgabe ˅]    +   ılıl   │
│  ╭ Übersicht … Suchen ╮      │
╰─ kein Kasten mehr dahinter ──╯
```

## Hinweise
- Die aufgeklappte Karte ist noch die Karte der iOS-Fassung; im Kalender liegt sie
  teils unter der kleinen Leiste.
- Geprüft bei 375 px dunkel: Übersicht, Projekte, Kalender, „Kalender anpassen“;
  Konsole leer.
