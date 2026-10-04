# 2026-10-04-erledigte-je-ansicht

## Problem
- Eine abgehakte Aufgabe verschwand sofort aus der Liste (und aus dem Board), weil „Erledigte zeigen“ als Standard aus war. Im Archiv lag sie auch nicht — die Regel „heute erledigt bleibt bis Mitternacht stehen, dann Archiv“ galt nur, wenn man den Schalter von Hand einschaltete.
- „Erledigte zeigen“ hatte keine Erklärung.
- Der Schalter sah nicht nach Material Design aus.

## Änderung
- `src/data/config-tasks.js`: Standard `hideDone: false` (Erledigte zeigen); Kommentar angepasst.
- `src/data/state.js`: Marke `taskDoneShown` im Speicher. Ältere Stände (ohne Marke) hatten „ausblenden“ als Vorgabe und werden einmalig auf „zeigen“ gestellt; danach gilt die eigene Wahl.
- Neu `src/data/task-hide-done.js`: ist „Erledigte zeigen“ in der gewählten Ansicht aus, gilt eine erledigte Aufgabe dort sofort als archiviert (an der Aufgabe wird nichts gespeichert).
- `src/data/queries.js`: `archivedEntries()` enthält diese Aufgaben; Filter und Board-Spalte „Archiviert“ behandeln sie wie archivierte.
- `src/data/archive-active.js`: „Aktive Aufgaben (n)“ zählt sie nicht doppelt.
- `src/data/mutations.js`: „Zurückholen“ öffnet eine nur ausgeblendete Aufgabe wieder.
- `src/features/tasks/tasks-settings.js`: ⓘ hinter „Erledigte zeigen“, öffnet ein Blatt mit drei Absätzen.
- `src/ui/panel-rows.js`: Schalter trägt Haken (an) bzw. Kreuz (aus) im Knopf.
- `styles/android-sheet.css`: Android-Schalter nach Material 3 „Switch with icons“ (Knopf immer 24px).
- Neu `styles/tasks-switch.css`: Schalter-Stile aus `tasks-settings.css` ausgelagert (400-Zeilen-Grenze), am Desktop ab 1024px derselbe Material-Look; `styles/tasks-settings.css`: Abstand des ⓘ (`.tasks-info.is-inline`).
- `styles/tokens-pages.css`: `--tasks-switch-m3-w/-h/-thumb`; `index.html`: `<link>` für `tasks-switch.css`; `docs/styles-dateien.md`: Eintrag.
- Zentrale Dateien berührt: `src/data/state.js`, `src/data/queries.js`, `src/data/mutations.js`, `index.html`, `styles/tokens-pages.css`, `docs/styles-dateien.md`.

## Begründung
- Jede Ansicht hat ihre eigene Regel. Archivieren der Aufgabe selbst wäre global — dann könnte sie nicht in Ansicht A stehen und in Ansicht B schon im Archiv liegen. Deshalb zählt sie nur rechnerisch als archiviert, und zwar nach der gerade gewählten Ansicht.
- Die Marke `taskDoneShown` ist nötig, weil sich ein alter Standardwert nicht von einer bewussten Wahl unterscheiden lässt.
- Info als Blatt (wie bei den Projekten), weil der Text länger als ein Hilfetext unter der Zeile ist.
- **Geltungsbereich:** Standard und Archiv-Regel gelten in allen Fassungen (gemeinsamer Speicher). Der neue Schalter gilt in Android und am Desktop; iOS und Erster Test auf dem Handy behalten den alten Schalter.
- Verworfen: nur Android/Desktop-Standard (künstlich bei gemeinsamem Speicher); Erledigte global archivieren (siehe oben).

## Visualisierung
Vorher:
```
 Archiv (1)  ⇅ ⛛ ⚙
 ○ Offene B                      <- abgehakte Aufgabe A ist weg
 Erledigte zeigen     [ ●━━ ]
```

Nachher:
```
 Archiv (1)  ⇅ ⛛ ⚙
 ○ Offene B
 ✓ ~~Offene A~~                  <- bis Mitternacht, dann Archiv
 Erledigte zeigen ⓘ   [ ━━(✓)]  Gruppieren [(✕)━━ ]

 „Erledigte zeigen“ aus: Archiv (2) -> ✓ Offene A (grünes Icon, nicht durchgestrichen)
```

## Hinweise
- Der Archiv-Zähler richtet sich nach der gerade gewählten Ansicht; ein Ansichtswechsel kann ihn ändern.
- Beim ersten Öffnen nach dem Update zeigen alle gespeicherten Ansichten wieder Erledigtes, auch eine bewusst auf „ausblenden“ gestellte (einmalig).
- Auch Kalender- und Projekte-Einstellungen nutzen den Schalter und ändern sich mit.
- Geprüft im Browser (375px und 1280px, hell und dunkel, Liste und Board, Konsole leer). Nicht geprüft: Desktop-Schalter hell, iOS-Fassung, `?demo=1`, Browser-Zurück. Am Gerät testen: abhaken, Schalter aus/an, Zurückholen aus dem Archiv.
