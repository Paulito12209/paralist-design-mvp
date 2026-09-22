# paralist-design-mvp

Web-Entwurf der iOS-App „Paralist“. Gebaut werden soll daraus später eine
**native Android-App** — das Web ist nur die schnelle Probe.

## Vor jeder Änderung

Die verbindlichen Regeln stehen in `.claude/skills/paralist-clean-code/SKILL.md`.
**Diese Datei vor der ersten Änderung lesen** und die Regeln einhalten.

Die harten Punkte in einem Satz:

1. **Maximal 400 Zeilen je Datei** — wird eine Datei größer, vorher teilen.
2. **Struktur einhalten:** `src/core → src/data → src/ui → src/features|src/shell`,
   Stile je Bereich unter `styles/`, alle Werte in `styles/tokens.css`.
3. **Kommentar-Header in jeder Datei** mit Pfad und allen anpassbaren Werten,
   auf Deutsch, in Alltagssprache.
4. **Performance:** große Bereiche über `src/core/lazy.js` nachladen, nur die
   sichtbare Ansicht neu zeichnen, Tippen über `scheduleSave()` speichern.
5. **Keine Bugs:** erst `python3 tools/version.py` (neuer Versionsstempel, damit
   offene Apps das Update-Fenster zeigen), dann muss `python3 tools/check.py`
   „alles in Ordnung“ melden,
   dann im Browser auf `http://localhost:4173` öffnen, Konsole muss leer sein,
   betroffene Flows anklicken — leerer und voller Speicher, hell und dunkel,
   375 px Breite, Zurück-Pfeil und Browser-Zurück.
6. **Nach jeder abgeschlossenen Änderung committen**, dabei nur die eigenen
   Blöcke stagen (an diesem Projekt arbeiten mitunter mehrere Sitzungen
   gleichzeitig).

## Entwicklungsserver

`python3 -m http.server 4173` im Projektordner (Konfiguration in
`.claude/launch.json`). Läuft der Port schon, einfach zu
`http://localhost:4173` navigieren und **nicht** die Konfiguration ändern.

Kein Build-Schritt, keine Abhängigkeiten: die App lädt als ES-Module direkt im
Browser.
