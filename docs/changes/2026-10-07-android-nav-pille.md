# 2026-10-07-android-nav-pille

## Problem
In „Android (Experiment)“ ging die Navigationsleiste von Rand zu Rand, hatte
dieselbe Fläche wie Kacheln und Container und war hoch; der Knopf „Neu“
schwebte als eigene Zeile darüber. Gewünscht: die Optik der Navigationsleiste
von Google Chat — schwebende, etwas hellere und flachere Pille, „Neu“ in
derselben Zeile rechts daneben. Gilt nur im Experiment, auch auf der
Detailseite (Eintragsseite).

## Änderung
- **`styles/android-experiment-nav.css` (neu):**
  - Leiste als schwebende Pille (64 px hoch, 16 px zum Rand, 20 px nach unten),
    Fläche wie die Suchleiste (eine Stufe heller als Kacheln und Container).
  - Pille des aktiven Reiters füllt die Zelle ihres Reiters (40 px hoch), 12 px
    Abstand zum Rand der Leiste — derselbe Abstand wie zwischen Leiste und
    „Neu“. Farbe: dasselbe Grau wie „Inhalt“ in den Reitern (`--m3-seg-thumb`).
  - „Neu“ (88 × 64 px, Rundung 20 px) steht rechts neben der Pille. Beim
    Scrollen nach unten gleitet die Pille weg, „Neu“ bleibt als Plus stehen.
  - Das ✕ des offenen Menüs hat dieselbe Fläche wie „Neu“ (gleicher Abstand zum Rand).
  - Medien-Seite: „Neu“ steht auch dort; im Menü fehlt dort „Medium“ (Dateien,
    Video, Foto, Audio liegen schon in der Medien-Leiste).
  - Seitenende (Kalender, Eintragsseite, Übersicht) rechnet nur noch bis über die Zeile.
- **`styles/tokens-android-dark.css`:** neue Werte `--m3-xl-nav-*`, `--m3-xl-fab-*`;
  im Experiment `--m3-fab-size` 64 px und kleineres `--m3-content-end`.
- **`index.html`:** `<link>` auf die neue Datei, nach `android-experiment-surface.css`.
- **`docs/styles-dateien.md`:** Zeile für die neue Datei.

## Begründung
Nur Stile und Werte, die Android-Fassung ohne Experiment und iOS bleiben
unberührt. Verworfen: `--m3-fab-radius` global ändern (Medien-Leiste und
Such-Knöpfe hängen daran); das Eingabefeld in die Pille packen (bleibt das
Blatt von unten).

## Visualisierung
Vorher:
```
 ...Liste...
                      ┌──────────┐
                      │ + Neu    │
 ┌──────────────────────────────┐
 │  ▣    ▦    ☑    ▨            │  Rand zu Rand
 └──────────────────────────────┘
```

Nachher:
```
   ╭─────────────────────╮ ╭───────╮
   │╭─────╮              │ │       │
   ││  ▣  │  ▦   ☑   ▨   │ │ + Neu │
   │╰─────╯              │ │       │
   ╰─────────────────────╯ ╰───────╯
```

## Hinweise
- Die Liste scrollt hinter der Pille durch (wie bei Chat).
- Am Pixel prüfen: Farbton der Pille, Breite von „Neu“, Namen unter den Icons
  (falls eingeschaltet), Wegscrollen und Wiederkommen, Medien-Menü ohne „Medium“.
