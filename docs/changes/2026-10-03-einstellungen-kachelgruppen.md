# 2026-10-03-einstellungen-kachelgruppen

## Problem
Die Android-Einstellungsliste zeigte blaue Abschnittstitel („Mehr“, „App“, „Konto“ …), die in den Google-Einstellungen fehlen. Der Profilkopf sah nicht nach Google-Konto aus.

## Änderung
- Neu: `styles/android-settings-groups.css` — auf der Liste (`#profile-body.is-list`) keine Abschnittstitel, Zeilen als getönte Kachelgruppen (außen 20 px, innen 4 px, 2 px Fuge, 16 px Luft zwischen Gruppen), Profilkopf als Karte mit Bild, Stift, Name und der Zeile „Pro · Dabei seit …“ statt der Mailadresse.
- `src/features/profile/profile.js`: setzt die Klasse `is-list`, solange die Liste (keine Unterseite) gezeigt wird.
- `styles/tokens-android.css`: `--m3-group-radius`, `--m3-group-inner-radius`, `--m3-group-gap`, `--m3-group-space`.
- `index.html`, `styles/tokens.css`: Stylesheet eingebunden bzw. in der Übersicht ergänzt.

## Begründung
Ohne Titel würden flache Zeilen ineinanderlaufen, deshalb Kachelgruppen wie bei Google. Die Klasse `is-list` trennt Liste von Unterseiten, ohne das gemeinsam genutzte Markup anzufassen. Unterseiten, Fortschritt und „Android (Experiment)“ bleiben unverändert.

## Visualisierung
Vorher:
```
(PA) Paul Angeles / Mail / Dabei seit …
Darstellung (blau)   System ✓ / Hell / Dunkel
Mehr (blau)          Versionen > / Nach Updates suchen
```

Nachher:
```
┌ (PA✎) Paul Angeles · Dabei seit … ┐
┌ System ✓ / Hell / Dunkel ┐
┌ Versionen > / Nach Updates suchen ┐
```

## Hinweise
Im hellen Modus heben sich die Kacheln nur schwach vom Hintergrund ab. Der Pfeil-Knopf der Google-Profilkarte ist nicht nachgebaut. Testen: „Darstellung“ (Haken) und „Konto“ mit Konto-Phase.
