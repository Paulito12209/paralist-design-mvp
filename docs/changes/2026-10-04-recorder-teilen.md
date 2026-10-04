# 2026-10-04-recorder-teilen

## Problem
`src/features/media/recorder.js` war nach #141, #142, #143, #146 und #149 auf
394 Zeilen gewachsen. CLAUDE.md §5.1 verlangt, Dateien über 360 Zeilen vor der
nächsten Änderung zu teilen (harte Grenze 400, `tools/check.py`).

## Änderung
Die Datei ist nach Zuständigkeit geteilt, ohne Verhalten zu ändern:

- `src/features/media/recorder.js` (394 → 239 Zeilen): hält den Ablauf
  zusammen — Mitschrift anlegen, Fehler, Starten mit Erlaubnis, Modus
  wechseln, Öffnen, Schließen und welcher Knopf was auslöst. Der Kopfkommentar
  nennt alle Teil-Dateien und wo die anpassbaren Werte jetzt stehen.
- `src/features/media/recorder-state.js` (neu, 60 Zeilen): der gemeinsame
  Zustand `rec` (Overlay, Welle, Zustand, Modus, Sitzung, fertige Aufnahme,
  Mitschrift, Abspieler) und `setState`, `canSave`, `canPlay`, `showProblems`.
  Anpassbar: `defaultMode`.
- `src/features/media/recorder-session.js` (neu, 128 Zeilen): die laufende
  Aufnahme — Zeit und Welle, Pause, Weiter, Stoppen, Verwerfen und die
  Erkennung des Mikrofon-Konflikts (`watchStarving`). Anpassbar:
  `levelEveryMs`, `soundLevel`, `starveAfterMs`.
- `src/features/media/recorder-save.js` (neu, 55 Zeilen): vorgeschlagener und
  getippter Name, Speichern als Audio-Datei oder Notiz. Anpassbar: `namePrefix`.
- `src/features/media/recorder-mic.js`, `src/features/media/recorder-view.js`:
  je eine Kopfzeile nachgezogen, die das Speichern allein in `recorder.js`
  verortete.

Der Versionsstempel `src/data/version.js` ist bewusst nicht neu gesetzt; das
übernimmt der Git Commit Manager.

## Begründung
- Gemeinsamer Zustand als Objekt in einer eigenen Datei, wie
  `calendar-state.js` (`cal`) und `composer-state.js`.
- Starten, Fehler und Modus bleiben zusammen in `recorder.js`: sie rufen sich
  gegenseitig auf (`start → fail → setup → setMode → start`). Getrennt gäbe
  das Import-Kreise. So zeigen die Importe nur in eine Richtung:
  `recorder → save → session → state → view`.
- Exportierte Funktionen tragen eindeutige Namen (`stopSession`,
  `pauseSession`, `saveRecording` …), weil es `save()` im Projekt schon mehrfach
  gibt.
- Verworfen: nur den Zustand auslagern (bliebe bei rund 370 Zeilen, also über
  360) oder `start` mit in die Sitzungs-Datei nehmen (Import-Kreis über `fail`
  und `setup`).

## Visualisierung
Vorher:
```
recorder.js (394)
 ├ Zustand + setState/canSave/canPlay/showProblems
 ├ Mitschrift anlegen
 ├ Pegel, Zeit, Mikrofon-Konflikt
 ├ Start / Pause / Weiter / Stoppen
 ├ Speichern, Name
 └ Modus, Öffnen, Schließen, Knöpfe
```

Nachher:
```
recorder.js (239)  Ablauf: Mitschrift, Start, Fehler, Modus, Öffnen/Schließen, Knöpfe
 ├─► recorder-save.js (55)      Name, Speichern
 │     └─► recorder-session.js
 ├─► recorder-session.js (128)  Zeit, Welle, Pause, Weiter, Stoppen, Konflikt
 │     └─► recorder-state.js
 └─► recorder-state.js (60)     rec + setState / showProblems
```
Die Oberfläche ist unverändert.

## Hinweise
- Neue Stellen am Rekorder lesen und schreiben den gemeinsamen Zustand über
  `rec.x`, nicht über eigene Variablen.
- Geprüft im Browser (375 px, hell und dunkel, Attrappen für Spracherkennung
  und Mikrofon): aufnehmen, pausieren, weiter, stoppen, anhören, speichern;
  Mikrofon-Konflikt nach 3 s mit „Nur Mitschrift“, kein Fehlalarm mit
  erkanntem Wort; Modus über ⚙ hin und zurück (Neustart bei 0:00); Speichern
  während der Mitschrift; „Abbrechen“ und Browser-Zurück nach > 3 s fragen
  „Aufnahme verwerfen?“, unter 3 s ohne Frage; leerer Speicher mit gesperrtem
  Mikrofon zeigt den Grund und öffnet das Blatt einmal. Konsole leer.
- Am Gerät testen: echtes Mikrofon und echte Spracherkennung, besonders der
  Mikrofon-Konflikt auf Android.
