# 2026-10-02-neu-bottom-sheet-eingabe

## Problem
In der Android-Fassung öffnete „Neu“ den alten Eingabe-Container aus der iOS-Fassung:
zwei Pillen oben, sechs runde Typ-Knöpfe, Diktat und ✕. Er sollte wie „Neue
Aufgabe“ in Google Tasks ein Bottom Sheet werden, mit dem Anhang-Plus und
einer kompakten Auswahl statt vieler Knöpfe.

## Änderung
- `styles/android-composer.css` (neu): das Eingabefeld als Material-3-Blatt von
  unten (Ecken `--m3-sheet-radius`, Schleier, ohne Typ-Knöpfe, Diktat und ✕).
  Zeile unten: Anhang-Plus, Typ-Chip (nur Icon und Pfeil), Ort-Chip, rechts
  „Speichern“. Anhänge schweben wie bisher über dem Blatt. In der Spielart
  „Android (Experiment)“ stehen statt „Speichern“ das Mikrofon und ein runder
  Pfeil-Knopf (grau ohne Inhalt, gefärbt mit Text oder Anhang).
- `src/features/composer/composer-sheet.js` (neu): Schleier (Tipp darauf und
  Browser-Zurück schließen das Blatt); beim Öffnen eines Auswahl-Blatts klappt
  die Tastatur ein und kommt beim Schließen zurück (`openOverComposer`).
- `src/features/composer/composer-hint.js` (neu): nach 6 s tippt sich bei einem
  Medium der Hinweis „Mit Text wird es ein Dokument …“ Buchstabe für Buchstabe
  in den Platzhalter und geht wieder auf „Neues Medium“ zurück.
- `src/features/composer/composer-types.js`: Typ-Liste um „Arbeitsbereich“
  ergänzt (schließt das Eingabefeld, legt ihn auf seiner Seite an); kurze
  Platzhalter; Typ-Chip bekommt `aria-label`.
- `src/features/composer/composer.js`: Schleier ein/aus, Arbeitsbereich-Weg,
  Tastatur beim Ort-Chip parken.
- `src/data/config.js` (`sheetPlaceholders`), `styles/composer.css` (Wort
  „Speichern“ sonst ausgeblendet), `styles/tokens-android.css` (vier neue Werte
  `--m3-chip-h`, `--m3-chip-radius`, `--m3-composer-attach`, `--m3-composer-pad`),
  `src/data/platform-versions.js` (Eintrag unter den Unterschieden des Experiments),
  `index.html` (Stylesheet und das Wort „Speichern“ im Anlegen-Knopf).
- `tools/version.py`: schreibt mehrere Dateinamen je Zeile; `src/data/version.js`
  stand sonst genau auf 400 Zeilen und hätte mit jeder neuen Datei `check.py`
  gebrochen.

## Begründung
- Filter-Chip mit Pfeil nach unten ist die Material-3-Lösung für eine Wahl aus
  vielen Möglichkeiten; ein Pfeil nach rechts hieße „neue Seite“, Segmented
  Buttons taugen nur für 2–5 Optionen.
- Der Platzhalter („Neue Aufgabe“) nennt den Typ schon, darum genügt im Chip das Icon.
- Anordnung nur per CSS (`display: contents` + `order`): iOS-Markup und -Verhalten
  bleiben unberührt.
- Verworfen: Dropdown statt Blatt für die Typ-Wahl (9 Einträge zu hoch);
  beide Chips unten (bei 375 px zu eng); Anhänge im Blatt (sah nicht gut aus).

## Visualisierung
Vorher:
```
╭─────────────────────────────────────╮
│ (⑂ Eingang ▾) (✓ Aufgabe ▾)     (↑) │
│ Neue Aufgabe einfügen …             │
│ (+)  ✎ ✓ 📅 🚀 ⬡        (🎤) (✕)   │
╰─────────────────────────────────────╯
```

Nachher:
```
Android:
╭──────────────────────────────────────────╮
│ Neue Aufgabe                             │
│ (+) [✓▾] [⑂ Eingang ▾]        Speichern  │
╰──────────────────────────────────────────╯
Android (Experiment):
│ (+) [✓▾] [⑂ Eingang ▾]         (🎤) (↑)  │
```

## Hinweise
- Am Gerät prüfen: Tastatur klappt beim Öffnen des Typ- und Ort-Blatts sauber
  ein und kommt zurück; Diktat im Experiment; der getippte Hinweis.
- Bei 375 px wird ein langer Ortsname („Ressourcen“) im Experiment gekürzt.
- Entfallen auf Android: Typ-Knopf-Abwählen (→ Dokument) und Diktat in der
  normalen Fassung; Dokument bleibt über den Chip wählbar.
- Gemeinsam genutzte Dateien: `index.html`, `src/data/version.js`,
  `src/data/platform-versions.js`, `styles/tokens-android.css`, `tools/version.py`.
- iOS und Desktop sind nicht berührt.
