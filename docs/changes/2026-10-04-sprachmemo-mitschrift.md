# 2026-10-04-sprachmemo-mitschrift

## Problem
Im Sprachmemo-Overlay lief die Mitschrift am Handy nicht, und man sah nicht,
warum. Gewünscht war oben rechts ein Weg zu den Berechtigungen. Außerdem
sollte „Mitschrift“ eine richtige Zwischenüberschrift mit sanfter Trennlinie
werden, mit zwei Knöpfen rechts daneben: Text kopieren und Text in eine Notiz
oder ein Dokument umwandeln („Text aus Sprachmemo 04.10.2026 …“).

## Änderung
- **⚙ oben rechts in der Kopfzeile** öffnet das Blatt „Mitschrift einrichten“
  (neu `src/features/media/recorder-setup.js`): ob das Mikrofon erlaubt ist,
  ob die Mitschrift läuft und sonst warum (Fehler der Web Speech API in
  Alltagssprache), die Schritte zum Erlauben für das eigene Gerät (iPhone,
  Android, Computer) und „Erneut anfragen“. Geht etwas nicht, trägt das
  Zahnrad einen roten Punkt.
- **Mitschrift merkt sich den Fehlergrund** (`problem()`) und lässt sich mit
  `retry()` neu anstoßen (`src/features/media/recorder-speech.js`).
- **Zwischenüberschrift „Mitschrift“** mit sanfter Linie über die ganze
  Breite; rechts Kopieren und Umwandeln (neu
  `src/features/media/recorder-text.js`). Umwandeln öffnet ein Blatt
  Notiz | Dokument und legt sofort einen Eintrag im Eingang an:
  „Notiz aus <Name der Aufnahme>“ bzw. „Text aus <Name der Aufnahme>“. Die
  Aufnahme läuft dabei weiter. Beide Knöpfe sind gesperrt, solange es keinen
  Text gibt.
- Verdrahtung in `src/features/media/recorder.js`, Markup in
  `src/features/media/recorder-view.js`, Stile in `styles/recorder.css`.

Keine gemeinsam genutzte Datei betroffen (außer `src/data/version.js`).

## Begründung
- Eine Webseite darf die Einstellungen von Telefon oder Browser nicht selbst
  öffnen. Das Blatt zeigt deshalb Zustand und Schritte. In der Android-App
  tritt an deren Stelle „Einstellungen öffnen“
  (`Settings.ACTION_APPLICATION_DETAILS_SETTINGS`).
- Das ⚙ sitzt in der Kopfzeile statt darunter: der Zähler muss nicht
  verrutschen, und es entspricht der Android-Kopfzeile mit Aktion rechts.
- Kopieren und Umwandeln als Icons, damit die Zwischenüberschrift ruhig
  bleibt; der Eintrag entsteht über `createEntryInline` wie jeder andere.

## Visualisierung
Vorher:
```
┌────────────────────────────┐
│ ←  Sprachmemo 04.10. 01:43 │
│           0:23             │
│      ● Aufnahme läuft      │
│   ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂     │
│ Mitschrift                 │
│ wieso klappt das nicht …   │
│ ■ ╭❚❚╭Speichern╮╮ Abbrechen│
└────────────────────────────┘
```

Nachher:
```
┌────────────────────────────┐
│ ←  Sprachmemo 04.10. 01:43 ⚙│  ← roter Punkt bei Problem
│           0:23             │
│      ● Aufnahme läuft      │
│   ▂▅▇▃▆▂▇▅▃▂▅▇▃▆▂▇▅▃▂     │
│ Mitschrift          ⧉   ⇄  │
│ ────────────────────────── │
│ wieso klappt das nicht …   │
│ ■ ╭❚❚╭Speichern╮╮ Abbrechen│
└────────────────────────────┘

⇄ → „Mitschrift umwandeln“     ⚙ → „Mitschrift einrichten“
    ✎ Notiz                        Mikrofon      Erlaubt
    ▤ Dokument                     Mitschrift    Vom Gerät gesperrt
                                   So erlaubst du es …
                                   🎤 Erneut anfragen
```

## Hinweise
- Geprüft im Browser-Pane mit simuliertem Mikrofon und simulierter
  Spracherkennung (Erfolg, Fehler, Erneut anfragen), Kopieren, Notiz,
  Dokument, Zurück, hell und dunkel bei 375 px; Konsole leer.
- Die Menüpfade für iPhone und Android sind nicht an echten Geräten geprüft
  und können je nach Version leicht anders heißen.
- „Erneut anfragen“ zeigt nur dann eine Frage des Browsers, wenn die
  Berechtigung nicht dauerhaft abgelehnt ist.
- Am Handy testen: ⚙ öffnen und ablesen, was bei „Mitschrift“ steht.
