# Paralist — Design-Entwurf (Web)

Web-Entwurf der iOS-App **Paralist**, gebaut als Vorlage für eine spätere
**native Android-App**. Kein Build-Schritt, keine Abhängigkeiten: die App läuft
als ES-Module direkt im Browser.

## Starten

```bash
python3 -m http.server 4173
```

Dann `http://localhost:4173` öffnen. Am besten in der Handy-Ansicht bei 375 px
Breite — dafür ist das Layout gemacht.

Zum Zurücksetzen auf die Beispieldaten in der Browser-Konsole:

```js
localStorage.clear()
```

## Aufbau

```
index.html                  Gerüst: nur Markup
manifest.webmanifest        Angaben für „Zum Startbildschirm hinzufügen“
assets/icons/               sprite.svg (alle Icons) und die App-Icons
styles/                     Stile, je Bereich eine Datei
src/                        die App, in kleine Module geteilt
CLAUDE.md                   Kurzregeln für die Arbeit am Projekt
.claude/skills/…/SKILL.md   die vollständigen Regeln
```

### Wo liegt was?

| Ordner | Aufgabe | Darf nicht |
| --- | --- | --- |
| `src/core/` | Werkzeuge ohne App-Wissen: DOM-Zugriff, Datum, Formate, Speicher, Nachrichten, Nachladen | nichts über die App wissen |
| `src/data/` | Zustand, Abfragen, Änderungen, Punkte, Nutzungszeit, Beispieldaten | das DOM anfassen |
| `src/ui/` | wiederverwendete Bausteine: Zeilen, Blätter, Menüs, Wischen, Diagramm-Gerüst, Router | einzelne Seiten kennen |
| `src/features/` | je Seite ein Ordner: `overview`, `calendar`, `media`, `resources`, `composer`, `entry`, `drawing`, `progress`, `profile`, `search`, `settings` | sich gegenseitig importieren (stattdessen `core/bus.js`) |
| `src/shell/` | Kopfzeile, Navigationsleiste, Suchfeld, Tastatur-Höhe, Icon-Sammlung | — |

Die Bereiche sprechen sich über `src/core/bus.js` ab: wer Daten ändert, ruft
`emit(events.dataChanged)`, und jeder Bereich zeichnet sich selbst neu —
**aber nur, wenn seine Seite gerade sichtbar ist**.

### Wo ändere ich das Aussehen?

Alle Farben, Schriftgrößen und Abstände stehen in **`styles/tokens.css`**. Dort
oben steht auch, welche Stil-Datei welchen Bereich abdeckt. Jede Datei — auch
jede JavaScript-Datei — beginnt mit einem Kommentarblock, der ihre anpassbaren
Werte in Alltagssprache auflistet.

## Performance

- **Nachladen:** Kalender, Medien, Suche, Ressourcen, Fortschritt, Profil,
  Zeichnung und die Dateiverarbeitung kommen erst beim ersten Öffnen dazu
  (`src/core/lazy.js`) und werden danach in Ruhephasen vorgeladen — das erste
  Öffnen fühlt sich dann sofort an.
- **Nur Sichtbares zeichnen:** eine versteckte Seite wird nie neu aufgebaut.
- **Ein Klick-Empfänger je Liste** statt eines Zuhörers pro Zeile.
- **Tippen speichert verzögert** (`scheduleSave()`), damit im Titel und im Text
  nicht bei jedem Buchstaben der ganze Datenstand geschrieben wird.
- **CSS-Werte werden gemerkt** (`src/core/css-vars.js`), damit Wischen und
  Ziehen nicht bei jeder Bewegung eine Neuberechnung auslösen.
- **Timer laufen nur, solange sie gebraucht werden** (die Jetzt-Linie im
  Kalender tickt nur bei offener Kalenderseite).
- Gemessen auf dem Entwicklungsserver: die Startseite ist nach rund 65 ms
  bedienbar, der gesamte Startcode lädt in zwei parallelen Wellen.

Für eine echte Veröffentlichung im Web würde man die Dateien zusätzlich
zusammenfassen und komprimieren (z.B. mit Vite). Für einen Entwurf, aus dem
eine Android-App wird, ist das absichtlich nicht eingebaut — es würde nur einen
Build-Schritt hinzufügen, der nach Android nicht mitwandert.

## Flows zum Durchprüfen

Die Startseite ist die wichtigste Seite. Nach einer Änderung mindestens das:

**Übersicht**
- Die vier Karten öffnen (Inbox, Favoriten, Projekte, Ressourcen) und zurück —
  die Zahl auf der Karte passt zur Zahl der Zeilen.
- Tab anlegen, benennen (Enter **und** Klick daneben), wechseln, umbenennen,
  Icon geben, löschen. Beim Löschen verschwinden seine Arbeitsbereiche, deren
  Einträge wandern in die Inbox.
- Arbeitsbereich anlegen, umbenennen, Icon geben, zu Favoriten, löschen.
- Lange auf eine Tab-Pille oder eine Arbeitsbereich-Zeile drücken: das Menü
  geht auf und die Seite darunter öffnet sich **nicht**.
- Zeile nach links wischen (Löschen) und nach rechts (Favorit, Archivieren,
  Verknüpfen). Eine aufgewischte Zeile schiebt sich beim Antippen erst zu.

**Anlegen**
- Jeden Typ einmal anlegen; der aktive Knopf lässt sich abwählen, dann entsteht
  ein Dokument. Ein Projekt landet auf der Projekte-Karte.
- Ablageort über die Verknüpfen-Pille wechseln.
- Foto/Video/Audio/Datei anhängen und wieder entfernen; ohne Text heißt der
  Eintrag wie die erste Datei.
- Eine Zeichnung anlegen: sie öffnet sich sofort, malen, Farbe wechseln,
  rückgängig, leeren.

**Eintrag**
- Titel und Text tippen — nach kurzer Pause ist es gespeichert (Seite neu laden
  und nachsehen).
- Menü: Favorit, Verknüpfen, Archivieren, Löschen. Eine archivierte Aufgabe
  gibt Punkte.

**Kalender**
- Raster und Liste umschalten, Zeitraum 1 W / 2 W / 1 M, „Heute“, Monatsmenü.
- Wochenstreifen senkrecht ziehen (eine Zeile) und waagerecht wischen (ganzer
  Zeitraum).
- Leere Stunde antippen: das Eingabefeld geht mit Typ „Termin“ und dieser
  Uhrzeit auf.

**Medien und Ressourcen**
- Alle Filter-Pillen durchgehen, auch die leeren.
- Dauer-Schild auf Video und Aufnahme zeigt `m:ss`.

**Suchen, Fortschritt, Profil**
- Tippen, Treffer, „keine Treffer“, Escape, die beiden Unterlisten und zurück.
- Fortschritt: Zeitraum 7/30/90, „Mehr anzeigen“, Blatt nach unten ziehen.
- Profil: Nutzungszeit steht als „1 Std 20 Min“ (nicht als `m:ss`), Zeitraum
  umschalten, Bild groß ansehen und mit Browser-Zurück schließen.

**Immer**
- Konsole muss leer sein.
- Einmal mit `localStorage.clear()` neu laden, einmal mit vorhandenen Daten.
- Hell und Dunkel, 375 px Breite.
