# 2026-10-06-desktop-navigation-seitenfenster

## Problem
Am Desktop standen Übersicht, Kalender, Aufgaben, Medien und die Suche als
Reiter mittig oben; der Pfad und die Knöpfe einer Detailseite standen in
einer eigenen Zeile darunter, der große Titel noch einmal darunter. Gewünscht
war — nach dem Vorbild von T3 Code —:

- die vier Seiten und die Suche als Icons in der Seitenleiste unter „Paralist“,
  mit Kürzeln,
- der Pfad oben in der Kopfzeile, die Knöpfe der Seite rechts daneben, ganz
  rechts ein Knopf für ein Seitenfenster,
- unten links statt Name und Profil eine schlanke Icon-Zeile: Einstellungen,
  Stufen-Ring (Statistiken), Hell/Dunkel und gegenüber „Updaten“,
- ein Seitenfenster rechts („Öffnen“): Browser (mit „Als Lesezeichen
  speichern“), Medien, Datei vom Gerät, Seite, Projekt, Arbeitsbereich — mit
  Knöpfen zum Minimieren und Schließen; auf dem Tablet klappt dabei die
  Seitenleiste zu.

## Änderung
- **Icon-Zeile der Seiten** (`src/shell/desk-pages.js`, `styles/desk-nav-pages.css`):
  unter „Paralist“, über „Neu“; Hinweis mit Name und Kürzel beim Überfahren.
- **Fuß der Seitenleiste** (`src/shell/desk-foot.js`, `styles/desk-nav-foot.css`
  neu geschrieben): Einstellungen (⌘,), Stufen-Ring (hierher umgesetzt, öffnet
  Fortschritt), Hell/Dunkel-Schalter, rechts „Nach Updates suchen“ (meldet
  „Wird gesucht …“ / „Du hast die neueste Fassung“, lädt eine neuere Fassung
  sofort). Name und Profilbild entfallen dort.
- **Kopfzeile oben** (`src/shell/desk-head.js`, `src/shell/desk-page-head.js`,
  `styles/desk-head.css`): Reiter und Level-Anzeige entfallen. Zurück/Vor,
  dann der Pfad; auf Eintrag, Sammlung und Arbeitsbereich wird die Kopfzeile
  der Seite (`#entry-head`, `#page-head`) samt Kategorie, Favorit, Cover und
  Menü dorthin verschoben, unter 1024px kehrt sie zurück. Auf den vier Seiten
  steht nur ihr Name. Ganz rechts der Knopf fürs Seitenfenster.
- **Titel im Pfad** (`src/ui/page-path.js`, `src/features/entry/entry.js`,
  `styles/entry-desk.css`): am Desktop entfällt der große Titel eines Eintrags;
  das letzte Glied des Pfads ist umbenennbar (Enter fertig, Escape zurück) und
  läuft über dasselbe Titelfeld wie am Handy.
- **Seitenfenster** (`src/shell/desk-side.js`, `-browser.js`, `-files.js`,
  `-pages.js`; `styles/desk-side.css`, `desk-side-views.css`,
  `desk-side-doc.css`): lädt erst beim ersten Öffnen nach. Auswahl „Öffnen“
  (Buchstaben B M D S P A), Breiter/Minimieren/Schließen; Zustand gemerkt unter
  `paralist-desk-side`. Solange offen, weicht die rechte Spalte; unter 1280px
  klappt die Seitenleiste zu und beim Schließen wieder auf (auch nach Neuladen
  und beim Verkleinern des Fensters).
  - Browser: Adresse oder Suchwort (Google mit `igu=1`), Neu laden, im eigenen
    Tab öffnen, Lesezeichen speichern (Eintrag vom Typ Lesezeichen im Eingang).
  - Medien: Kacheln, Klick zeigt Bild/Video/Aufnahme/PDF/Text groß.
  - Datei vom Gerät: wählen oder hineinziehen, nur anzeigen; „In Medien speichern“.
  - Seite/Projekt/Arbeitsbereich: Liste mit Suche, Lese-Vorschau (Bausteine,
    Zeichnung als Bild, Inhalt von Projekt/Arbeitsbereich), „Öffnen“ ins
    Hauptfenster, Link-Karten öffnen im Browser des Fensters.
- **Lesezeichen-Liste** (`src/features/bookmarks/bookmarks.js`): eigene
  Lesezeichen zeigen „Gespeichert: Heute, 12:06 · Eingang“.
  `src/data/bookmarks.js`: `ownBookmarkFor(url)`.
- **Kürzel** (`src/ui/desk-links.js`, `src/shell/desk-combos.js`,
  `src/features/profile/shortcuts.js`): ⇧⌘Ü/K/A/M für die Seiten, ⇧⌘O fürs
  Seitenfenster, ⌃1–⌃7 für die Sammlungen (außerhalb des Macs Strg ⇧ bzw.
  Alt). ⌘K bleibt Suche; 1–4 und „G + Buchstabe“ gehen weiter.
- **Aufgeteilt:** die Tastatur-Logik aus `src/shell/desk.js` steht jetzt in
  `src/shell/desk-keys.js` (reine Verschiebung), damit `desk.js` unter der
  Zeilengrenze bleibt.
- Gemeinsame Dateien: `index.html` (4 Stylesheets), `src/main.js`
  (`deskSide` nachladbar, Hell/Dunkel hereingegeben), `src/core/storage.js`
  (`deskSide`), `styles/tokens-desk.css` (`--desk-side-*`),
  `assets/icons/sprite-2.svg` (sidebar-right, refresh, minus, shrink),
  `styles/desk-kbd.css`, `docs/styles-dateien.md`.

## Begründung
Die Kopfzeile der Unterseite wird verschoben statt nachgebaut — so bleiben
Menüs, Klicks und Typ-Auswahl genau dieselben. ⌘K blieb die Suche, und ⌘N/⌘M
fängt der Browser selbst ab, darum ⇧⌘ + Buchstabe (Wunsch). Strg+Ziffer
wechselt unter Windows den Browser-Tab, darum dort Alt+Ziffer.
Seite/Projekt/Arbeitsbereich sind im Fenster vorerst nur zum Lesen; ein
zweites bearbeitbares Fenster derselben App (z.B. als iframe) hätte zwei
Speicher-Stände gegeneinander schreiben lassen.
**Geltungsbereich:** gilt am ganzen Desktop ab 1024px, für alle Fassungen;
am Handy ändert sich nichts. Der große Titel entfällt am Desktop für alle
Eintragsarten.
Verworfen: die Anmerkungen „Auswahl“/„Board“ im zweiten Screenshot (stammen
vermutlich aus einer früheren Aufgabe).

## Visualisierung
Vorher:
```
Paralist        [▯] │ ‹ ›      [Übersicht|Kalender|Aufgaben|Medien|🔍]       ◔1
[+ Neu        N]    │ Übersicht › Eingang › Test     Zeichnung ☆ 🖼 ⋮
Sammlungen          │ Test                                        │ Details
  Eingang     G I   │ [Inhalt] [Verknüpfungen]                    │ …
DN Dein Name   ⌘,   │                                             │
```

Nachher:
```
Paralist        [▯] │ ‹ ›  Übersicht › Eingang › Test   Zeichnung ☆ 🖼 ⋮ [▯]│ Öffnen      ⤢ – ×
 ▦  📅  ☑  🖼  🔍   │ [Inhalt] [Verknüpfungen]                             │ 🌐 Browser       B
[+ Neu        N]    │                                                      │ 🖼 Medien        M
Sammlungen          │                                                      │ ⤓ Datei vom Gerät D
  Eingang     ⌃1    │                                                      │ ✎ Seite          S
…                   │                                                      │ 🚀 Projekt       P
⚙ ◔1 ☀          ⟳  │                                                      │ ≋ Arbeitsbereich A
```

## Hinweise
- Viele Websites verbieten das Einbetten (Anmeldeseiten, GitHub, Banken):
  der Rahmen bleibt dann leer, der Hinweis darunter bietet den eigenen Tab an.
  Im Browser-Pane von Claude waren fremde Seiten ganz gesperrt — bitte in
  Chrome mit z.B. Wikipedia testen.
- Als Lesezeichen gespeichert wird die eingegebene Adresse, nicht die, zu der
  man im Rahmen weitergeklickt hat (der Browser verrät sie nicht).
- Prüfen, ob Chrome ⇧⌘A (Tab-Suche) und ⇧⌘M (Profil) an die App durchlässt.
- Testen: Umbenennen im Pfad, Seitenfenster bei 1100px (Seitenleiste klappt
  zu und wieder auf), Hell/Dunkel-Schalter unten, „Nach Updates suchen“.
