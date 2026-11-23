# 2026-10-16-android-xool-composer

## Problem
Das Eingabe-Blatt in „Android (Xool-DB)“ sollte aussehen und arbeiten wie in der Xool-App (Vorbild Google Tasks): „Eingang ▾“ über dem Feld, Details, Datum und Markierungen direkt beim Anlegen. Gilt nur für diese Fassung.

## Änderung
- **`src/features/composer/composer-extras.js` (neu):** Werkzeugzeile Details · Uhr · Favorit · Anpinnen, Details-Feld und Datums-Chip mit ✕; beim Speichern gehen Details, Datum/Uhrzeit, Favorit und Anpinnen an den neuen Eintrag. Die Uhr nur bei Aufgabe, Termin und Projekt; bei Medium und Arbeitsbereich keines der vier Werkzeuge. Aus einer angetippten Kalenderstunde steht das Datum gleich im Chip.
- **`src/features/composer/composer-place.js` (neu):** die Ablageort-Pille „Eingang ▾“ und das Blatt „Ablegen in“, unverändert aus `composer.js` herausgezogen, damit diese unter 400 Zeilen bleibt (jetzt 315).
- **`src/features/composer/composer.js`:** ruft die neuen Teile auf (zeichnen, leeren, übernehmen).
- **`src/ui/date-field.js`:** neue Funktion `openWhenPicker` — Datum und Uhrzeit für einen Entwurf, der noch kein Eintrag ist.
- **`styles/android-xool-composer.css` (neu):** Aussehen, nur mit `data-mobile-variant="xool"` unter 1024px.
- **`assets/icons/sprite-2.svg`:** Icon `align-left` (Lucide) für Details.
- **`index.html`** (gemeinsame Datei) lädt das neue Stylesheet; **`docs/styles-dateien.md`** nennt es.

## Begründung
Die Teile entstehen in jeder Fassung, sind aber nur in Xool sichtbar und werden nur dort übernommen — die anderen Fassungen bleiben unberührt. „Eingang ▾“ erscheint erst, wenn etwas getippt ist oder der Ort feststeht, damit das leere Blatt ruhig bleibt. Ein Tipp auf ein Werkzeug lässt die Tastatur offen (außer bei der Uhr).

## Visualisierung
Vorher:
```
┌──────────────────────────┐
│ Titel…           [✓ ▾]   │
│ (+)  [Eingang]  Speichern│
└──────────────────────────┘
```

Nachher:
```
┌──────────────────────────┐
│ ⤓ Eingang ▾              │
│ Titel…           [✓ ▾]   │
│ Details hinzufügen       │
│ [📅 Fr., 17. Okt. ✕]     │
│ (+) ≡ 🕓 ☆ 📌   Speichern│
└──────────────────────────┘
```

## Hinweise
- Im Browser bei 375px hell und dunkel geprüft: Aufgabe mit Details, Favorit und Anpinnen gespeichert, alles übernommen, Konsole leer.
- Nicht angeklickt: die Uhr (System-Auswahl für Datum und Uhrzeit). Am Gerät einmal Datum setzen und mit ✕ entfernen.
- Am Gerät prüfen, dass die Tastatur beim Tipp auf ein Werkzeug offen bleibt.
