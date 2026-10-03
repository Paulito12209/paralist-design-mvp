# 2026-10-03-android-hell-flaechen

## Problem
Im hellen Android hoben sich Kacheln und Zeilen kaum vom Seitengrund `#f2f2f7` ab, besonders in den Einstellungen (Zeilen `#eef2f9`). Die bessere Farbgebung aus #124 (`2026-10-03-experiment-hell-kontrast`) galt nur in „Android (Experiment)“ und nur auf der Übersicht. Gewünscht war sie in beiden Android-Fassungen und überall, der Projekte-Container bleibt aber nur im Experiment.

## Änderung
- `styles/tokens-android.css`:
  - Im Hellen (beide Fassungen) ist `--m3-surface-container` jetzt `#dde3ee` statt `#eef2f9`. Davon leben Navigationsleiste, Einstellungszeilen, Kachelgruppen und Blätter.
  - Neuer Block „Android, nur im Hellen“: `--card` und `--overview-card-bg` folgen `--m3-surface-container` statt dem Grau `#d1d5db`. Das betrifft die Übersichtskacheln und die Kacheln auf Profil- und Kontoseiten, in Kachelblättern und Hinweisen.
  - Im Experiment bleiben nur die Werte, die es allein dort gibt: `--m3-xl-surface-high` (`#cdd5e3`, runder Pfeil-Knopf) und `--m3-xl-divider-color`. Die doppelten Farbwerte `--m3-xl-surface` und `--m3-xl-tile` lesen jetzt die gemeinsame Fläche. Kopfkommentar angepasst.
- `styles/android-experiment-surface.css`: nur der Kopfkommentar. Die gemeinsame Fläche steht jetzt in den Tokens, hier bleiben Container, Pfeil-Knopf und Trennlinie.
- `src/data/version.js`: neuer Versionsstempel.
- Zentrale Datei berührt: `styles/tokens-android.css` (jetzt 368 Zeilen, über 360: vor der nächsten Änderung teilen).

## Begründung
#124 wurde vollständig gemergt, hatte die Farben aber bewusst auf Experiment und Übersicht begrenzt (dort verworfen: „im ganzen Experiment ändern, hätte Einstellungen und Blätter mit eingefärbt“). Genau das ist jetzt gewünscht. Deshalb werden die Farbwerte selbst geändert und nicht einzelne Seiten überschrieben: So gilt der Ton automatisch überall, auch auf Seiten, die später dazukommen. Die Suchleiste behält ihren Material-3-Ton `#e5eaf2` wie in #124. Im Dunkeln bleiben alle Werte. Verworfen: den Container auch ins normale Android übernehmen (ausdrücklich nicht gewünscht).

## Visualisierung
Vorher (hell, normales Android):
```
( Suchen )   #e5eaf2
[Kachel] grau #d1d5db
Einstellungen:
┌ System ┐ #eef2f9  ≈ Seitengrund
[ Navigationsleiste ] #eef2f9
Seitengrund #f2f2f7
```

Nachher (hell, beide Android-Fassungen):
```
( Suchen )   #e5eaf2
[Kachel] #dde3ee
Einstellungen:
┌ System ┐ #dde3ee  ← klar abgehoben
[ Navigationsleiste ] #dde3ee
Seitengrund #f2f2f7
```

## Hinweise
- Blätter von unten (Ansicht, Filtern, Neu-Eingabe) und die Eintragsseite sind im Hellen einen Ticken dunkler.
- Kacheln mit `--card` (Profil, Konto, Hinweis-Banner, Toasts) sind etwas heller als vorher (`#dde3ee` statt `#d1d5db`).
- Geprüft bei 375 px mit leerem Speicher: Android hell, Experiment hell, Android dunkel, Konsole leer. Am Gerät mit gefülltem Speicher und die Gedrückt-Zustände ansehen.
