# 2026-10-04-profil-name-bearbeiten

## Problem
Den Namen konnte man nur unter „Persönliche Daten“ ändern. Gewünscht war, ihn direkt im Profilkopf durch Antippen zu bearbeiten (Cursor hinter dem letzten Buchstaben) und das Ergebnis nach Material Design zu speichern. Gilt für alle Fassungen, in denen der Profilkopf vorkommt (iOS, Android, Android (Experiment), Desktop-Profilseite).

## Änderung
- `src/features/profile/profile-name-edit.js` (neu): Tipp auf den Namen macht ihn zum Eingabefeld, Cursor am Ende. Haken-Knopf, Enter oder Wegtippen speichert, Kreuz-Knopf oder Esc verwirft. Ein leerer Name oder der unveränderte Platzhalter „Dein Name“ speichert „kein Name“. Nach dem Speichern ziehen Initialen im runden Bild und Seitenleiste (`events.dataChanged`) nach.
- `styles/profile-name-edit.css` (neu): Feld erbt Schrift und Größe vom Namen, Linie darunter, zwei runde Knöpfe. Android nutzt `--m3-primary`, sonst `--add`. Das Feld hat `width: 0` und `flex: 1 1 0`, sonst dehnt seine Grundbreite den zentrierten Kopf (iOS) über den Rand.
- `styles/tokens-pages.css`: `--profile-name-edit-btn` (36px), `--profile-name-edit-line` (2px).
- `src/features/profile/profile-cards.js`: `data-name-edit` am Namen.
- `src/features/profile/account.js`: gibt den Tipp an `onNameClick` weiter (statt `profile.js`, das schon 395 Zeilen hat).
- `index.html`: `<link>` für die neue CSS-Datei; `docs/styles-dateien.md`: Eintrag.

## Begründung
Die Bedienung folgt Material-Textfeldern (Haken/Kreuz neben dem Feld, Enter/Esc), und Wegtippen speichert wie unter „Persönliche Daten“, damit keine Eingabe verloren geht. Verworfen: eigener Dialog oder Speichern-Leiste unten — für ein einzelnes Feld zu schwer. Die Anbindung läuft über `account.js`, damit `profile.js` (395 Zeilen) nicht wächst.

## Visualisierung
Vorher:
```
(DN)  Dein Name
      Dabei seit Oktober 2026
```

Nachher (nach Tipp auf den Namen):
```
(DN)  Dein Name|      ✕   ✓
      ─────────────────
      Dabei seit Oktober 2026
```

## Hinweise
- Geteilte Dateien: `index.html` (ein `<link>` in Zeile 60) und `styles/tokens-pages.css`.
- Am Gerät testen: bleibt die Tastatur offen, wenn man Haken oder Kreuz antippt? Langer Name (bis 120 Zeichen), Namen leeren, Wegtippen auf eine andere Stelle.
- Der Name ist nicht per Tastatur fokussierbar, nur per Tipp/Klick (wie die Zeilen unter „Persönliche Daten“).
