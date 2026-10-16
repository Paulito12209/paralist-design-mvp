# 2026-10-16-android-xool-eins-zu-eins

## Problem
„Android (Xool-DB)“ sollte eins zu eins wie die Xool-App aussehen: Kopfzeile mit Statistik-Icon links, Suche in der Mitte und Konto rechts, dazu Farben, Maße und Schrift von Xool. Der Regler sollte nicht doppelt (Kopf und Werkzeugzeile) stehen. Die Leiste bleibt wie gewünscht: Plus in der Mitte, Menü rechts. Gilt nur für diese Fassung.

## Änderung
- **`styles/android-xool-top.css` (neu, in `index.html` und `docs/styles-dateien.md`):** Statistik-Icon statt Strich-Skala (öffnet weiter „Fortschritt“), helle Suchleiste, Profilknopf mit Stufenring (Fortschritt) und Stufenzahl, Titel 22px, Übersicht 12px vom Rand, Schrift DM Sans.
- **`styles/tokens-android-dark.css`:** Abschnitt XOOL-DB mit den am laufenden Xool gemessenen Werten (Seitengrund, Karten, Leiste, Suche, Silberblau der Stufe, Pille der Leiste, Schrift- und Zahlfarben; hell und dunkel); `--bg` wird in dieser Fassung zum Xool-Seitengrund.
- **`styles/android-xool-overview.css`:** Zeilen 4px gerundet mit 2px Fuge, leere Abschlusskarte unten (16px), aktiver Reiter und Linie in Silberblau, Zahlen blass, Kacheln ohne Vorschau der zweiten Seite; Regler aus der Werkzeugzeile entfernt.
- **`styles/android-xool-nav.css`:** Leiste 70px in eigener Fläche, Pille hinter dem aktiven Icon 64px, Plus in Silberblau.
- **`assets/icons/sprite-2.svg`:** Icon `chart-column`. **`index.html`:** Statistik-Icon im Knopf oben links.
- **`src/shell/level-gauge.js`:** schreibt Stufe und Fortschritt zusätzlich an den Profilknopf (`data-level`, `--level-progress`). **`src/shell/android-xool-nav.js`:** lädt DM Sans nur in dieser Fassung und setzt den Platzhalter „Suche in Paralist“.

## Begründung
Die Werte stammen aus der laufenden Xool-App (Port 5181, bei 375px gemessen): Titel bei 86px, Kacheln 170 × 112 ab 126px, Reiter bei 386px, Kopf bei 434px — die Übersicht trifft diese Lagen jetzt genau. Die Logik bleibt die des MVP (andere Kacheln und Listen als in Xool). Verworfen: die Schrift fest in `index.html` laden (alle Fassungen hätten sie geholt).

## Visualisierung
Vorher:
```
 (1Lv)  [   Suchen   ]  (👤)
 Übersicht
 [Eingang][Favoriten][Le…
```

Nachher:
```
 📊  [ Suche in Paralist ]  (◔)
                             1
 Übersicht
 [Eingang 8   ][Favoriten 6 ]
 [Arbeitsb. 5 ][Ressourcen 12]
     Markiert ☐     Listen ˅
 ╭ Projekte 7               ⚙ ╮
 │ ▤ 1 | 7 Einträge      ⇅    │
 │ 🚀 Umzug nach Leipzig     ⋮ │
```

## Hinweise
- Die Schrift kommt von Google Fonts (nur in dieser Fassung); ohne Netz bleibt die Systemschrift.
- Lesezeichen und Archiv (zweite Kachelseite) schauen nicht mehr hervor, sind aber per Wischen erreichbar.
- Die Namen unter den Icons der Leiste folgen weiter der Einstellung (in Xool sind sie an).
