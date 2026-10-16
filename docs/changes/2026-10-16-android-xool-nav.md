# 2026-10-16-android-xool-nav

## Problem
Die Navigation der Xool-App (Plus als Feld in der Mitte der Leiste, Menü ganz rechts) sollte als eigene Fassung im Entwurf sichtbar werden, mit der Logik und den Funktionen des MVP. Gilt nur für diese neue Fassung; „Android“, „Android (Experiment)“ und iOS bleiben unberührt.

## Änderung
- **Neue Fassung „Android (Xool-DB)“** (Spielart `xool`): `src/data/platform-versions.js` (Eintrag samt `differences`, Kommentar zur Ausnahme von „eine Fassung + ein Experiment“) und das Startskript in `index.html`.
- **Leiste:** Übersicht · Kalender · Plus · Aufgaben · Menü, fünf gleich breite Felder von Rand zu Rand. Das Plus ist eine immer gefüllte Pille (Farbe `--m3-primary-container`), bei eingeschalteten Namen mit „Neu“ darunter. Der Knopf „Neu“ über der Leiste entfällt. `styles/android-xool-nav.css` (neu, in `index.html` und `docs/styles-dateien.md` eingetragen).
- **Plus:** öffnet das bestehende Anlege-Menü (`src/shell/android-fab.js`: `toggleFabMenu(anchor)`, Menü und ✕ stehen mittig über dem Plus). `src/shell/android-xool-nav.js` fängt den Klick vor dem Eingabefeld der iOS-Fassung ab.
- **Menü:** neuer Reiter (`#tab-menu` in `index.html`, Icon `icon-menu` in `sprite-2.svg`, nach dem Zeichen der Xool-App) öffnet ein Blatt mit Medien, Archiv, Einstellungen. „Medien“ ist in dieser Fassung kein Reiter mehr.
- `src/shell/nav-bar.js` überspringt Reiter ohne Seite; `src/ui/platform.js`: `isMobileVariant()`; `src/main.js`: Anmeldung.
- Am Seitenende bleibt nur Platz für die Leiste (`--m3-content-end`), weil kein Knopf mehr darüber steht.

## Begründung
Nur Stile und ein kleiner Eintrag in gemeinsamen Dateien; alle anderen Fassungen laden dieselben Regeln, sie greifen aber nur mit `data-mobile-variant="xool"`. Verworfen: `composer.js` ändern (378 Zeilen, über der 360er-Grenze) — der Klick wird stattdessen per Capture abgefangen. Die Übersicht nach Xool (Reiter „Markiert · Listen“) folgt als eigenes Paket.

## Visualisierung
Vorher („Android“):
```
                     ┌────────┐
                     │ + Neu  │
 ┌────────────────────────────┐
 │  ▣     ▦     ☑     ▨       │
 └────────────────────────────┘
```

Nachher („Android (Xool-DB)“):
```
 ┌────────────────────────────┐
 │  ▣     ▦    (＋)    ☑    ☰ │
 │ Übers. Kal.  Neu  Aufg. Menü│
 └────────────────────────────┘
```

## Hinweise
- Am Gerät testen: Plus-Menü mittig, ✕ genau über dem Plus, Menü-Blatt (Medien, Archiv, Einstellungen), Wegscrollen der Leiste, hell und dunkel, Namen unter den Icons an/aus.
- Das Plus gleitet beim Scrollen mit der Leiste weg (in Xool bleibt es stehen) — bei Bedarf als Nachbesserung.
- Wer die Fassung wechselt, wählt sie unter Einstellungen › Mehr › Versionen.
