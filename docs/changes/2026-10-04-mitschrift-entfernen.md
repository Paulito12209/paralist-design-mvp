# 2026-10-04-mitschrift-entfernen

## Problem
Die Mitschrift in der Audio-Aufnahme (Spracherkennung neben der Aufnahme)
ließ sich auf Android nicht sauber umsetzen — Android gibt das Mikrofon nur an
eine App auf einmal. Zwei Versuche scheiterten. Gewünscht: das Feature
komplett entfernen und nur noch Sprachmemos erstellen, das Overlay-Design aber
behalten (Zeit und Welle mittig, Zahl größer). Außerdem klebte „Abbrechen“ am
Gehäuse, und das Hilfe-Blatt versprach mit „Erneut anfragen“ eine
Weiterleitung, die nicht funktionierte.

## Änderung
- Gelöscht: `src/features/media/recorder-speech.js` (Spracherkennung),
  `src/features/media/recorder-text.js` (Kopieren und Umwandeln der Mitschrift).
- `recorder.js`, `recorder-state.js`, `recorder-session.js`, `recorder-save.js`,
  `recorder-view.js`: Modus-Wahl („Aufnahme + Mitschrift“ / „Nur Mitschrift“),
  Mikrofon-Konflikt-Erkennung, Mitschrift-Bereich und Hinweise entfernt. Es gibt
  nur noch die Aufnahme; gespeichert wird sie unverändert als Audio-Datei
  im Medien-Eintrag im Eingang („Sprachmemo Datum Uhrzeit“).
- `recorder-setup.js`: Blatt heißt „Mikrofon erlauben“ und erklärt nur noch
  (Mikrofon-Status, Schritte je Gerät). Entfernt: Icon im Blatt, „Mikrofon
  nutzen für“ mit den zwei Optionen, „Erneut anfragen“, Zeile „Mitschrift“,
  Hinweise zu Google-Spracherkennung und Diktierfunktion.
- Kopfzeile: Zahnrad wird zum Mikrofon-Symbol (`recorder-view.js`).
- `recorder-discard.js`: Rückfrage-Text ohne „Mitschrift“, kein Art-Wechsel mehr.
- `recorder-mic.js`: `echoCancellation: false` entfernt (stand nur wegen der
  Spracherkennung dort).
- `src/core/storage.js`: Schlüssel `recorderMode` entfernt (zentrale Datei).
- `src/features/media/media-import.js`: nur ein Kommentar angepasst.
- `styles/recorder.css`: Mitschrift-Stile entfernt, Inhalt mittig, Zeit 88 px
  (auf schmalen Geräten 20 % der Breite), „Abbrechen“ mit 12 px Abstand und
  Auslassungspunkten bei Platzmangel.

## Begründung
Alles, was zur Mitschrift gehört, kommt raus, statt es zu verstecken — so
bleibt kein toter Code. Das Dropdown „mit welchem Eintrag verknüpfen“ wurde
erwogen und wieder verworfen. Das Diktat im Eingabefeld (`dictation.js`) und
das Mikrofon der Suche (`search-voice.js`) sind eigene Funktionen und bleiben.
Gilt für alle Fassungen, nicht nur Android. „Abbrechen“ der Suche bleibt
unverändert (dort bewusst ganz lesbar); nur der Rekorder kürzt mit „…“.

## Visualisierung
Vorher:
```
┌──────────────────────────────┐
│ ←  Sprachmemo 04.10…      ⚙  │
│          0:19                │
│       ● Mitschrift läuft     │
│      ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪      │
│ Mitschrift            ⧉  ⇄   │
│ Was du sagst, erscheint hier.│
│ [■] [ ⏸ │Speichern│]Abbrechen │
└──────────────────────────────┘
```

Nachher:
```
┌──────────────────────────────┐
│ ←  Sprachmemo 04.10…      🎙  │
│                              │
│            0:19              │
│        ● Aufnahme läuft      │
│      ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪      │
│                              │
│ [■] [ ⏸ │Speichern│]  Abbre…  │
└──────────────────────────────┘
```

## Hinweise
- Bei 375 px steht „Abbre…“; auf größeren Geräten mehr. Abstand ggf. verringern.
- `src/data/version.js` listet noch die zwei gelöschten Dateien; den Stempel
  setzt der Git Commit Manager.
- Im Browser alter Nutzer bleibt `paralist-recorder-mode` ungenutzt liegen.
- Am Gerät testen: Aufnahme starten, pausieren, stoppen, anhören, speichern;
  Pfeil, Zurück-Geste, Rückfrage ab 3 Sekunden; Blatt „Mikrofon erlauben“ mit
  erlaubtem und gesperrtem Mikrofon.
