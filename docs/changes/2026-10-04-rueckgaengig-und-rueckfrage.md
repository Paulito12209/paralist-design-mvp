# 2026-10-04-rueckgaengig-und-rueckfrage

## Problem
Die App hatte keinen Bestätigungs-Baustein. Deshalb haben frühere Sitzungen
bewusst auf eine Rückfrage verzichtet:
- „Alle … löschen“ je Sammlung (Eingang, Favoriten, Ressourcen, Projekte,
  Archiv, Arbeitsbereiche, Lesezeichen) löschte sofort und endgültig
  (siehe `2026-10-04-sammlungen-kopf-beschreibung.md`).
- Abbrechen, der Pfeil oben und die Zurück-Geste im Sprachmemo-Overlay
  verwarfen eine Aufnahme ohne Rückfrage (siehe `2026-10-04-medien-leiste-audio.md`).

## Änderung
Neue Bausteine:
- `src/data/undo.js`: `runUndoable(change)` merkt vor dem Löschen Einträge,
  Arbeitsbereiche und Projekt-Ansichten. `undo()` schreibt sie zurück, was in
  der Zwischenzeit neu angelegt wurde, bleibt erhalten. `settle()` bestätigt
  die Löschung.
- `src/ui/undo-toast.js`: `deleteWithUndo(change, { title, icon })` löscht
  sofort und zeigt 5 s lang (`UNDO_MS`) die Meldung „… gelöscht · Rückgängig“
  (Snackbar nach Material 3, vorhandener Toast). Eine neue Löschung bestätigt
  die vorige.
- `src/ui/confirm-sheet.js`: `openConfirmSheet(...)` ist eine kurze Rückfrage
  im Auswahl-Blatt mit den Knöpfen „Behalten | Verwerfen“ nebeneinander.
- `src/features/media/recorder-discard.js`: fragt „Aufnahme verwerfen?“ erst
  ab 3 s Länge (`askFromMs`). Gilt für „Abbrechen“, den Pfeil oben und die
  Zurück-Geste bzw. Browser-Zurück (über `addPopGuard`; der Verlaufsschritt
  wird wieder vorgelegt). Speichern fragt nicht.

Angepasst:
- `src/data/mutations.js`: `holdPrune()`/`releasePrune()`. Solange
  „Rückgängig“ möglich ist, räumt `commit()` die Dateien und Vorschaubilder
  gelöschter Einträge nicht auf.
- `src/ui/toast.js`: neue Option `ms` für die Anzeigedauer.
- `src/features/overview/page.js`: die roten Menüpunkte laufen über
  `deleteWithUndo`.
- `src/data/collection-delete.js`: neue Texte der Meldung (`deletedLabels`).
- `src/features/media/recorder.js`: `lengthMs()`, `cancel` → `cancelRecorder`,
  Speichern über `leaveRecorder()`, Wächter beim ersten Öffnen anmelden.

Gemeinsam genutzte Dateien: `src/ui/toast.js` (abwärtskompatibel) und
`commit()` in `src/data/mutations.js`.

## Begründung
- Beim Löschen ist „Rückgängig“ am Handy schneller als ein Dialog vorher. Für
  eine Aufnahme gibt es kein sinnvolles Rückgängig, deshalb dort eine
  Rückfrage. Abgestimmt in der Sitzung.
- Toast und Blatt gab es schon, mit Stilen für alle Fassungen (iOS, Android,
  Experiment, Desktop). Deshalb keine neue CSS-Datei und keine zweite Snackbar.
- Ohne Aufschub beim Aufräumen hätte „Rückgängig“ Medien ohne Datei
  zurückgebracht.
- Die Rückfrage-Logik steht in einer eigenen Datei, damit der Konflikt mit
  PR #143 (Umbau von `recorder.js`) klein bleibt.
- Verworfen: Rückfrage-Blatt auch beim Löschen (langsamer) und Rückgängig für
  die verworfene Aufnahme (Mikrofon schon frei, Zustand schwer wiederherstellbar).

## Visualisierung
Vorher:
```
┌─────────────────────────┐
│ ⋮ → Alle Ressourcen     │
│     löschen             │
│ → sofort weg, endgültig │
│                         │
│ Sprachmemo: Abbrechen   │
│ → Aufnahme weg          │
└─────────────────────────┘
```

Nachher:
```
┌─────────────────────────┐   ┌─────────────────────────┐
│   Noch keine Ressourcen │   │ ←  Sprachmemo …      ⚙  │
│┌───────────────────────┐│   │        0:11  (läuft)    │
││🗑 Alle Ressourcen      ││   │┌───────────────────────┐│
││  gelöscht  Rückgängig↶││   ││ Aufnahme verwerfen?   ││
│└───────────────────────┘│   ││ Die Aufnahme (0:11)   ││
│ [▦]  [📅]  [☑]  [▣]    │   ││ und ihre Mitschrift … ││
└─────────────────────────┘   ││ [✓ Behalten][🗑 Verw.]││
                              └┴───────────────────────┴┘
```

## Hinweise
- Wer innerhalb der 5 s einen übrig gebliebenen Eintrag ändert und dann
  „Rückgängig“ tippt, verliert diese Änderung.
- Wird die Seite innerhalb der 5 s neu geladen, bleibt die Löschung bestehen.
  Die Datei eines Mediums bleibt dann als Ballast liegen, bis das nächste
  Löschen aufräumt.
- PR #143 baut `recorder.js` um. Beim Zusammenführen `cancel: cancelRecorder`,
  `leaveRecorder()` beim Speichern sowie `initDiscardGuard`/`armDiscardGuard`
  übernehmen.
- Am Gerät prüfen: echtes Mikrofon und die Zurück-Geste von Android.
- Den Versionsstempel `src/data/version.js` setzt der Git Commit Manager.
