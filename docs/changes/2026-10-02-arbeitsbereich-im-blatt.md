# 2026-10-02-arbeitsbereich-im-blatt

## Problem
Wählte man im Bottom Sheet „Neu“ (Typ-Chip) oder im Plus-Menü „Arbeitsbereich“,
schloss sich das Blatt und die App sprang auf die Seite Arbeitsbereiche mit
leerem Namensfeld. Im Blatt selbst ließ sich kein Arbeitsbereich anlegen.
Außerdem zeigte das Blatt dabei den Ort-Chip „Eingang“, obwohl ein
Arbeitsbereich auf derselben Ebene liegt wie der Eingang.

## Änderung
- `src/features/composer/composer-workspace.js` (neu): „Arbeitsbereich“ ist im
  Blatt wählbar wie ein Typ. Speichern (oder Enter) legt ihn mit dem getippten
  Namen im gewählten Tab an, ohne Seitenwechsel; Meldung „Arbeitsbereich
  erstellt · +XP · Zur Seite“. Angehängte Dateien werden Medien mit dem neuen
  Arbeitsbereich als Ablageort.
- `src/features/composer/composer-types.js`: Typ-Chip und Platzhalter zeigen den
  Arbeitsbereich; die Option im Typ-Blatt wählt ihn, statt wegzuspringen.
- `src/features/composer/composer.js`: Anlegen-Weg für den Arbeitsbereich;
  Speichern braucht einen Namen; Anhänge stellen den Typ nicht auf „Medium“ um.
- `src/shell/create-menu.js`: „Arbeitsbereich“ im Plus-Menü (Android und iOS)
  öffnet das Blatt statt der Seite.
- `styles/composer.css`: Ort-Chip ausgeblendet, solange „Arbeitsbereich“ gewählt ist.
- `src/data/mutations.js`: `addWorkspace(name)` nimmt optional einen fertigen
  Namen (dann kein Namensfeld, Punkte wie bisher über `nameWorkspace`).
- `src/data/config.js`: Platzhalter `arbeitsbereich` in `composerPlaceholders`
  und `sheetPlaceholders`.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
- Der Arbeitsbereich bleibt eine eigene Wahl im Blatt und wird nicht in `types`
  aufgenommen: sonst wäre er auch in Kalender, Ressourcen und Abfragen ein Typ.
- Anhänge bleiben möglich: ein Arbeitsbereich ist ein Ablageort, ein Foto ist
  ein Medium-Eintrag und kann dort liegen. Der getippte Text benennt den
  Arbeitsbereich, die Medien heißen wie ihre Datei.
- Verworfen: Anhang-Plus ausblenden (erste Fassung) — Bilder in einem neuen
  Arbeitsbereich sind ein sinnvoller Fall.

## Visualisierung
Vorher:
```
╭──────────────────────────────────────────╮
│ Neue Aufgabe                             │
│ (+) [✓▾] [⑂ Eingang ▾]        Speichern  │
╰──────────────────────────────────────────╯
  Typ-Chip → „Arbeitsbereich“ → Blatt zu → Seite Arbeitsbereiche
```

Nachher:
```
╭──────────────────────────────────────────╮
│ Garten                                   │
│ (+) [≋▾]                      Speichern  │
╰──────────────────────────────────────────╯
  Speichern → bleibt auf der Seite, Meldung:
  ✓ Arbeitsbereich erstellt   +2 XP   Zur Seite ↗
```

## Hinweise
- Geprüft: Android 375 px hell und dunkel, iOS-Plus-Menü, mit Foto-Anhang,
  „Zur Seite“ und Browser-Zurück; Konsole leer. Nicht geprüft: echtes Handy
  (Tastatur nach der Wahl im Typ-Blatt).
- Plus-Menü der iOS-Fassung verhält sich jetzt ebenso (gemeinsame Liste).
- Gemeinsam genutzte Dateien: `src/data/mutations.js`, `src/data/config.js`,
  `src/data/version.js`.
