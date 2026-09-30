# Karte „Details“: Fälligkeit, Erinnerung und die drei Kennzahlen je Kategorie

> Nachtrag 1. Oktober 2026: Schritte 1–5 sind umgesetzt, Schritt 6
> (Karte für den Arbeitsbereich) und 7 (README, Desktop-Flows) stehen noch
> aus. Die offenen Punkte aus Abschnitt 13 sind so entschieden, wie der Plan
> sie vorschlägt. Abweichungen: Schritt 3 und 4 sind ein Commit. Das Banner
> nutzt die Werte der Meldung unten (`--toast-radius`, `--toast-gap`,
> `--toast-anim`) statt eigener `--banner-*`, und `styles/reminder-banner.css`
> steht in der Zeile von `toast.css` in der Übersicht — `tokens.css` hat 399
> Zeilen. `remindMissedAt` gibt es nicht: eine Erinnerung ist verbraucht,
> sobald ihr Banner erscheint, und verpasste kommen beim nächsten Öffnen.
> „Bearbeitet“ oben heißt knapp „jetzt“, „vor 5 Min“, „vor 3 Std“,
> „gestern“, sonst der Tag — „gerade eben“ passte nicht in die Spalte.
> Icon der Erinnerung ist bis zur Glocke `clock` (`reminderIcon` in
> `src/ui/date-field.js`).

Stand: 1. Oktober 2026, Entwurf zur Prüfung. Umsetzung
nach den Regeln in `.claude/skills/paralist-clean-code/SKILL.md`: erst
`python3 tools/version.py`, dann `python3 tools/check.py`, dann im Browser
prüfen, dann committen — je Schritt aus Abschnitt 11 ein Commit.

## 1. Zielbild in drei Sätzen

Die Karte „Details“ zeigt bei **jeder** Kategorie oben drei Kennzahlen:
links, was der Eintrag *ist*, in der Mitte *wann* er dran ist, rechts *wie es
um ihn steht*. Aufgabe, Projekt und Termin tragen in der Mitte die
**Fälligkeit** (Termin: den Tag mit Uhrzeit), alle anderen Kategorien und
der Arbeitsbereich eine **Erinnerung**. Wird eine Erinnerung fällig, gleitet
ein **Banner von oben** in die App, das man antippt (öffnet die Seite),
abhakt oder wegwischt — und das nach 12 Sekunden von selbst geht.

## 2. Was heute da ist

- `src/data/entry-facts.js` legt in `statsByType` je Kategorie drei
  Kennzahlen fest. Aufgabe: Dringlichkeit | Datum | Status. Termin: Datum |
  Uhrzeit | Verknüpft. Projekt: Einträge | Offene Aufgaben | Erledigt. Notiz
  und Dokument: Wörter | Lesezeit | Mal geöffnet. Zeichnung, Medien,
  Lesezeichen: Erstellt | Verknüpft | Mal geöffnet.
- Die mittlere Kennzahl der Aufgabe sagt ohne Datum „—“ mit der
  Beschriftung „Kein Datum“ — das ist die Stelle aus dem Screenshot.
- Ein Tipp auf Datum öffnet die Systemauswahl für Tag und Uhrzeit
  (`src/ui/date-field.js`), ein Tipp auf Status oder Dringlichkeit das Blatt
  mit den Tabs Status | Dringlichkeit | Typ (`src/ui/task-status.js`).
- Status und Dringlichkeit gibt es nur bei Aufgaben (`entry.status`,
  `entry.priority`, Vorgaben „Offen“ und „Später“). Beim Umwandeln in einen
  anderen Typ fallen sie weg (`adoptTaskFields` in `src/data/convert.js`).
- **Der Kalender sortiert jeden Eintrag nach `entry.date`** und ohne Datum
  nach dem Tag des Anlegens (`entryDay` in `src/data/queries.js`). Das ist
  für den Plan wichtig: eine Erinnerung darf deshalb *nicht* in `date`
  landen, sonst springt eine Notiz im Kalender auf den Erinnerungstag.
- Meldungen gibt es nur unten über der Navigation (`src/ui/toast.js`,
  4,2 Sekunden) und mittig das Fenster „Neue Version“ (`update-prompt.js`).
  Nichts kommt von oben.
- Der Arbeitsbereich hat **keine** Karte „Details“; seine Angaben stehen nur
  im Blatt „Details“ des Menüs und am Desktop in der rechten Spalte.

## 3. Die drei Kennzahlen je Kategorie

Die Regel, nach der links und rechts gewählt sind: **links Umfang oder
Herkunft** (wie groß, woher, wie viele), **Mitte die Zeit** (Fälligkeit oder
Erinnerung), **rechts der Zustand** (Status, Frische, Gebrauch). Bei den drei
Zeit-Kategorien stehen links und rechts die zwei Stellhebel, die man wirklich
setzt: Dringlichkeit und Status — wie bisher bei der Aufgabe.

| Kategorie      | links                | Mitte                        | rechts                         |
| -------------- | -------------------- | ---------------------------- | ------------------------------ |
| Aufgabe        | Dringlichkeit ▸      | **Fälligkeit** ▸             | Status ▸                       |
| Projekt        | Dringlichkeit ▸      | **Fälligkeit** ▸             | Status ▸                       |
| Termin         | Dringlichkeit ▸      | **Tag**, darunter Uhrzeit ▸  | Status ▸                       |
| Notiz          | Wörter               | **Erinnerung** ▸             | Bearbeitet („vor 2 Std“)       |
| Dokument       | Wörter               | **Erinnerung** ▸             | Status ▸ (Entwurf/Fertig/Geprüft) |
| Zeichnung      | Erstellt             | **Erinnerung** ▸             | Bearbeitet                     |
| Medien         | Erstellt             | **Erinnerung** ▸             | Verknüpft (Zahl)               |
| Lesezeichen    | Website („youtube.com“, Beschriftung Website/Video/Standort) | **Erinnerung** ▸ | Geöffnet („12-mal“) |
| Arbeitsbereich | Einträge (Zahl)      | **Erinnerung** ▸             | Geändert („gestern“)           |

▸ = antippbar. Warum so:

- **Notiz — Wörter | Erinnerung | Bearbeitet.** Eine Notiz lebt vom
  Schreiben: links sieht man, wie viel drinsteht, rechts, wie frisch sie ist.
  „Lesezeit“ und „Mal geöffnet“ rutschen in die Abschnitte darunter; sie
  bleiben erhalten, nur nicht mehr oben. Favorit steht nicht oben: den
  setzt man über Wischen und Menü, und ein Ja/Nein trägt oben zu wenig.
- **Dokument — Wörter | Erinnerung | Status.** Deine Idee „verifiziert“
  aufgegriffen: ein Dokument hat einen eigenen kleinen Status **Entwurf →
  Fertig → Geprüft** (Vorgabe Entwurf, keine Farbe bis „Geprüft“ in Grün).
  Kein „Erledigt“: ein Dokument wird nicht abgehakt, es wird fertig. Der
  Status öffnet dasselbe Blatt wie bei der Aufgabe, nur mit den Tabs
  Status | Typ.
- **Zeichnung — Erstellt | Erinnerung | Bearbeitet.** Wann sie entstand und
  wann zuletzt daran gezeichnet wurde — mehr sagt eine Zeichnung nicht über
  sich.
- **Medien — Erstellt | Erinnerung | Verknüpft.** Ein Foto oder Video ist
  fertig, sobald es da ist; interessant ist, wo es benutzt wird.
- **Lesezeichen — Website | Erinnerung | Geöffnet.** Die Domain ist die
  Identität eines Lesezeichens („wikipedia.org“), und wie oft man hinspringt,
  sagt, ob es etwas taugt. Die volle Adresse bleibt im Abschnitt „Link“.
- **Arbeitsbereich — Einträge | Erinnerung | Geändert.** Wie viel darin
  liegt (ein Tipp wechselt zur Pille „Verknüpfte Einträge“) und wann zuletzt
  etwas darin passiert ist — dieselbe Zahl wie in der Desktop-Karte.
- **Termin — Tag mit Uhrzeit in der Mitte.** Ein Termin ist nicht „fällig“,
  er *findet statt*. Deshalb steht bei ihm der Tag als Wert und die Uhrzeit
  („14:00 Uhr“ oder „Ganztägig“) als Beschriftung — die Uhrzeit ist bei
  einem Termin das Wesentliche. Links und rechts wie bei der Aufgabe, damit
  die drei Zeit-Kategorien ein Muster haben (siehe Abschnitt 7).

## 4. Wortlaut der mittleren Kennzahl

Das Feld ist ein Wert (17 px) über einer Beschriftung (13 px) in einer
Spalte von rund 100 px auf 375 px Breite — etwa 10 Zeichen oben, 14 unten.
„Fälligkeitsdatum“ (16 Zeichen) passt nirgends hinein, **„Fälligkeit“**
(10) passt in die Beschriftung und ist als Hauptwort das Gegenstück zu
„Dringlichkeit“ und „Status“: drei Hauptwörter nebeneinander.

Fälligkeit (Aufgabe, Projekt):

| Zustand                      | Wert                     | Beschriftung   |
| ---------------------------- | ------------------------ | -------------- |
| keine gesetzt                | — (gedämpft)             | Fälligkeit     |
| gesetzt, in der Zukunft      | „Heute“, „Morgen“, „Fr, 3. Okt“ (`shortDay`) | Fälligkeit |
| überfällig, nicht erledigt   | Datum in `--prio-jetzt`  | **Überfällig** |
| erledigt                     | Datum, gedämpft          | Fälligkeit     |

Erinnerung (alle anderen, Arbeitsbereich):

| Zustand         | Wert                          | Beschriftung |
| --------------- | ----------------------------- | ------------ |
| keine           | —                             | Erinnerung   |
| gesetzt         | „Heute“, „Morgen“, „Fr, 3. Okt“ | Erinnerung |
| schon gemeldet  | (Erinnerung ist verbraucht → wieder „—“) | Erinnerung |

Die **Uhrzeit** steht bewusst nicht oben: „Fälligkeit 14:00“ oder
„Erinnerung 14:00“ sprengt die Beschriftung, „3. Okt, 14:00“ den Wert. Sie
steht vollständig eine Handbreit tiefer im neuen Abschnitt **„Zeit“** (siehe
Abschnitt 6) und in der Auswahl selbst. Der Termin ist die Ausnahme: dort
trägt die Beschriftung die Uhrzeit, weil er keinen Leerzustand hat.

Zur Prüfung morgen, Variante B: Beschriftung „Fällig 14:00“, sobald eine
Uhrzeit gesetzt ist (12 Zeichen, passt). Nachteil: die Beschriftung springt
zwischen Hauptwort und Verb, und für die Erinnerung gibt es kein ebenso
kurzes Gegenstück.

## 5. Fälligkeit — die Logik

- **Feld:** `entry.date` (und `entry.time`) — genau das Feld, das die
  Aufgabe schon hat und das der Kalender liest. Ein Projekt mit Fälligkeit
  steht damit im Kalender an seinem Stichtag statt am Tag des Anlegens; ohne
  Fälligkeit bleibt alles wie heute.
- **Dringlichkeit bleibt unangetastet.** Ein Datum ändert nie von selbst die
  Dringlichkeit — beides sind zwei Aussagen: *wie wichtig* und *bis wann*.
  Was sich verbindet, ist die Farbe: überfällig färbt den Wert wie „Jetzt“
  (`--prio-jetzt`), so wie es die Aufgaben-Liste schon tut
  (`tasks-parts.js`).
- **Überfällig** heißt: Tag vorbei und nicht erledigt. Am Tag der
  Fälligkeit selbst ist nichts überfällig, auch nicht nach der Uhrzeit —
  sonst blinkt um 14:01 alles rot.
- **Uhrzeit optional.** Nur Tag gewählt heißt „im Laufe des Tages“; für
  Erinnerungen relativ zur Fälligkeit gilt dann 09:00 (`defaultTime` in
  `date-field.js`).
- **Erledigt** nimmt die rote Farbe weg, lässt das Datum aber stehen
  („Erledigt nach 3 Tagen“ im Verlauf bleibt damit nachvollziehbar).
- **Sortierung „Fällig“** der Aufgaben-Seite bleibt, wie sie ist.

## 6. Erinnerung — die Logik

- **Ein Feld für alle:** `remindAt` (Zeitpunkt in Millisekunden) an jedem
  Eintrag und jedem Arbeitsbereich. Nicht `date`: der Kalender würde die
  Notiz sonst verschieben (Abschnitt 2).
- **Bei Notiz, Dokument, Zeichnung, Medien, Lesezeichen, Arbeitsbereich**
  ist die Erinnerung *der* Zeitpunkt: ein Tipp auf die Kennzahl öffnet
  direkt die Systemauswahl für Tag und Uhrzeit (ein Schritt, wie heute beim
  Datum), Leeren nimmt sie weg. Danach die kurze Meldung unten „Erinnerung:
  Fr, 3. Okt, 14:00“.
- **Bei Aufgabe, Projekt, Termin** hängt die Erinnerung an der Fälligkeit.
  Der Tipp auf die Kennzahl öffnet wie heute direkt die Datumsauswahl (der
  schnelle Weg bleibt). Die Erinnerung steht darunter im Abschnitt „Zeit“
  als eigene Zeile „Erinnerung — 1 Std vorher ›“; ein Tipp öffnet ein
  kleines Blatt mit den Optionen **Keine · Zur Fälligkeit · 1 Stunde vorher ·
  1 Tag vorher · Eigener Zeitpunkt …** (Haken an der gewählten). Ohne
  Fälligkeit gibt es nur „Eigener Zeitpunkt …“ — die relativen Optionen
  wären sonst Rechnen ohne Zahl.
- **Verschieben:** ändert man die Fälligkeit und es gibt eine Erinnerung,
  wandert sie um dieselbe Spanne mit (Abstand bleibt). Fällt die Fälligkeit
  weg, fällt eine relative Erinnerung mit weg; eine „eigene“ bleibt.
- **Einmalig:** eine Erinnerung meldet sich genau einmal. Nach dem Banner
  (egal ob abgehakt, weggewischt oder von selbst verschwunden) ist sie
  verbraucht und die Kennzahl steht wieder auf „—“. Wer noch einmal
  erinnert werden will, setzt sie neu — wie ein Wecker, nicht wie ein
  Kalender. So sammelt sich nie ein Berg alter Erinnerungen an.
- **Nachholen:** ist die App zum Zeitpunkt nicht offen (das Web kann im
  Hintergrund nichts zeigen), kommen die verpassten Erinnerungen beim
  nächsten Öffnen nacheinander als Banner — älteste zuerst, jedes 12
  Sekunden, keins geht verloren. Der Abschnitt „Zeit“ zeigt so lange
  „Erinnerung — verpasst, 3. Okt, 14:00“.
- **Erledigt oder archiviert** meldet sich nicht mehr: beim Erledigen einer
  Aufgabe wird ihre Erinnerung entfernt, archivierte und gelöschte
  Einträge kommen nicht ins Banner.
- **Neuer Abschnitt „Zeit“** in der Liste unter den Kennzahlen (vor
  „Nutzung“): „Fällig am — Fr, 3. Okt, 14:00“ (antippbar → Auswahl),
  „Erinnerung — 1 Std vorher“ bzw. „Fr, 3. Okt, 13:00“ (antippbar → Blatt
  bzw. Auswahl). Bei Kategorien ohne Fälligkeit nur die Erinnerungs-Zeile.
  Ohne beides fällt der Abschnitt weg, wie alle leeren Abschnitte.

## 7. Status und Dringlichkeit für Termin und Projekt

- Beide bekommen `status` und `priority` mit denselben Listen wie die
  Aufgabe (`taskStatuses`, `taskPriorities`) und denselben Vorgaben „Offen“
  und „Später“. Eine Liste, ein Blatt, ein Muster — und die Farben der
  Dringlichkeit stimmen mit den Ringen im Kalender überein.
- Wortlaut bleibt: „Erledigt“ bei einem Termin heißt *hat stattgefunden*,
  bei einem Projekt *abgeschlossen*. „In Arbeit“ passt beim Projekt gut, beim
  Termin weniger (siehe offene Punkte).
- **Was sich nicht ändert:** die Aufgaben-Seite zeigt weiter nur Aufgaben,
  das Board gruppiert nur Aufgaben, um Mitternacht wandern nur erledigte
  *Aufgaben* ins Archiv (`task-archive.js` prüft den Typ), der Haken-Knopf
  in Zeilen bleibt Aufgaben vorbehalten. Termin und Projekt bekommen keinen
  Haken in der Zeile — nur die Kennzahl auf ihrer Seite.
- **Umwandeln:** `adoptTaskFields` in `convert.js` wird zu
  `adoptTimeFields`: Wechsel *in* eine der drei Kategorien gibt Status und
  Dringlichkeit (falls noch nicht da), Wechsel *heraus* nimmt sie weg;
  `date` und `time` bleiben, wie heute. „Rückgängig“ über `typeSnapshot`
  funktioniert unverändert, weil die Felder in `typeFields` schon stehen.
- **Dokument-Status** ist eine eigene kleine Liste `docStatuses` in
  `config-tasks.js`: Entwurf (Vorgabe, keine Farbe), Fertig (`--cal-accent`),
  Geprüft (`--xp-done`). Kein `done: true` — `isTaskDone` bleibt bei
  Aufgaben-Status. Gespeichert ebenfalls in `entry.status`; welche Liste
  gilt, sagt `statusListFor(type)`.

## 8. Das Banner von oben

- **Aussehen:** eine Karte wie die Meldung unten (`--card`, `--toast-radius`,
  Schatten), aber am **oberen Rand** des Geräts, unter der sicheren Zone
  (`--safe-top`), 12 px Abstand zum Rand. Links das Icon der Kategorie in
  ihrer Farbe (`typeIcon`, `xpItemStyle`), daneben zwei Zeilen: der Titel
  (fett, eine Zeile, „…“) und darunter klein „Erinnerung“ bzw. bei
  Fälligkeit „Fällig heute, 14:00“. Rechts ein runder Knopf:
  - **Aufgabe, Projekt, Termin:** Haken (`check-circle`) — setzt den Status
    auf „Erledigt“ und schließt das Banner. Das ist der häufigste Griff:
    erinnert werden und gleich abhaken.
  - **Alle anderen:** × (`close`) — nimmt die Erinnerung zur Kenntnis. Zwei
    Symbole, zwei Bedeutungen; ein Haken auf einer Notiz wäre ein Versprechen,
    das nichts einlöst.
- **Tipp auf den Text** öffnet die Seite des Eintrags (bzw. des
  Arbeitsbereichs) und schließt das Banner. **Nach oben wischen** schließt es
  wie unter Android. Alle drei Wege verbrauchen die Erinnerung (Abschnitt 6).
- **Von selbst weg nach 12 Sekunden** (`AUTO_HIDE_MS = 12000`). Der Text kann
  nie „zu viel“ werden: eine Titelzeile mit „…“, eine Nebenzeile — das Banner
  hat immer dieselbe Höhe, deshalb reicht eine feste Zeit. Solange der Finger
  auf dem Banner liegt, läuft die Zeit nicht.
- **Bewegung:** gleitet in `--toast-anim` von oben herein (`translateY`), geht
  nach oben wieder weg. Nur `transform`, keine Layout-Bewegung; die Seite
  darunter rührt sich nicht.
- **Warteschlange:** immer nur ein Banner; weitere warten und kommen
  nacheinander. Kein Stapel — auf 375 px wäre der zweite schon halb unter der
  Kopfzeile.
- **Ebene:** `z-index: 55` — über den Blättern von unten (50) und der
  Suchpalette (48), unter dem Fenster „Neue Version“ (60). Sitzt direkt in
  `.device` wie das Update-Fenster; damit steht es am Desktop genauso in der
  Bühne, oben mittig, mit `--update-width` als größter Breite.
- **Zeitgeber:** ein Modul `src/shell/reminder-banner.js` prüft alle 30
  Sekunden (`CHECK_EVERY_MS`) und bei jeder Rückkehr in den Vordergrund
  (`visibilitychange`, wie `lifecycle.js`), ob `remindAt <= jetzt`. Der Timer
  läuft nur, solange es überhaupt eine ausstehende Erinnerung gibt — sonst
  keiner (Regel „Timer nur, solange gebraucht“).
- **Vorlesehilfen:** `role="status"` wie die Meldung unten; der Knopf hat
  einen Namen („Erledigt“ / „Schließen“).
- **Grenze des Webs, Gewinn in Android:** im Browser gibt es kein Banner,
  solange die App zu ist — dafür das Nachholen beim Öffnen. In der nativen
  App wird aus `remindAt` ein `AlarmManager`-Alarm mit einer
  Benachrichtigung im Kanal „Erinnerungen“; das Banner hier ist die
  Heads-up-Notification in App-Optik, mit denselben zwei Aktionen.

## 9. Tipps und Blätter — was passiert wo

- **Dringlichkeit / Status** (Aufgabe, Projekt, Termin): das bekannte Blatt
  mit den Tabs Status | Dringlichkeit | Typ. Es heißt weiter
  `openTaskSheet`, zeigt aber den Typnamen des Eintrags statt „Aufgabe“.
- **Status** (Dokument): dasselbe Blatt mit den Tabs Status | Typ und der
  Liste Entwurf/Fertig/Geprüft.
- **Fälligkeit** (Aufgabe, Projekt) und **Tag** (Termin): direkt die
  Systemauswahl, wie heute.
- **Erinnerung** (übrige Kategorien): direkt die Systemauswahl, setzt
  `remindAt`.
- **Zeile „Erinnerung“ im Abschnitt „Zeit“** (Aufgabe, Projekt, Termin):
  Blatt `src/ui/remind-sheet.js` mit den fünf Optionen aus Abschnitt 6;
  „Eigener Zeitpunkt …“ öffnet die Systemauswahl.
- **Zeile „Fällig am“:** Systemauswahl. **Einträge** (Arbeitsbereich):
  wechselt zur Pille „Verknüpfte Einträge“. Alles andere ist reine Anzeige.
- **Desktop-Spalte rechts** (`entry-rail.js`) bekommt all das geschenkt:
  sie nutzt `detailsBodyMarkup` und `handleDetailsClick` schon heute.

## 10. Datenmodell und Migration

Neue oder erweiterte Felder:

| Feld              | wo                              | Bedeutung                                   |
| ----------------- | ------------------------------- | ------------------------------------------- |
| `status`          | Aufgabe, Projekt, Termin, Dokument | wie bisher bei der Aufgabe; Dokument aus `docStatuses` |
| `priority`        | Aufgabe, Projekt, Termin        | wie bisher bei der Aufgabe                  |
| `date`, `time`    | Aufgabe, Projekt: Fälligkeit; Termin: Tag | unverändert, Projekt neu             |
| `remindAt`        | jeder Eintrag, jeder Arbeitsbereich | Zeitpunkt der Erinnerung (ms) oder nicht gesetzt |
| `remindOffset`    | Aufgabe, Projekt, Termin        | Minuten vor der Fälligkeit (0 = zur Fälligkeit) oder `null` = eigener Zeitpunkt; nur zum Mitwandern und für den Haken im Blatt |
| `remindMissedAt`  | überall                         | wann ein verpasstes Banner fällig war, bis es nachgeholt ist |

Migration (`migrate()` in `state.js`): Termin und Projekt ohne `status`
oder `priority` bekommen die Vorgaben; Dokument ohne `status` bekommt
„entwurf“. Alte Stände haben kein `remindAt` — nichts zu tun. **Achtung:**
`state.js` hat 392 Zeilen. Vor der Migration wird `migrate()` in eine eigene
Datei `src/data/migrate.js` ausgelagert (reine Verschiebung, eigener Commit),
sonst reißt die 400-Zeilen-Grenze.

## 11. Dateien und Schritte (je Schritt ein Commit)

1. **Aufräumen vorab:** `migrate()` aus `state.js` nach
   `src/data/migrate.js`. `statsByType` und die Kennzahl-Definitionen aus
   `entry-facts.js` nach `src/data/entry-stats.js` (entry-facts behält
   `collect` und die Abschnitte). Keine sichtbare Änderung.
2. **Status und Dringlichkeit für Termin und Projekt, Status für Dokument:**
   `config-tasks.js` (`docStatuses`, `statusListFor`, `timeTypes = ["aufgabe",
   "projekt", "termin"]`), `migrate.js`, `convert.js` (`adoptTimeFields`),
   `task-status.js` (Tabs je Typ, Typname im Kopf), `mutations-tasks.js`
   (`setTaskStatus` nimmt jede der Listen an). Prüfen: Aufgaben-Seite,
   Board, Archiv um Mitternacht, Umwandeln hin und zurück mit „Rückgängig“.
3. **Kennzahlen je Kategorie und Wortlaut „Fälligkeit“:** `entry-stats.js`
   nach der Tabelle in Abschnitt 3, Zustände aus Abschnitt 4 (Überfällig in
   `--prio-jetzt`, Erledigt gedämpft), Abschnitt „Zeit“ in `entry-facts.js`.
   Neuer Token `--stat-muted` nur, falls „gedämpft“ nicht mit `--muted`
   auskommt. Prüfen: jede Kategorie einmal öffnen, hell und dunkel, 375 px,
   Desktop-Spalte.
4. **Erinnerung setzen:** `src/data/reminders.js` (Daten: setzen, entfernen,
   mitwandern, verbrauchen, fällige und verpasste ermitteln — kein DOM),
   `date-field.js` bekommt einen zweiten Modus „Erinnerung“ (schreibt
   `remindAt` statt `date`), `src/ui/remind-sheet.js` (die fünf Optionen),
   Zeilen im Abschnitt „Zeit“ antippbar (`handleDetailsClick`). Meldung unten
   nach dem Setzen. Prüfen: setzen, ändern, leeren, Fälligkeit verschieben
   (Erinnerung wandert mit), Fälligkeit entfernen.
5. **Banner von oben:** `src/shell/reminder-banner.js` (Zeitgeber,
   Warteschlange, die drei Wege zu schließen, Nachholen), `styles/
   reminder-banner.css`, Tokens `--banner-gap`, `--banner-anim`,
   `--banner-drop` in `tokens.css` — **die hat 399 Zeilen**: die
   Banner-Werte kommen deshalb nach `tokens-pages.css` (391 Zeilen, Platz für
   drei Zeilen plus Kommentar) oder es wird zuvor ein Block ausgelagert.
   Eintrag in der Stil-Übersicht oben in `tokens.css`, `<link>` in
   `index.html`, `registerLoader` nicht nötig (klein, muss beim Start
   laufen). Anmeldung in `main.js`. Prüfen: Erinnerung auf „in 1 Minute“
   setzen, warten; App in den Hintergrund und zurück; Erinnerung in der
   Vergangenheit setzen → Nachholen beim Neuladen; zwei Erinnerungen
   gleichzeitig → nacheinander; Haken bei Aufgabe → Status „Erledigt“ und
   Zeile durchgestrichen; × bei Notiz; Wischen; Antippen öffnet die Seite und
   Zurück-Pfeil führt dorthin zurück, wo man war.
6. **Arbeitsbereich bekommt die Karte:** `entry-details.js` wird so
   umgebaut, dass die Karte einen Host und einen „Gegenstand“ (Eintrag oder
   Arbeitsbereich) bekommt statt fest `dom.entryPanelNotes` und
   `ui.currentEntryId`; `workspace-page.js` hängt sie unter den Text,
   `entry-facts.js` bekommt `workspaceFacts(workspace)`. Das ist der größte
   Umbau und steht deshalb zuletzt; die Schritte 1–5 sind ohne ihn schon
   rund.
7. **Texte:** README „Flows zum Durchprüfen“ um Fälligkeit, Erinnerung und
   Banner ergänzen; `docs/desktop-flows.md` um die Spalte rechts; diesen Plan
   als umgesetzt markieren.

Icons: für das Blatt „Erinnerung“ und die Zeile im Abschnitt „Zeit“ fehlt
eine Glocke. Der Nutzer liefert Lucide `bell` und `bell-off` nach
`assets/icons/sprite-2.svg`; bis dahin `clock` als Platzhalter. Das Banner
selbst braucht kein neues Icon (Icon der Kategorie, `check-circle`, `close`).

## 12. Prüfen (zusätzlich zur Kette aus der SKILL.md)

- Leerer Speicher: neue Aufgabe zeigt „— / Fälligkeit“, neues Projekt
  „Später | — | Offen“, neue Notiz „0 Wörter | — | gerade eben“.
- Voller Speicher: alte Termine und Projekte haben nach dem Laden Status
  und Dringlichkeit; alte Dokumente „Entwurf“; keine Zeile im Kalender
  verschoben (Notiz mit Erinnerung bleibt am Tag des Anlegens).
- Aufgabe fällig gestern, offen: „Überfällig“ rot; abhaken: Datum bleibt,
  Farbe weg; wieder öffnen: wieder rot.
- Termin: Uhrzeit ändern → Beschriftung folgt; Ganztägig → „Ganztägig“.
- Erinnerung an einer Aufgabe „1 Std vorher“, dann Fälligkeit um einen Tag
  verschieben → Erinnerung liegt wieder eine Stunde davor.
- Banner: hell und dunkel, 375 px, über einem offenen Blatt (liegt darüber),
  während der Tastatur (liegt oben, stört das Schreiben nicht), am Desktop
  oben mittig in der Bühne. Konsole leer.
- Zurück-Pfeil und Browser-Zurück nach dem Öffnen aus dem Banner.

## 13. Offene Punkte für morgen

1. **Termin-Status:** dieselbe Liste wie die Aufgabe (Offen / In Arbeit /
   Erledigt) — oder eine eigene (Geplant / Stattgefunden / Abgesagt)? Der
   Plan nimmt dieselbe Liste: ein Muster, ein Blatt. Eigene Wörter wären ein
   drittes Status-Set.
2. **Mittlere Kennzahl beim Termin:** Tag mit Uhrzeit als Beschriftung
   (Plan) oder auch hier „Fälligkeit“ für ein völlig gleiches Bild bei allen
   drei Zeit-Kategorien?
3. **Uhrzeit oben:** Variante A (Plan: nur der Tag, Uhrzeit im Abschnitt
   „Zeit“) oder Variante B („Fällig 14:00“ als Beschriftung, sobald eine
   Uhrzeit gesetzt ist)?
4. **Erinnerung einmalig** (Plan, wie ein Wecker) oder bleibt sie nach dem
   Banner als „erinnert am …“ sichtbar stehen?
5. **Banner-Knopf bei Aufgabe, Projekt, Termin:** Haken = Erledigt (Plan)
   oder nur Schließen, Erledigen ausschließlich in der App?
6. **Arbeitsbereich-Karte** (Schritt 6) jetzt mitbauen oder erst einmal nur
   die Einträge?
