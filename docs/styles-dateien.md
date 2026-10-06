# Welche Stil-Datei macht was

Übersicht aller Dateien unter `styles/` mit einem Satz dazu. Sie stand bis
Oktober 2026 im Kopf von `styles/tokens.css` und ist hierher gezogen, weil
`tokens.css` an der Grenze von 400 Zeilen stand.

**Neue CSS-Datei anlegen heißt:** hier eine Zeile ergänzen, in `index.html`
als `<link>` an der richtigen Stelle der Ladereihenfolge eintragen. Den
Versionsstempel setzt der Git Commit Manager nach dem Mergen (CLAUDE.md, Abschnitt 6).

Ladereihenfolge der Werte-Dateien (`index.html`): `tokens.css` →
`tokens-nav.css` → `tokens-pages.css` → `tokens-entry.css` → `tokens-dark.css`,
danach die Bereichs-Stile; die Fassungen laden ihre Werte vor ihren Regeln
(`tokens-android.css` → `tokens-android-dark.css` → `android*.css`,
`tokens-ios.css` → `ios*.css`, `tokens-desk.css` → `desk*.css`).
Die Dunkel-Werte stehen immer **nach** den hellen, damit sie gewinnen.

| Datei | Was sie macht |
| --- | --- |
| `styles/tokens.css` | die Werte, die auf jeder Seite wirken: Grundfarben, Schriftgrößen, Kopfzeile, Eingabefeld, Meldung, Wischen, Menüs und Blätter |
| `styles/tokens-nav.css` | die Werte der Navigationsleiste unten und der Tab-Pillen über den Arbeitsbereichen |
| `styles/tokens-pages.css` | die Werte, die nur eine einzelne Seite betreffen (auch das Update-Fenster) |
| `styles/tokens-entry.css` | die Werte für den Inhalt eines Eintrags: Bausteine, Karten, Lesezeichen, Cover, Details, Zeichnung, Videoplayer |
| `styles/tokens-dark.css` | dieselben Werte, soweit sie im Dunkeln anders sind |
| `styles/base.css` | Grundgerüst: Seite, Gerätefenster, Inhaltsbereich, Icons |
| `styles/top-bar.css` | Kopfzeile: Level-Anzeige, Suchleiste, Profil-Knopf |
| `styles/overview.css` | Startseite: die vier Karten und die Tab-Pillen |
| `styles/overview-more.css` | Startseite: zweite Kartenseite zum Schieben, Karten „Demnächst verfügbar“, Pfeil neben „Projekte“ |
| `styles/rows.css` | Listenzeilen, Kopfzeile einer Unterseite |
| `styles/swipe-rows.css` | Wisch-Zeile: Knöpfe dahinter, Einfärben nach dem Halten |
| `styles/empty-state.css` | Platzhalter für leere Listen (eigene Werte, siehe dort) |
| `styles/entry.css` | Seite eines Eintrags: Titel, Text, verknüpfte Einträge; styles/entry-desk.css: Desktop-Kopfzeile und Details rechts |
| `styles/page-cover.css` | Eintrag und Arbeitsbereich: Farbverlauf oben (Cover); Eintrag: eigenes Icon über dem Titel |
| `styles/entry-details.css` | Eintrag: gekürzter Text mit „Mehr anzeigen“ und die Karte „Details“ am Ende von „Inhalt“ |
| `styles/details-sheet.css` | Blatt „Details“ von unten (iOS-Optik, Android überstimmt es) und Info-Knopf; die Karte am Textende ist ausgeblendet |
| `styles/blocks.css` | Inhalt eines Eintrags: Stichpunkte, Zahlen, runde Checkboxen, Trennlinie |
| `styles/embeds.css` | Inhalt eines Eintrags: Karten für Standort, Video und Web-Lesezeichen |
| `styles/slash-menu.css` | Inhalt eines Eintrags: das „/“-Menü mit Gruppen und Kacheln; styles/block-bar.css: Leiste über der Tastatur (Handy), Auswahl an Stelle der Tastatur |
| `styles/navigation.css` | untere Navigationsleiste |
| `styles/composer.css` | Eingabefeld zum Anlegen |
| `styles/composer-attachments.css` | Kachelreihe der Anhänge im Eingabefeld |
| `styles/toast.css` | kurze Meldung über der Navigation nach dem Anlegen; styles/reminder-banner.css: Erinnerung als Banner von oben |
| `styles/update.css` | Fenster „Neue Version verfügbar“ mit Später und Aktualisieren |
| `styles/overlays.css` | Auswahl-Blatt, kleines Menü, Blätter von unten |
| `styles/sheet-tabs.css` | Auswahl-Blatt mit Tabs (Aufgabe): Kopf mit Icon, Trennlinie, Pillen, Haken, Hereingleiten |
| `styles/sheet-tiles.css` | Auswahl-Blatt: Raster aus Icon-Kacheln („Icon wählen“) |
| `styles/sheet-progress.css` | Auswahl-Blatt: Fortschrittszeile mit Satz und linearem Balken (Export, solange die Datei entsteht) |
| `styles/details.css` | Blatt „Details“ und kleiner Titel in der Kopfzeile einer Detailseite |
| `styles/modal-top.css` | runder Pfeil in einem Blatt, der nach oben rollt |
| `styles/search.css` | Suchseite; styles/search-refine.css: Art-Reiter, Sortieren/Filter, Chips; styles/search-overlay.css: Overlay am Handy |
| `styles/progress.css` | Fortschritt-Blatt: Ring, Verlauf, Historie |
| `styles/milestones.css` | Fortschritt-Blatt: Karte und Seite „Meilensteine“ mit Plaketten und Stufen-Leiter |
| `styles/profile.css` | Profil-Blatt: Bild, Nutzungszeit, Serie, Listen; styles/account.css: Konto- und Daten-Seiten; styles/profile-name-edit.css: Name im Profilkopf antippen und bearbeiten |
| `styles/usage-split.css` | Nutzungszeit: Karte „Wo die Zeit hingeht“ mit Band und Bereichszeilen; styles/streak-legend.css: Serie, Erklärung unter dem Punkte-Raster |
| `styles/avatar-crop.css` | Ausschnitt fürs Profilbild: Fenster, Zoom-Regler, Auswählen |
| `styles/data-transfer.css` | Einstellungen › Daten: Textfeld zum Einfügen und Erklärungen der Export-Stufen |
| `styles/settings.css` | Einstellungs-Blatt: Darstellung und Haken-Zeilen, dazu die Analyse-Kacheln des Fortschritt-Blatts; styles/support.css: Feedback-Formular und Danksagungen |
| `styles/tasks.css` | Aufgaben-Seite: Pillen der Ansichten, Liste, Haken, Anlegen durch Tippen; styles/tasks-desk.css: Desktop-Werkzeuge und Spalten |
| `styles/tasks-board.css` | Aufgaben-Seite: die Spalten des Kanban-Boards (auch für das Board der Projekte); styles/projects-board.css: was dort bei Projekten anders ist; styles/tasks-select.css: Auswahlmodus (Kreise, Zählzeile, Leiste, Stapel) |
| `styles/task-status.css` | Haken vor Aufgaben in jeder Liste, Kategorie-Pille oben auf jeder Eintragsseite |
| `styles/tasks-settings.css` | Karte „Ansicht“ über der Navigation der Aufgaben-Seite: Ebene, Segment, Filter |
| `styles/tasks-switch.css` | Schalter an/aus der Karte „Ansicht“: Handy-Grundform, am Desktop Material 3 mit Haken und Kreuz (Android: `android-sheet.css`) |
| `styles/view-end.css` | wo Übersicht, Projekte und Arbeitsbereiche unten enden; die Pille „Zum Archiv“ darüber |
| `styles/calendar.css` | Kalender: Datum, Wochenstreifen, Rollen-Blatt, Knopf „Heute“ im Panel „Ansicht“ |
| `styles/calendar-rings.css` | Kalender: Ringe mit Murmeln um die Tageszahlen |
| `styles/calendar-panel.css` | Kalender: graue Fläche mit Stundenraster und Liste; styles/calendar-week.css: Desktop-Werkzeugzeile, Woche, Monat |
| `styles/columns-sheet.css` | Blatt „Spalten“ eines Boards: Reihenfolge per Griff „=“, Auge zum Aus- und Einblenden |
| `styles/sort-wheels.css` | Blatt „Sortieren“: Rollen „Wonach“ \| „Reihenfolge“; styles/filter-sheet.css: „Filtern“ mit Übersicht und Unterseiten je Abschnitt (iOS, Desktop) |
| `styles/info-dialog.css` | kleiner Erklär-Dialog hinter einem ⓘ im Auswahl-Blatt |
| `styles/media.css` | Medien- und Ressourcen-Seite; styles/media-bar.css: Leiste unten; styles/recorder.css: Audio-Aufnahme; styles/media-desk.css: Desktop |
| `styles/bookmarks.css` | Lesezeichen-Seite: Zeilen mit großer Kachel, Website und Herkunft |
| `styles/page-hero.css` | Sammlungen: großer Kopf mit Icon und zweizeiligem Satz (im Menü einschaltbar) |
| `styles/viewer.css` | Dateiansicht: Foto, Video, Aufnahme und PDF |
| `styles/drawing.css` | Zeichenfläche und Werkzeugleiste |
| `styles/drawing-items.css` | Zeichnung: Text, Formen, Bilder und Notizzettel auf der Fläche, Rahmen und kleine Leiste des gewählten Dings |
| `styles/drawing-desk.css` | Zeichnung am Desktop: Werkzeugleiste über die ganze Breite unten oder ganze Höhe links, Griff und Ziele zum Andocken |
| `styles/drawing-pop.css` | Zeichnung: Fenster an der Leiste — Strichbreite, Formen, Farbwähler, weitere Werkzeuge hinter „⋯“ |
| `styles/drawing-attach.css` | Zeichnung: Fenster „Anhang einfügen“ mit den Reitern Medien und Eigene Dateien |
| `styles/video-player.css` | YouTube-Player als dunkler Block an der Stelle einer Video-Karte (Eintrag, Lesezeichen) |
| `styles/android.css, ios.css` | Fassungen Android/iOS; dazu android-tabs/-fab/-sheet/-archive/-view-btn/-entry/-list/-reorder/-card/-bottom-sheet/-details (Blatt „Details“: Kopf mit Titel, Verknüpfen, Zeilen, Leiste „Als erledigt markieren“)/-filter-sheet (Filtern als Chips)/-segmented/-tab-snap/-overview-gaps/-quiet-tools/-calendar/-calendar-tabs (Reiter der Kalenderliste mit Symbol „Ansicht“)/-calendar-rings (Tage im Wochenstreifen nach Material 3, ohne Experiment)/-pages (Einstellungen und Fortschritt als ganze Seite)/-pages-content (deren Inhalt nach Material 3, ohne Experiment)/-settings-tiles (Einstellungen: jede Zeile eine Kachel)/-settings-groups (Einstellungsliste als Kachelgruppen ohne Titel, Profilkarte)/-overview-sheet (Kartenreihe mit Peek in beiden Android-Fassungen, Projekte-Container nur im Experiment)/-experiment-surface (Experiment: gemeinsame Fläche von Kacheln, Container und Leiste im Hellen; Trennlinie unter „Projekte“ bei ausgeblendeten Reitern)/-tabs-off (Schalter „Tabs anzeigen“ in beiden Android-Fassungen), ios-segmented/-menu, tokens-android/-ios.css |
| `styles/tokens-android.css` | die Werte der Android-Fassung (Material 3), hell |
| `styles/tokens-android-dark.css` | Android: die Farben im Dunkeln, die Kacheln im Hellen und die Flächen von „Android (Experiment)“ |
| `styles/tokens-ios.css` | die Werte der iOS-Fassung |
| `styles/tokens-desk.css` | die Werte der Desktop-Fassung (Spalten, Flächen, große Zahlen) |
| `styles/desk.css` | Desktop: Raster aus Seitenleiste, Reiterzeile, Seite und rechter Spalte; Zuklappen, Suchfeld, Eingabefeld unten |
| `styles/desk-head.css` | Desktop: Wortmarke mit Klapp-Knopf; Kopfzeile mit Zurück, Vorwärts, Pfad samt Knöpfen der Seite und Knopf fürs Seitenfenster |
| `styles/desk-overlays.css` | Desktop: große Blätter, Auswahl-Blatt, Menü und Update-Fenster als Dialoge in der Mitte, samt Auftauchen |
| `styles/desk-views.css` | Desktop: wie Übersicht, Kalender, Aufgaben, Medien und Eintrag die Breite nutzen |
| `styles/desk-hover.css` | Desktop: Überfahren, Drücken und Tastatur-Rahmen für Seite, Kopfzeile und Dialoge |
| `styles/desk-nav.css` | Desktop: Seitenleiste mit „Neu“, Sammlungen, Tab-Gruppen; ihr Fuß (Einstellungen, Stufe, Hell/Dunkel, Update) in styles/desk-nav-foot.css |
| `styles/desk-nav-pages.css` | Desktop: Icon-Zeile oben in der Seitenleiste (Übersicht, Kalender, Aufgaben, Medien, Suche) mit Hinweis beim Überfahren |
| `styles/desk-kbd.css` | Desktop: dezente Tasten-Schilder und das Auftauchen der Blöcke der Seitenleiste |
| `styles/search-palette.css` | Desktop: Such-Palette in der Fenstermitte (⌘K, „/“, Suchfeld, Such-Knopf) |
| `styles/desk-settings.css` | Desktop: Profil als Seite mit Untermenü; styles/shortcuts.css: Liste der Kurzbefehle |
| `styles/desk-rail.css` | Desktop: rechte Spalte mit nächstem Termin, Aufgaben und zuletzt Geöffnetem |
| `styles/desk-rail-tiles.css` | Desktop: die zwei Kacheln oben rechts (Eingang-Stapel, Stufen-Ring) und die Tagesleiste |
| `styles/desk-rail-views.css` | Desktop: Karten der rechten Spalte je Seite (Monat, Tag, Zahlen, Balken, Vorschau) |
| `styles/desk-side.css` | Desktop: Seitenfenster rechts — Platz im Raster, Rahmen und Kopf (Zurück, Breiter, Minimieren, Schließen) |
| `styles/desk-side-views.css` | Desktop: Inhalt des Seitenfensters — Auswahl „Öffnen“, Browser, Medien, Datei vom Gerät und Listen |
| `styles/desk-side-doc.css` | Desktop: Text der Lese-Vorschau im Seitenfenster (Absätze, Checkboxen, Karten mit Link, „Darin“) |
| `styles/dashboard.css` | Desktop: Zahlen der Übersicht, Band und zwei Karten (Fortschritt); Bewegung in dashboard-motion.css |
| `styles/dashboard-stage.css` | Desktop: Bühne der Übersicht wie Apple Arcade; ihre Reihe verknüpfter Einträge in styles/dashboard-shelf.css; styles/desk-progress.css: Fortschritt als Seite |
