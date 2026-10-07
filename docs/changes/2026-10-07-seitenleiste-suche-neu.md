# 2026-10-07-seitenleiste-suche-neu

## Problem
Die Desktop-Seitenleiste war zu voll und zu laut: Icon-Zeile mit Lupe, ein
weißer „Neu“-Knopf, „Liste ▾ … ⌘L“, „Nichts in …“, Zahlen an jeder Zeile,
Ordner-Icons an Arbeitsbereichen, eine Linie über „Archiviert“ und ein Fuß,
dessen Icons unten mehr Luft hatten als oben. Die Leiste hob sich im Dunkeln
nicht von der Seite ab, und die Seitentitel standen nicht auf einer Linie mit
ihr. Das Eingabefeld am Desktop hatte zwei Pillen oben, nur fünf Typ-Knöpfe
(Ressourcen erst über ein Blatt) und ein ✕; bei langem Ortsnamen rutschte der
Pfeil zum Anlegen in eine eigene Zeile. Vorbilder: Raycast, T3 Code, Codex, Arc.

## Änderung
**Seitenleiste** (`src/shell/desk-nav-parts.js`, `desk-nav.js`, `desk-pages.js`,
`desk-list.js`, `desk-list-rows.js`; `styles/desk-nav.css`, `desk-nav-pages.css`,
`desk-nav-list.css`, `desk-nav-foot.css`, `desk-head.css`, `desk-kbd.css`)
- Fläche in Android-Tönen: im Dunkeln heller als die Seite (`#1e1f23`), im
  Hellen ein Hauch dunkler; leicht in der Farbe der gewählten Liste getönt
  (`data-desk-tone` am Gerätefenster, Eingang Silberblau, Projekte Rot …).
- Vier gleich breite Kacheln (Übersicht, Kalender, Aufgaben, Medien) statt der
  Icon-Zeile; die Lupe ist raus.
- Zeile „🔍 Suchen ⌘K“ (Fläche erst beim Überfahren, ⌘K 16 px hinter dem Wort)
  und rechts der Stift „Neuer Eintrag N“ statt des „Neu“-Knopfs.
- Trennlinie darunter in der Listenfarbe (zu 30 %), 8 px Luft darüber und darunter.
- Kopf „📥 Eingang 9 ˅“: Icon in Listenfarbe, Name hell und fett; Klick oder
  ⇧⌘L (Strg ⇧ L) öffnet das Menü „Liste wechseln“, beim Überfahren steht der
  Hinweis mit Kürzel darunter. Rechts gegenüber ein Plus, das in der Liste
  anlegt (Hinweis „Neues Projekt“ …, im Archiv kein Plus). ⌘L ist frei.
- Zeilen: Arbeitsbereiche alle mit dem Arbeitsbereich-Icon in Grau, keine
  Zahlen mehr; Arbeitsbereiche und Projekte zeigen beim Überfahren einen Pfeil
  und klappen ihre Einträge eingerückt darunter auf (höchstens 3 Stufen, nicht
  im Archiv, nur für die Sitzung gemerkt). Kein „Nichts in …“.
- Blasse Zeile unter dem letzten Eintrag je Liste: „Neues Projekt“, „Neuer
  Arbeitsbereich“, „Neue Ressource“, „Neuer Eintrag“, „Neue Aufgabe“, „Neuer
  Termin“, „Neues Lesezeichen“.
- Keine Linie mehr über „Archiviert“; die Linie über dem Fuß läuft über die
  ganze Breite, die Icons haben oben und unten je 10 px.
- Eine gemeinsame Linie: Wortmarke, Lupe, Kopf und Zeilen beginnen bei 24 px;
  Klapp-Knopf, Stift und Plus stehen genau übereinander; Abstände 16 px.

**Seitentitel** (`styles/desk-views.css`): Übersicht, Kalender, Aufgaben und
Medien stehen mittig auf Höhe der Kacheln, die Pillen „Alle | Board“ auf Höhe
von „Suchen“.

**Eingabefeld am Desktop** (`styles/desk-composer.css` neu;
`src/features/composer/composer-state.js`, `-types.js`, `-workspace.js`, `-sheet.js`)
- Oben Ort-Pille (höchstens 45 %, sonst „…“) und Textfeld; unten Plus, alle
  neun Typen als Icons (inkl. Arbeitsbereich, Hinweis in der Einzahl), rechts
  Mikrofon und Pfeil — der Pfeil bricht nie um, zu enge Icons brechen in ihrer
  Reihe um. Typ-Pille und ✕ unsichtbar; Escape schließt, ein Klick daneben nur,
  solange nichts drinsteht. Beim Wechsel über 1024 px schließt das Feld.
- `workspaceDraft` steht jetzt in `composer-state.js` (Re-Export bleibt).

**Kürzel und Texte**: `src/ui/desk-links.js` (`listSwitch`, neue Anlege-Texte),
`src/shell/desk-keys.js`, `desk-combos.js`, `desk-help.js`,
`src/features/profile/shortcuts.js`.

**Gemeinsame Dateien**: `index.html` (Stylesheet `desk-composer.css`),
`styles/tokens-desk.css` (Seitenleisten-Werte und Listenfarben),
`src/core/storage.js` (nur Kommentar), `docs/styles-dateien.md`,
`docs/desktop-flows.md`, `src/shell/desk.js` (Kommentar).

## Begründung
Ruhige Hierarchie nach den Vorbildern: eine gefüllte Fläche weniger, Färbung
statt Beschriftung, Bedienung erst beim Überfahren. Das Eingabefeld ist rein
per CSS umgestellt, damit das Handy unverändert bleibt. Ein Klick daneben
verwirft nur leere Entwürfe, damit kein Text verloren geht.
**Geltungsbereich:** nur Desktop ab 1024 px, alle Fassungen; am Handy ändert
sich nichts.
Verworfen: ⇄-Knopf und Einklappen der Liste (ersetzt durch Klick auf den Kopf
und Plus), Zahlen an den Zeilen, seitliches Rollen der Typ-Icons.
Ausgelagert in eigene Sitzungen: Aufgaben-Zeilen (Angaben rechts, direkt
bearbeiten) und Karte „Ansicht“ als Kopf-Icon.

## Visualisierung
Vorher:
```
Paralist ◔1              [▯]
 ▦   📅   ☑   🖼   🔍
[+ Neu                   N]
Liste ˅ 🚀 Projekte 12   ⌘L
  Nichts in „Projekte“
  + Projekt hinzufügen
─────────────────────────
˅ Archiviert (4)
 ─────────────────────────
 ⚙  ?  ☀               ⟳

[Eingang ▾][✎ Notiz ▾]     (↑)
Neue Notiz einfügen …
(+)  ✎ ◯ 📅 🚀 ⬚        🎤 (✕)
```

Nachher:
```
Paralist ◔1              [▯]   │ Aufgaben              ← eine Linie
[ ▦ ][ 📅 ][ ☑ ][ 🖼 ]          │
🔍 Suchen  ⌘K            [✎]   │ (Alle) Board +        ← eine Linie
──────────────────────────     ← Listenfarbe
≋ Arbeitsbereiche 5 ˅     [+]
  ≋ Studium ★             ˅    ← aufgeklappt
    🚀 Bachelorarbeit
  ≋ Haushalt              ›    ← Pfeil beim Überfahren
  + Neuer Arbeitsbereich
˅ Archiviert (4)
══════════════════════════════
 ⚙  ?  ☀               ⟳

[⑂ Fitness & Gesundh… ▾] Neue Ressource anlegen …
(+) ✎ ◯ 📅 🚀 ≋ 📄 ✍ 🖼 🔖                    🎤 (↑)
```

## Hinweise
- Am iPad ohne Tastatur gibt es kein ✕: ein getippter Entwurf lässt sich nur
  durch Löschen des Texts und Tippen daneben verwerfen (Option: ✕ nur bei
  Touch zeigen).
- Tab-Reihenfolge im Eingabefeld: der Pfeil kommt vor dem Textfeld dran
  (Enter legt an); sauber lösbar erst nach Teilen von `composer.js`.
- „Neue Ressource“ legt ein Dokument an; „Neuer Eintrag“ im Eingang legt an,
  was die offene Seite vorschlägt.
- Der Aufklapp-Pfeil der Zeilen ist nur mit der Maus erreichbar.
- Safari: ⇧⌘L öffnet dort auch die Seitenleiste des Browsers — bitte prüfen.
- Geprüft im Browser-Pane (1024, 1100, 1200, 1320, 1440 px, hell und dunkel,
  375 px, leerer und voller Speicher): Menü per Klick und ⇧⌘L, Plus, Aufklappen,
  Titel-Ausrichtung gemessen, Eingabefeld mit langem Ort, offenem Seitenfenster
  und erzwungener Breite 260–480 px, Escape und Klick daneben, Browser-Zurück.
