# 2026-11-28-og-einstellungen

## Problem
Das Einstellungs-Blatt der „OG Version“ sah noch wie die alte iOS-Liste aus. Es soll wie Organi7er-ios aussehen (Referenz 08/09).

## Änderung
- `src/features/profile/og-settings.js` (neu): Liste der OG Version – Profilkarte mit „Mehr Infos“, Gruppen „Individualisierung“, Konto/Profil, Daten, „Weiteres“; Menü „Erscheinungsbild“, Blatt „Dashboard anpassen“.
- `src/features/profile/update-check.js` (neu): „Nach Updates suchen“, aus `profile.js` ausgelagert (395 Zeilen).
- `src/features/profile/profile.js`, `profile-cards.js` (`rowsOf`), `profile-name-edit.js` („Name hinzufügen“ nur mit `data-unset-text`).
- `styles/og-settings-sheet.css` (neu): Kopf mit Griff, Titel, rundem ✕, weicher Unterkante; Profilkarte; Zeilen 60 px.
- `styles/tokens-og-settings.css`: neue Werte `--og-sheet-*` (bestehende unverändert); `styles/og-settings.css`: Blatt nutzt sie.
- Gemeinsame Dateien: `index.html` (ein `<link>`), `docs/styles-dateien.md`, `assets/icons/sprite-2.svg` (contrast, chevron-updown, person-fill).

## Begründung
Alles hängt an `data-mobile-os="ios"` und `data-mobile-variant="og"`; die Fassung „iOS“ ist unverändert. Gilt nur für die OG Version. Ohne Gegenstück im Web und daher weggelassen: Sprache, Form der Kacheln, Farbe der Checkboxen und des Aufklapp-Dreiecks, Trigger-Wörter, Papierkorb, Logbuch. Versionen, Navigation, Suche, Design, Tabs, Konto, Daten, Feedback sind im selben Stil einsortiert.

## Visualisierung
Vorher:
```
 Dein Name (DN)   Pro · Dabei seit …
 Darstellung: System / Hell / Dunkel
```
Nachher:
```
      ▬ Einstellungen  (✕)
 ╭ (👤✎) Name hinzufügen ╮
 │ Mehr Infos          ˅ │
 Individualisierung
 ╭ ◐ Erscheinungsbild  Dunkel ⇕ ╮
 │ ▦ Dashboard anpassen       › │
```

## Hinweise
- Geprüft bei 375 px hell und dunkel, Konsole leer, Zurück-Pfeil und Browser-Zurück, Versionen erreichbar.
- Am Gerät testen: Name bearbeiten, Profilbild, Erscheinungsbild, Dashboard-Blatt.
- Wert bei „Versionen“ wird bei langen Fassungsnamen abgeschnitten.
