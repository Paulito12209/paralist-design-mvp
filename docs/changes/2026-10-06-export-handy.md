# 2026-10-06-export-handy

## Problem
„Daten exportieren“ war am Handy unzuverlässig: Beim ZIP wurde jede
Mediendatei komplett in den Arbeitsspeicher kopiert, komprimiert und ohne
Pause geprüft — der Browser fror ein. „Teilen …“ schlug nach längerem Packen
still fehl, weil der Browser `navigator.share` nur innerhalb einer Fingergeste
erlaubt. Android Chrome teilt außerdem keine .zip-, .json- oder .md-Dateien,
der Knopf erschien trotzdem. Das Blatt schloss sofort, Rückmeldung gab es nur
als kleine graue Zeile; der Wert „78 Einträge, 12 Me…“ in der Zeile war
abgeschnitten. Gilt für alle Fassungen.

## Änderung
- `src/core/zip.js`: Blobs bleiben Blobs — Prüfsumme stückweise (CHUNK_SIZE
  4 MB) mit Pausen fürs Zeichnen, keine Kopie, kein Deflate für Fotos, Videos,
  Audio und Dateien über DEFLATE_MAX (8 MB). Neu `onProgress` und `signal`
  (AbortError beim Abbrechen).
- `src/data/transfer-export.js`: `zipExport({ onProgress, signal })`,
  Momentaufnahme nur einmal gelesen, Medien mit `store: true`.
- `src/ui/sheet.js` (gemeinsam genutzt): neue Option `progress` (Satz und
  linearer Material-3-Balken, bestimmt oder unbestimmt) und
  `setSheetProgress(label, fraction)`.
- `styles/sheet-progress.css` (neu), `index.html`, `docs/styles-dateien.md`:
  Stil des Balkens, hell und dunkel, Android-Fassung mit `--m3-primary`.
- `src/features/profile/data-export.js`: neuer Ablauf. Tipp auf „Datei
  speichern“ oder „Teilen …“ → das Blatt bleibt offen und zeigt Fortschritt
  und „Abbrechen“. Gilt die Fingergeste noch (`navigator.userActivation`,
  sonst QUICK_MS), wird sofort gespeichert bzw. geteilt; sonst zeigt das Blatt
  „Fertig: Dateiname · Größe“ mit „Datei speichern“ und „Teilen …“ für den
  zweiten Tipp. Teilen wird je Dateityp mit `canShare` geprüft; Text und
  Paralist-Datei gehen ersatzweise als .txt (der Import erkennt das Format am
  Inhalt), beim ZIP steht ein Hinweis statt des Knopfs. Im Blatt eine Zeile
  „Umfang“ (Einträge, Medien, Größe); die Zeilenwerte sind kurz. Der Bereich
  „transfer“ lädt schon beim Öffnen des Blatts.

## Begründung
- Fortschritt im Blatt statt auf der Seite: Material 3 empfiehlt für
  blockierende Vorgänge einen sichtbaren Indikator im modalen Kontext; die
  Statuszeile nimmt man am Handy nicht wahr.
- Zweiter Tipp nur, wenn nötig: kleine Exporte bleiben ein Tipp, große
  bekommen einen klaren Fertig-Zustand statt eines stillen Fehlers.
- Mediendateien unkomprimiert: sie sind es schon, Deflate kostete nur Zeit
  und doppelten Speicher. Das fertige ZIP ist ein Blob aus Blobs, den der
  Browser selbst hält.
- Die Ebenen waren in Ordnung (Einstellungs-Blatt 44, Auswahl-Blatt 50,
  Info-Dialog 60); die „Hänger“ kamen vom blockierten Thread und dem
  sofort geschlossenen Blatt ohne Rückmeldung.
- Verworfen: Fortschritt nur in der Statuszeile; Teilen über
  `navigator.share({ text })` für Markdown (unhandlich bei vielen Einträgen).

## Visualisierung
Vorher:
```
Vollständig   78 Einträge, 12 Me… >
  Blatt: [Datei speichern] [Teilen …]   ← schließt sofort
  Seite: „Wird gepackt …“ (klein, grau) … Browser friert ein
  Teilen → Fehler nach dem Packen oder „Permission denied“ (ZIP)
```

Nachher:
```
Vollständig   12 Medien · 332 B >
┌──────────────────────────────┐
│ ▤ Vollständig                │
│ Die Paralist-Datei samt …    │
│ Umfang                       │
│ 78 Einträge, 12 Medien, …    │
│ ⤓ Datei speichern            │
│ ⇪ Teilen …  (nur wenn möglich, sonst Hinweis) │
└──────────────────────────────┘
   ↓ Tipp
│ Wird gepackt … 5 von 14 Dateien │
│ ━━━━━━━━━━━━━━━━──────────      │
│ ✕ Abbrechen                     │
   ↓ fertig, Geste abgelaufen
│ Fertig                          │
│ paralist-2026-10-06.zip · 312 MB│
│ ⤓ Datei speichern               │
│ ⇪ Teilen …                      │
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Android-Fassung: Blatt, Fortschritt,
  Fertig-Zustand, Download mit Statuszeile, Browser-Zurück schließt das Blatt,
  Konsole leer. ZIP-Schreiber mit Node getestet: `zipfile.testzip()` und
  `unzip -t` ohne Fehler, Medien unkomprimiert, Abbruch wirft AbortError.
- Teilen ist am Mac nicht testbar (kein `navigator.share`). Am Android-Gerät
  prüfen: „Nur Text“ und „Paralist-Datei“ als .txt teilbar, beim ZIP der
  Hinweis statt des Knopfs; nach einem langen ZIP erscheint das Fertig-Blatt.
- iOS Safari: `a.download` für große ZIPs verhält sich eigen.
- Sehr große Videos (mehrere GB) können trotz Blob-aus-Blobs an Grenzen stoßen.
