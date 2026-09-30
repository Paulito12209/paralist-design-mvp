# Übersicht: Projekte nach vorn, Arbeitsbereiche eine Ebene tiefer

Stand: 30. September 2026. Gilt für Handy und Desktop. Umsetzung nach den
Regeln in `.claude/skills/paralist-clean-code/SKILL.md`: erst
`python3 tools/version.py`, dann `python3 tools/check.py`, dann im Browser
prüfen, dann committen — je Schritt aus Abschnitt 10 ein Commit.

## 1. Zielbild

Die Hierarchie bleibt, wie sie ist: Arbeitsbereiche ganz oben, darin
Projekte, darin alles andere. Ein Projekt ist weiter ein Eintrag vom Typ
`projekt` mit seinen `places`. Es tauscht nur die Anzeige:

- **Übersicht am Handy:** die vier Karten heißen Eingang, Favoriten,
  **Arbeitsbereiche**, Ressourcen. Darunter steht statt der Arbeitsbereiche
  die Sektion **„Projekte ↗“** mit Ansichts-Pillen, der Projektliste, der
  Zeile „Projekt hinzufügen“ und „Zum Archiv“.
- **Seite Arbeitsbereiche** (Karte 3, `#/arbeitsbereiche`): behält die
  Tab-Pillen und bekommt alles, was heute nur die Übersicht kann — Tab
  anlegen, Arbeitsbereich anlegen, umbenennen, „Arbeitsbereich hinzufügen“,
  „Zum Archiv“.
- **Seite Projekte** (`#/projekte`, hinter „Projekte ↗“ und dem Kürzel G P):
  dieselben Ansichts-Pillen, dieselbe Liste und dieselbe Karte „Ansicht“
  wie die Übersicht.
- **Ansichten der Projekte** funktionieren wie die Ansichten der
  Aufgaben-Seite: „Alle“ fest, eigene Ansichten mit handverlesener
  Projektliste, Sortierung mit Richtung und Filtern. Wortwahl in der
  Oberfläche: immer **„Ansicht“**, nie „Tab“ — Tabs sind die der
  Arbeitsbereiche, zwei Dinge mit demselben Namen wären verwirrend.
- **Desktop:** die Seitenleiste zeigt die Projekte je Ansicht statt der
  Arbeitsbereiche je Tab. Arbeitsbereiche stehen als Sammlung in der Leiste
  und öffnen ihre Seite. Zahlen und Bühne der Desktop-Übersicht bleiben
  unverändert. Ein Abschnitt „Arbeitsbereiche“ unter der Bühne ist
  **geparkt** (Abschnitt 13) und wird jetzt nicht gebaut.

## 2. Entschiedene Punkte

- Sortierung nach dem Muster von Google Drive: ein Blatt mit „Sortieren
  nach“ und „Sortierungsrichtung“, jede Option hat beide Richtungen
  (Abschnitt 6). Den Abschnitt „Ordner“ gibt es nicht.
- Icon „Projekt hinzufügen“ selbst bauen: die vorhandene Rakete mit kleinem
  Plus, so wie `task-plus` entstanden ist, in `assets/icons/sprite.svg`.
- Vorgabe-Sortierung von „Alle“: Zuletzt geöffnet, Neueste zuerst — so steht
  das Laufende oben, ohne dass man etwas einstellt. Neue Ansichten sind
  Kopien von „Alle“.
- Kürzel: Arbeitsbereiche als Sammlung bekommt **G B**, G P bleibt bei
  Projekten.
- Keine Punkte für eine neue Ansicht (wie bei den Aufgaben-Ansichten). Tabs
  geben weiter Punkte wie heute.

## 3. Datenmodell

Neu sind nur die Ansichten. Muster: `src/data/task-views.js`.

```
state.projectViews = [{ id: 1, name: "Alle", icon: null, fixed: true, ...projectViewDefaults }]
state.activeProjectViewId = 1
projectViewDefaults = { sort: "geoeffnet", sortAsc: false, place: "alle", favoritesOnly: false, ids: [] }
```

- `ids` ist die handverlesene Liste. Regel für die Liste einer Ansicht: sind
  `ids` gefüllt, zeigt sie genau diese Projekte (ohne archivierte). Sind sie
  leer, greifen `place` und `favoritesOnly`. Danach wird sortiert.
  „Alle“ hat weder `ids` noch Filter, darf aber sortieren
  (`fixed` erzwingt das wie bei `updateTaskView`).
- `place`: `"alle"`, `"inbox"` (Projekte ohne Ort) oder ein Verweis `w:<id>`.
- Sortierungen (`projectSorts` in der Konfiguration, mit Beschriftung je
  Richtung): `name` (A bis Z / Z bis A), `erstellt` und `geaendert`
  (Neueste zuerst / Älteste zuerst; geändert = `editedAt`, sonst
  `createdAt`), `geoeffnet` (letzter Zeitpunkt aus `state.opens` über
  `src/data/opens.js`, sonst `editedAt`, sonst `createdAt`), `eintraege`
  (Meiste zuerst / Wenigste zuerst; Zahl aus `entriesOf(entryRef(id))`).
- `ui.editingProjectViewId` (Name wird getippt) und `ui.projectDraftView`
  (Ansicht, aus der „Projekt hinzufügen“ kam; das Eingabefeld liest es beim
  Anlegen einmal aus und trägt das neue Projekt in deren `ids` ein — wie
  `taskDraftColumn`). Kam das Projekt aus einer Ansicht ohne `ids`, aber mit
  Arbeitsbereichs-Filter, bekommt es diesen Arbeitsbereich als Ablageort;
  sonst wäre es sofort unsichtbar.
- `src/data/state.js`: `snapshot`, `loadState`, `migrate`. Fehlt die Liste
  im alten Stand, entsteht „Alle“; steht „Alle“ nicht vorn, nach vorn; `ids`
  auf existierende Projekte bereinigen; `activeProjectViewId` auf eine
  vorhandene Ansicht.
- `deleteEntry` in `src/data/mutations.js` streicht ein gelöschtes Projekt
  aus allen `ids` (wie `dropLinksTo` bei Verknüpfungen). Archivierte bleiben
  in `ids` und kommen beim Zurückholen wieder.
- Neue Datei `src/data/project-views.js`: `allProjectView`, `findProjectView`,
  `activeProjectView`, `selectProjectView`, `updateProjectView`,
  `addProjectView`, `duplicateProjectView`, `beginRenameProjectView`,
  `commitProjectViewName`, `setProjectViewIcon`, `moveProjectView`,
  `deleteProjectView`, `toggleProjectInView(id)`, `visibleProjects(view)`.
  Nicht in `queries.js`: die ist mit 350 Zeilen fast voll.

## 4. Übersicht am Handy

Dateien: `index.html` (Abschnitt `#view-home`), `src/features/overview/overview.js`,
neu `src/features/overview/project-views.js` (Pillen, Menü, Namensfeld) und
`src/features/overview/projects.js` (Liste, Hinzufügen-Zeile, Archiv-Pille,
Karte „Ansicht“). `tabs.js` und `workspaces.js` ziehen auf die Seite
Arbeitsbereiche um (Abschnitt 5).

- Karte 3 in `overviewPages` (`src/data/config.js`) wird
  `{ title: "Arbeitsbereiche", icon: "layers", kind: "workspaces" }`.
  `pageCount` bekommt den Zweig „aktive Arbeitsbereiche, ohne archivierte“.
  `coloredIcons` in `overview.js` bekommt `layers`, die Farbe ist ein neuer
  Token `--workspace-icon-color` in `styles/tokens.css` — dasselbe Orange
  wie die Arbeitsbereiche im Fortschritt (`xpItems.arbeitsbereich`).
- Sektion darunter: Überschrift „Projekte ↗“ (`data-open-projects`), dann die
  Pillenzeile **aus JS gezeichnet** wie `taskViewsMarkup` in
  `src/features/tasks/tasks-views.js`: Ansichten links, kleines Plus für eine
  neue Ansicht, rechts hinter der Trennlinie der Knopf „Projekt hinzufügen“
  (neues Icon). Dann die Liste aus `entryRow` (`src/ui/rows.js`), die Zeile
  „Projekt hinzufügen“, „Zum Archiv“ mit der Pille `projekt`, am Ende die
  Karte „Ansicht“ (Abschnitt 7).
- `#workspace-tabs` und `#workspace-list` verschwinden aus `index.html`; die
  Getter in `src/core/dom.js` heißen dann `projectViews` und `projectList`.
  `tools/check.py` prüft die IDs.
- „Projekt hinzufügen“ (Knopf und Zeile) setzt `ui.projectDraftView` und
  meldet `emit(events.createRequested, "projekt")`. Der leere Zustand der
  Liste nutzt `emptyStates.projects` aus `page.js` (dorthin oder in eine
  gemeinsame Datei, damit Übersicht und Seite denselben Text zeigen).
- Wischen über `#view-home` (`initPillSwipe`) wechselt künftig die Ansicht;
  aus, solange eine Ansicht benannt wird.
- Pille gedrückt halten oder Rechtsklick: Umbenennen, Icon, Duplizieren,
  Nach links, Nach rechts, Löschen — „Alle“ nur Icon und Duplizieren. Das
  Halte-Menü mit `addLongPressMenu("projectView", …)` anmelden; die Pillen
  tragen `data-project-view`.
- Zweites Antippen von „Übersicht“ unten rollt die Karten wie heute zurück.
- Die Sektion zeichnet sich nur, wenn die Übersicht offen ist
  (`isViewActive("home")`), und am Desktop gar nicht (Abschnitt 8).

## 5. Seite Arbeitsbereiche

Datei: `src/features/overview/workspace-collection.js`; die Pillen-Logik aus
`tabs.js` und die Listen-Logik aus `workspaces.js` ziehen hierher bzw.
zeichnen in `dom.pageBody`.

- Pillenzeile wie heute auf der Übersicht: Tab-Pillen mit `data-tab-id`
  (nicht mehr `data-collection-tab`, sonst greifen weder Halte-Menü noch der
  Rechtsklick aus `src/ui/list-clicks.js`), kleines Plus für einen neuen Tab,
  rechts hinter der Trennlinie der Ordner-Plus-Knopf.
- Unter der Liste die Zeile „Arbeitsbereich hinzufügen“ und „Zum Archiv“ mit
  der Pille `workspaces`.
- Die Wahl der Pille schreibt `state.activeTabId` über `selectTab`, nicht
  mehr `page.pill`. Der Grund für die Trennung fällt weg, weil die
  Übersicht keine Tabs mehr zeigt. `addWorkspace`, `nextWorkspacePlaceholder`
  und `workspaceTabFor` lesen `activeTabId` und stimmen dann von selbst.
  `openWorkspacesPage` braucht kein `pill` mehr; Browser-Zurück stellt die
  Pille über `activeTabId` her.
- Umbenennen von Tab und Arbeitsbereich: die Felder `tab-name-input` und
  `workspace-name-input` entstehen jetzt in `#page-body`. Die Zuhörer
  (`input`, `keydown`, `blur` in der Aufnahmephase) hängen an `dom.pageBody`
  statt an `dom.workspaceTabs`; `bindNameInput(dom.pageBody)` gibt es schon.
  `canEdit` in `renderWorkspaces` prüft „Seite Arbeitsbereiche offen“ statt
  `isViewActive("home")`. `revealActive` bekommt `el("view-page")`.
- `handleTabPill` in `list-clicks.js` bleibt: aktiver Tab → Umbenennen,
  anderer → wählen. `beginRenameTab` und `beginRenameWorkspace` melden
  `dataChanged`; die Seite zeichnet sich neu und fokussiert das Feld.
- Platzhalter eines leeren Tabs: „Tippe unten auf „Arbeitsbereich
  hinzufügen““ statt des Verweises auf die Übersicht.
- „Zeigen“ in der Verschieben-Meldung (`src/ui/move-menu.js`) wählt den Tab
  und öffnet die Seite Arbeitsbereiche, falls sie nicht offen ist.
- Die Favoriten-Seite behält ihr Inline-Umbenennen (`renderFavorites`).
- Cover-Regel in `page.js` unverändert: Sammlungen haben kein Cover.

## 6. Gemeinsames Sortier-Blatt

Neue Datei `src/ui/sort-sheet.js`:
`openSortSheet({ title, options, sort, asc, onChange })`. Zwei Abschnitte mit
Zwischenüberschrift: „Sortieren nach“ mit Häkchen an der gewählten Option,
„Sortierungsrichtung“ mit zwei Zeilen, deren Wortlaut die Option liefert
(`up`/`down`, z.B. „A bis Z“ / „Z bis A“, „Neueste zuerst“ / „Älteste
zuerst“). Kennt `src/ui/sheet.js` keine Zwischenüberschriften, eine Option
`{ heading: "…" }` ergänzen. Das Blatt bleibt offen, bis man es zuzieht.

Die Aufgaben-Seite stellt um: `openSortSheet` in
`src/features/tasks/tasks-settings.js` nutzt den Baustein, `taskSorts`
bekommen `up`/`down` (Erstellt: Neueste / Älteste zuerst, Fällig: Früheste /
Späteste zuerst, Titel: A bis Z / Z bis A). Die Sortier-Zeile in der Karte
zeigt „Name · A bis Z“. Die Suche behält ihr eigenes Sortieren (Relevanz).

## 7. Karte „Ansicht“ und Seite Projekte

- Karte „Ansicht“ am Ende der Liste, auf Übersicht und Seite Projekte
  gleich. Kopf, Lage und Auf-/Zuklappen wie die Karte „Ansicht konfigurieren“
  der Aufgaben-Seite (`tasks-panel.js` wiederverwenden, nur die Zeilen sind
  andere): **Sortieren** (Wert wie „Zuletzt geöffnet · Neueste zuerst“, Tipp
  öffnet das Blatt aus Abschnitt 6), **Filtern** (Blatt „Projekte aus“: Alle
  Orte, Eingang, jeder Arbeitsbereich), **Nur Favoriten** (Schalter),
  **Projekte wählen** (Blatt mit Häkchen über alle Projekte; setzt `ids`).
  Bei „Alle“ nur Sortieren plus ⓘ mit demselben Erklärtext wie bei den
  Aufgaben, auf Projekte umformuliert. Filtern und Favoriten sind gesperrt,
  solange `ids` gefüllt sind — die Zeile sagt „Handverlesen, n Projekte“.
- Seite Projekte: `projectsPage = { title: "Projekte", kind: "projects" }` in
  `src/data/collections.js`; `openProjectsPage()` in `src/ui/router.js` mit
  `#/projekte` und Verlaufseintrag `{ view: "projects", from }`; im
  `popstate` ein Zweig dafür. `renderPageBody` zeichnet für `kind ===
  "projects"` Pillenzeile, Liste, Hinzufügen-Zeile und Karte über dieselben
  Funktionen wie die Übersicht (Ziel-Container als Parameter). Wischen über
  `#view-page` mit `enabled: Seite Projekte offen`. `composer-defaults.js`
  wählt dort schon den Typ `projekt`.
- Karte 3 öffnet die Seite Arbeitsbereiche: `openTarget("overview", "3")`
  delegiert an `openWorkspacesPage()`, damit die Adresse `#/arbeitsbereiche`
  und der Verlaufseintrag `workspaces` bleiben; alte Verlaufseinträge
  `{ view: "overview", id: "3" }` landen ebenfalls dort. `collectionHeads`
  und `state.prefs.pageHeads` bleiben unverändert (Schlüssel `workspaces`,
  `projects`).

## 8. Desktop

- **Seitenleiste** (`src/shell/desk-nav.js`, `desk-nav-parts.js`): die
  Gruppe „Arbeitsbereiche ↗“ mit Tab-Gruppen wird zur Gruppe **„Projekte ↗“**
  mit je einer auf-/zuklappbaren Gruppe pro Ansicht, „Alle“ zuerst. Die
  Überschrift öffnet die Seite Projekte, das Plus daneben legt eine neue
  Ansicht an (Seite Projekte öffnen, dann `addProjectView` — das Namensfeld
  steht in deren Pillen). Das Plus am Gruppenkopf legt ein Projekt in dieser
  Ansicht an (`ui.projectDraftView`, `createRequested("projekt")`). Eine Zeile
  zeigt Icon (`entry.icon` oder Rakete), Titel, Zahl der Einträge, Stern bei
  Favorit; `data-open-entry`. Zugeklappt zeigt der Kopf die Zahl der
  Projekte.
- Rechtsklick auf eine Zeile öffnet `openEntryCtxMenu` (`src/ui/entry-menu.js`),
  auf einen Gruppenkopf das Ansichts-Menü (aus `main.js` über `initDesk`
  hereingeben, wie heute `openTabMenu`). `followNavMenu`: „Umbenennen“ einer
  Ansicht öffnet die Seite Projekte; Löschen oder Archivieren des gerade
  offenen Projekts geht zurück, woher man kam.
- Zugeklappte Gruppen bekommen einen neuen Speicherschlüssel
  (`storageKeys.deskViewGroups`), damit alte Tab-Ids nicht zufällig auf
  Ansichten passen. `activeTargets` bekommt `project` (offener Eintrag, wenn
  er ein Projekt ist).
- **Sammlungen** oben ziehen automatisch mit (`collectionLinks` in
  `src/ui/desk-links.js` lesen `overviewPages`): Karte 3 heißt jetzt
  Arbeitsbereiche und bekommt das Kürzel **B** (Ton `workspace`, Farbe
  `--workspace-icon-color`). G P bleibt und öffnet die Seite Projekte über
  `openCollection`. Kopfkommentar in `src/shell/desk.js`, die Kürzel-Seite im
  Profil (`src/features/profile/shortcuts.js`) und
  `src/data/shortcut-hints.js` ziehen mit.
- **Desktop-Übersicht** bleibt Zahlen plus Bühne. In `styles/desk-views.css`
  die Regel mit `:has(#tab-name-input, #workspace-name-input)` durch ein
  einfaches Verstecken der Projekte-Sektion ersetzen; die Ausnahme wird
  nicht mehr gebraucht, weil Umbenennen jetzt auf den Seiten passiert. Die
  Sektion wird am Desktop auch nicht gezeichnet (`isDesk()` prüfen).
- Such-Palette (`src/features/search/search-palette-data.js`): der Punkt
  „Projekte“ öffnet die Seite Projekte, „Arbeitsbereiche“ bleibt.
- Rechte Spalte und Bühne unverändert; `workspace-rail.js` gilt weiter nur
  auf der Seite eines Arbeitsbereichs.

## 9. Texte

- `src/data/details.js`: „Speicherort: Arbeitsbereiche · Tab“ statt
  „Übersicht · Tab“.
- `src/data/convert-notes.js`: „Erscheint unter Arbeitsbereiche im Tab „…““.
- `README.md`, Abschnitt „Flows zum Durchprüfen › Übersicht“ neu schreiben
  (Abschnitt 12 hier ist die Vorlage); `docs/desktop-flows.md` um die
  Seitenleiste mit Ansichten ergänzen. Beide Dateien unter 400 Zeilen halten.

## 10. Reihenfolge — je Schritt ein Commit

Vorab teilen, sonst scheitert jeder Schritt am Prüfskript:

| Datei | Zeilen | Vorschlag |
|---|---|---|
| `src/ui/router.js` | 394 | Wiederherstellen aus dem Verlauf (`popstate`) nach `src/ui/router-restore.js` |
| `src/data/config.js` | 396 | Aufgaben-Konfiguration nach `src/data/config-tasks.js` |
| `src/data/mutations.js` | 392 | Aufgaben-Mutationen nach `src/data/mutations-tasks.js` |
| `index.html` | 399 | Pillenzeile der Übersicht aus JS zeichnen (Schritt 4) — bis dahin nichts hinzufügen |
| `styles/tokens.css` | 399 | eine Gruppe nach `styles/tokens-pages.css` |

Dann:

1. Sortier-Blatt (Abschnitt 6) bauen und die Aufgaben-Seite umstellen.
   Sichtbar prüfbar, unabhängig vom Rest.
2. Datenmodell der Ansichten (Abschnitt 3) mit Migration und
   Löschen-Bereinigung, noch ohne Oberfläche. Leerer und voller Speicher.
3. Seite Arbeitsbereiche vollständig machen (Abschnitt 5). Die Übersicht
   bleibt dabei noch unverändert — so lässt sich beides nebeneinander prüfen.
4. Übersicht tauschen (Abschnitt 4) und Seite Projekte mit Route
   (Abschnitt 7 ohne Karte). Karte 3, Sektion Projekte, Wischen, Archiv-Pille.
   `tabs.js`/`workspaces.js` aufräumen.
5. Karte „Ansicht“ mit Sortieren, Filtern, Favoriten, Projekte wählen.
6. Desktop-Seitenleiste, Sammlungen, Kürzel, Palette (Abschnitt 8).
7. Texte, README, Desktop-Flows (Abschnitt 9).

Nach jedem Schritt: `python3 tools/version.py`, `python3 tools/check.py`
(„alles in Ordnung“), `node --check` über alle Module, Browser mit leerer
Konsole, die Flows aus Abschnitt 12, `git diff -U0` lesen und nur eigene
Blöcke stagen.

## 11. Stolperstellen

- **Namensfelder wandern.** `tab-name-input` und `workspace-name-input`
  entstehen in `#page-body` und werden bei jedem Zeichnen ersetzt. `el()`
  prüft `isConnected`; die `blur`-Zuhörer müssen am neuen Behälter hängen,
  sonst wird ein Name nie übernommen.
- **Neuzeichnen beim Tab-Wechsel.** `selectTab` meldet `dataChanged`, die
  Seite zeichnet alles neu. Ein offenes Namensfeld nimmt seinen Entwurf über
  `ui.nameDraft` mit (`commitStaleWorkspaceName`) — muss auf der Seite
  genauso laufen wie heute auf der Übersicht.
- **Zwei Wischer auf `#view-page`.** Arbeitsbereich-Seite, Sammlung
  Arbeitsbereiche und Seite Projekte teilen die Ansicht; die
  `enabled`-Bedingungen müssen sich gegenseitig ausschließen.
- **Alter Verlauf.** `{ view: "overview", id: "3" }` muss auf Arbeitsbereiche
  landen, nicht auf einer leeren Projektliste.
- **Sichtbarkeit neuer Projekte.** Siehe `ui.projectDraftView` in
  Abschnitt 3 — ohne die Regel ist ein neues Projekt in einer gefilterten
  Ansicht sofort unsichtbar.
- **Tab löschen.** Seine Arbeitsbereiche verschwinden, deren Projekte rücken
  in den Eingang und bleiben in „Alle“ und in jeder `ids`-Liste.
- **Umwandeln.** Arbeitsbereich → Projekt von der Seite Arbeitsbereiche aus:
  die Ansicht wechselt auf den neuen Eintrag, Zurück führt auf die Seite
  Arbeitsbereiche. Eine aktive eigene Ansicht zeigt das neue Projekt nicht,
  „Alle“ schon — die Meldung „Zur Seite“ reicht. Eintrag → Arbeitsbereich:
  „Zur Seite“ öffnet den Arbeitsbereich, unverändert.
- **Desktop-CSS.** Wird das `:has`-Konstrukt in `desk-views.css` nicht
  ersetzt, taucht die Projekte-Sektion am Desktop beim Umbenennen auf.
- **Zähler.** Karte Arbeitsbereiche zählt ohne archivierte; die Zahl in der
  Seitenleiste am Projekt zählt `entriesOf(entryRef(id))`.
- **Dateigrenzen.** `state.js` (349) und `queries.js` (350) nichts Großes
  zufügen; `page.js` (296) wächst durch die Seite Projekte — Zeichnen von
  Übersicht und Seite in `projects.js` bündeln, `page.js` ruft nur auf.

## 12. Prüfliste

**Handy, 375 px, hell und dunkel, leerer und voller Speicher**

- Karte Arbeitsbereiche öffnen, Zähler passt zur Zahl der Zeilen. Zurück.
- Auf der Seite Arbeitsbereiche: Tab anlegen, benennen mit Enter **und** mit
  Klick daneben, wechseln, umbenennen, Icon, löschen (seine Arbeitsbereiche
  weg, Einträge im Eingang). Arbeitsbereich anlegen, umbenennen, Icon,
  Favorit, verschieben und „Zeigen“, archivieren, „Zum Archiv“, zurückholen,
  löschen. Halten und Rechtsklick auf Pille und Zeile: Menü geht auf, nichts
  öffnet sich. Wischen wechselt den Tab. Zurück-Pfeil und Browser-Zurück.
- Auf der Übersicht: „Alle“ zeigt jedes Projekt, Zahl und Reihenfolge
  (Zuletzt geöffnet). Projekt über Knopf und über Zeile anlegen. Ansicht
  anlegen, benennen, Icon, duplizieren, nach links/rechts, löschen. Projekte
  wählen, dann Filtern gesperrt. Ansicht ohne Auswahl: nach Arbeitsbereich
  filtern, Projekt anlegen — es liegt in diesem Arbeitsbereich und steht in
  der Liste. Sortieren: jede Option in beiden Richtungen. Wischen wechselt
  die Ansicht, nicht während des Benennens. „Zum Archiv“ öffnet die Pille
  Projekte. Zweites Antippen von „Übersicht“ rollt die Karten zurück.
- Seite Projekte über „Projekte ↗“: dieselbe Ansicht gewählt wie auf der
  Übersicht, alle Punkte von oben, Zurück führt zur Übersicht.
- Projekt löschen, das in einer eigenen Ansicht liegt: Liste sauber.
  Projekt archivieren und zurückholen: steht wieder in der Ansicht.
- Typ ändern in beide Richtungen von jeder Seite aus (Abschnitt 11).
- Aufgaben-Seite: neues Sortier-Blatt, Richtung je Option, Wert in der Karte.

**Desktop, 1024 / 1280 / 1440 px**

- Seitenleiste: Gruppe Projekte mit „Alle“ und eigenen Ansichten, auf- und
  zuklappen bleibt nach Neuladen, Zahl am zugeklappten Kopf. Plus am Kopf
  legt ein Projekt in der Ansicht an. Plus an der Überschrift führt auf die
  Seite Projekte ins Namensfeld. Rechtsklick auf Zeile (Eintrags-Menü) und
  Kopf (Ansichts-Menü); „Umbenennen“ öffnet die Seite Projekte. Offenes
  Projekt ist markiert.
- Sammlungen: Arbeitsbereiche mit G B, Projekte mit G P, Kürzel-Seite im
  Profil stimmt. Palette: „Projekte“ und „Arbeitsbereiche“ öffnen ihre Seite.
- Übersicht: Zahlen und Bühne wie vorher, keine Projekte-Sektion, auch nicht
  beim Umbenennen.
- Seite Arbeitsbereiche am Desktop: alle Handy-Flows, rechte Spalte zeigt
  die Karten der Übersicht.

## 13. Geparkt: Abschnitt „Arbeitsbereiche“ unter der Bühne

Idee, bewusst **nicht** in dieser Umsetzung: auf der Desktop-Übersicht
unter der Bühne ein Abschnitt „Arbeitsbereiche ↗“ mit Tab-Pillen, Ordner-
Plus, einem Schalter Kacheln | Liste (gespeichert in den Prefs wie das
Raster der Medien-Seite) und den Arbeitsbereichen des gewählten Tabs als
Kacheln (Icon, Name, Zahl der Einträge, bei Cover die orange Fläche oben)
oder als Zeilen, dazu Plus-Kachel und „Zum Archiv“. Umbenennen direkt dort,
auch in der Kachel. Übersicht-Abschnitt und Seite Arbeitsbereiche wären ein
Modul, das in zwei Behälter zeichnet. Wer das später baut, setzt auf Schritt 3
aus Abschnitt 10 auf und kippt die Sichtbarkeitsregel in `desk-views.css`.
