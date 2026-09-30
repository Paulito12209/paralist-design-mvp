# Einstellungen: Unterseite „App-Einstellungen“ mit Reiter-Namen und Such-Tastatur

Stand: 30. September 2026. Gilt für Handy und Desktop. Umsetzung nach den
Regeln in `.claude/skills/paralist-clean-code/SKILL.md`: erst
`python3 tools/version.py`, dann `python3 tools/check.py`, dann im Browser
prüfen, dann committen — je Schritt aus Abschnitt 8 ein Commit.

## 1. Zielbild

Im Einstellungs-Blatt steht heute unter „Darstellung“ direkt nach den drei
Zeilen Hell / Dunkel / System die einzelne Zeile „Namen unter den Reitern“.
Sie zieht auf eine eigene Unterseite um, und dort kommt eine zweite Wahl dazu:

- **Neuer Abschnitt „App“** unter „Darstellung“, vor „Konto“: eine Zeile
  **„App-Einstellungen ›“**, die eine Unterseite öffnet — genau wie
  „Konto › Kontoeinstellungen“. Unter „Darstellung“ bleiben nur die drei
  Darstellungs-Zeilen.
- **Unterseite „App-Einstellungen“** (`#/einstellungen/app`), zwei Gruppen:
  - **Navigation:** die Zeile „Namen unter den Reitern“ mit Haken, wie heute.
  - **Suche:** die Zeile **„Tastatur sofort öffnen“** mit Haken. Darunter ein
    grauer Hinweis: „Aus: Die Suche zeigt erst, was du zuletzt geöffnet hast.
    Die Tastatur kommt mit der Pille „Suchen“ unten.“
- **Vorgabe: aus.** Wer die Suche öffnet, sieht zuerst die Pille „Zuletzt
  geöffnet“ mit den letzten Seiten — der schnellste Weg zurück zu dem, woran
  man gearbeitet hat. Die Tastatur holt man mit der Pille „Suchen“ unten
  rechts oder mit einem Tipp ins Suchfeld oben. Steht der Haken, geht die
  Tastatur beim Öffnen sofort auf, wie bisher.
- **Desktop:** der Punkt „Navigation“ im Untermenü des Profils heißt
  künftig **„App“** und zeigt dieselben zwei Gruppen. Beide Wahlen wirken
  nur am Handy und Tablet — am Desktop öffnet das Suchfeld die Palette, und
  die Leiste unten gibt es nicht; die Hinweise darunter sagen das.

## 2. Entschiedene Punkte

- Eigener Abschnitt „App“ mit Unterseite, nicht eine Zeile innerhalb von
  „Darstellung“: das ist das Muster von „Konto › Kontoeinstellungen“, und
  die Unterseite kann weitere App-weite Wahlen aufnehmen, ohne dass das
  Blatt länger wird.
- Eine Haken-Zeile statt zwei Auswahlzeilen für die Tastatur: die Wahl ist
  ein Ja/Nein, und die Zeile sieht aus wie „Namen unter den Reitern“ daneben.
  Wortlaut „Tastatur sofort öffnen“ — aus (Vorgabe) heißt: erst ausgeblendet.
- Kein neuer Bus-Ereignistyp: die Suche liest die Wahl bei jedem Öffnen
  frisch aus dem Speicher. Die Reiter-Namen behalten ihr Ereignis
  `navLabelsChanged`, weil die Leiste sich sofort umbauen muss.
- Icons: „App-Einstellungen“ und der Punkt „App“ nehmen `settings`
  (vorhanden). Die Zeile „Tastatur sofort öffnen“ braucht ein
  Tastatur-Icon, das es noch nicht gibt — der Nutzer liefert das
  Lucide-Icon `keyboard`, es kommt nach `assets/icons/sprite-2.svg`
  (214 Zeilen, Platz ist da). Bis dahin `text` als Platzhalter.
- Der alte Speicherschlüssel `paralist-nav-labels` bleibt; wer die Namen
  eingeblendet hat, behält sie.

## 3. Datenmodell

Muster: `src/data/nav-labels.js` — reiner Zustand ohne Seite.

- `src/core/storage.js`: neuer Schlüssel
  `searchKeyboard: "paralist-search-keyboard"`.
- Neue Datei `src/data/search-keyboard.js`: `searchKeyboardOn()` liest
  `"1"` aus dem Schlüssel (fehlt er, ist die Wahl aus — so bekommen auch
  vorhandene Installationen die neue Vorgabe), `setSearchKeyboardOn(value)`
  schreibt `"1"` oder `""`. Kopfkommentar: wer liest (Suchfeld, Zieh-Geste,
  Suchknopf der Seiten), wer schreibt (die Unterseite).
- Keine Migration in `src/data/state.js`; die Wahl liegt wie die Reiter-Namen
  außerhalb des Zustands.

## 4. Einstellungs-Blatt am Handy

Dateien: `src/features/profile/settings-cards.js`, `profile-cards.js`,
`profile.js`, `nav-labels.js`, neu `src/features/profile/app-settings.js`.

- **`app-settings.js`** (neu, gut 60 Zeilen): baut die Unterseite und
  behandelt ihre Klicks, damit `profile.js` (374 Zeilen) nicht wächst.
  - `appSettingsCard()`: `<p class="psection">Navigation</p>` +
    `navLabelsRowMarkup()` aus `nav-labels.js`, dann
    `<p class="psection">Suche</p>` + Gruppe mit der Zeile
    `data-search-keyboard-toggle="1"` (Icon, Text, `settings-check`,
    `aria-pressed`) + `<p class="settings-note">…</p>`.
  - `onAppSettingsClick(event)`: gibt `true` zurück, wenn ein Klick auf
    `[data-nav-labels-toggle]` (→ `toggleNavLabels()`) oder
    `[data-search-keyboard-toggle]` (→ `setSearchKeyboardOn(!searchKeyboardOn())`)
    erledigt wurde — nach dem Muster von `onFeedbackClick`.
- **`settings-cards.js`**: `appearanceSection()` verliert
  `navLabelsRowMarkup()` und zeigt nur noch `themeListMarkup()`;
  `details` bekommt `app: { hash: "app", title: "App-Einstellungen", card: appSettingsCard }`.
  Kopfkommentar der Datei und der von `nav-labels.js` („Die Zeile im
  Einstellungs-Blatt …“ → „… auf der Unterseite App-Einstellungen …“)
  anpassen.
- **`profile-cards.js`**: `listSections` bekommt vorn den Abschnitt
  `{ title: "App", rows: [{ icon: "settings", label: "App-Einstellungen", trail: "chevron", detail: "app" }] }`.
  `listsMarkup()` zeichnet damit App, Konto, Support, Mehr — die Reihenfolge
  im Blatt ist Darstellung → App → Konto, ohne weitere Änderung. Am Desktop
  ziehen `listSection("Konto")` und `listSection("Support")` gezielt, der
  neue Abschnitt taucht dort nicht ungewollt auf.
- **`profile.js`**: in `onBodyClick` ersetzt
  `if (onAppSettingsClick(event)) { rerenderKeepingScroll(); return; }` den
  bisherigen Zweig `[data-nav-labels-toggle]`; der Import von
  `toggleNavLabels` entfällt. Öffnen der Unterseite, Pfeil zurück,
  Browser-Zurück und das Kreuz laufen über `openDetail` / `closeDetail` /
  `close` wie bei den Kontoeinstellungen — nichts Neues nötig.
- **Stile**: `.settings-note` steht heute nur in `styles/desk-settings.css`
  innerhalb der Desktop-Abfrage. Die Regel zieht nach `styles/settings.css`
  (allgemein gültig, 13px grau mit 4px Rand, Größe im Kopfkommentar
  nennen), aus `desk-settings.css` verschwindet sie samt dem Satz „Hinweis
  unter „Navigation“ 13px“ im Kopf. Kopfkommentar von `settings.css`: „die
  Liste für Hell, Dunkel und System und die Haken-Zeilen der
  App-Einstellungen“.

## 5. Profil am Desktop

Datei: `src/features/profile/settings-nav.js`.

- Punkt `navigation` wird `{ id: "app", label: "App", icon: "settings", render: appSettingsCard }`.
  Der Import von `navLabelsRowMarkup` entfällt, der bisherige Hinweistext
  „Gilt für die Leiste unten am Handy und Tablet.“ wandert als zweiter
  Hinweis in `appSettingsCard()` unter die Gruppe Navigation — so steht er
  am Handy wie am Desktop.
- `isPane("navigation")` ist danach falsch; alte Verlaufseinträge mit
  `pane: "navigation"` fallen über `paneOf` auf „Konto“ zurück — kein
  Sonderfall nötig.
- Kopfkommentar der Datei („Konto, Darstellung, Navigation, …“) und der von
  `styles/desk-settings.css` mitziehen.

## 6. Suche: Tastatur beim Öffnen

Heute geht die Tastatur immer auf: der Tipp ins Feld oben fokussiert das
`<input>` nativ (das `<label id="search-entry">` gibt den Fokus außerdem
weiter), `onFocus` in `src/shell/search-bar.js` öffnet dann die Suchseite.
Die Zieh-Geste und der Suchknopf der Seiten rufen `focus()` selbst.

- **`src/shell/search-bar.js`** (157 Zeilen, importiert `searchKeyboardOn`
  aus `../data/search-keyboard.js` und `isDesk` aus `../ui/desk-mode.js`):
  - Neue Hilfe `keepKeyboardClosed()`:
    `!isDesk() && !searchKeyboardOn() && !isViewActive("search")`. Ist die
    Suchseite schon offen, tippt man bewusst ins Feld — dann kommt die
    Tastatur immer.
  - `#search-entry` bekommt einen `pointerdown`-Zuhörer: bei
    `keepKeyboardClosed()` `event.preventDefault()` — das unterbindet die
    nachfolgenden Maus-Ereignisse und damit den Fokus auf dem Feld (Chrome
    und Safari). Kommentar daneben, warum.
  - Der vorhandene `click`-Zuhörer auf `#search-entry`: bei
    `keepKeyboardClosed()` zusätzlich `event.preventDefault()`, sonst gibt
    das `label` den Fokus doch noch weiter; danach `showSearch()` wie heute.
    Der Desktop-Zweig `takeOver(event)` bleibt unverändert davor.
  - `onFocus`, die Pille „Suchen“ (`dom.searchInput.focus()`), das × im Feld,
    `keyboardClosed` und Enter bleiben, wie sie sind.
- **`src/ui/pull-search.js`** (268 Zeilen): die zwei gleichen Blöcke
  `showSearch(); setTimeout(() => dom.searchInput.focus(), 60)` werden eine
  Hilfe `openSearchByPull()`, die nur bei `searchKeyboardOn()` fokussiert.
  `pullFocusDelayMs = 60` als benannter `const` in den Kopf.
- **`src/features/overview/page.js`** (296 Zeilen): der Suchknopf im
  Seitenkopf fokussiert nur bei `searchKeyboardOn()`; sein Kommentar
  („ein verstecktes Feld nimmt keinen Fokus an“) bleibt gültig.
- **Unverändert:** `src/shell/search-palette.js` (Desktop),
  `src/ui/page-path.js` (öffnet nur die Seite), `src/features/search/*`.
  Ohne Fokus ist `ui.searchTyping` falsch, `.search-actions` ist sofort zu
  sehen und die Pille sagt „Suchen“ — genau der Knopf, der die Tastatur holt.
- Kopfkommentar von `search-bar.js` um die Wahl ergänzen; `index.html`
  braucht keine Änderung.

## 7. Texte

- `README.md`, „Flows zum Durchprüfen › Suchen, Fortschritt, Einstellungen“:
  ein Punkt für die Tastatur (Vorgabe aus: Suche öffnet auf „Zuletzt
  geöffnet“, Pille „Suchen“ holt die Tastatur; mit Haken sofort) und die
  Einstellungen-Zeile um „App-Einstellungen: beide Haken, Pfeil und
  Browser-Zurück“ ergänzen. Datei bleibt unter 400 Zeilen (344).
- `docs/desktop-flows.md`, Punkt „Profil als Seite“: „Unter „App“ die zwei
  Haken; sie ändern am Desktop nichts Sichtbares außer der Leiste unten am
  Tablet.“

## 8. Reihenfolge — je Schritt ein Commit

1. Speicherschlüssel und `src/data/search-keyboard.js`; `search-bar.js`,
   `pull-search.js`, `page.js` lesen die Wahl. Noch ohne Oberfläche: Vorgabe
   aus, im Browser prüfen, dass die Suche ohne Tastatur aufgeht und die
   Pille sie holt. Mit `localStorage.setItem("paralist-search-keyboard","1")`
   das alte Verhalten prüfen.
2. Unterseite: `app-settings.js`, `settings-cards.js`, `profile-cards.js`,
   `profile.js`, `.settings-note` nach `settings.css`. Handy-Blatt prüfen.
3. Desktop-Punkt „App“ in `settings-nav.js`, `desk-settings.css` aufräumen.
4. Tastatur-Icon aus der Lieferung des Nutzers in `sprite-2.svg`, Platzhalter
   `text` ersetzen.
5. README und Desktop-Flows.

Nach jedem Schritt: `python3 tools/version.py`, `python3 tools/check.py`
(„alles in Ordnung“), `node --check` über alle Module, Browser mit leerer
Konsole, die Flows aus Abschnitt 10, `git diff -U0` lesen und nur eigene
Blöcke stagen.

## 9. Stolperstellen

- **Fokus lässt sich nur vor dem Fokus verhindern.** `preventDefault()`
  muss auf `pointerdown` liegen; auf `click` allein ist das Feld längst
  fokussiert und die Tastatur offen. Im Browser-Pane nur am Handy-Maß
  prüfbar — das echte Verhalten auf iOS Safari und Android Chrome am Gerät
  nachsehen. Reicht `pointerdown` auf iOS nicht, zusätzlich `touchstart`
  (nicht `passive`) mit demselben `preventDefault()`.
- **Das `label` fokussiert selbst.** Ohne `preventDefault()` auf `click`
  reicht das `<label id="search-entry">` den Klick als Fokus ans Feld
  weiter — auch wenn `pointerdown` schon abgefangen wurde.
- **Zweiter Tipp ins Feld auf der Suchseite** muss die Tastatur öffnen:
  `keepKeyboardClosed()` prüft `isViewActive("search")`, sonst käme man nie
  zum Tippen.
- **Desktop-Palette.** `takeOver` läuft in `click` und `focus`; der
  `pointerdown`-Zweig darf am Desktop nichts abfangen (`isDesk()`), sonst
  bleibt die Palette bei einem Klick ins Feld zu.
- **`ui.searchTyping` bleibt falsch**, solange nicht fokussiert wurde —
  `search-tap.js` und `.search-actions` verhalten sich dann wie nach dem
  Zuklappen der Tastatur; das ist gewollt und braucht keine Anpassung.
- **Verlaufseintrag `pane: "navigation"`** aus alten Sitzungen: fällt auf
  „Konto“ zurück, kein Fehler in der Konsole (`paneOf` prüfen).
- **`profile.js` an der Grenze** (374 Zeilen): keine neuen Zweige dort,
  alles Neue über `onAppSettingsClick`.
- **`.settings-note` am Handy** muss nach dem Umzug in `settings.css`
  wirklich greifen — vorher stand sie nur ab 1024 px.

## 10. Prüfliste

**Handy, 375 px, hell und dunkel, leerer und voller Speicher**

- Suche über das Feld oben: Suchseite geht auf „Zuletzt geöffnet“ auf,
  keine Tastatur, Pille „Suchen“ ist zu sehen. Pille tippen: Tastatur da,
  Pille weg. Feld oben auf der Suchseite tippen: Tastatur da. Tippen,
  Treffer, Enter, Abbrechen führt zur vorigen Seite.
- Zieh-Geste auf der Übersicht und Suchknopf im Kopf einer Seite: gleiches
  Verhalten wie über das Feld.
- Einstellungen › App › App-Einstellungen: Haken „Tastatur sofort öffnen“
  setzen, Blatt schließen, Suche öffnen — Tastatur sofort da, auch nach
  Neuladen. Haken wieder weg: wieder ohne Tastatur.
- „Namen unter den Reitern“ auf der Unterseite: Namen erscheinen sofort in
  der Leiste, bleiben nach Neuladen; unter „Darstellung“ steht die Zeile
  nicht mehr.
- Unterseite: Zurück-Pfeil führt zur Liste, Browser-Zurück ebenso, das
  Kreuz schließt alles; Adresse `#/einstellungen/app`. Blatt vom
  Unterseiten-Stand aus nach unten ziehen schließt es.
- Kontoeinstellungen, Nutzungszeit, Serie, Danksagungen wie bisher.

**Desktop, 1024 / 1280 / 1440 px**

- Profil › „App“ zeigt beide Gruppen mit Hinweisen; „Navigation“ gibt es
  nicht mehr. Klick ins Suchfeld öffnet weiter die Palette, ⌘K ebenso.
- Punkt wechseln, während „App“ offen ist; Esc und Zurück schließen.
- Zwischen Handy- und Desktop-Breite ziehen, während die Unterseite offen
  ist: Blatt wird Seite und zurück, ohne Konsolenfehler.
