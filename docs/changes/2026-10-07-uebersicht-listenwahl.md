# 2026-10-07-uebersicht-listenwahl

## Problem
In „Android (Experiment)“ zeigte die Übersicht unter den Kacheln immer nur die
Projekte. Gewünscht war ein Gegenstück zu „Liste ˅“ der Desktop-Seitenleiste:
„Projekte ˅“, um unten eine andere Liste zu zeigen; „Projekte“ 2 px größer;
rechts neben dem runden Pfeil (bleibt) wie in Google Chat ein runder Knopf mit
einem Reiter-Symbol, der die Reiter ein- und ausblendet, und links daneben
eine Pille „Liste“, die beim Tippen zu „Kanban“ wird. „Board“ heißt künftig
„Kanban“.

## Änderung
- **Neu `src/features/overview/home-list.js`**: zeichnet im Experiment den Kopf
  über der Liste neu (`renderHomeHead`), merkt die gewählte Liste
  (`storageKeys.homeList`) und zeichnet andere Listen als Projekte als
  schlichte Zeilen (`homeListMarkup`).
  - „Projekte ˅“ öffnet das Blatt „Liste wählen“ mit den acht Listen aus
    `src/ui/desk-links.js` (Projekte, Arbeitsbereiche, Ressourcen, Archiv │
    Eingang, Aufgaben, Termine, Lesezeichen).
  - Pille „≡ Liste“ / „▥ Kanban“ schaltet das Layout der gewählten
    Projekt-Ansicht um.
  - Runder Reiter-Knopf (neues Symbol `icon-tabs` in
    `assets/icons/sprite-2.svg`) blendet die Reiter der Übersicht ein und aus —
    derselbe Schalter wie „Tabs anzeigen“; eingeschaltet hell gefüllt.
  - Der runde Pfeil öffnet die Seite der gewählten Liste (Aufgaben und
    Termine: den Reiter unten).
  - Bei anderen Listen fehlen Pille und Reiter-Knopf; ein Tipp in die freie
    Fläche öffnet das Eingabefeld mit dem passenden Typ, leer steht nur die
    Zeile zum Anlegen da.
- `src/features/overview/projects.js`: bindet das Modul ein.
- `src/features/overview/project-inline.js`: das Anlegen eines Projekts per
  Tipp greift nicht in den anderen Listen.
- Stile: `styles/android-overview-sheet.css` (Kopf, Pille, runde Knöpfe,
  Chevron), `styles/android-experiment-surface.css` (Trennlinie auch unter
  anderen Listen), `styles/tokens-android.css` (`--m3-ov-head-size: 17px`,
  `--m3-ov-tools-gap: 8px`).
- **Board → Kanban** in allen Fassungen: Layout-Schalter bei Projekten
  (`project-settings.js`) und Aufgaben (`tasks-settings.js`), Symbol-Auswahl
  (`src/data/icon-sets.js`), Hinweistext (`tasks-filter.js`), Demo-Daten.
- `src/data/platform-versions.js`: neue Zeile unter den Unterschieden des
  Experiments.
- Gemeinsame Dateien: `src/core/storage.js` (Schlüssel `homeList`),
  `styles/tokens-android.css`, `assets/icons/sprite-2.svg`.

## Begründung
Blatt von unten statt Klappmenü, weil Android-Menüs in der App überall so
aufgehen. Die Listen kommen aus derselben Quelle wie am Desktop, damit beide
nicht auseinanderlaufen. Pille und Reiter-Knopf nur bei Projekten, weil nur
die Projekte auf der Übersicht Ansichten und Kanban haben. Keine neue
CSS-Datei, damit `index.html` unberührt bleibt.
**Geltungsbereich:** Kopf und Listenwahl nur in „Android (Experiment)“ am
Handy; „Android“, iOS und Desktop unverändert. Die Umbenennung Board → Kanban
gilt überall.
Verworfen: Sortieren-/Filtern-Zeile auch für die anderen Listen (die haben
dafür ihre eigene Seite hinter dem Pfeil).

## Visualisierung
Vorher:
```
╭──────────────────────────────────────╮
│ Projekte                         (↗) │
│──────────────────────────────────────│
│ ▭ 1 | 7 Einträge             ⇅   ☰  │
```

Nachher:
```
╭──────────────────────────────────────╮
│ Projekte ˅      (≡ Liste) (▭)   (↗) │   ← 17 px, ▭ = Reiter an/aus
│──────────────────────────────────────│
│ ▭ 1 | 7 Einträge             ⇅   ☰  │

Tipp auf „Projekte ˅“:       Andere Liste gewählt:
┌ Liste wählen ─────────┐    │ Arbeitsbereiche ˅             (↗) │
│ 🚀 Projekte         ✓ │    │───────────────────────────────────│
│ ≋  Arbeitsbereiche    │    │ 📁 Studium                      ⋮ │
│ ⬚  Ressourcen         │    │ 📁 Haushalt                     ⋮ │
│ ▭  Archiv             │
│───────────────────────│
│ ⤓  Eingang … Lesezeichen │
```

## Hinweise
- Gespeicherte Ansichten, die „Board“ heißen, behalten ihren Namen.
- Andere Listen zeigen auf der Übersicht keine Werkzeugzeile.
- Am Gerät testen: Wischen auf den Zeilen anderer Listen (Archiv:
  Zurückholen/Löschen), Anlegen per Tipp in die freie Fläche.
- Geprüft im Browser (Chromium, 375 px, hell und dunkel, leerer und voller
  Speicher, Konsole leer): Menü, Kanban, Reiter-Knopf, Pfeil und
  Browser-Zurück, Pfeil bei Aufgaben; „Android“, iOS und Desktop (1200 px)
  zeigen den alten Kopf.
