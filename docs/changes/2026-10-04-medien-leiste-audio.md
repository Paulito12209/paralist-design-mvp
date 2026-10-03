# 2026-10-04-medien-leiste-audio

## Problem
Die Leiste unten auf der Medien-Seite bestand aus vier runden Knöpfen mit
Schatten (Import, Audio, Video, Foto) neben dem Knopf „Neu“. Sie sollte wie die
Knöpfe der Suche aufgebaut sein: dunkler Bereich darunter, mittig ein Gehäuse,
links und rechts nur Icons. „Importieren“ sollte direkt die Dateiauswahl
öffnen, Audio direkt aufnehmen — mit eigener Oberfläche statt über eine
Rekorder-App oder die Dateiauswahl.

Dazu zwei Fehler:
- Öffnete man über der Medien-Seite die Suche, schienen die vier Knöpfe über
  den Knöpfen der Suche durch.
- Öffnete man aus der Suche einen Treffer (z. B. eine Zeichnung oder Aufgabe),
  führte Zurück wieder in die Suche statt auf die Seite, von der aus gesucht
  wurde.

## Änderung
- **Medien-Leiste** (`index.html`, neu `styles/media-bar.css`, alter Block aus
  `styles/media.css` entfernt): links ein Ordner-Icon (Dateiauswahl), mittig
  ein Gehäuse mit Video und Foto (Foto als helle Fläche wie „Suchen“), rechts
  das Mikrofon. Ordner und Mikrofon ohne Fläche, nichts mit Schatten. In der
  Android-Fassung liegt darunter dieselbe dunkle Leiste wie bei der Suche
  (`--m3-search-band-*`), „Neu“ entfällt auf der Medien-Seite. Abstand zur
  Navigation wie bei „Neu“: `--m3-fab-gap` (16 px, `styles/android.css`).
  Am Desktop bleibt die Glaspille (`styles/desk.css`, `styles/desk-hover.css`).
- **Suche über Medien:** die Leiste ist ausgeblendet, solange die Suche offen ist.
- **Audio-Aufnahme als Overlay** (neu `src/features/media/recorder.js`,
  `recorder-view.js`, `recorder-speech.js`, `styles/recorder.css`): ein Tipp
  aufs Mikrofon nimmt sofort auf. Oben ← und der Name der Aufnahme zum
  Überschreiben, darunter Zeit, roter Punkt, eine Welle nach dem echten Pegel
  und die Live-Mitschrift (Web Speech API). Unten wie bei der Suche:
  ■ Stoppen | Gehäuse mit ❚❚ Pause / „Speichern“ | „Abbrechen“. Nach dem Stoppen
  anhören oder neu aufnehmen. Gespeichert wird ein Medien-Eintrag mit Dauer, die
  Mitschrift wird sein Text. Zurück-Geste, ← und Abbrechen verwerfen und geben
  das Mikrofon frei. Das Overlay ist dunkler als das der Suche (90 % statt
  74 %, 16 px Unschärfe), damit die Mitschrift gut lesbar ist.
  Nachgeladen über `lazyModules` in `src/main.js`.
- `src/features/media/media-import.js`: kein Audio-Dateifeld mehr;
  `addMediaFiles` nimmt optional Text und Dauer mit.
- **Zurück aus der Suche** (`src/ui/router.js`, `leaveSearchFirst`): wird aus
  der Suche ein Eintrag, eine Datei oder eine Seite geöffnet, geht die App erst
  im Verlauf hinter die Suche zurück und öffnet dann das Ziel. Zurück vom Ziel
  landet auf der Ausgangsseite. Der Begriff bleibt unter „Zuletzt gesucht“.
- Neue Icons `pause`, `play`, `stop` in `assets/icons/sprite-2.svg`;
  `--media-btn-size`/`--media-actions-gap`/`--media-actions-space` in
  `styles/tokens-pages.css` neu belegt.

Gemeinsam genutzte Dateien: `index.html`, `styles/tokens.css` (Dateiliste),
`src/main.js`, `src/ui/router.js`.

## Begründung
- Die Knöpfe im Overlay tragen dieselben Klassen wie die Medien-Leiste und
  „Abbrechen“ der Suche — so sehen sie garantiert gleich aus, ohne doppeltes CSS.
- Zurück aus der Suche: statt den Verlaufseintrag der Suche nur zu ersetzen,
  wird erst zurückgegangen und dann geöffnet. So stimmt der Verlauf
  (`Seite → Ziel`) auch für die Dateiansicht, die als Overlay aufgeht.
- Die Mitschrift steht in einer eigenen Datei, damit `recorder.js` deutlich
  unter 360 Zeilen bleibt.
- Die Werte des Overlays stehen in `styles/recorder.css`, weil sie nur dort
  gelten und `tokens-android.css` schon über 360 Zeilen hat.

## Visualisierung
Vorher:
```
│ ▓▓▓ Kacheln ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ (⇩)(🎤)(🎥)(📷)   [+ Neu]   │
│ ⊞     📅     ☑     🖼       │

Aufgaben → Suche → Aufgabe → ←  =  Suche
```

Nachher:
```
│ ▓▓▓ Kacheln ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▒▒▒ dunkler Verlauf ▒▒▒▒▒▒ │
│   📁  ╭🎥╭ 📷 ╮╮  🎤        │  16 px zur Leiste wie „Neu“
│ ⊞     📅     ☑     🖼       │

Audio-Overlay
┌──────────────────────────────┐
│ ←  Sprachmemo 04.10.2026 14:03│
│▓▓▓▓▓▓▓▓ 0:12 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓ ● Aufnahme läuft ▓▓▓▓▓▓▓│
│▓ ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂▅▇ ▓▓▓▓▓▓│
│▓Mitschrift▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓Heute habe ich die Idee …▓▓▓▓│
│  ■  ╭❚❚╭Speichern╮╮ Abbrechen │
└──────────────────────────────┘

Aufgaben → Suche → Aufgabe → ←  =  Aufgaben
```

## Hinweise
- Chrome für Android zeigt bei einem Dateifeld ohne Filter selbst eine
  Auswahl mit Kamera an; im Web lässt sich das nicht abstellen, ohne Fotos aus
  den Dateien auszuschließen. Die native App öffnet direkt den Dateimanager.
- Das echte Mikrofon war im Browser-Pane gesperrt; geprüft wurde mit einem
  simulierten Mikrofon und simulierter Spracherkennung. Unter Android-Chrome
  können Aufnahme und Spracherkennung um das Mikrofon konkurrieren — dann
  bleibt die Mitschrift leer („Mitschreiben geht hier gerade nicht“), die
  Aufnahme läuft weiter.
- Abbrechen und Zurück verwerfen eine Aufnahme ohne Rückfrage.
- Gespeichert wird in den Eingang; einen Ablageort wählt man noch nicht.
- Testen: Medien → Mikrofon → aufnehmen, pausieren, stoppen, anhören,
  speichern; Suche über Medien öffnen; aus der Suche Aufgabe, Zeichnung und
  Foto öffnen und mit Zurück-Geste und ← zurückgehen.
