# 2026-10-02-fab-menue-startet-unten

## Problem
Auf kleinen Geräten (z. B. iPhone SE) passt das Plus-Menü der Android-Fassung
nicht ganz auf den Bildschirm. Die Liste ist dann scrollbar und startete oben:
der Eintrag am Knopf (Termin, bzw. Aufgabe) war abgeschnitten, sichtbar war
stattdessen der seltene oberste (Medium).

## Änderung
- `src/shell/android-fab.js`: `openFabMenu` setzt die Liste beim Öffnen ans
  Ende (`scrollTop = scrollHeight`). Das gilt bei jedem Öffnen, nichts wird
  gemerkt.
- `styles/android-fab.css`: Kommentar bei `.m3-fab-menu-list` nennt das Verhalten.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Eine scrollbare Liste startet immer oben, das Menü ist aber unten am Knopf
verankert. Termin und Aufgabe sind die häufigsten Arten und stehen darum am
Knopf, wo der Daumen ist; die seltenen erreicht man durch Wischen nach oben.
Verworfen: die Reihenfolge ändern (`create-menu.js` gilt auch für iOS) und
`flex-direction: column-reverse` (würde die Reihenfolge im Dokument umdrehen).

## Visualisierung
Vorher:
```
 ┌ Medium ┐   ← voll
 │ Lesezeichen
 │ …
 │ Aufgabe
 │ Termin ┐   ← abgeschnitten
    (✕)
```

Nachher:
```
 ┌ Medium ┐   ← halb sichtbar, nach oben wischen
 │ Lesezeichen
 │ …
 │ Aufgabe
 │ Termin     ← voll, direkt über dem ✕
    (✕)
```

## Hinweise
- Geprüft: 375×667, Android-Fassung, Menü zweimal hintereinander geöffnet,
  Konsole leer. Nicht geprüft: Dunkelmodus, echtes Handy.
- Auf höheren Geräten, wo alles hineinpasst, ändert sich nichts.
