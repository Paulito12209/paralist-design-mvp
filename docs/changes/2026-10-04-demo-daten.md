# 2026-10-04-demo-daten

## Problem
CLAUDE.md und der Skill verlangen Tests mit „leerem und vollem Speicher“, es
gab aber keinen schnellen Weg zu einem vollen Speicher. Dadurch ließen sich
u. a. das Seitenende-Verhalten der Leisten (#133), lange Eintragstitel (#140),
Board-Spalten (#136) und Suchtreffer nicht prüfen.

## Änderung
- Neu `src/data/demo-data.js`: baut einen kompletten Speicherstand mit
  38 Einträgen und 6 Arbeitsbereichen in 2 Tabs — alle Typen (Notiz, Aufgabe
  mit/ohne/überfälliger Fälligkeit, Termin, Dokument, Zeichnung, Lesezeichen
  als Link/Video/Ort, Medien ohne echte Datei), Projekte in jeder Status- und
  Dringlichkeits-Spalte, Archiviertes, Favoriten, Verknüpfungen, Verlauf, drei
  sehr lange Titel und ein Titel aus einem einzigen langen Wort. Je eine
  Ansicht „Board“ bei Aufgaben und Projekten. Nachgeladen über
  `src/core/lazy.js`.
- Neu `src/shell/demo-load.js`: `?demo=1` fragt nach (mit deutlicher Warnung
  und Anzahl der vorhandenen Daten), sichert den alten Stand und lädt neu;
  `?demo=0` holt die Sicherung zurück.
- `src/main.js`: Loader `demo` in `lazyModules`, `takeDemoRequest()` vor
  `loadEverything()`.
- `src/core/storage.js`: Schlüssel `demoBackup` (`paralist-mvp-vor-demo`).
- `CLAUDE.md` Abschnitt 5 und Skill Abschnitt 7: Satz zum vollen Speicher,
  im Skill zusätzlich der Umweg für das Browser-Pane.
- `src/data/version.js` bewusst nicht angefasst (setzt der Git Commit Manager).

## Begründung
Die Demo-Daten werden roh in den Speicher geschrieben und die Seite lädt neu:
so läuft die normale Migration darüber (Status-Vorgaben, Cover/Icon,
XP-Sammelposten, Rückseite der Verknüpfungen), die Demo bleibt klein und
wächst mit späteren Datenänderungen mit. Gesichert wird nur, wenn noch keine
Sicherung existiert — sonst würde ein zweites `?demo=1` die echten Daten durch
die Demo ersetzen. Ein Eintrag unter Einstellungen › Mehr wurde verworfen:
mehr berührte Dateien, und die Adresse reicht auch am Gerät.

## Visualisierung
Vorher:
```
Eingang 0   Arbeitsbereiche 0
Projekte: —      Aufgaben: leer      Medien: leer
```

Nachher (`?demo=1`, nach Rückfrage):
```
┌──────────────────────────────────────────────┐
│ Demo-Daten laden?                            │
│ ACHTUNG: Die vorhandenen Daten (…) werden    │
│ ERSETZT. Sie werden vorher gesichert;        │
│ zurück mit „?demo=0“.     [Abbrechen] [OK]   │
└──────────────────────────────────────────────┘
Eingang 8   Favoriten 6   Arbeitsbereiche 5   Ressourcen 12
Projekte: Alle | Board   [Offen 4] [In Arbeit 2] [Erledigt 1]
Aufgaben: ● Gliederung … 02.10. (überfällig)
          ○ Eine Aufgabe mit sehr langem Titel…
          ○ Donaudampfschifffahrtsgesellschaftskapitä…
Medien:   Okt: Foto Foto Sprachmemo · Sep: Video Lebenslauf.pdf
```

## Hinweise
- Das Browser-Pane unterdrückt `confirm()` (antwortet „Nein“); Claude-Sitzungen
  nehmen dort den Umweg aus dem Skill (Abschnitt 7).
- Ersetzt wird nur der Hauptspeicher `paralist-mvp`; Profil, Nutzungszeit und
  Fotos bleiben.
- Neue Eintragsarten fehlen in der Demo, bis sie nachgetragen werden.
- Aufgefallen: Das lange Wort wird in der Aufgabenliste ohne „…“ abgeschnitten
  — eigene Sitzung.
