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

`python3 -m http.server` sendet kein `Cache-Control`. Chrome hält Dateien darum
eine Weile für frisch und zeigt nach einer Änderung womöglich noch den alten
Stand — dann einmal hart neu laden (Shift + Reload).

## Aufbau

```
index.html                  Gerüst: nur Markup
manifest.webmanifest        Angaben für „Zum Startbildschirm hinzufügen“
assets/icons/               sprite.svg (alle Icons) und die App-Icons
styles/                     Stile, je Bereich eine Datei
src/                        die App, in kleine Module geteilt
tools/check.py              prüft die Projektregeln (Zeilengrenze, Struktur, Kommentare)
tools/version.py            schreibt den Versionsstempel src/data/version.js (für das Update-Fenster)
CLAUDE.md                   Kurzregeln für die Arbeit am Projekt
.claude/skills/…/SKILL.md   die vollständigen Regeln
```

### Wo liegt was?

| Ordner | Aufgabe | Darf nicht |
| --- | --- | --- |
| `src/core/` | Werkzeuge ohne App-Wissen: DOM-Zugriff, Datum, Formate, Speicher, Nachrichten, Nachladen | nichts über die App wissen |
| `src/data/` | Zustand, Abfragen, Änderungen, Punkte, Nutzungszeit, Beispieldaten | das DOM anfassen |
| `src/ui/` | wiederverwendete Bausteine: Zeilen, Blätter, Menüs, Wischen, Tippen zum Schreiben, Diagramm-Gerüst, Router | einzelne Seiten kennen |
| `src/features/` | je Seite ein Ordner: `overview`, `calendar`, `tasks`, `media`, `resources`, `composer`, `entry`, `drawing`, `progress`, `profile`, `search` | sich gegenseitig importieren (stattdessen `core/bus.js`) |
| `src/shell/` | Kopfzeile, Navigationsleiste, Suchfeld, Tastatur-Höhe, Schreiben auf der Seite (Leiste weicht), Icon-Sammlung | — |

Importe zeigen immer nur in eine Richtung:
`main.js → shell|features → ui → data → core`. Zwei Seiten importieren sich
nie gegenseitig. Stattdessen:

- **Nachrichten:** wer Daten ändert, ruft `emit(events.dataChanged)`, und jeder
  Bereich zeichnet sich selbst neu — **aber nur, wenn seine Seite gerade
  sichtbar ist**. So bittet auch der Kalender mit `events.composerRequested` um
  das Eingabefeld, ohne es zu kennen.
- **Hereingeben:** braucht eine untere Schicht etwas von einer oberen, bekommt
  sie es beim Start übergeben — `initListClicks({ openTabMenu, … })`,
  `registerLoader(name, importFn)`, `registerOverlay(name, { open, hide })`.
  `src/main.js` ist die einzige Datei, die alle Bereiche kennt.

Dass all das stimmt, prüft `python3 tools/check.py`.

### Wo ändere ich das Aussehen?

Die Werte, die auf jeder Seite wirken — die Grundfarben, die Maße der
Bedienelemente, die wiederkehrenden Abstände —, stehen in
**`styles/tokens.css`**. Was nur eine einzelne Seite betrifft (Kalender,
Aufgaben, Medien, Suche, Zeichnung, Profil, Einstellungen), steht in
**`styles/tokens-pages.css`**. Oben in `tokens.css` steht auch, welche Stil-Datei
welchen Bereich abdeckt.

Die Schriftgröße eines einzelnen Elements (die Stundenbeschriftung im Kalender,
eine Überschrift im Profil-Blatt) steht dagegen direkt bei ihrer Regel in der
Datei des Bereichs. Jede Datei — auch jede JavaScript-Datei — beginnt darum mit
einem Kommentarblock, der ihre anpassbaren Werte in Alltagssprache auflistet.
Der richtige Weg ist also: in `styles/tokens.css` nachsehen, welche Datei den
Bereich abdeckt, und dann deren Kopfkommentar lesen.

## Datenmodell

Drei Ebenen, eine Liste von Verweisen:

```
Tab
 └─ Arbeitsbereich          { id, name, tab, icon, favorite, body }
     └─ Projekt (Eintrag)   { id, type: "projekt", title, body, places: ["w:3", "w:5"] }
         └─ alles andere    { id, type, title, body, places: ["e:17"] }
```

- **Arbeitsbereiche** stehen ganz oben, direkt auf der Übersichtsseite. Sie
  liegen nie in etwas anderem und sind keine Einträge.
- **Jeder Eintrag hat eine Liste von Ablageorten** (`places`) und erscheint an
  jedem davon: `"w:<id>"` ist ein Arbeitsbereich, `"e:<id>"` ein Projekt, die
  leere Liste heißt Eingang. So liegt ein Projekt zugleich bei Marketing und bei
  Design, wenn beide daran arbeiten. Die Kürzel stehen in `src/data/refs.js`
  und machen eindeutig, welche Nummer gemeint ist.
- **Nur Projekte nehmen Einträge auf** (`containerTypes` in
  `src/data/config.js`). Ein Projekt kann nicht in einem Projekt liegen — so
  kann nie ein Kreis entstehen, und der Baum ist immer höchstens drei Ebenen
  tief.
- **Verknüpfen heißt an- und abwählen:** „Verknüpfen mit“ zeigt alle Orte mit
  Haken, jeder lässt sich hinzunehmen oder wegnehmen, nachträglich und von
  überall. „Eingang” nimmt alle weg.
- **Löschen ist ortsbezogen:** Verschwindet ein Ort (Arbeitsbereich gelöscht,
  „Alle Einträge löschen“), wird er aus den Einträgen gestrichen. Was nur dort
  lag, ist weg bzw. rückt in den Eingang; was auch woanders liegt, bleibt dort.
  Inhalte eines gelöschten Projekts übernehmen dessen Orte.
- **Die Karten Projekte, Favoriten und Ressourcen sind Sammlungen**, keine
  Orte: sie zeigen alle Projekte, alles Markierte, alle Dokumente, Zeichnungen
  und Medien — egal, wo sie liegen. Nur der Eingang ist ein Ort.
- **Der Typ lässt sich nachträglich ändern** (`src/data/convert.js`): aus einer
  Notiz wird eine Aufgabe, aus einer Aufgabe ein Projekt, aus einem Eintrag ein
  Arbeitsbereich — und zurück. Die Regel dabei: was zu einem Ding gehört,
  gehört danach zum neuen Ding. Ein Projekt und ein Arbeitsbereich nehmen auf,
  alles andere verknüpft; beim Wechsel wird darum aus Verknüpfungen Inhalt und
  aus Inhalt Verknüpfungen. Nur Zeichnung und Medium bleiben, was sie sind —
  ihr Inhalt ist die Zeichenfläche bzw. die Datei.
- Arbeitsbereiche und Projekte haben einen freien Text (`body`) und zeigen
  ihre Einträge unter **Verknüpfte Einträge**, nach Typ gruppiert in der
  Reihenfolge aus `typeOrder`. Jede Unterseite — Arbeitsbereich, Übersichts-
  karte oder einzelner Eintrag (Aufgabe, Notiz, Termin, Zeichnung, Projekt …)
  — zeigt dafür dieselben zwei Pillen **Inhalt** und **Verknüpfte Einträge**.

## Performance

- **Nachladen:** Kalender, Aufgaben, Medien, Suche, Ressourcen, Fortschritt, Profil,
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
- Die vier Karten öffnen (Eingang, Favoriten, Projekte, Ressourcen) und zurück —
  die Zahl auf der Karte passt zur Zahl der Zeilen.
- Auf einer Unterseite (Karte, Arbeitsbereich, Eintrag) ist die allgemeine
  Kopfzeile mit Level, Suche und Profil weg: ganz oben links steht nur der
  Zurück-Pfeil. Suche und Optionen erscheinen erst beim Herunterscrollen in
  der oben feststehenden Kopfzeile; darunter darf keine Zeile durchscheinen.
  Zurück zur Übersicht und erneut öffnen zeigt wieder ganz oben, mit
  verborgener Suche. Über die Suche geht es auf die Suchseite, dort ist die
  allgemeine Kopfzeile wieder da und der Cursor steht im Feld.
- Tab anlegen, benennen (Enter **und** Klick daneben), wechseln, umbenennen,
  Icon geben, löschen. Beim Löschen verschwinden seine Arbeitsbereiche, deren
  Einträge wandern in den Eingang.
- Arbeitsbereich anlegen, umbenennen, Icon geben, zu Favoriten, löschen.
- Lange auf eine Tab-Pille oder eine Arbeitsbereich-Zeile drücken: das Menü
  geht auf und die Seite darunter öffnet sich **nicht**.
- Zeile nach links wischen (Archivieren, Löschen) und nach rechts (Favorit,
  Verknüpfen). Eine aufgewischte Zeile schiebt sich beim Antippen erst zu.
- Arbeitsbereich umwandeln — über das Menü der Zeile, das Seitenmenü oder die
  Pille „Arbeitsbereich“ oben auf seiner Seite: „Typ ändern“ → Projekt. Das
  Blatt sagt vorher, dass sein Inhalt ins Projekt zieht und das Projekt im
  Eingang liegt; auf seiner Seite wechselt die Ansicht auf den neuen Eintrag,
  Zurück-Pfeil und Browser-Zurück führen dorthin, woher man kam. Aus einer
  Liste heraus bietet die Meldung unten „Zur Seite“.

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
- Menü: Favorit, Verknüpfen, Typ ändern, Details, Archivieren, Löschen. Eine
  archivierte Aufgabe gibt Punkte.
- Typ ändern — drei Wege: das Menü, die graue Pille mit dem Typ mitten in der
  Kopfzeile (bei einer Aufgabe steht „Typ ändern“ unten im Blatt mit Status
  und Dringlichkeit) und das Menü beim gedrückt Halten einer Zeile. Notiz →
  Aufgabe wechselt sofort; die Meldung unten bietet „Rückgängig“, und das
  bringt auch Status, Dringlichkeit und Datum zurück, nicht aber Getipptes.
  Notiz → Termin bekommt heute und die aktuelle Uhrzeit (die Uhrzeit steht
  klein in der Meldung). Notiz mit Verknüpfungen → Projekt, Projekt mit Inhalt → Notiz
  und Eintrag → Arbeitsbereich zeigen erst in Sätzen, was mit Inhalt,
  Verknüpfungen und Ort passiert, dann „Umwandeln“ oder „Abbrechen“. Nach
  Eintrag → Arbeitsbereich steht die Seite des Arbeitsbereichs offen; Zurück
  führt dorthin, woher man kam. Zeichnung und Medium haben die Option nicht.
- Aufgabe abhaken: sie bleibt ausgegraut stehen, auf der Aufgaben-Seite ganz
  unten (auch in jeder Board-Spalte). Ab 00:00 Uhr des nächsten Tages liegt
  sie im Archiv (`src/data/task-archive.js`). Zurückgeholt bleibt sie wieder
  bis Mitternacht sichtbar.
- Zwischen den Pillen „Inhalt“ und „Verknüpfte Einträge“ wechseln — bei jedem
  Eintragstyp (Aufgabe, Notiz, Termin, Zeichnung, Projekt). Bei einer
  Zeichnung steht unter „Inhalt“ die Zeichenfläche.
- Unter „Inhalt“ in die freie Fläche unter dem Text tippen, auch ganz unten
  über der Navigation: die Tastatur geht auf, der Cursor steht am Textende,
  die Navigation verschwindet. Waagerecht wischen wechselt dort nur die Pille,
  senkrecht ziehen scrollt nur. Dasselbe auf der Seite eines Arbeitsbereichs.
- Bei offener Tastatur irgendwo auf die Seite tippen, auch mitten in einen
  langen Text: nur die Tastatur geht zu, der Cursor springt nicht, die
  Navigation kommt zurück. Zurück-Pfeil und Menü wirken sofort.

**Kalender**
- Raster und Liste umschalten, Zeitraum 1 W / 2 W / 1 M, „Heute“, Monatsmenü.
- Wochenstreifen senkrecht ziehen (eine Zeile) und waagerecht wischen (ganzer
  Zeitraum).
- Leere Stunde antippen: das Eingabefeld geht mit Typ „Termin“ und dieser
  Uhrzeit auf.

**Medien und Ressourcen**
- Alle Filter-Pillen durchgehen, auch die leeren.
- Dauer-Schild auf Video und Aufnahme zeigt `m:ss`.

**Suchen, Fortschritt, Einstellungen**
- Tippen, Treffer, „keine Treffer“, Escape, die beiden Unterlisten und zurück.
- Tastatur bleibt über der Navigation stehen (die Leiste rückt nicht mit
  hoch), daneben tippen schließt nur die Tastatur statt einen Eintrag zu
  öffnen, zugeklappt zeigt sich die Suchen-Pille rechts über der Navigation.
- Fortschritt: Zeitraum 7/30/90, „Mehr anzeigen“, Blatt nach unten ziehen.
- Einstellungen (Knopf oben rechts): die beiden Kacheln unter „Analyse“
  öffnen die volle Karte — Zurück-Pfeil, Browser-Zurück und das Kreuz müssen
  sich unterscheiden (Kreuz schließt alles). Nutzungszeit steht als
  „1 Std 20 Min“ (nicht als `m:ss`), Zeitraum umschalten, Darstellung wechseln,
  Bild groß ansehen und mit Browser-Zurück schließen.

**Immer**
- `python3 tools/version.py` ausführen, dann meldet `python3 tools/check.py` „alles in Ordnung“.
- Konsole muss leer sein.
- Einmal mit `localStorage.clear()` neu laden, einmal mit vorhandenen Daten.
- Hell und Dunkel, 375 px Breite.
