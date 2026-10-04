# 2026-10-04-aufnahme-android-mikrofon

## Problem
Auf Android erschien bei der Sprachmemo-Aufnahme kein Text, obwohl die Welle
sichtbar ausschlug. Außerdem endete ein gesperrtes Mikrofon stumm, und in der
installierten „App“ vom Startbildschirm fand sich keine Stelle, die
Berechtigung zu geben.

Ursache für den fehlenden Text: Android gibt das Mikrofon nur an **eine** App
gleichzeitig. Chrome hält es für die Aufnahme, die Spracherkennung läuft in
der App „Google“ und bekommt nur Stille. Chrome für Android kann der
Erkennung auch nicht den Ton der laufenden Aufnahme reichen (das geht nur am
Desktop ab Chrome 135). Im Web lässt sich das nicht umgehen, nur sauber
behandeln.

## Änderung
- **Zwei Arten, das Mikrofon zu nutzen:** „Aufnahme + Mitschrift“ wie bisher
  und neu „Nur Mitschrift“. Im zweiten Modus bekommt die Spracherkennung das
  Mikrofon, der Text erscheint live, die Welle schlägt aus, wenn die Erkennung
  etwas hört, und „Speichern“ legt eine Notiz mit dem Namen der Aufnahme an.
  Die Wahl bleibt im Browser gemerkt (`storageKeys.recorderMode`).
- **Die App merkt den Konflikt selbst:** Hört die Aufnahme drei Sekunden lang
  Ton (`soundLevel`, `starveAfterMs` in `recorder.js`), ohne dass die
  Erkennung ein Wort liefert, steht unter „Mitschrift“ der Grund und darunter
  der Knopf „Nur Mitschrift“. Ein Tipp wechselt den Modus und startet neu.
- **Berechtigung:** Solange der Browser nach dem Mikrofon fragt, steht „Bitte
  das Mikrofon erlauben …“ unter der Zeit. Geht das Mikrofon nicht auf, steht
  der Grund in der Mitte (gesperrt, keins gefunden, belegt), und bei
  „gesperrt“ öffnet sich einmal von selbst das Blatt mit den Schritten.
  „Erneut anfragen“ löst die Browser-Frage neu aus. Die Android-Schritte
  nennen den Weg über Chromes eigene Berechtigung (Einstellungen › Apps ›
  Chrome › Berechtigungen › Mikrofon) und den aus Chromes „Blockiert“-Liste.
- **⚙-Blatt:** zusätzlich „Mikrofon nutzen für“ mit Haken am aktiven Modus;
  bei gesperrtem Mikrofon steht bei Mitschrift „Wartet aufs Mikrofon“.
- **Neue Datei** `src/features/media/recorder-mic.js`: Mikrofon öffnen,
  Mitschnitt, Pegel, Freigeben, Anhören — ausgelagert aus `recorder.js`.
- „Neu aufnehmen“ beginnt jetzt auch die Mitschrift neu.

Dateien: `src/features/media/recorder.js`, `recorder-mic.js` (neu),
`recorder-speech.js`, `recorder-view.js`, `recorder-setup.js`,
`styles/recorder.css`. **Gemeinsam genutzt:** `src/core/storage.js`
(neuer Schlüssel `recorderMode`).

## Begründung
Die Erkennung des Konflikts statt einer Android-Weiche: sie greift auf jedem
Gerät mit demselben Verhalten und stört nirgends, wo beides zusammen geht.
Der Modus liegt im Browser-Speicher und nicht im App-Zustand, weil er eine
Eigenschaft des Geräts ist. Verworfen: Android pauschal auf „Nur Mitschrift“
stellen, weil dann die Audiodatei ohne Erklärung fehlte. Für die native
Android-App gilt derselbe Zwang; dort löst es ab Android 13 der
SpeechRecognizer mit einer Audioquelle aus der Aufnahme
(`RecognizerIntent.EXTRA_AUDIO_SOURCE`).

## Visualisierung
Vorher auf Android:
```
│ ←  Sprachmemo 04.10. 02:31    ⚙│
│            0:12                │
│       ● Aufnahme läuft         │
│   ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂         │
│ Mitschrift              ⧉  ⇄   │
│ ────────────────────────────── │
│ Was du sagst, erscheint hier.  │   ← bleibt für immer leer
```

Nachher, nach drei Sekunden Ton ohne Text:
```
│ ←  Sprachmemo 04.10. 02:32    ⚙●│
│            0:04                │
│       ● Aufnahme läuft         │
│   ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂         │
│ Mitschrift              ⧉  ⇄   │
│ ────────────────────────────── │
│ Dein Gerät gibt das Mikrofon   │
│ nur an die Aufnahme …          │
│      ( 🎤 Nur Mitschrift )      │   ← ein Tipp wechselt
```

Nachher im Modus „Nur Mitschrift“:
```
│            0:02                │
│       ● Mitschrift läuft       │
│   ▁▁▁▁▂▅▇▃▆▂▁▁▁▁ (bei Sprache) │
│ Hallo, das ist ein Test …      │
│  ■  ╭ ▶ ╭Speichern╮╮ Abbrechen │   ← ▶ grau, Speichern legt Notiz an
```

Gesperrtes Mikrofon:
```
│      Kein Zugriff aufs Mikrofon│
│ Das Mikrofon ist für diese     │
│ Seite gesperrt. Oben rechts ⚙ …│
│ ┌ Mitschrift einrichten ─────┐ │   ← öffnet sich einmal von selbst
│ │ Mikrofon     Gesperrt      │ │
│ │ Mitschrift   Wartet aufs … │ │
│ │ Mikrofon nutzen für        │ │
│ │ ✓ Aufnahme + Mitschrift    │ │
│ │   Nur Mitschrift           │ │
│ │ So erlaubst du es … 🎤 Erneut│ │
```

## Hinweise
- Geprüft im Browser-Pane bei 375 px, hell und dunkel, mit simuliertem
  Mikrofon und simulierter Spracherkennung: Konflikt-Erkennung, Wechsel in
  beide Richtungen, Text live mit Welle, Stoppen, Speichern als Notiz,
  gemerkter Modus, Browser-Nachfrage, gesperrtes Mikrofon mit automatischem
  Blatt und „Erneut anfragen“, Abbrechen in jedem Zustand.
- Am echten Android testen: Medien → Mikrofon → nach etwa drei Sekunden
  Sprechen muss „Nur Mitschrift“ erscheinen; danach Text live, kopieren,
  speichern; im ⚙ zurück auf „Aufnahme + Mitschrift“.
- Die Schwelle für „Ton da“ liegt bei 0,12. Bei sehr leisem Sprechen
  erscheint der Knopf später oder gar nicht; dann hilft der Umweg über ⚙.
- Bekommt auf einem Gerät die Erkennung statt Chrome den Ton, bleibt die
  Aufnahme still und der Text kommt trotzdem. Das erkennt die App nicht.
- Der Menüpfad für Chromes Website-Einstellungen ist nicht am Gerät geprüft.
