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

- **Arbeitsbereiche** stehen ganz oben in der Ordnung. Sie liegen nie in etwas
  anderem und sind keine Einträge. Angezeigt werden sie auf ihrer eigenen
  Seite (Karte „Arbeitsbereiche“), je Tab eine Pille; die Übersicht zeigt
  darunter die Projekte, weil man die viel öfter öffnet.
- **Jeder Eintrag hat eine Liste von Ablageorten** (`places`) und erscheint an
  jedem davon: `"w:<id>"` ist ein Arbeitsbereich, `"e:<id>"` ein Projekt, die
  leere Liste heißt Eingang. So liegt ein Projekt zugleich bei Marketing und bei
  Design, wenn beide daran arbeiten. Die Kürzel stehen in `src/data/refs.js`
  und machen eindeutig, welche Nummer gemeint ist.
- **Nur Projekte nehmen Einträge auf** (`containerTypes` in
  `src/data/config.js`). Ein Projekt kann nicht in einem Projekt liegen — so
  kann nie ein Kreis entstehen, und der Baum ist immer höchstens drei Ebenen
  tief.
- **Verknüpfen heißt an- und abwählen:** das Blatt „Verknüpfen“ hat Pillen —
  „Zuletzt“ (was zuletzt geöffnet wurde), „Ablageort“ und je Kategorie eine.
  Jeder Haken lässt sich hinzunehmen oder wegnehmen, nachträglich und von
  überall. „Eingang” nimmt alle Orte weg.
- **Löschen ist ortsbezogen:** Verschwindet ein Ort (Arbeitsbereich gelöscht,
  „Alle Einträge löschen“), wird er aus den Einträgen gestrichen. Was nur dort
  lag, ist weg bzw. rückt in den Eingang; was auch woanders liegt, bleibt dort.
  Inhalte eines gelöschten Projekts übernehmen dessen Orte.
- **Die Karten Favoriten, Arbeitsbereiche und Ressourcen sind Sammlungen**,
  keine Orte: sie zeigen alles Markierte, alle Arbeitsbereiche, alle
  Dokumente, Zeichnungen und Medien — egal, wo sie liegen. Nur der Eingang ist
  ein Ort. Die Projekte stehen in **Ansichten** (`src/data/project-views.js`):
  „Alle“ fest, eigene Ansichten mit Sortierung, Ort-Filter, „Nur Favoriten“
  oder einer handverlesenen Liste. In der Oberfläche heißen sie immer
  „Ansicht“, nie „Tab“ — Tabs sind die Pillen der Arbeitsbereiche.
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

**Übersicht** (375 px, hell und dunkel, leerer und voller Speicher)
- Die vier Karten öffnen (Eingang, Favoriten, Arbeitsbereiche, Ressourcen) und
  zurück — die Zahl passt zur Liste (Arbeitsbereiche: alle Tabs, ohne archivierte).
- Auf einer Unterseite (Karte, Arbeitsbereich, Eintrag) ist die allgemeine
  Kopfzeile mit Level, Suche und Profil weg: ganz oben links steht nur der
  Zurück-Pfeil. Suche und Optionen erscheinen erst beim Herunterscrollen in
  der oben feststehenden Kopfzeile; darunter darf keine Zeile durchscheinen.
  Zurück zur Übersicht und erneut öffnen zeigt wieder ganz oben, mit
  verborgener Suche. Über die Suche geht es auf die Suchseite, dort ist die
  allgemeine Kopfzeile wieder da und der Cursor steht im Feld.
- Projekte unter den Karten: „Alle“ zeigt jedes Projekt, zuletzt Geöffnetes
  oben. Projekt über den Raketen-Knopf und über die Zeile „Projekt
  hinzufügen“ anlegen. Ansicht anlegen (kleines Plus, startet im Namensfeld),
  benennen, Icon, duplizieren, nach links/rechts, löschen — halten oder
  Rechtsklick auf die Pille; „Alle“ nur Icon und Duplizieren. Wischen wechselt
  die Ansicht, nicht während des Benennens. „Zum Archiv“ öffnet die Pille
  Projekte. Zweites Antippen von „Übersicht“ rollt die Karten zurück.
- Karte „Ansicht“ über der Navigation (Kopf antippen oder ziehen): Sortieren
  mit „Sortieren nach“ und „Sortierungsrichtung“ — jede Option in beiden
  Richtungen; Filtern nach Ort; Nur Favoriten; Projekte wählen (danach sind
  Filtern und Favoriten gesperrt, die Zeile sagt „Handverlesen, n Projekte“).
  Ansicht mit Arbeitsbereichs-Filter: neues Projekt liegt dort und steht in
  der Liste. Handverlesenes Projekt löschen: Liste sauber; archivieren und
  zurückholen: steht wieder da.
- „Projekte ↗“ öffnet die Seite Projekte mit derselben Ansicht, allen Punkten
  von oben; Zurück führt zur Übersicht.
- Seite Arbeitsbereiche: Tab anlegen, benennen (Enter **und** Klick daneben),
  wechseln, umbenennen, Icon, löschen (seine Arbeitsbereiche verschwinden,
  deren Einträge wandern in den Eingang). Arbeitsbereich anlegen,
  umbenennen, Icon, Favorit, in anderen Tab verschieben und „Zeigen“,
  archivieren, „Zum Archiv“, zurückholen, löschen. Wischen wechselt den Tab.
- Pille oder Zeile lange drücken (oder Rechtsklick): Menü auf, Seite darunter
  bleibt zu. Android: Halten verschiebt die Zeile, Menü nur über die drei Punkte.
- Zeile nach links wischen (Archivieren, Löschen) und nach rechts (Favorit,
  Verknüpfen). Eine aufgewischte Zeile schließt beim Antippen, sonst nach 8 s.
- Arbeitsbereich umwandeln — über das Menü der Zeile, das Seitenmenü oder die
  Pille „Arbeitsbereich“ oben auf seiner Seite: „Typ ändern“ → Projekt. Das
  Blatt sagt vorher, dass sein Inhalt ins Projekt zieht und das Projekt im
  Eingang liegt; auf seiner Seite wechselt die Ansicht auf den neuen Eintrag,
  Zurück-Pfeil und Browser-Zurück führen dorthin, woher man kam. Aus einer
  Liste heraus bietet die Meldung unten „Zur Seite“.

**Anlegen**
- Jeden Typ einmal anlegen; der aktive Knopf lässt sich abwählen, dann entsteht
  ein Dokument. Ein Projekt steht danach in „Alle“ unter den Karten.
- Ablageort über die Verknüpfen-Pille wechseln.
- Foto/Video/Audio/Datei anhängen und wieder entfernen; ohne Text heißt der
  Eintrag wie die erste Datei.
- Eine Zeichnung anlegen: sie öffnet sich sofort, malen, Farbe wechseln,
  rückgängig, leeren.

**Eintrag**
- Titel und Text tippen — nach kurzer Pause ist es gespeichert (Seite neu laden
  und nachsehen).
- Menü: Favorit, Verknüpfen, Typ ändern, Cover, Icon, Archivieren, Löschen.
  Eine archivierte Aufgabe gibt Punkte.
- Karte „Details“ am Ende von „Inhalt“ (jede Kategorie): beim Öffnen schauen
  „Details“ und das Ketten-Symbol gerade über der Navigation hervor — mit
  leerem Text, kurzem Text und langem Text prüfen. Langer Text endet dort
  und läuft aus, „Mehr anzeigen“ klappt ihn aus, „Weniger anzeigen“ wieder
  ein; jede neu geöffnete Seite beginnt eingeklappt, ein Tipp in den Text
  klappt von selbst aus. Ein Tipp in die freie Fläche über der Karte schreibt
  am Textende weiter. Hochscrollen zeigt die ganze Karte über der Navigation;
  ein Tipp auf „Details“ holt sie hoch. Oben drei Kennzahlen je Kategorie
  (`src/data/entry-stats.js`): Aufgabe und Projekt Dringlichkeit | Fälligkeit |
  Status, Termin Dringlichkeit | Tag mit Uhrzeit | Status, sonst in der Mitte
  die Erinnerung (Dokument rechts Entwurf · Fertig · Geprüft). Ohne Datum steht
  „— Fälligkeit“ gedämpft, gestern fällig und offen „Überfällig“ in Rot,
  erledigt gedämpft. Darunter „Zeit“ (Fällig am, Erinnerung ›), Text, Nutzung,
  Verlauf und Ablage. Das Ketten-Symbol öffnet „Verknüpfen“ mit den Pillen
  Zuletzt | Ablageort | Kategorien.
- Erinnerung ›: Keine, Zur Fälligkeit, 1 Std / 1 Tag vorher, Eigener Zeitpunkt.
  Fälligkeit verschieben: sie wandert mit; abhaken: sie ist weg. Fällig: Banner
  von oben — Haken setzt Erledigt, ✕ schließt, Antippen öffnet (Zurück führt
  zurück), nach oben wischen schließt, nach 12 s allein weg, Finger hält es.
  Zwei fällige nacheinander; verpasste kommen nach dem Neuladen.
- Arbeitsbereich: unter „Inhalt“ dieselbe Karte (Einträge | Erinnerung |
  Geändert); „Einträge“ wechselt die Pille, „Details“ scrollt sie in den Blick.
- YouTube-Karte im Inhalt antippen: die Karte wird an Ort und Stelle zum
  dunklen Player über die ganze Zeilenbreite (kein neuer Tab), der Text bleibt
  darüber und darunter stehen; gekürzter Text klappt dafür aus. Das Bild hat
  sein echtes Seitenverhältnis (hochkant prüfen: ein Short macht den Block
  hoch, nichts ist abgeschnitten) mit YouTubes eigener Bedienung im Bild.
  Darunter, zwischen Bild und Titel, die Leiste: links das Tempo-Raster
  (0,25x bis 2x, Vorgabe 1x in der Mitte), rechts Vollbild — öffnet das Video
  in der Medien-Vorschau (Zurück-Pfeil und Browser-Zurück schließen sie,
  danach steht wieder die Karte bzw. Zeile) — und „×“, das den Player
  schließt und Karte bzw. Zeile zurückholt. Der Titel endet nach fünf Zeilen mit „…“. Pillenwechsel, Zurück-Pfeil und
  Browser-Zurück schließen den Player; ein Video ohne Einbettungsfreigabe
  meldet YouTube selbst. Auf der Lesezeichen-Seite spielt ein Tipp auf das
  Vorschaubild genauso an der Stelle der Zeile; der Rest der Zeile öffnet den Eintrag.
- Lesezeichen mit YouTube-Link anlegen (Eingabefeld, Typ Lesezeichen, Link als
  Text): der Eintrag heißt nach kurzem Moment wie das Video, die Karte im
  Inhalt auch. In der Karte „Details“ steht oben „Link · Adresse“: antippen,
  neuen Link eingeben, Enter — Karte, Titel und Videotitel ziehen mit.
- Zeichnung: kein Textfeld; unter der weißen Fläche die Werkzeugleiste, darunter
  schaut die Karte „Details“ über der Navigation hervor. Der Kopier-Knopf neben
  den Pillen legt das Bild (weißer Grund, PNG) in die Zwischenablage — in einen
  Chat einfügen und nachsehen; gedrückt halten bietet „Bild“ oder „Titel“. Das
  Menü hat „Exportieren“ mit „Als PNG“ und „Als JPEG“ (Datei wird geladen, auch
  aus dem Menü einer Zeile heraus); ein gerade gezogener Strich ist mit dabei.
- Cover und Icon (wie in Notion): „Cover hinzufügen“ legt einen Farbverlauf in
  der Farbe der Kategorie hinter Kopfzeile und Titel — hell und dunkel ansehen,
  Typ ändern wechselt die Farbe mit, „Cover entfernen“ nimmt ihn weg. Beim
  Herunterscrollen bekommt die Kopfzeile mit dem kleinen Titel ihren
  Hintergrund zurück. „Icon hinzufügen“ öffnet das Kachel-Raster (Bereiche und
  Sammlungen, Kategorien, Weitere); das Icon steht danach groß über dem Titel
  und in jeder Listenzeile statt des Typ-Icons. Ein Tipp auf das Icon öffnet
  dasselbe Raster mit dem gewählten Icon markiert und „Icon entfernen“ unten.
  Dasselbe Raster nutzen Tab und Arbeitsbereich.
- Arbeitsbereich: Menü oben rechts → „Cover hinzufügen“ legt den Verlauf in
  Orange (Farbe der Arbeitsbereiche) über die Seite, er endet an den Pillen.
  Zurück und in Eingang/Favoriten: dort ist kein Cover. Typ ändern zwischen
  Eintrag und Arbeitsbereich nimmt Cover und Icon mit.
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
- Aufgaben-Seite: der Titel steht allein, darunter die Pillen der Ansichten
  wie bei den Projekten auf der Übersicht: „Alle“ (fest), eigene Ansichten,
  das kleine Plus legt eine neue Ansicht als Kopie von „Alle“ an (startet im
  Namensfeld), rechts hinter der Trennlinie öffnet ✓+ dieselbe leere Zeile wie ein Tipp
  in die Liste (am Ende der Liste bzw. der ersten Gruppe, im Board in der
  ersten Spalte) und scrollt dorthin. Wischen über die Liste wechselt die Ansicht.
  Pille gedrückt halten (oder Rechtsklick): Umbenennen, Icon, Duplizieren,
  Nach links / Nach rechts, Löschen — „Alle“ nur Icon und Duplizieren.
- Karte „Ansicht“ als Ebene über der Liste, unter der
  Navigation: eingeklappt schaut nur der Kopf hervor; Tipp auf Kopf oder
  Symbol rechts (oder Kopf ziehen) klappt sie aus und wieder ein, die Liste
  bleibt dabei stehen. Beim Umstellen bleibt der Inhalt sichtbar. Layout Liste | Board, Sortieren (Blatt „Sortieren
  nach“ Erstellt / Fällig / Titel, darunter „Sortierungsrichtung“ mit eigenem
  Wortlaut je Option; die Zeile zeigt z.B. „Titel · A bis Z“), Filtern (rechts „Keine“ oder die Zahl der
  gefilterten Abschnitte, darunter je Abschnitt ein Chip: Ort mit Namen, Status
  und Dringlichkeit mit Zähler, bei „ist nicht“ mit „nicht | 1“; das Blatt zeigt
  erst die Übersicht Ort / Status / Dringlichkeit mit Zusammenfassung rechts,
  dann je Abschnitt eine Unterseite mit Zurück-Pfeil, bei Status und
  Dringlichkeit mit Segment „ist | ist nicht“ — Wechsel dreht die Liste um,
  die Haken bleiben; Erledigt und Archiviert sind Werte im Status, „Erledigte
  zeigen“ ist derselbe Schalter; „Alle Filter zurücksetzen“ zeigt wieder alles;
  bei „Alle“ fehlt der Ort), Gruppieren als Schalter (an:
  „Spalten nach“ Dringlichkeit | Status), Erledigte zeigen. Jede Ansicht
  merkt sich das für sich. Standard: alle Aufgaben als eine Liste, älteste
  zuerst. Gruppiert zeigt die Liste dieselben Gruppen wie das Board Spalten;
  das Board gruppiert ungruppiert nach Dringlichkeit. Der Ring des Hakens
  trägt die Farbe der Dringlichkeit, „In Arbeit“ zeigt einen Punkt darin.
  Unter dem Titel nur stiller Text: Fälligkeit (überfällig rot), in
  Status-Gruppen die Dringlichkeit, dann der Ort.
- Aufgabe anlegen durch Tippen: ganz ohne Aufgaben liegt die blasse Zeile
  „Neue Aufgabe“ da. Sonst ein Tipp in die freie Fläche — die neue Zeile mit
  Cursor erscheint am Ende der Liste (gruppiert: der Gruppe, unter der man
  getippt hat); im Board in der angetippten Spalte. Die untere Leiste weicht
  am Handy der Tastatur wie bei jedem Feld auf der Seite, am Rechner bleibt
  sie stehen. Enter legt an und öffnet die
  nächste Zeile, Escape oder Verlassen einer leeren Zeile lässt sie
  verschwinden, Verlassen mit Text legt an. Scrollen und Wischen legen nichts an.
- Aufgabe abhaken: Erledigtes ist standardmäßig ausgeblendet (die Meldung
  unten bietet „Rückgängig“); mit „Erledigte zeigen“ bleibt sie ausgegraut
  ganz unten in der Liste bzw. in der Board-Spalte stehen. Ab 00:00 Uhr des
  nächsten Tages liegt sie im Archiv (`src/data/task-archive.js`). Zurückgeholt
  bleibt sie wieder bis Mitternacht sichtbar.
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
- Bausteine unter „Inhalt“: „/“ am Zeilenanfang öffnet das Menü (Grundlagen,
  Einbettungen), Weitertippen filtert, Escape schließt. „- “, „1. “, „[] “ und
  „---“ wandeln die Zeile direkt um. Enter setzt eine Liste fort, Enter in
  einer leeren Listenzeile beendet sie, Löschen am Zeilenanfang macht Text
  daraus bzw. hängt die Zeile an die vorige. Runde Checkbox antippen füllt sie.
  Standort, Video, Web-Lesezeichen: Link einfügen → links eine Kachel (oben
  das Bild, unten graue Leiste mit Logo, Dienst und „⋯“), rechts groß der
  Name, darunter „Kopieren“ (kopiert nur den Namen, zeigt kurz „Kopiert“); antippen öffnet den Link, „⋯“ bietet Umbenennen, Namen kopieren und
  Entfernen. „/“ vor einem schon eingefügten Link macht ihn direkt zur Karte.
  Nach Neuladen steht alles wieder so da; Kopieren liefert Markdown.
  Dasselbe im Inhalt eines Arbeitsbereichs — dort zeigt ein anderer
  Arbeitsbereich seinen eigenen Text, Pillen wechseln behält alles.

**Kalender**
- Panel „Ansicht“ über der Navigation: Darstellung Raster | Liste, Zeitspanne
  1 W / 2 W / 1 M, Zeile „Woche“ öffnet die Rollen Jahr | KW (Wechsel über die
  Jahresgrenze: KW 53 wird im Jahr mit 52 Wochen zu KW 52), „Heute“ im Kopf
  springt zurück, ohne das Panel zuzuklappen. Am Desktop nur in der Tagesansicht.
- Datum unter „Kalender“ antippen: Rollen Tag | Monat | Jahr; ein Tag in einem
  anderen Jahr zeigt das Jahr in der Überschrift.
- Wochenstreifen senkrecht ziehen (eine Zeile) und waagerecht wischen (ganzer
  Zeitraum).
- Leere Stunde antippen: das Eingabefeld geht mit Typ „Termin“ und dieser
  Uhrzeit auf.

**Medien und Ressourcen**
- Alle Filter-Pillen durchgehen, auch die leeren.
- Dauer-Schild auf Video und Aufnahme zeigt `m:ss`.

**Suchen, Fortschritt, Einstellungen**
- Tippen, Treffer, „keine Treffer“, Escape, die beiden Unterlisten und zurück.
- Öffnen ohne Tastatur (Vorgabe): Tipp ins Suchfeld, Ziehen nach unten und
  der Suchknopf einer Seite zeigen „Zuletzt geöffnet“ und die Pille „Suchen“;
  die Pille oder ein zweiter Tipp ins Feld holt die Tastatur. Mit Haken bei
  „Tastatur sofort öffnen“ geht sie jedes Mal sofort auf, auch nach Neuladen.
- Tastatur bleibt über der Navigation stehen (die Leiste rückt nicht mit
  hoch), daneben tippen schließt nur die Tastatur statt einen Eintrag zu
  öffnen, zugeklappt zeigt sich die Suchen-Pille rechts über der Navigation.
- Fortschritt: Zeitraum 7/30/90, „Mehr anzeigen“, Blatt nach unten ziehen.
- Meilensteine: Karte im Fortschritt-Blatt öffnen, eine Zeile auf- und
  zuklappen. Pfeil und Browser-Zurück führen zu den Karten, das Kreuz schließt
  alles. „Neu“ ist beim zweiten Öffnen weg; eine erreichte Stufe bleibt, auch
  wenn man danach Einträge löscht.
- Einstellungen (Knopf oben rechts): die beiden Kacheln unter „Analyse“
  öffnen die volle Karte — Zurück-Pfeil, Browser-Zurück und das Kreuz müssen
  sich unterscheiden (Kreuz schließt alles). Nutzungszeit steht als
  „1 Std 20 Min“ (nicht als `m:ss`), Zeitraum umschalten, Darstellung wechseln,
  Bild groß ansehen und mit Browser-Zurück schließen. Unter „App“ Navigation,
  Suche und Design: Haken setzen und lösen (Namen unter den Reitern sofort, der
  Verlauf hinter der Leiste ohne Haken weg), „Neue Seiten beginnen mit“ Icon
  oder Cover, dann Eintrag und Arbeitsbereich anlegen. „Mehr“ › Versionen: je
  Gruppe eine Fassung wählen, sie bleibt nach dem Neuladen (`data-mobile-os`).
  Pfeil und Browser-Zurück führen zur Liste, das Kreuz schließt alles.

**Desktop (ab 1024 px) und Android-Fassung**
- Desktop: alle Flows in `docs/desktop-flows.md` — bei jeder Änderung an
  Seitenleiste, Reiterzeile, Palette, rechter Spalte oder breiten Seiten.
- Android (Einstellungen › Mehr › Versionen): `docs/android-flows.md`.

**Immer**
- `python3 tools/version.py` ausführen, dann meldet `python3 tools/check.py` „alles in Ordnung“.
- Konsole muss leer sein.
- Einmal mit `localStorage.clear()` neu laden, einmal mit vorhandenen Daten.
- Hell und Dunkel, 375 px Breite.
