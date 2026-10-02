# 2026-10-02-werkzeugzeile-einrasten

## Problem
Beim Hochscrollen rasteten in der Android-Fassung nur die Reiter („Alle | Test |
Neue Ansicht“) oben ein. Die Werkzeugzeile darunter (Archiv, Sortieren, Filtern,
Ansicht) rutschte weg und war nicht mehr erreichbar. Außerdem ließ sich die Seite
auch bei zwei Einträgen scrollen, weil eine Mindesthöhe absichtlich Scrollweg
zum Einrasten erzwang.

## Änderung
Nur `styles/android-tabs.css` (CSS):

- Die Werkzeugzeile `.project-card-head` rastet per `position: sticky` direkt
  unter der Reiterzeile ein (Abstand der Reiter plus `--m3-tab-height`). Auf
  Unterseiten rastet sie unter Kopfzeile und Reitern ein, ohne Reiter
  (`.is-plain`, z. B. Eingang) direkt unter der Kopfzeile.
- Die erzwungenen Mindesthöhen für Übersicht, Aufgaben, Medien und Unterseiten
  sind entfernt: eine Liste ist nur so lang wie ihr Inhalt, gescrollt wird erst,
  wenn sie länger ist als der Bildschirm.
- Kalender unverändert (Mindestweg und `container-type` bleiben).
- Kopfkommentar angepasst.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Sticky ist reines CSS, ohne Skript und ohne Messen beim Scrollen; die Zeile folgt
der Suchleiste mit derselben Verzögerung wie die Reiter. Verworfen: die Zeile in
die Reiter-Hülle verschieben (Umbau in vier Features, die Zeile wird bei jeder
Aktion neu gezeichnet) und den Scrollweg genau auf „beide Zeilen eingerastet“
begrenzen (bräuchte Skript).

## Visualisierung
Vorher (hochgescrollt):
```
┌──────────────────────────┐
│ Alle  Test  + Neue Ansicht│  ← rastet ein
│──────────────────────────│
│ Test              ⋮      │  ← Archiv/⇅/≡ sind weg
│ Projekt hinzufügen       │
└──────────────────────────┘
(2 Einträge – trotzdem scrollbar)
```

Nachher:
```
┌──────────────────────────┐
│ Alle  Test  + Neue Ansicht│  ← rastet ein
│──────────────────────────│
│ 🗄 Archiv        ⇅  ≡  ⎍ │  ← rastet mit ein
│ Test              ⋮      │  ← Liste läuft darunter durch
│ Projekt hinzufügen       │
└──────────────────────────┘
(wenig Einträge: kein Scrollen; viele: beide Zeilen oben fest)
```

## Hinweise
- Geprüft bei 375 px, hell und dunkel, Konsole leer: Übersicht, Aufgaben, Eingang,
  Ressourcen, je mit wenig und mit 20 zusätzlichen Zeilen.
- Ein kleiner Restweg bleibt (bis etwa 80 px, z. B. Übersicht mit den vier
  Kacheln): das ist vorhandener Inhalt plus das Polster für Suchleiste und
  Navigation, kein erzwungener Weg.
- Nicht geprüft: voller Speicher mit Migration, Zurück-Pfeil und Browser-Zurück,
  Archiv- und Lesezeichen-Seiten, Desktop-Breite, echtes Gerät (Zeilen ziehen,
  Board).
- Keine zentrale Datei außer `src/data/version.js` (Versionsstempel).
