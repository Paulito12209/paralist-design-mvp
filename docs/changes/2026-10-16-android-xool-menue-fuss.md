# 2026-10-16-android-xool-menue-fuss

## Problem
Die Seitenleiste von „Android (Xool-DB)“ glich dem Menü der Xool-App noch nicht: Profil links statt mittig, kein Update-Knopf mit blauem Punkt, keine Sprache unten links, das Menü-Zeichen wurde nicht zum ✕. Außerdem war das Plus bei weggeblendeter Leiste in iOS Safari oben abgeschnitten. Gilt nur für diese Fassung.

## Änderung
- **Kopf wie in Xool** (`src/shell/android-xool-drawer.js`, `styles/android-xool-drawer.css`): Marke mittig, Profilbild (104px), Name (26px) und „Dabei seit …“ mittig; rechts das Menü-Zeichen, das sich beim Öffnen zum ✕ dreht und an den vier Enden rote Punkte bekommt.
- **Fußleiste:** links die Sprache („Deutsch ˅“, Blatt „Sprache“ — English und Español stehen als „demnächst“ da, es gibt nur Deutsch), rechts „Nach Updates suchen“, Hell/Dunkel, Einstellungen.
- **Update-Knopf mit blauem Punkt:** `src/shell/update-prompt.js` meldet eine bereitliegende Fassung (`events.updateFound` in `src/core/bus.js`, `hasPendingUpdate()`); der Punkt erscheint am Menü-Zeichen, am Aktualisieren-Knopf und am Menü-Reiter (`styles/android-xool-nav.css`). Ein Tipp sucht nach (der Pfeil dreht sich) und lädt eine neuere Fassung sofort; ohne neue Fassung meldet eine Meldung „Du hast die neueste Version“ bzw. „Kein Netz“.
- **Plus nicht mehr abgeschnitten** (`styles/android-xool-nav.css`): die Leiste rutscht beim Wegscrollen nicht mehr weg; Fläche und übrige Reiter blenden aus, das Plus bleibt als runder Knopf stehen und klickbar. Vorher lag es in einem weggerutschten Teil, den Safari oben beschnitt und die Seite überdeckte.
- `src/data/platform-versions.js`: Zeile „Menü“.

## Begründung
Aufbau nach `menu-drawer/_head.scss` und `MenuDrawer.jsx` der Xool-App (Kopf mittig, Fußleiste mit Sprache links); der Punkt nach `UpdateDot`. Verworfen: das Plus per Gegenbewegung festhalten (die Teile, die die Seite überdeckt, ließen es abschneiden).

## Visualisierung
Vorher:
```
 ┌ PARALIST            ☰ ┐
 │ (DN)                  │
 │ Dein Name             │
 │             ☀  ⚙      │
```

Nachher:
```
 ┌      PARALIST       ✕ ┐   ✕ mit vier roten Punkten
 │        (DN)           │
 │      Dein Name        │
 │ Dabei seit Okt. 2026  │
 │ Deutsch ˅   ⟳•  ☀  ⚙  │   • = blauer Punkt bei neuer Fassung
```

## Hinweise
- Testen: den blauen Punkt, indem ein neuer Versionsstempel auf den Server kommt (tools/version.py); „Nach Updates suchen“ ohne neue Fassung; Plus bei weggeblendeter Leiste in Safari (Tippen öffnet das Anlege-Blatt); Sprache-Blatt.
- Die Sprachwahl hat noch keine Wirkung, die App gibt es nur auf Deutsch.
