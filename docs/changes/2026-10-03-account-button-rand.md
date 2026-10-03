# 2026-10-03-account-button-rand

## Problem
Auf „Alle Daten löschen“ ragten die Knöpfe „Vorher Daten exportieren“ und „Alle Daten löschen“ im normalen Android rechts über den Bildschirm hinaus und wurden abgeschnitten, links stand der Seitenrand.

## Änderung
- `styles/android-pages-content.css`: Die vorhandene Ausnahme `width: auto` für `.modal-body > .ms-teaser` gilt jetzt auch für `.account-button`.

## Begründung
Im Android-Layout bekommt jedes direkte Kind von `.modal-body` einen Außenabstand links und rechts (`margin-inline: var(--m3-page-edge)`). `.account-button` hat in `styles/account.css` aber `width: 100%` — Breite plus Abstand ergibt einen Knopf, der um den Seitenrand zu weit nach rechts reicht. Mit `width: auto` füllt der Knopf die Breite als Flex-Kind trotzdem aus und hält den Rand auf beiden Seiten. Dieselbe Falle war bei `.ms-teaser` (Fortschritt) schon so gelöst. Betroffen war nur Android ohne „Experiment“ unter 1024 px; im Experiment hat `.modal-body` Innenabstand statt Außenabstand der Kinder. `.account-button` kommt nur auf den Löschen-Seiten und bei „Passwort ändern“ vor (letztere ist im reinen Android ohne Konto nicht erreichbar, wird aber mit behoben). Geprüft bei 375 px: alle Einstellungsseiten in Android, Android (Experiment) und iOS sowie der Fortschritt in Android — danach ragt nichts mehr über den rechten Rand.

## Visualisierung
Vorher:
```
┌──────────────────────┐
│ ╭─────────────────────
│ │ Vorher Daten expor…
│ ╰─────────────────────
│ ╭─────────────────────
│ │ Alle Daten löschen
│ ╰─────────────────────
└──────────────────────┘
```

Nachher:
```
┌──────────────────────┐
│ ╭──────────────────╮ │
│ │ Vorher Daten exp.│ │
│ ╰──────────────────╯ │
│ ╭──────────────────╮ │
│ │ Alle Daten lösch.│ │
│ ╰──────────────────╯ │
└──────────────────────┘
```

## Hinweise
Geändert wird eine gemeinsam genutzte Android-Datei, aber nur die Regel für `.account-button`. Am Gerät ansehen: „Alle Daten löschen“ im normalen Android.
