# 2026-10-02-einstellungen-scroll-zurueck

## Problem
In den Einstellungen sprang die Liste nach oben, wenn man aus einer
Unterseite (z. B. „Kontoeinstellungen“) zurückging — per Wischgeste, Pfeil
oder Browser-Zurück. Wer vorher ein Stück gescrollt hatte, musste sich die
Stelle neu suchen.

## Änderung
Nur `src/features/profile/profile.js`:
- Neuer Merker `listScroll`: beim Öffnen einer Unterseite (`openDetail`) wird
  die Scrollhöhe der Liste gemerkt.
- `open()` (der Weg, den Wischgeste und Browser-Zurück nehmen) stellt die Höhe
  wieder her, wenn von einer Unterseite auf dieselbe Liste zurückgekehrt wird
  (Blatt war offen, gleicher Menüpunkt). Frisch geöffnet beginnt das Blatt weiter oben.
- `closeDetail()` (Pfeil ohne Verlaufseintrag) stellt die Höhe ebenfalls wieder her.
- `hide()` setzt den Merker zurück.
- `src/data/version.js`: neuer Versionsstempel (`tools/version.py`).

## Begründung
Wischgeste und Browser-Zurück laufen über den Verlauf in `open()`; der Merker
sitzt dort, wo jeder Rückweg ankommt, nicht nur beim Pfeil. Verworfen: die
Liste hinter der Unterseite stehen zu lassen — das würde den Aufbau des
Blatts umkrempeln.

## Visualisierung
Vorher:
```
Liste (gescrollt, „Konto“ sichtbar) -> Kontoeinstellungen -> zurück
Liste ganz oben („App“)
```

Nachher:
```
Liste (gescrollt, „Konto“ sichtbar) -> Kontoeinstellungen -> zurück
Liste wie vorher („Konto“ sichtbar)
```

## Hinweise
- Getestet mit 375 px, iPhone- und Android-Kennung: Browser-Zurück und Pfeil
  stellen 300 px wieder her; Konsole leer.
- Desktop-Untermenü nicht getestet; dort wird nur bei gleichem Menüpunkt
  zurückgescrollt.
- `profile.js` hat jetzt 390 von 400 Zeilen — beim nächsten Zuwachs teilen.
