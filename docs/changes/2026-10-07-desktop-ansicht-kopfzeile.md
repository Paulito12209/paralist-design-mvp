# 2026-10-07-desktop-ansicht-kopfzeile

## Problem
Am Desktop (ab 1024 px) klebte die Karte „Ansicht“ unten auf der Seite — eine
Handy-Form, die die Android-Fassung so nicht hat. Sie kam auf Aufgaben, der
Seite Projekte, Eingang und den übrigen Sammlungen sowie im Kalender
(Tagesansicht) vor; bei Aufgaben stand sie ab 1280 px zusätzlich als Karte in
der rechten Spalte. Gewünscht: die Desktop-Fassung zeigt nur Funktionen, die
auch Android hat; statt der Karte unten öffnet ein Icon „Ansicht umstellen“
oben rechts in der Kopfzeile dieselben Einstellungen.

## Änderung
- **Icon „Ansicht umstellen“** (Regler-Symbol) links neben dem Knopf fürs
  Seitenfenster (`src/shell/desk-head.js`, `styles/desk-head.css`). Nur auf
  Seiten mit Karte (Aufgaben, Seite Projekte, Sammlungen, Kalender „Tag“),
  nicht in Kalender-Woche/-Monat und nicht im Auswahlmodus. Hinterlegt,
  solange die Karte offen ist; blass und nicht klickbar, solange das
  Eingabefeld offen ist.
- **Dieselbe Karte als Aufklapp-Fenster** unter dem Icon, rechtsbündig mit
  der Kopfzeile (bei offenem Seitenfenster vor dem Fenster). Zeilen, Klicks
  und Blätter bleiben dieselben. Zu über das Icon, Klick daneben, Rollen der
  Seite oder Escape (ein Blatt darüber schließt Escape zuerst). Am Desktop
  wird nicht gezogen, der Kopf schaltet nicht um (`src/ui/view-panel.js`:
  `closeViewPanel()`, `data-view-panel-toggle`; `src/shell/desk-keys.js`).
- **Platz unten freigegeben** bei Aufgaben (`styles/tasks-desk.css`),
  Projekten/Sammlungen (`styles/view-end.css`) und Kalender
  (`styles/desk-views.css`).
- **Karte „Ansicht“ der rechten Spalte bei Aufgaben entfernt**
  (`src/features/tasks/tasks-rail.js`); Details, Stand, Dringlichkeit und
  Demnächst fällig bleiben.
- Desktop-Lage der Karte aus `styles/tasks-settings.css` nach
  `styles/desk-head.css` verschoben. Kommentare angepasst in
  `styles/desk-side.css`, `styles/desk.css`, `src/shell/desk-rail.js`;
  `docs/desktop-flows.md` ergänzt.

## Begründung
Dasselbe Element wird nur anders platziert, statt eine zweite Karte zu bauen —
so bleiben Zeilen, Klicks und Blätter an einer Stelle, und das Handy bleibt
unberührt. Die Karte in der rechten Spalte wäre eine Kopie dessen, was das
Icon öffnet. Das Regler-Symbol nutzt Android schon auf der Projekte-Zeile als
Auslöser derselben Karte. Keine neue CSS-Datei, damit `index.html` unberührt
bleibt; `calendar.css` (schon über 360 Zeilen) wurde nicht ergänzt.
**Geltungsbereich:** nur Desktop ab 1024 px, alle Fassungen; am Handy ändert
sich nichts (375 px iOS und Android pixelgleich mit `main`).
Verworfen: die Karte in der rechten Spalte behalten (doppelt); ein Klick
daneben, der nur schließt (am Handy tut der Tipp danach, was er immer tut).

## Visualisierung
Vorher:
```
Paralist ◔1      [▯] │ ‹ ›                                          [▯]
 ▦ 📅 ☑ 🖼 🔍         │ Aufgaben
[+ Neu          N]   │ (Alle) Board +                    [≡|▥] ✓+
Liste ˅ Projekte     │ ○ Gliederung mit Betreuerin …    05.10.  Jetzt
  …                  │ ○ Literaturliste ergänzen                Später
                     │ …
⚙ ? ☾            ⟳  │ ┌ Ansicht ──────────────────────────────── ▤ ┐
```

Nachher:
```
Paralist ◔1      [▯] │ ‹ ›                                      ⚙︎  [▯]
 ▦ 📅 ☑ 🖼 🔍         │ Aufgaben                     ┌ Ansicht ────────────┐
[+ Neu          N]   │ (Alle) Board +               │ Layout        [≡|▥] │
Liste ˅ Projekte     │ ○ Gliederung mit Betreu…     │ Sortieren   Erstellt│
  …                  │ ○ Literaturliste ergänzen    │ Filtern  Nicht mögl.│
                     │ …                            │ Gruppieren      (×) │
⚙ ? ☾            ⟳  │ (unten keine Karte)          └ Erledigte zeigen (✓)┘
```
(⚙︎ = Icon „Ansicht umstellen“, hinterlegt solange offen)

## Hinweise
- Klick daneben auf eine Zeile schließt die Karte und öffnet die Zeile
  trotzdem (wie am Handy).
- Das offene Fenster liegt über der rechten oberen Ecke der Seite
  (Kalender-Werkzeuge, oberste Karten der rechten Spalte).
- Wird das Fenster bei offener Karte unter 1024 px gezogen, steht am Handy die
  aufgeklappte Karte.
- Geprüft im Browser (Chromium, 1024/1100/1440 px, hell und dunkel, Konsole
  leer): Icon auf/zu, Klick daneben, Escape, Sortieren-Blatt, Seitenwechsel,
  Browser-Zurück, Seitenfenster.
