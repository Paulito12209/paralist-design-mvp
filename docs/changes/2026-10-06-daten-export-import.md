# 2026-10-06-daten-export-import

## Problem
„Daten exportieren“ und „Daten importieren“ unter Einstellungen › Daten
hatten keine Funktion. Gewünscht war ein Konzept für drei Stufen — nur Text,
alles ohne Mediendateien, alles komplett — und ein Import, der denselben Stand
auf einem anderen Gerät herstellt (Laptop → Tablet und zurück). Gilt für alle
Fassungen, Handy und Desktop.

## Änderung
Neue Dateien:
- `src/core/zip.js` — ZIP schreiben und lesen ohne Bibliothek (Deflate über
  CompressionStream, sonst unkomprimiert).
- `src/data/transfer-snapshot.js` — Momentaufnahme aus Zustand, Vorschaubildern
  (inklusive Zeichnungsstrichen) und Einstellungen; Sicherung vor „Ersetzen“
  unter dem neuen Schlüssel `importBackup`.
- `src/data/transfer-markdown.js`, `src/data/transfer-markdown-read.js` —
  Markdown schreiben und zurücklesen. Jeder Eintrag ist `## Titel ^e20`
  (Arbeitsbereiche `^w3`), darunter Angaben (`typ: … · status: … · fällig: …`),
  `ort:` und `verknüpft:` mit Name plus Marke, dann der Inhalt. Fremdes Markdown
  (nur Überschriften) und nackter Text werden ebenfalls zu Notizen.
- `src/data/transfer-export.js` — die drei Dateien: `.md`, `.json`
  (Paralist-Datei) und `.zip` (paralist.json, export.md, zeichnungen/,
  vorschau/, medien/).
- `src/data/transfer-import.js` — Format am Inhalt erkennen; **Hinzufügen**
  (neue Nummern, Orte und Verknüpfungen umgehängt, Zettel und Bilder der
  Zeichnungen, Vorschaubilder, Mediendateien, Tabs über den Namen) und
  **Ersetzen** (Zustand, Vorschaubilder, Einstellungen, Dateien; nur mit JSON
  oder ZIP).
- `src/data/transfer.js` — Sammelpunkt, als Bereich „transfer“ nachgeladen.
- `src/features/profile/data-export.js`, `data-import.js` — die beiden Seiten:
  Blatt je Stufe (Text kopieren, Datei speichern, Teilen, wo der Browser
  Dateien teilen kann), Datei wählen oder Text einfügen, Vorschau mit Zahlen,
  Rückfrage vor „Ersetzen“, Zeile „Import rückgängig“ nach einem Ersetzen,
  Statuszeile auf der Seite.
- `styles/data-transfer.css` — Textfeld, Statuszeile, Erklärungen.

Geänderte Dateien: `src/main.js` (Lazy-Modul `transfer`), `index.html` und
`docs/styles-dateien.md` (neue CSS-Datei), `src/core/storage.js` (Schlüssel
`importBackup`), `src/features/profile/profile-cards.js` und
`settings-cards.js` (die Zeilen bekommen ihre Unterseite),
`src/features/profile/account-delete.js` („Vorher Daten exportieren“ öffnet
die Export-Seite).

## Begründung
- Zeichnungen sind heute PNG (Striche) plus `drawItems` (Text, Formen, Bilder,
  Zettel). Das passt in JSON und ZIP vollständig; Markdown wird dafür bewusst
  nicht erzwungen, der Text-Export nennt am Ende, wie viele fehlen.
- Die Marken `^eID` machen Verknüpfungen und Orte beim Rücklesen eindeutig,
  auch bei gleichen Titeln; ohne Marke gilt der Name. Verworfen: Markdown ganz
  ohne Marken (Dubletten, Verknüpfungen nur über Titel).
- Meldungen unten (toast) liegen hinter dem Einstellungs-Blatt, deshalb eine
  Statuszeile direkt auf der Seite.
- `profile.js` stand bei 395 Zeilen und bleibt unverändert; die Klicks der
  Daten-Seiten hängen in `data-import.js` am Blattkörper. Verworfen: `profile.js`
  nebenbei aufteilen.
- „Ersetzen“ nur mit JSON oder ZIP: eingefügter Text kennt weder Ansichten noch
  Einstellungen. Vor dem Ersetzen wird der alte Stand gesichert (so weit der
  Speicher reicht); „Import rückgängig“ holt ihn zurück.
- Alle drei Formate lassen sich in der späteren Android-App eins zu eins
  weiterverwenden (JSON-Schema, Standard-ZIP, Markdown).

## Visualisierung
Vorher:
```
Daten
  Daten exportieren          >   (tut nichts)
  Daten importieren          >   (tut nichts)
```

Nachher, Export:
```
< Daten exportieren
  Was soll in die Datei?
  [T] Nur Text          64 Einträge  >  → Blatt: Text kopieren · Datei speichern · Teilen
  [□] Paralist-Datei    78 Einträge  >  → Blatt: Datei speichern · Teilen
  [▤] Vollständig  78 Einträge, 12 Medien >  → ZIP
  Statuszeile: „Datei gespeichert: paralist-2026-10-06.zip (3,2 MB).“
```

Nachher, Import:
```
< Daten importieren
  [↓] Datei wählen      ZIP, JSON, MD >
  Oder Text einfügen
  ┌ ## Einkaufsliste … ┐
  [ Text prüfen ]
  [↶] Import rückgängig   06.10., 12:40 >   (nur nach einem Ersetzen)
  → Blatt „Import prüfen“: Einträge 2 · Arbeitsbereiche 0 · [Hinzufügen] [Ersetzen]
```

## Hinweise
- Die Mediendateien laufen beim ZIP komplett durch den Arbeitsspeicher; bei
  mehreren hundert MB Video kann ein Handy-Browser aussteigen.
- „Teilen“ erscheint nur, wo der Browser Dateien teilen kann (Android Chrome);
  am Mac gibt es den Download.
- Reicht der Speicher für die Sicherung nicht, läuft „Ersetzen“ trotzdem, nur
  ohne Rückgängig.
- Geprüft bei 375 px hell und dunkel sowie am Desktop (Konto-Punkt), Konsole
  leer: Markdown-Roundtrip mit allen Verknüpfungen, ZIP mit echter Bilddatei
  hinzufügen, Ersetzen mit Sicherung und Rückgängig, fremdes Markdown,
  Browser-Zurück. Am Gerät testen: Export, Datei schicken, auf dem anderen
  Gerät „Ersetzen“, dann eine Zeichnung öffnen und ein Video abspielen.
