# 2026-10-04-tokens-teilen

## Problem
`styles/tokens.css` (399 Zeilen), `styles/tokens-pages.css` (397) und
`styles/tokens-android.css` (388) standen an der harten Grenze von 400 Zeilen.
Jede weitere Sitzung, die dort einen Wert ergänzt, hätte erst teilen müssen.

## Änderung
- `styles/tokens.css` (255): Grundfarben, Kopfzeile, Eingabefeld, Meldung,
  Wischen, Blätter. Die Dateiliste im Kopf ist nach `docs/styles-dateien.md`
  gezogen; der Kopf verweist darauf. Verwaister Kommentar am Dateiende entfernt.
- Neu `styles/tokens-nav.css` (109): Navigationsleiste und Tab-Pillen
  (`--nav-*`, `--tab-*` außer `--tab-pill-active-bg`) samt Abfrage für Handys
  unter 370 px.
- `styles/tokens-pages.css` (298) ohne die Eintrags-Werte; neu
  `styles/tokens-entry.css` (117): Bausteine, Karten, „/“-Menü, Lesezeichen,
  Cover, Details, Zeichnung, Videoplayer.
- `styles/tokens-android.css` (301): helle Farben und Maße; neu
  `styles/tokens-android-dark.css` (111): Farben im Dunkeln, Kacheln im Hellen,
  Flächen von „Android (Experiment)“ (`--m3-xl-*`).
- `index.html`: drei neue `<link>`s (tokens-nav und tokens-entry vor
  tokens-dark, tokens-android-dark direkt nach tokens-android).
- Neu `docs/styles-dateien.md`: Liste aller Stil-Dateien und Ladereihenfolge.
- `CLAUDE.md` und `.claude/skills/paralist-clean-code/SKILL.md`: Dateiliste
  steht jetzt in `docs/styles-dateien.md`, Werte in `styles/tokens*.css`.

## Begründung
Nach Thema geteilt, damit die meisten Verweise „alle in styles/tokens-….css“
in anderen Dateien stimmen. Alle neuen Werte-Dateien laden vor
`tokens-dark.css` bzw. vor `android-*.css`, damit die Dunkel-Werte weiter
gewinnen. Die Dateiliste wächst mit jeder neuen CSS-Datei und ist deshalb in
eine Doku gezogen. Verworfen: Liste in `tokens.css` lassen (Datei bliebe bei
~320 Zeilen und wüchse weiter).

## Visualisierung
Vorher:
```
tokens.css (399) → tokens-pages.css (397) → tokens-dark.css → …
tokens-android.css (388) → android*.css
```

Nachher:
```
tokens.css (255) → tokens-nav.css (109) → tokens-pages.css (298)
  → tokens-entry.css (117) → tokens-dark.css → …
tokens-android.css (301) → tokens-android-dark.css (111) → android*.css
Dateiliste: docs/styles-dateien.md
```

Prüfung: alle 659 berechneten CSS-Variablen vorher/nachher verglichen
(Android, Experiment, iOS × Thema System/hell/dunkel × Systemfarbe hell/dunkel
× 375/1280 px) — 0 Abweichungen, Konsole leer.

## Hinweise
- Zentrale Dateien betroffen: `index.html`, `styles/tokens*.css`, `CLAUDE.md`,
  Skill. Parallele PRs, die dort Werte ergänzen, bekommen einen Konflikt —
  Wert dann in die thematisch passende neue Datei setzen.
- Versionsstempel `src/data/version.js` absichtlich nicht neu geschrieben; das
  übernimmt der Git Commit Manager.
- Die Abfrage für Handys unter 370 px greift nur auf Touch-Geräten und ließ
  sich im Browser-Pane nicht prüfen; sie ist unverändert umgezogen.

## Nachtrag
Zweiter Commit im selben PR (auf Wunsch): die Köpfe von `styles/embeds.css`
und `styles/entry-details.css` verweisen jetzt auf `styles/tokens-entry.css`;
`--tasks-panel-slide` (entry-details) und `--xp-done` (embeds) bleiben als
Ausnahme in `tokens-pages.css` markiert. Nur Kommentare, keine sichtbare
Änderung.
