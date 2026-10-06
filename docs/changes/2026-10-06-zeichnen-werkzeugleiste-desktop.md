# 2026-10-06-zeichnen-werkzeugleiste-desktop

## Problem
Am Desktop hatte eine Zeichnung nur Stift, Marker, Radierer, fünf Farben und
Rückgängig. Gewünscht waren — nach dem Vorbild der iPad-Stiftpalette — die
Werkzeuge Wiederholen, Farbwähler, Formen (statt Lineal), Text, Notizzettel
(als verknüpfte Notiz) und Anhang mit den Reitern „Medien“ und „Eigene
Dateien“. Die Leiste soll sich unter die Zeichnung oder links daneben
schieben lassen und den verfügbaren Platz ausnutzen; was nicht passt, steht
hinter „⋯“.

## Änderung
- **Desktop-Werkzeugleiste** (`src/features/drawing/draw-desk-bar.js`): Griff |
  Rückgängig, Wiederholen | Auswählen, Stift, Marker, Radierer | 5 Farben +
  Farbwähler | Formen, Text, Notiz, Anhang. Zweiter Klick auf das gewählte
  Malwerkzeug öffnet die Strichbreite. Am Handy bleibt die schlanke Leiste.
- **Andocken** (`draw-dock.js`): am Griff nach unten oder links ziehen (zwei
  Ziele leuchten auf), Klick auf den Griff wechselt. Gemerkt unter
  `paralist-draw-prefs`.
- **Platz ausnutzen** (`draw-bar-fit.js`): unten über die volle Breite, links
  über die volle Höhe, Gruppen verteilt; links ein- oder zweispaltig je nach
  Höhe; bei Platzmangel wandern Knöpfe hinter „⋯“.
- **Fenster** (`draw-pop.js`, `draw-color-pop.js`): Strichbreite, Formen (zehn
  Formen aus `src/data/draw-shapes.js`, „Kontur | Gefüllt“), Farbwähler (40
  Farben, zuletzt gemischte, eigene Farbe über den Systemdialog, Hex-Feld),
  „Weitere Werkzeuge“.
- **Dinge auf der Fläche** (`draw-layer.js`, `draw-select.js`, `draw-insert.js`,
  `draw-item-bar.js`, `draw-model.js`): Text, Formen, Bilder und Notizzettel
  liegen als eigene Ebene unter den Strichen, gespeichert in
  `entry.drawItems` (`src/data/draw-items.js`). Auswählen, verschieben, am
  Griff größer ziehen, kleine Leiste über dem gewählten Ding (Schrift,
  Füllung, Zettelfarbe, Notiz öffnen, Duplizieren, Nach vorn, Löschen).
- **Notizzettel** sind echte Notizen, beidseitig mit der Zeichnung verknüpft;
  erste Zeile = Titel.
- **Anhang** (`draw-attach.js`): Reiter „Medien“ (Bilder der App, mehrere
  wählbar) und „Eigene Dateien“ (Ablagefeld, Dateiauswahl; die Bilder
  landen auch in Medien). Dazu Bilder direkt auf die Fläche ziehen oder mit
  Strg+V einfügen. Das Anlegen von Medien steht dafür jetzt in
  `src/data/media-add.js`; `src/features/media/media-import.js` reicht es weiter.
- **Rückgängig/Wiederholen** für Striche und Dinge gemeinsam
  (`draw-history.js`), Tasten in `draw-keys.js` (Strg+Z/Y, Entf, Strg+D,
  Pfeile, Escape).
- **Export/Kopieren** enthalten die Dinge mit (`src/ui/drawing-compose.js`,
  `src/ui/drawing-export.js`).
- **Striche bleiben erhalten**, wenn die Fläche niedriger ist als die
  gespeicherte Zeichnung (vorher schnitt jedes Speichern den verdeckten Teil ab).
- Gemeinsame Dateien: `index.html` (4 Stylesheets), `src/core/bus.js`
  (`layoutChanged`), `src/core/storage.js` (`drawPrefs`),
  `src/features/entry/entry-fold.js` (misst nach dem Andocken neu),
  `styles/tokens-entry.css` (`--draw-desk-*` u. a.), `docs/styles-dateien.md`.
- Neue Stile: `styles/drawing-items.css`, `drawing-desk.css`,
  `drawing-pop.css`, `drawing-attach.css`.

## Begründung
Die Dinge liegen als eigene Ebene statt ins Bild gemalt zu werden — nur so
bleiben sie verschiebbar und änderbar; unter den Strichen, damit man auf
Bildern anmerken kann. Maße in Tausendsteln der Flächenbreite, damit alles
mit der Fläche mitwächst. Lineal ersetzt durch Formen (Wunsch). Keine
Ein-Buchstaben-Kürzel, weil N, G und andere schon belegt sind.
**Geltungsbereich:** die neue Leiste gilt am ganzen Desktop ab 1024 px (alle
Desktop-Fassungen, die sich bisher nicht unterscheiden); am Handy bleibt die
schlanke Leiste, die Dinge werden dort nur angezeigt.
Verworfen: Bilder als Daten-URL im Eintrag (Speicher voll) — sie verweisen auf
den Medien-Eintrag.

## Visualisierung
Vorher:
```
┌──────── Zeichenfläche ────────┐
└───────────────────────────────┘
( ✎  🖍  ⌫  │ ● ● ● ● ● │  ↶ )
```

Nachher:
```
┌──────── Zeichenfläche ────────┐       ╭──╮ ┌──────────┐
│  Text   ▢ Form   [Zettel]     │       │⠿ │ │          │
│        [Bild] ~~Striche~~     │       │↶↷│ │          │
└───────────────────────────────┘       │➚✎│ │          │
(⠿ ↶ ↷ │ ➚ ✎ 🖍 ⌫ │ ●●●●● ◍ │ ◇ T 🗒 📎)   │●●│ │          │
 ← über die volle Breite verteilt →     │◇T│ │          │
                                        ╰──╯ └──────────┘
Zu kurz: (⠿ ↶ │ ✎ ⌫ │ ●●●●● │ ⋯) → Fenster „Weitere Werkzeuge“
```

## Hinweise
- `src/features/drawing/drawing.js` hat 363 Zeilen — vor der nächsten
  Änderung daran zuerst teilen.
- Vorschaubilder in Listen zeigen weiterhin nur die Striche.
- Zettel löschen entfernt nur den Zettel, die Notiz bleibt.
- Leiste links macht die Fläche schmaler; Striche und Dinge schrumpfen mit.
- Bei extrem niedriger Fläche ragt die linke Leiste trotz „⋯“ etwas heraus.
- Testen: Medien-Seite importieren (verschobene Funktion), Farbdialog unter
  Windows, Bild aus dem Explorer auf die Fläche ziehen, Andocken, Reiter
  „Verknüpfungen“ bei Leiste links.
