# 2026-11-28-og-uebersicht-dashboard

## Problem
Die Übersicht der „OG Version“ sah noch nicht aus wie die iOS-App Organi7er:
„Projekte ↗“ mit Ansichten und die Karte „Ansicht“ standen noch da, das
Dashboard („Im Blick“, „Zuletzt …“) fehlte, die Listen hatten die falsche Reihenfolge.

## Änderung
- Neu: `src/data/home-dash.js` (Daten: Angepinnt, Heute, Morgen, Zuletzt erstellt/geöffnet/bearbeitet,
  Zähler, Zeitstempel), `src/ui/dot-matrix.js` (Punktmatrix-Schrift), `src/features/overview/home-og.js`
  und `home-og-cards.js` (Rendern, Filter-Pillen, Seitenpunkte, Karten), `styles/tokens-og-home.css`,
  `styles/og-dash.css`, `styles/og-dash-card.css`.
- Listen: Favoriten, Projekte (Zielscheibe, rot), Arbeitsbereiche, Ressourcen, Eingang, Lesezeichen, Archiv
  (`overview.js`); Projekte-Bereich und Karte „Ansicht“ sind in OG ausgeblendet.
- Gemeinsame Dateien: `index.html` (Behälter `#og-dash`, zwei `<link>`), `overview.js`,
  `entry-menu.js` („Anpinnen“ auch in OG), `demo-data.js` (angepinnte und bearbeitete Demo-Einträge),
  `sprite-2.svg` (`icon-target`), `og-lists.css` (Säule und Schein auch für `.og-art`), `og-home.css`,
  `docs/styles-dateien.md`.

## Begründung
Alles hängt an `data-mobile-os="ios"` und `data-mobile-variant="og"`; andere Fassungen bleiben
unverändert (der Behälter bleibt leer und ausgeblendet). Klick, Stern und „…“ nutzen die
vorhandenen Empfänger aus `list-clicks.js`. Auge und Stift der Zeitstempel sind eigene
Punkt-Raster, weil die Symbole der Sammlung dafür zu dünn sind. Geltungsbereich: nur OG Version.

## Visualisierung
Vorher:
```
Listen ›  [Eingang][Favoriten][Arbeits…]
Projekte ↗  (Alle · Neue Ansicht) (🚀+)
Projekt hinzufügen            [Karte „Ansicht“]
```

Nachher:
```
Listen ›  [Favoriten][Projekte][Arbeits…][Ressour…]
Im Blick  (Angepinnt)(Heute)(Morgen)
╭────────────────╮ ╭──────
│ ✎ Notiz        │ │ ◎ Projekt
│ Einkaufsliste  │ │ Umzug na…
│ 🕘 02:21  ★ ⋯  │ │
╰────────────────╯ ╰──────
Zuletzt erstellt ›  [Kachel][Kachel][Kachel][Ka…
Zuletzt geöffnet ›  …
Zuletzt bearbeitet › …
      ( Dashboard anpassen )
```

## Hinweise
- „Dashboard anpassen“ ist nur gezeichnet, ein Blatt dahinter gibt es nicht; die Pfeile hinter
  „Zuletzt …“ führen noch nirgendwohin.
- Die großen Karten wirken etwas heller als in der App (Werte in `tokens-og-leiste.css`).
- Geprüft bei 375 px dunkel und hell mit `?demo=1`, Konsole leer. Nicht geprüft: leerer Speicher,
  leere Zustände, Zurück-Navigation.
