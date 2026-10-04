# 2026-10-04-mitschrift-android-teilen

## Problem
Auf Android blieb die Mitschrift im Sprachmemo leer, obwohl die Welle
ausschlug — am Mac (Chrome) und am iPhone (Safari) erschien der Text, und das
Diktieren in der Suche ging auch auf Android. Die Ursache, belegt durch den
Chromium-Quelltext und Androids Regeln zum geteilten Mikrofon:

- Android gibt den Ton nur an **eine** App. Ausnahme: der Google-Assistent,
  dessen Dienst Chromes Spracherkennung nutzt, darf mithören — aber nur,
  solange die andere App keine „privatsphäre-sensible“ Tonquelle
  (`VOICE_COMMUNICATION`, `CAMCORDER`) benutzt.
- Chrome öffnet das Mikrofon für `getUserMedia` mit Echo-Unterdrückung über
  genau diese Tonquelle für Telefonate (`AAUDIO_INPUT_PRESET_VOICE_COMMUNICATION`
  nur bei `ECHO_CANCELLER`, sonst `GENERIC`). Darum bekam die Erkennung während
  der Aufnahme nur Stille. Die Suche öffnet kein eigenes Mikrofon, deshalb ging sie.
- Zwei Android-Eigenheiten der Erkennung kamen dazu: `continuous` wird in
  Chrome für Android zum Diktiermodus (`android.speech.extra.DICTATION_MODE`),
  der Zwischenstände als endgültig meldet (Wörter doppelt) und nach dem ersten
  Ergebnis aufhört. Und „Erkennung gerade beschäftigt“
  (`ERROR_RECOGNIZER_BUSY`) meldet Chrome dort als `not-allowed`, was die
  Mitschrift bisher sofort beendete.

## Änderung
Nur Dateien unter `src/features/media/`, keine gemeinsam genutzte Datei.

- `recorder-mic.js`: Das Mikrofon wird **ohne Echo-Unterdrückung** geöffnet
  (`micConstraints`). Chrome nimmt auf Android dann die normale Tonquelle, und
  die Spracherkennung darf gleichzeitig mithören. Ein Sprachmemo braucht keine
  Echo-Unterdrückung, es spielt dabei nichts ab.
- `recorder-speech.js` (neu geschrieben): Zuhören in **Anläufen** wie beim
  Mikrofon der Suche (`src/shell/search-voice.js`). Auf Android je Anlauf ein
  Satz (`continuous = false`), am Computer und iPhone durchgehend wie bisher.
  Der Text eines Anlaufs wird bei jedem Ergebnis aus der ganzen Liste neu
  gebaut, nichts wird angehängt — keine Dubletten. Ein Fehler zählt erst nach
  drei gescheiterten Anläufen hintereinander (`maxFailedRuns`), dazwischen
  400 ms Pause (`retryAfterMs`); sofort beendete Anläufe (`shortRunMs`)
  laufen nicht in einer engen Schleife. Neu exportiert: `conflictProblems`
  (`starved`, `audio-capture`).
- `recorder.js`, `recorder-state.js`: Klappt das Teilen auf einem Gerät
  trotzdem nicht (Ton da, drei Sekunden nichts gehört, oder die Erkennung kam
  nicht ans Mikrofon), wechselt die App **von selbst** auf „Nur Mitschrift“,
  zeigt einen bleibenden Hinweis warum und merkt sich das
  (`storageKeys.recorderMode` = `"text"`). Hat man die Art im ⚙-Blatt einmal
  selbst festgelegt (`rec.modeChosen`), bleibt es bei der Wahl und es erscheint
  wie bisher nur der Knopf „Nur Mitschrift“. Fällt die Erkennung im Modus „Nur
  Mitschrift“ später dauerhaft aus und steht schon Text da, endet sie wie nach
  „Stoppen“, damit der Text speicherbar bleibt.
- `recorder-view.js`: Hinweis-Zeile unter der Welle (`showNotice`,
  `clearNotice`, Texte in `notices`), die über Zustände hinweg stehen bleibt;
  der Knopf „Nur Mitschrift“ erscheint bei beiden Konflikt-Gründen.
- `recorder-setup.js`: `deviceKind()` exportiert (bestimmt auch die Art des
  Zuhörens), Texte zu `audio-capture` angepasst.

## Begründung
- Die eigentliche Reparatur ist eine Zeile (Echo-Unterdrückung aus). Ohne
  Gerät lässt sie sich aber nicht beweisen — zum Beispiel wenn auf einem
  Samsung Bixby statt Google der Assistent ist oder auf Android 9 die erste
  App gewinnt. Darum sitzt dahinter der Automatik-Wechsel, der auf jeden Fall
  zu einem sichtbaren Transkript führt.
- Anläufe wie in der Suche, weil dieser Weg auf allen drei Geräten
  nachweislich geht. Auf Android ein Satz je Anlauf, weil Chromes
  Diktiermodus dort Dubletten erzeugt.
- Der Automatik-Wechsel schreibt die Wahl in den Browser-Speicher, damit die
  nächste Aufnahme auf diesem Gerät direkt mit Text beginnt; die eigene Wahl
  im ⚙-Blatt hat Vorrang, sonst käme der Wechsel bei jedem Versuch mit
  Audiodatei zurück.
- Verworfen: Android pauschal auf „Nur Mitschrift“ (verschenkt die Audiodatei
  dort, wo das Teilen jetzt geht). Verworfen: überall nur ein Satz je Anlauf
  (am Mac und iPhone läuft das durchgehende Zuhören gut; Lücken zwischen
  Anläufen wären ein Rückschritt). Verworfen: Erkennung über
  `start(MediaStreamTrack)` mit dem Ton der Aufnahme — Chrome kann das nur am
  Desktop. Verworfen: Hinweis als Toast — der liegt in der Fußzeile unter dem
  Overlay.

## Visualisierung
Vorher auf Android:
```
│            0:12                │
│       ● Aufnahme läuft         │
│   ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂         │
│ Mitschrift              ⧉  ⇄   │
│ Was du sagst, erscheint hier.  │   ← bleibt leer
```

Nachher, Regelfall (Mikrofon wird geteilt):
```
│            0:12                │
│       ● Aufnahme läuft         │
│   ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂         │
│ Mitschrift              ⧉  ⇄   │
│ hallo das ist ein test zweiter │
│ satz kommt jetzt und noch …    │   ← live, ohne Dubletten
```

Nachher, wenn das Gerät nicht teilt (einmalig, danach gemerkt):
```
│            0:05                │
│       ● Mitschrift läuft       │
│   ▂▅▇▃▆▂▁▁▁▁▁▁▁▁▁▁▁▁▁         │
│ Dein Gerät gibt das Mikrofon   │
│ nur an eine App. Deshalb läuft │
│ hier die Mitschrift ohne       │
│ Audiodatei — ändern unter ⚙.   │
│ Mitschrift              ⧉  ⇄   │
│ hallo das ist ein test …       │
```

## Hinweise
- Geprüft im Browser bei 375 px, hell und dunkel, mit simulierter
  Spracherkennung und Chromiums Fake-Mikrofon (lauter Testton): Android ok,
  Desktop ok (durchgehend), Konflikt ohne eigene Wahl (Automatik-Wechsel,
  Hinweis, gemerkt, Mikrofon frei, Text kommt), Konflikt mit eigener Wahl
  (Knopf, roter Punkt), Erlaubnis verweigert (nach drei Anläufen Hinweis,
  Aufnahme läuft weiter), nur Mitschrift ok, Ausfall mit Text („Mitschrift
  beendet“, speicherbar), Stoppen. Konsole leer.
- Am Android testen: Medien → Mikrofon → ein paar Sätze sprechen. Entweder
  erscheint der Text während „Aufnahme läuft“, oder nach etwa drei Sekunden
  springt die Zeit auf 0:00, „Mitschrift läuft“ mit Hinweis, dann Text. Wer
  dort schon „Nur Mitschrift“ gewählt hat, startet direkt mit Text; für den
  Regelfall im ⚙ auf „Aufnahme + Mitschrift“ stellen — dann gilt diese Wahl
  und beim Konflikt kommt der Knopf statt des Automatik-Wechsels.
- Am Mac und iPhone ändert sich nur: Aufnahme ohne Echo-Unterdrückung. Für
  ein Memo ohne Wiedergabe sollte das nicht hörbar sein.
- Auf Android gibt es zwischen zwei Anläufen eine kleine Lücke; ein Wort
  direkt am Satzende kann fehlen.
- Erkennt die App den Konflikt, gehen die ersten rund drei Sekunden Audio und
  Text verloren — nur beim ersten Mal auf diesem Gerät.

## Nachbesserung (zweiter Commit, nach dem Review im Git Commit Manager)
Vier bestätigte Fehler aus dem Review und sechs weitere aus einem
unabhängigen Mehrfach-Review (vier Blickwinkel, je Fund drei Skeptiker):

- `recorder-speech.js`: `closeRun()` behält jetzt den unsicheren Rest hinter
  dem sicheren Text (`joinWords(committed, runFinal, pending)`); beim
  Stoppen oder Pausieren am Computer und iPhone fehlten sonst die letzten
  Wörter. Ein stiller Anlauf ohne Fehler (Sprechpause) setzt `failedRuns`
  zurück — sonst sammelten sich einzelne „beschäftigt“-Fehler über eine lange
  Aufnahme und beendeten die Mitschrift auf Android.
- `recorder.js`: Der Automatik-Wechsel greift nur, solange die Erkennung noch
  nichts gehört hat **und** die Aufnahme kürzer als `autoSwitchUntilMs`
  (8 s) ist; sonst bleibt es beim Knopf, damit keine laufende Aufnahme samt
  Text ohne Rückfrage verloren geht. Der Knopf „Nur Mitschrift“ und der
  Wechsel im ⚙-Blatt fragen bei einer längeren Aufnahme erst „Aufnahme
  verwerfen?“ (`chooseMode` → `discardThen` in `recorder-discard.js`), auch
  nach „Stoppen“. Tippt man im ⚙-Blatt die schon aktive Art an, gilt sie ab
  jetzt als festgelegt (`modeChosen`, gemerkt), ohne Neustart. „Erneut
  anfragen“ und „Weiter“ nach einer Pause setzen den Konflikt-Zähler zurück
  (`resetStarving` in `recorder-session.js`); vorher stand er nach „starved“
  schon über der Schwelle und der neue Anlauf wurde beim ersten Ton sofort
  wieder beendet.
- `recorder-view.js`: Im Modus „Nur Mitschrift“ zeigt ein Fehler keinen
  Konflikt-Text und keinen Knopf „Nur Mitschrift“ mehr (`failedTextOnly`).
- `recorder-setup.js`: Dasselbe im ⚙-Blatt (`textOnlyHints`). `deviceKind()`
  erkennt Android auch mit „Desktop-Website anfordern“ (Browser nennt sich
  „Linux“, hat aber Touch; `navigator.userAgentData.platform`), sonst liefe
  dort der Diktiermodus mit Dubletten.

Geprüft wie oben, zusätzlich: Stoppen mit unsicherem Rest (Rest bleibt),
abwechselnd „beschäftigt“ und still (Mitschrift bleibt am Leben), Konflikt
nach vorhandenem Text (kein Wechsel, Text bleibt, roter Punkt), „Erneut
anfragen“ nach Konflikt (neuer Anlauf bekommt die vollen drei Sekunden),
Stoppen → „Nur Mitschrift“ (Rückfrage, Aufnahme bleibt bis „Verwerfen“),
aktive Art antippen (gemerkt, kein Neustart), Wechsel im ⚙ nach 4 s
(Rückfrage), Android-Desktop-Ansicht (ein Satz je Anlauf). Konsole leer.
