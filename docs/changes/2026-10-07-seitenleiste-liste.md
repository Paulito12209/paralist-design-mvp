# 2026-10-07-seitenleiste-liste

## Problem
Die Desktop-Seitenleiste zeigte alle Sammlungen und alle Projekt-Gruppen auf
einmal, die Stufen-Anzeige saß unten im Fuß, oben zwischen Wortmarke,
Icon-Zeile und „Neu“ war es gedrängt, und über der Übersicht stand ihr Name
im Pfad noch einmal. Gewünscht war das Muster von T3 Code: oben nur „Liste“
mit einer Auswahl, darunter nur diese eine Liste, ganz unten „Archiviert (n)“
zum Aufklappen, ein Hilfe-Knopf im Fuß und die Stufe 16 px rechts neben
„Paralist“.

## Änderung
- **Stufe nach oben** (`src/shell/desk-head.js`, `styles/desk-head.css`):
  `#level-btn` steht neben der Wortmarke (Token `--desk-brand-gap`), der
  Hinweis „Stufe 1 · noch … XP“ erscheint darunter; solange Fortschritt offen
  ist, ist der Knopf hinterlegt. Aus `src/shell/desk-foot.js` und
  `styles/desk-nav-foot.css` entfernt.
- **Luft oben**: neues Token `--desk-nav-top-gap` (16 px) in
  `styles/tokens-desk.css` für die Abstände Wortmarke → Icon-Zeile → „Neu“ →
  „Liste“ (`styles/desk-nav.css`, `styles/desk-nav-pages.css`).
- **„Liste“ statt Sammlungen** (`src/shell/desk-list.js`,
  `src/shell/desk-list-rows.js`, `styles/desk-nav-list.css`, alle neu): Kopf
  „Liste ▾ Eingang 18 ⌘L“ unter „Neu“. Klick auf „Liste“ oder ⌘L öffnet das
  Menü mit 1 Projekte, 2 Arbeitsbereiche, 3 Ressourcen, 4 Archiv, Strich,
  5 Eingang, 6 Aufgaben, 7 Termine, 8 Lesezeichen (Ziffer, Pfeile, Escape,
  Klick daneben). Die Wahl bleibt unter `paralist-desk-list`. Darunter nur
  die Zeilen dieser Liste (Icon, Titel, Stern, rechts Zahl der Einträge bzw.
  Tag eines Termins), die offene Zeile ist markiert, Rechtsklick öffnet das
  Menü des Eintrags. Klick auf den Namen im Kopf öffnet die Seite der Liste.
- **Anlegen per Klick**: freie Fläche unter den Zeilen oder die blasse Zeile
  „… hinzufügen“ öffnet das Eingabefeld mit dem Typ der Liste (Projekt,
  Arbeitsbereich, Dokument, Eintrag im Eingang, Aufgabe, Termin, Lesezeichen);
  im Archiv gibt es die Zeile nicht.
- **„Archiviert (n)“** fest über dem Fuß, klappt bis zur halben Höhe der
  Leiste auf (`paralist-desk-archive`); ausgeblendet, wenn die Liste selbst das
  Archiv ist oder nichts drin liegt.
- **Hilfe** (`src/shell/desk-help.js`, `styles/desk-help.css`, neu): das
  Fragezeichen im Fuß zwischen Einstellungen und Hell/Dunkel öffnet einen
  Dialog — was Paralist ist, wie man arbeitet, die wichtigsten Kürzel, Knopf
  „Alle Kurzbefehle“ zu Profil › Kurzbefehle. Ein `.modal-backdrop`, damit
  Escape, Kreuz und Klick daneben wie überall schließen.
- **Pfad oben leer** auf Übersicht, Kalender, Aufgaben und Medien
  (`src/shell/desk-page-head.js`): der Name steht dort schon groß auf der Seite.
- **Kürzel** (`src/ui/desk-links.js`: `listLinks`, `listKey` statt
  `collectionLinks`; `src/shell/desk-keys.js`, `src/shell/desk-combos.js`):
  ⌘L öffnet das Menü, ⌃1–⌃8 (Alt außerhalb des Macs) wählen direkt, G und
  Buchstabe (P B R A I U T L) öffnet die Seite. Profil › Kurzbefehle
  (`src/features/profile/shortcuts.js`) hat die Gruppe „Liste“.
- **Gerüst** (`src/shell/desk-nav-parts.js`, `src/shell/desk-nav.js`):
  Sammlungen, „Mehr anzeigen“ und die Projekt-Gruppen je Ansicht entfallen;
  `activeTargets()` liefert `entry` statt `project`.
- Gemeinsame Dateien: `index.html` (zwei neue Stylesheets nach
  `desk-nav-pages.css`), `src/core/storage.js` (`deskList`, `deskArchive`
  statt `deskMore`, `deskViewGroups`), `styles/tokens-desk.css`,
  `styles/desk-kbd.css` (Ziffern im Menü bleiben auch bei ausgeblendeten
  Schildern), `docs/styles-dateien.md`, `docs/desktop-flows.md`.

## Begründung
Das Menü liegt in der Navigation selbst, nicht in einem Dialog: ⌘L und die
Ziffer arbeiten so ohne Ortswechsel, wie in T3 Code. Die Wahl im Menü
ändert nur die Seitenleiste, nicht die Hauptseite — die Leiste ist die
Thread-Liste, die Seite bleibt, was man gerade liest; die Seite der Liste
öffnet der Name im Kopf. ⌘L lässt Chrome die Seite übernehmen (⌘N, ⌘M
nicht). Favoriten stehen nicht im Menü, weil die Vorgabe sie nicht nannte.
Die Projekt-Gruppen je Ansicht gibt es weiter auf der Seite Projekte.
**Geltungsbereich:** nur Desktop ab 1024 px, alle Fassungen; am Handy ändert
sich nichts (die Stufe kehrt dort in die Kopfzeile zurück).
Verworfen: Glas mit Unschärfe fürs Menü (die Zeilen darunter schienen durch),
ein eigener Dialog für die Auswahl.

## Visualisierung
Vorher:
```
Paralist                 [▯]
 ▦ 📅 ☑ 🖼 🔍
[+ Neu                   N]
Sammlungen
  Eingang 18            ⌃1
  Favoriten             ⌃2
  Arbeitsbereiche       ⌃3
  Ressourcen            ⌃4
  Lesezeichen           ⌃5
  Archiv                ⌃6
  ˅ Mehr anzeigen
Projekte ↗               +
 ˅ Alle
   🚀 Marathon          6
⚙ ◔1 ☀                 ⟳
```

Nachher:
```
Paralist  ◔1             [▯]

 ▦   📅   ☑   🖼   🔍

[+ Neu                   N]

Liste ˅  🚀 Projekte 12  ⌘L   ← ⌘L öffnet darunter:
  🚀 Marathon-Vorbereitung 2   ┌ 1 🚀 Projekte        ✓ ┐
  🚀 Fotobuch Sommerurlaub     │ 2 ≋ Arbeitsbereiche    │
  🚀 Umzug nach Leipzig ★ 6    │ 3 ⬚ Ressourcen         │
  + Projekt hinzufügen         │ 4 ▭ Archiv             │
                               │ ───────────────────── │
  (freie Fläche = anlegen)     │ 5 ⤓ Eingang            │
                               │ 6 ◯ Aufgaben           │
                               │ 7 📅 Termine           │
˅ Archiviert (10)              └ 8 ▯ Lesezeichen        ┘
⚙  ?  ☀                  ⟳
```

## Hinweise
- Favoriten fehlen in der Seitenleiste; bei Bedarf als 9. Punkt ergänzen.
- Rechtsklick auf Zeilen unter „Archiviert“ zeigt das normale Eintragsmenü
  mit „Archivieren“, nicht „Zurückholen“.
- Am Gerät testen: ⌘L in Safari (könnte die Adresszeile behalten),
  Seitenleiste zu- und aufklappen, „Archiviert“ bei sehr kurzem Fenster,
  Hilfe-Dialog im Hellen, Zurück-Pfeil und Browser-Zurück nach einem Klick
  auf eine Zeile.
- Geprüft im Browser-Pane (Chromium, 1100 und 1440 px, hell und dunkel,
  375 px): Konsole leer, Menü per Klick und ⌘L, Ziffer 5, ⌃6, G T, Anlegen
  per Zeile und Fläche, Archiv-Block, Stufe mit Hinweis und Fortschritt,
  Hilfe-Dialog mit Escape.
