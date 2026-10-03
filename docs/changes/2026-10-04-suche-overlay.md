# 2026-10-04-suche-overlay

## Problem
Die Suche war eine eigene Seite, die die aktuelle ersetzt hat. Oben standen
Level-Anzeige, Suchfeld als Pille und Profilbild, darunter die Überschrift
„Suchen“. Die Reiter hatten keine durchgehende Linie, es gab keine Zeile mit
der Anzahl und den Symbolen Sortieren und Filtern. Unten wurde die Liste hart
abgeschnitten, damit „Abbrechen“ lesbar blieb, und die Knöpfe waren Pillen
statt Kacheln wie der Knopf „Neu“.

Vorbilder: Raycast (Overlay über der Seite), Google Kalender (Kopfzeile der
Suche), Spotify (Leiste unten, durch die die Liste noch zu sehen ist).

## Änderung
Am Handy legt sich die Suche als Overlay über die Seite, von der aus sie
geöffnet wurde. Gestaltet ist das für die Android-Fassungen; iOS und „Erster
Test“ bekommen nur das Overlay mit deckender Fläche, der Desktop bleibt wie er war.

- **Overlay:** Die Seite darunter bleibt stehen und schimmert verschwommen
  durch (74 % Deckkraft, 10 px Unschärfe). Nur die Liste rollt; Reiter und
  Anzahl stehen oben fest, ohne eigene Fläche.
  `src/ui/views.js` lässt die Seite darunter sichtbar und ihre Klassen am body
  stehen; `src/shell/search-bar.js` hebt den Abschnitt der Suche am Handy aus
  dem Scrollbereich (am Desktop zurück hinein); `src/ui/list-clicks.js` hört
  deshalb auch auf den Such-Abschnitt.
- **Kopfzeile wie Google Kalender:** deckend in eigener Farbe
  (`--m3-search-head-bg`), Pfeil ← (neues Icon `arrow-back` in
  `assets/icons/sprite-2.svg`, Knopf in `index.html`), daneben das Feld ohne
  Pille. Level-Anzeige, Profilbild und Überschrift entfallen. Der Pfeil
  schließt die Suche wie „Abbrechen“.
- **Reiter mit Linie über die ganze Breite**, darunter links die Anzahl
  („15 Einträge“, „21 Treffer“, „1 Suchbegriff“), rechts Sortieren und Filtern
  als Symbole. Sie öffnen die bekannten Blätter von unten.
- **Tastatur:** War sie vor Sortieren oder Filtern offen, kommt sie nach dem
  Blatt zurück; war sie zu, bleibt sie zu (`search.js`, `search-tap.js`).
- **Reiter ohne Eingabe** (`src/features/search/search-browse.js`, neu):
  „Zuletzt geöffnet“ und „Am häufigsten“ lassen sich ebenfalls sortieren und
  filtern (Ort, Bearbeitet, Erledigte; neue Sortierung „Häufigkeit“).
  „Zuletzt gesucht“ zeigt nur die Anzahl. Die Zeilen-Bausteine stehen jetzt in
  `src/features/search/search-rows.js` (neu).
- **Einträge:** ohne Linien dazwischen und ohne Pfeil rechts; der Titel
  höchstens drei Zeilen, darunter eine Zeile Art und Ablageort.
- **Abstände:** von „15 Einträge“ bis „Heute“ sichtbar 24 px, bis zum ersten
  Treffer knapp 25 px; die Zeile mit der Anzahl behält ihre 48 px Tippfläche.
- **Unten:** Die Liste läuft bis zum Rand; Mikrofon, „Suchen“ und
  „Neue Suche“ sind abgerundete Kacheln wie „Neu“, ohne Schatten. Eine dunkle
  Leiste, nie ganz deckend, hält „Abbrechen“ lesbar.

Stile: `styles/search-overlay.css` (neu, in `index.html` und der Dateiliste
von `styles/tokens.css`), `styles/search.css`; neue Werte in
`styles/tokens-android.css` (`--m3-search-*`). Außerdem angepasst:
`search-sheet.js` (Zählzeile, Blätter mit eigenen Sortierungen),
`search-refine.js` (Hilfen exportiert, unbenutztes `isSorted` entfernt).

Gemeinsam genutzte Dateien: `index.html`, `styles/tokens.css`,
`src/ui/views.js`, `src/ui/list-clicks.js`.

## Begründung
- Das Overlay entsteht, indem die Seite darunter einfach sichtbar bleibt —
  kein zweites Zeichnen, kein Kopieren. Der Abschnitt der Suche muss dafür neben
  dem Scrollbereich liegen, sonst rollte er mit der Seite darunter.
- Nur die Liste rollt, damit Reiter und Anzahl ohne eigene Fläche auf dem
  Overlay stehen können, ohne dass Einträge unter ihnen durchlaufen.
- Die neuen Werte stehen in `tokens-android.css`, weil `tokens.css` und
  `tokens-pages.css` schon fast 400 Zeilen haben.
- Verworfen: 82 % Deckkraft mit 28 px Unschärfe — die Seite darunter war nicht
  mehr zu erkennen, es wirkte nicht wie ein Overlay.

## Visualisierung
Vorher:
```
┌──────────────────────────────┐
│ (Lv)  [   Suchen    ]   (👤) │
│ Suchen                       │
│ Zuletzt geöffnet  Am häufigs…│
│ ▔▔▔▔▔▔                       │
│ Heute                        │
│ 🚀 Tagebuch               >  │
│ ─────────────────────────── │
│ ███████ hart abgeschnitten ██│
│    ( 🎤 (Suchen) )  Abbrechen│
└──────────────────────────────┘
```

Nachher:
```
┌──────────────────────────────┐
│▓▓←  Suchen▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ eigene Farbe, deckend
│░Zuletzt geöffnet  Am häufig░░│ Overlay (Seite schimmert durch)
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ Linie über die ganze Breite
│░15 Einträge           ⇅   ≡░│
│░Heute                     ░░│ 24 px darüber
│░🚀 Tagebuch                ░░│ nur die Liste rollt
│░🔖 Training Plan           ░░│
│ Rick Astley…  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │ dunkle Leiste, Liste zu ahnen
│   ╭🎤╭Suchen╮╮   Abbrechen    │ Kacheln wie „Neu“
└──────────────────────────────┘
```

## Hinweise
- Tastatur am echten Android-Gerät prüfen: tippen → Filtern → schließen
  (Tastatur kommt zurück); ohne Tastatur Sortieren → schließen (bleibt zu).
- Suche von einer Unterseite (z. B. Eingang) öffnen und mit ←, „Abbrechen“ und
  Browser-Zurück schließen — man landet, wo man herkam.
- Nach Treffer öffnen → Zurück liegt die Suche über der zuletzt gezeigten Seite;
  „Abbrechen“ führt trotzdem an den Ursprung.
- Die Unschärfe hinter dem Overlay kann auf älteren Geräten Leistung kosten.
- Bei jedem Wechsel von Reiter, Sortierung oder Begriff steht die Liste wieder oben.
- Am Desktop zeigen die Reiter ohne Eingabe jetzt ebenfalls die Zeile mit der
  Anzahl und den Pillen Sortieren/Filter.
