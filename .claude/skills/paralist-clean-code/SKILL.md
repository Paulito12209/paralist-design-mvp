---
name: paralist-clean-code
description: >-
  Verbindliche Regeln für dieses Projekt (paralist-design-mvp): maximal 400
  Zeilen je Datei, feste Ordnerstruktur unter src/ und styles/, eindeutige
  deutsche Kommentare, Kommentar-Header mit allen anpassbaren Werten,
  Lazy Loading und Performance, Prüfen vor dem Abschließen, Commit nach jeder
  Änderung. Use when writing or editing ANY file in this project — JavaScript,
  CSS, HTML, manifest or docs — and before reporting a change as done.
---

# Clean Code in paralist-design-mvp

Diese Regeln gelten für **jede** Änderung in diesem Projekt. Sie stehen über
allgemeinen Gewohnheiten: wenn eine Regel hier etwas anderes sagt, gilt diese Regel.

Was das Projekt ist: ein Web-Entwurf der iOS-App „Paralist“. Gebaut werden soll
daraus später eine **native Android-App** — das Web ist nur die schnelle Probe.
Entscheidungen deshalb so treffen, dass sie sich nach Android übertragen lassen
(Material-3-Maße, die schon im Code stehen, beibehalten).

## 1. Maximal 400 Zeilen je Datei

Keine Datei im Projekt überschreitet 400 Zeilen — auch nicht CSS, HTML oder
Assets. Wird eine Datei größer, wird sie **vor** dem Weiterarbeiten geteilt,
und zwar nach Zuständigkeit, nicht willkürlich in der Mitte.

Prüfen:

```bash
find . -path ./node_modules -prune -o -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.md' \) -print | xargs wc -l | sort -rn | head
```

Richtwert: eine Datei hat eine Aufgabe. 60–250 Zeilen sind normal, 400 ist die
harte Grenze, nicht das Ziel.

## 2. Struktur

```
index.html                 Gerüst: nur Markup, keine Logik, keine Stile
manifest.webmanifest       Angaben für „Zum Startbildschirm hinzufügen“
assets/icons/              sprite.svg (alle Icons) und die App-Icons
src/main.js                Startpunkt: Zustand laden, Bereiche anmelden, zeichnen
src/core/                  Werkzeuge ohne App-Wissen (DOM, Datum, Format, Speicher, Bus, Lazy)
src/data/                  Zustand, Abfragen, Änderungen, Beispieldaten — kein DOM
src/ui/                    wiederverwendete Bausteine (Zeilen, Blätter, Menüs, Gesten, Router)
src/features/<bereich>/    je Seite ein Ordner (overview, calendar, media, …)
src/shell/                 Kopf- und Fußzeile, Tastatur, Icon-Sammlung
styles/tokens.css          ALLE Farben, Größen, Abstände + Übersicht aller Stil-Dateien
styles/<bereich>.css       je Bereich eine Datei
```

Richtungsregel, damit keine Kreise entstehen:

```
shell/features  ->  ui  ->  data  ->  core
```

- `core/` kennt nichts über die App.
- `data/` fasst **nie** das DOM an.
- `ui/` und `features/` sprechen sich über `src/core/bus.js` ab, nicht durch
  gegenseitige Importe.
- Neue Seite? Neuer Ordner unter `src/features/` und eine Datei unter `styles/`.

## 3. Kommentar-Header mit allen anpassbaren Werten

Jede Datei beginnt mit einem Kommentarblock, der sagt: was die Datei macht, wo
sie liegt und **welche Werte man darin anpassen kann** — in Alltagssprache, nicht
als Wiederholung des technischen Namens.

```css
/*
 * Medien-Seite: Kachelraster nach Monaten.
 * Pfad: styles/media.css
 *
 * ANPASSBARE WERTE (alle in styles/tokens.css)
 * -----------------------------------
 * --media-gap        -> Fuge zwischen den Kacheln
 * --media-btn-size   -> Größe der runden Knöpfe über der Navigation
 */
```

```js
/*
 * Die Werkzeuge der Zeichenfläche.
 * Pfad: src/features/drawing/drawing-tools.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * tools[*].width -> Strichbreite des Werkzeugs
 * tools[*].alpha -> Deckkraft (1 = volldeckend, 0.35 = durchscheinend)
 */
```

Enthält eine Datei keine solchen Werte, steht dort ausdrücklich
„Keine anpassbaren visuellen Werte“ und wohin man stattdessen schaut.

`styles/tokens.css` führt zusätzlich die Liste **aller** Stil-Dateien mit einem
Satz dazu. Neue Datei anlegen heißt: diese Liste ergänzen.

## 4. Werte zentral halten

Farben, Schriftgrößen und Abstände stehen als CSS-Variablen in
`styles/tokens.css`; die übrigen Stil-Dateien verweisen nur darauf. Feste Zahlen
in JavaScript (Verzögerungen, Grenzwerte, Größen) bekommen oben in ihrer Datei
einen benannten `const` und stehen im Header — niemals mitten im Code als
nackte Zahl.

## 5. Kommentare müssen eindeutig sein

- Auf **Deutsch**, kurz, konkret.
- Sie erklären das **Warum**, nicht das Was. `/* Zähler um eins erhöhen */` ist wertlos.
- Bei einem anpassbaren Wert steht, was sich sichtbar ändert, wenn man ihn ändert.
- Jede CSS-Eigenschaft außerhalb der gewohnten Liste (`position`, `transform`,
  `transition`, `z-index`, `object-fit`, `container-type`, …) und jedes
  seltenere HTML-Element (`canvas`, `dialog`, `svg`, `input type=file`) bekommt
  direkt daneben einen Satz, warum es nötig ist.
- Gewohnte HTML-Elemente: `div, section, nav, ul, li, header, footer, main,
  img, p, h1–h6, button, input, textarea, span`. Alles andere begründen.
- Kein Kommentar, der beschreibt, was einmal war („früher hieß das …“) — außer
  in `migrate()` in `src/data/state.js`, wo genau das die Aufgabe ist.

## 6. Performance ist eine Anforderung, kein Extra

- **Nachladen:** große Bereiche (Kalender, Medien, Suche, Fortschritt, Profil,
  Zeichnung, Ressourcen, Dateiverarbeitung) kommen über `src/core/lazy.js` erst
  beim ersten Öffnen dazu und werden in Ruhephasen vorgeladen. Neue große
  Bereiche genauso anmelden.
- **Nur zeichnen, was sichtbar ist:** ein Bereich reagiert auf
  `events.dataChanged` immer mit `if (isViewActive("…"))`. Nie eine versteckte
  Seite neu aufbauen.
- **Ein Klick-Empfänger je Liste:** Ereignisse hängen am Container
  (`src/ui/list-clicks.js`), nicht an jeder Zeile.
- **Kein Speichern bei jedem Tastendruck:** Tippen nutzt `scheduleSave()`,
  echte Änderungen `saveState()`.
- **Nicht in jeder Bewegung messen:** CSS-Werte über `cssNumber()` aus
  `src/core/css-vars.js` holen (gemerkt), nicht `getComputedStyle` in
  `pointermove`. Bewegungen laufen über `transform`, nie über `top`/`left`.
- **Timer nur, solange sie gebraucht werden:** die Jetzt-Linie tickt nur bei
  offener Kalenderseite.
- Bilder in Listen mit `loading="lazy" decoding="async"`.

## 7. Keine Bugs — vor dem Abschließen prüfen

Eine Änderung ist erst fertig, wenn diese Kette durchlaufen ist:

1. **Importe und Syntax** — jeder Import zeigt auf eine Datei, die den Namen
   wirklich exportiert; jede Datei lässt sich als ES-Modul lesen:
   ```bash
   for f in $(find src -name '*.js'); do cp "$f" "/tmp/$(basename $f).mjs"; node --check "/tmp/$(basename $f).mjs" || echo "FEHLER $f"; done
   ```
2. **Im Browser öffnen** — der Entwicklungsserver läuft auf
   `http://localhost:4173` (`python3 -m http.server 4173`, Konfiguration in
   `.claude/launch.json`). Läuft der Port schon, einfach dorthin navigieren,
   nicht den Port ändern.
3. **Konsole muss leer sein** — keine Fehler, keine Warnungen.
4. **Betroffene Flows anklicken**, nicht nur die geänderte Zeile lesen. Die
   Liste steht in `README.md` unter „Flows zum Durchprüfen“; die Startseite ist
   die wichtigste.
5. **Leerer Speicher und voller Speicher** — einmal mit `localStorage.clear()`
   neu laden (Beispieldaten) und einmal mit vorhandenen Daten (Migration).
6. **Hell und Dunkel** ansehen und **375 px Breite** prüfen.
7. **Zurück-Pfeil und Browser-Zurück** auf jeder berührten Seite.

Achtung, zwei Stolperstellen, die schon Fehler verursacht haben:

- `el(id)` aus `src/core/dom.js` merkt sich Elemente. Felder, die erst beim
  Zeichnen entstehen (`tab-name-input`, `workspace-name-input`, `cal-now`),
  werden bei jedem Zeichnen ersetzt — `el()` prüft deshalb `isConnected`. Wer
  dort etwas ändert, prüft Umbenennen von Tab und Arbeitsbereich noch einmal.
- Es darf **nie** zwei Funktionen mit demselben Namen für verschiedene Dinge
  geben. Dauer-Angaben heißen `formatSpan` („1 Std 20 Min“) und `formatClock`
  („1:20“), Tagesüberschriften `activityDayHeading` und `historyDayHeading`.
  Die alte Fassung hatte je zwei gleichnamige Funktionen — die spätere gewann
  still und die Nutzungszeit im Profil zeigte Unsinn.

## 8. Nach jeder abgeschlossenen Änderung committen

- Sofort committen, ohne nachzufragen.
- **Nur die eigenen Änderungen stagen.** An diesem Projekt arbeiten mitunter
  mehrere Sitzungen gleichzeitig: vor dem Commit `git diff -U0` lesen und
  prüfen, dass jeder Block von der eigenen Arbeit stammt. Fremde Blöcke nicht
  mitnehmen, sondern gezielt nur die eigenen in den Index legen.
- Commit-Nachricht kurz, auf das **Warum** bezogen.
- Nie `git stash`, `git reset --hard` oder `--force`. Keine Secrets committen.
