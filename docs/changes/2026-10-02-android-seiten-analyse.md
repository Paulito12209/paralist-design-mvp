# 2026-10-02-android-seiten-analyse

## Problem
- Nutzungszeit und Serie („Analyse“) standen in den Einstellungen, gehören
  aber zum Fortschritt.
- In der Android-Fassung sollten Einstellungen und Fortschritt so aufgebaut
  sein, wie Material Design es für Einstellungen vorsieht — nicht als Blatt von
  unten. „Android (Experiment)“ soll dasselbe Layout bekommen, aber den
  bisherigen Inhalt (Kacheln, Diagramme) behalten. Der Desktop bleibt unberührt.

## Änderung
**Analyse nach Fortschritt (nur Handy, alle Fassungen)**
- Neu in `src/ui/`: `insight-tiles.js` (die zwei Kacheln), `usage-pages.js`
  (Seiten „Nutzungszeit“ und „Serie“), `usage-split.js` (verschoben aus
  `src/features/profile/`). In `src/ui`, damit Profil und Fortschritt sie beide
  nutzen dürfen.
- `src/features/progress/progress.js`: Abschnitt „Analyse“ nach dem Ring,
  Unterseiten `milestones`, `usage`, `streak` (`#/fortschritt/…`), Zeitraum-Schalter.
- `src/features/profile/*`: Analyse aus der Handy-Liste entfernt. Am Desktop
  bleibt sie unverändert unter „Analyse“ im Profil.

**Layout in Android und Experiment**
- `styles/android-pages.css`: Einstellungen und Fortschritt als Vollbildseite mit
  Kopfleiste (Pfeil links, Titel; Unterseiten nennen ihren Namen in der Leiste),
  ohne Griff, Kreuz und Wischen nach unten. Hereingleiten wie „Shared axis“.
- `src/ui/modal-pull.js`: Blätter mit `data-android-page` (in `index.html`)
  lassen sich in Android nicht ziehen.
- `profile.js`, `profile-page.js`, `progress.js`: Pfeil steht in Android immer
  und schließt auf der ersten Ebene; Titel der Unterseite in der Leiste.
- Kein Drawer/Hamburger: nur zwei Ziele, beide schon als Knöpfe in der Kopfzeile.

**Inhalt nach Material 3 (nur Android, nicht Experiment)**
- `styles/android-pages-content.css`: Zeilen ohne Kasten und Linie,
  Abschnittstitel in Akzentfarbe, Karten mit 16 dp, Zeitraum-Schalter als
  „Segmented button“, Profilkopf linksbündig, „Abmelden“ als Outlined button.
- Neue Maße `--m3-page-*` in `styles/tokens-android.css`.
- `index.html` (Stil-Dateien, Attribut), `styles/tokens.css` (Dateiliste),
  `styles/settings.css` (Rahmen `.progress-insights`).

## Begründung
Material empfiehlt für Einstellungen eine eigene Seite mit „Small top app bar“;
ein Bottom Sheet ist für ergänzende Inhalte gedacht. Ein Drawer lohnt sich erst
bei vielen gleichwertigen Zielen. Layout in Android und Experiment gleich,
damit nur der Inhalt den Unterschied macht. Verworfen: Sheet plus Drawer.
Die Analyse am Desktop zu verschieben wurde zurückgenommen — der Desktop sollte
sich nicht ändern.

## Visualisierung
Vorher:
```
┌──────────────────────────────┐
│ ▔▔▔▔ Einstellungen        ✕ │   Blatt von unten, Analyse in den
│  (PA) Paul Angeles           │   Einstellungen, Wischen schließt
│ Analyse [Nutzung][Serie]     │
└──────────────────────────────┘
```
Nachher:
```
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ ←  Einstellungen             │   │ ←  Fortschritt               │
│ (PA)  Paul Angeles           │   │  Ring                        │
│ Darstellung                  │   │  Analyse [Nutzung][Serie]    │
│  ▭ System               ✓    │   │  Meilensteine, Verlauf …     │
└──────────────────────────────┘   └──────────────────────────────┘
 Experiment: gleiches Layout, Inhalt (Kartenkästen, zentriert) wie vorher
```

## Hinweise
- Alte Adressen `#/einstellungen/nutzungszeit` und `…/serie` gelten am Handy
  nicht mehr; neu: `#/fortschritt/nutzungszeit` und `…/serie`.
- Nicht einzeln angesehen: Feedback-Formular und Danksagungen in Android Material
  (erben nur das Zeilenlayout); Prüfung mit gefülltem Speicher.
- Desktop (Windows/macOS/Erster Test) ist unverändert; geprüft mit Android, iOS
  und Experiment bei 1280 px.
