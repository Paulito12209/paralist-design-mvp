# Desktop-Fassung: Plan für die neue Oberfläche

Stand: September 2026. Gilt ab 1024 px Fensterbreite; das Handy-Layout bleibt
unangetastet. Wireframes: `docs/desktop-wireframes.html` (im Browser öffnen).

## 1. Was heute stört

Gemessen an der laufenden App bei 1440 × 900 (leerer und voller Speicher):

| Stelle | Heute | Problem |
| --- | --- | --- |
| Suche | 130 px breite Pille links oben zwischen Level-Ring und Profil-Knopf | gestaucht; Tippen springt auf eine eigene Seite mit Pillen unten („Suchen / Abbrechen“), obwohl eine Tastatur da ist |
| Einstellungen | nur über das Profil-Icon links oben, als Dialog in der Mitte | versteckt; Desktop-Apps zeigen Konto und Einstellungen unten in der Seitenleiste |
| Rechte Spalte | auf jeder Seite dieselben fünf Karten (Eingang, Fortschritt, Als Nächstes, Aufgaben, Zuletzt) | wiederholt, was Seitenleiste und Übersicht schon zeigen, und hilft auf Kalender, Aufgaben oder Medien nicht |
| Eingang | Seitenleiste + Kachel rechts + Karte auf der Übersicht + Zahl „Einträge“ | viermal dieselbe Zahl |
| Fortschritt | Ring links oben + Pille im Aktivitätsband + Karte „Diese Woche“ + Kachel rechts | viermal Stufe und XP |
| Aufgaben | Seitenleiste (Zahl) + Kennzahl „Offen“ + Karte rechts + Aufgaben-Seite | viermal „offen“ |
| Termine | Kennzahl „Heute“ + Karte „Als Nächstes“ mit Tagesleiste + Kalender | dreimal „heute“ |
| Tipp-Karte | dauerhaft unten in der Seitenleiste | nimmt den Platz, der Konto und Einstellungen gehört |
| Kalender | Handy-Streifen mit einer Woche in der Mitte, „Heute“ und „1 W“ liegen über der zweiten Zeile | nutzt die Breite nicht; Desktop-Kalender zeigen die Woche als Spalten |
| Aufgaben | Karte „Ansicht konfigurieren“ klebt unten in der Mitte | ein Handy-Blatt an einem Ort, wo rechts Platz wäre |

## 2. Leitidee

**Jede Information genau einmal, an dem Ort, wo sie gebraucht wird.**

Vorbilder: die Desktop-App von Codex (ruhige Seitenleiste, Konto und
Einstellungen unten, alles per Tastatur, eine Kontextspalte rechts) und die
Browser-Oberfläche von Google Drive (Suchfeld über die volle Breite oben, ein
„Neu“-Knopf, Ansicht-Umschalter je Seite, Detail-Spalte zum Ein- und
Ausklappen). Aus Paralist bleiben: die großen dünnen Zahlen, Pillen als
Segmente, die grauen Flächen aus `color-mix`, die orangen Ordner der leeren
Zustände, das Glas-Eingabefeld unten, das Punkte-Band der Aktivität, die
Karten der vier Sammlungen.

Zwei Fragen, zwei Orte: **„Wie schaue ich drauf?“** beantworten die vier
Reiter oben (Übersicht, Kalender, Aufgaben, Medien sind Sichten auf dieselben
Daten). **„Wo liegt es?“** beantwortet die Seitenleiste (Sammlungen und
Arbeitsbereiche sind Orte). Neue Orte wie Planer, Personen und Tags kommen
später als Zeilen in die Seitenleiste; die Reiterzeile wächst nie.

```
┌──────────────┬──────────────────────────────────────────┬──────────────┐
│ Paralist   ≡ │ ‹ ›     Übersicht Kalender Aufgaben Medien   ⋯│              │
│ 🔍 Suchen ⌘K ├──────────────────────────────────────────┤  Kontext     │
│ + Neu      N │  Übersicht › Marketing › Notiz  (Pfad)   │  (je Seite   │
│ SAMMLUNGEN   │                                          │  anders,     │
│  Eingang G I │  Seite                                   │  einklappbar)│
│ ARBEITSBER.  │                                          │              │
│  Meine ▾  +  │                                          │              │
│   Marketing  │                                          │              │
│  Arbeit ▸ 2  │                                          │              │
│ Stufe 3      │  Eingabefeld (Glas, schwebt)             │              │
│ Paul · ⚙  ⌘, │                                          │              │
└──────────────┴──────────────────────────────────────────┴──────────────┘
  264 px         Rest                                       320 px (ab 1280)
```

- **Seitenleiste** = Orte, Suche, Neu, Konto. Sie zeigt nie Inhalte.
- **Reiterzeile über der Mitte** = Zurück und Vorwärts, die vier Reiter, rechts
  die Werkzeuge der offenen Seite (und die Suche als Knopf, wenn die
  Seitenleiste zu ist).
- **Mitte** = Pfad, Titel und die Seite selbst, breit oder in Lesebreite.
- **Kontextspalte** = das, was zur offenen Seite gehört: Details, Filter,
  Vorschau, Tagesplan. Auf 1024–1279 px eingeklappt, über einen Knopf in
  der Kopfzeile aufklappbar (wie das „i“ in Drive).

## 3. Die Seitenleiste

Von oben nach unten:

1. **Wortmarke und Klapp-Knopf.** Oben links steht „Paralist“, rechts daneben
   der Knopf zum Einklappen (`⌘\`). Der Klapp-Knopf hält seine Höhe: bei
   offener Leiste in ihr, bei geschlossener am linken Rand der Reiterzeile
   (wie in ChatGPT und Codex).
2. **Suchfeld** darunter mit Luft, in voller Leistenbreite, rechts das Schild
   `⌘K`. Es ist nur der Einstieg; die Suche selbst ist die Palette
   (Abschnitt 4).
3. **Neu** — ein Knopf, schwarz, mit `N`. Das Menü dahinter nennt die Typen.
4. **Sammlungen**, alle auf einmal: Eingang, Favoriten, Projekte,
   Ressourcen, Lesezeichen, Archiv (blass, immer zuletzt). Heute fehlen
   Lesezeichen und Archiv am Desktop ganz — am Handy liegen sie auf der
   zweiten Kartenseite bzw. an der Pille unter den Arbeitsbereichen.
   Personen und Pläne stehen blass mit „Bald“ darunter, wie die Karten
   „Demnächst verfügbar“ am Handy; Tags kommt später dazu.
5. **Arbeitsbereiche, nach Tabs gruppiert.** Jeder Tab ist eine auf- und
   zuklappbare Gruppe wie die Abschnitte in der Codex-Seitenleiste: Kopf mit
   Pfeil und Name („Meine ▾“), darunter eingerückt seine Arbeitsbereiche. Alle
   Tabs sind auf einmal sichtbar, nichts muss gewechselt werden, darum braucht
   es kein Kürzel. Zugeklappt zeigt der Kopf die Zahl seiner Arbeitsbereiche;
   der Zustand wird gemerkt (`storageKeys.deskGroups`). Das Plus am Kopf legt einen
   Arbeitsbereich in diesem Tab an, Rechtsklick auf den Kopf gibt Umbenennen,
   Icon, Verschieben und Löschen (dasselbe Menü wie die Tab-Pille am Handy).
   „+ Tab“ neben der Überschrift legt eine neue Gruppe an. Am Handy bleiben
   die Tab-Pillen wie sie sind; `state.activeTabId` gilt dort weiter.
6. **Fuß, fest unten** (rollt nicht mit):
   - **Stufe**: kleiner Ring, „Stufe 3 · 160 XP bis Stufe 4“. Klick öffnet
     Fortschritt. Die einzige Stelle mit dem Ring.
   - **Profil und Einstellungen** sind eine Zeile: Profilbild, Name, „Pro“,
     rechts das Zahnrad und `⌘,`. Klick öffnet die Einstellungsseite auf
     „Konto“ — Profil und Einstellungen sind dasselbe.
   - Die Tipp-Karte entfällt; `?` öffnet Profil › Kurzbefehle.

Die vier Reiter stehen nicht in der Seitenleiste, sondern in der Reiterzeile
(Abschnitt 3a). Eingeklappt ist die Leiste 0 px breit; die Reiterzeile bleibt
sichtbar, und jede Sammlung hat ein Kürzel, damit man ohne Leiste überall hinkommt.

## 3a. Reiterzeile, Zurück, Vorwärts, Pfad

- **Links** das Pfeilpaar `‹ ›` für den Verlauf (Zurück `⌘[`, Vorwärts `⌘]`),
  wie in Finder, Codex und VS Code. Ist die Leiste zu, steht davor der
  Klapp-Knopf.
- **Zentriert** über der Mitte die vier Reiter als Pillen: Übersicht, Kalender,
  Aufgaben, Medien (`1–4`). Links und rechts davon je eine gleich breite
  Zone, damit die Reiter unabhängig von Pfeilen und Werkzeugen mittig stehen. Unter 1280 px nur Icons mit Tooltip. Ist eine Sammlung, ein
  Arbeitsbereich oder ein Eintrag offen, leuchtet kein Reiter; der Ort zeigt
  sich in der Seitenleiste und im Pfad.
- **Rechts** die Werkzeuge der offenen Seite (Ansicht, Filter, Menü) und der
  runde Such-Knopf, sobald die Leiste zu ist.
- **Pfad** über dem Seitentitel, wie bei Google Drive: „Übersicht › Marketing ›
  Design-System Notizen“. Jedes Glied klickbar, das letzte ist der Titel. Liegt
  ein Eintrag an mehreren Orten, zeigt der Pfad den Weg, über den man kam
  (`ui.sourceView`); die übrigen Orte stehen in den Details rechts.

## 3b. Tastenkürzel

Alle Kürzel stehen als kleine Schilder direkt an ihrer Zeile, in der
Blau-Tönung von `--link-color`, damit sie als eine Familie lesbar sind und
sich von Zahlen wie „4 im Eingang“ unterscheiden. Ein Akkord ist **ein**
Schild („G I“), nicht zwei: G drücken, loslassen, dann innerhalb einer
Sekunde den Buchstaben. Die Schilder lassen sich unter Profil › Kurzbefehle
ausblenden, getrennt für Seitenleiste und Reiterzeile.

| Kürzel | Wirkung |
| --- | --- |
| `1` `2` `3` `4` | Übersicht, Kalender, Aufgaben, Medien |
| `N` | Neu |
| `⌘K` oder `/` | Suche (Palette) |
| `G` dann `I` `F` `P` `R` `L` `A` | Eingang, Favoriten, Projekte, Ressourcen, Lesezeichen, Archiv |
| `⌘[` `⌘]` | Zurück, Vorwärts |
| `⌘\` | Seitenleiste ein- und ausklappen |
| `⌘,` | Profil und Einstellungen |
| `?` | Profil › Kurzbefehle öffnen |
| `Esc` | schließt, was obenauf liegt |

Akkorde mit `G` (wie in Linear und GitHub) skalieren auf beliebig viele Orte:
Planer, Personen und Tags bekommen später je einen freien Buchstaben.

## 4. Suche

- **Einstieg** ist das Feld in der Seitenleiste oder `⌘K`; bei eingeklappter
  Leiste der runde Knopf rechts in der Reiterzeile.
- **Die Suche ist eine Palette** in der Mitte des Fensters: ein Feld, darunter
  Treffer in Gruppen (Zuletzt geöffnet, Einträge, Aufgaben, Termine,
  Arbeitsbereiche). Pfeiltasten wählen, Enter öffnet, Esc schließt. Die Seite
  dahinter bleibt stehen und ist abgedunkelt.
- **„Alle Ergebnisse“** oder Enter im leeren Feld öffnet die Suchseite in der
  Mitte: Treffer in voller Breite, Filter-Pillen darüber, rechts die Vorschau
  des markierten Treffers. Keine Pillen „Suchen / Abbrechen“ unten mehr.
- Die Handy-Pillen „Zuletzt geöffnet / Am häufigsten / Zuletzt gesucht“ werden
  die Gruppen der leeren Palette.

## 5. Kontextspalte je Seite

| Seite | Kontextspalte rechts |
| --- | --- |
| Übersicht | **Heute**: nächster Termin mit Tagesleiste, heute fällige Aufgaben mit Haken. Darunter **Zuletzt geöffnet**. |
| Kalender | **Monat** als kleines Raster zum Springen. Darunter **der gewählte Tag oder Termin**: Titel, Zeit, Ablageort, Notiz. |
| Aufgaben | **Ansicht**: Liste / Board, Gruppieren nach, Sortieren, Erledigte zeigen. Bei markierter Aufgabe: **Details** (Datum, Status, Dringlichkeit, Ablageort). |
| Medien | **Details** der markierten Datei: Vorschau, Typ, Größe, Datum, Ablageort, „Öffnen“. Ohne Auswahl: Speicherbelegung nach Typ. |
| Suche | **Vorschau** des markierten Treffers. |
| Eintrag / Arbeitsbereich | **Details** (heute die Karte am Textende): Kennzahlen, Ablageort, Verknüpfte Einträge, Cover und Icon. Der Text in der Mitte bleibt allein und ruhig. |
| Profil und Einstellungen | keine; die Seite hat links ein eigenes Untermenü. |

Ein Kontextteil ist eine Karte mit Titel. Was leer ist, sagt es in einem
Satz („Heute frei“) und bietet eine Aktion („Termin anlegen“).

## 6. Die Seiten

**Übersicht.** Kopf: nur „Übersicht“, die Überschrift steht allein. Das Datum
steht in der Karte „Heute“ rechts, wo es hingehört. Darunter drei Kennzahlen
statt vier (Einträge, Offen, Erledigt in 7 Tagen — „Heute“ steht rechts).
Aktivitätsband ohne Stufen-Pille. Zwei große Karten „Diese Woche“ und
„Serie“. Dann die vier Sammlungs-Karten und die Arbeitsbereiche.

**Kalender.** Werkzeugzeile: Monat mit Pfeilen, „Heute“, Segment
Tag / Woche / Monat, Plus. Ab 1024 px ist die Woche ein Raster mit sieben
Spalten und Stundenzeilen, die Jetzt-Linie läuft quer. Monat zeigt sechs
Zeilen mit Terminchips. Klick in eine freie Stunde legt einen Termin an.

**Aufgaben.** Werkzeugzeile: Ansichts-Pillen (Alle, eigene Ansichten, Plus),
rechts Segment Liste / Board und Filter. Die Liste hat ruhige Spalten:
Haken, Titel, Fälligkeit, Dringlichkeit, Ablageort. Board wie heute. Die
Karte „Ansicht konfigurieren“ wandert in die Kontextspalte.

**Medien.** Werkzeugzeile: Pillen der Typen, rechts Segment Raster / Liste
und Regler für die Kachelgröße. Die vier Knöpfe (Importieren, Aufnehmen,
Video, Foto) liegen als Glas-Pille unten wie heute.

**Eintrag / Arbeitsbereich.** Lesebreite 720 px, Titel und Text. Die Pillen
„Inhalt / Verknüpfte Einträge“ bleiben oben; „Verknüpfte Einträge“ zeigt
dieselbe Liste wie die Kontextspalte, nur breit. Werkzeuge (Favorit, Typ,
Cover, Menü) rechts in der Kopfzeile.

**Profil und Einstellungen.** Eine Seite in der Mitte statt eines Dialogs,
Titel „Profil“. Links ein Untermenü: Konto, Darstellung, Navigation, Analyse,
Feedback, Kurzbefehle, Hilfe. Rechts der Inhalt der heutigen Karten. Zurück
führt dorthin, woher man kam.

**Profil › Kurzbefehle.** Eine Unterseite mit allen Kürzeln nach Gruppen
(Seiten, Sammlungen, Überall) und zwei Schaltern: „Schilder in der
Seitenleiste“ und „Schilder in der Reiterzeile“. Die Wahl wird gespeichert
(`ui.shortcutHints` in `src/data/state.js`). Die Taste `?` öffnet diese Seite.

## 6a. Abstände

Ein Raster von 4 px, und zwischen Dingen, die nicht zusammengehören, immer
mehr Luft als innerhalb einer Gruppe:

- **Seitenleiste:** 14 px Rand, 14 px zwischen Wortmarke und Suchfeld, 12 px
  unter „Neu“, 16 px über jeder Gruppenüberschrift, Zeilen 32 px hoch, Fuß mit
  10 px über der ersten Zeile.
- **Mitte:** 26 px oben, 30 px seitlich, 20 px unter dem Titel und unter der
  Werkzeugzeile. Kennzahlen: 24 px zwischen den Spalten, 10 px zwischen Pille
  und Zahl, 26 px unter der Reihe. Karten mit 16 px Fuge, 14 / 16 px innen.
- **Kontextspalte:** 18 px oben, 16 px seitlich, 12 px zwischen Karten.

Die Werte werden zu `--desk-*`-Variablen in `styles/tokens-desk.css`; nichts
davon steht als nackte Zahl in einer Stil-Datei.

## 7. Copy

- „Neu anlegen“ → **„Neu“** (Knopf), „Neu im Eingang“ bleibt als Aktion.
- „Alle sortiert“ / „Nichts offen.“ / „Keine Termine in Sicht“ →
  **„Eingang leer“**, **„Nichts fällig“**, **„Heute frei“**.
- Zahlen tragen immer ihr Wort: „3 heute“, „12 offen“, nie eine nackte 3.
- Werkzeuge heißen, was sie tun: „Ansicht“, „Filter“, „Gruppieren“.

## 8. Umsetzung in Schritten

Jeder Schritt ist für sich lauffähig, wird geprüft (`tools/version.py`,
`tools/check.py`, Browser) und einzeln committet.

1. **Gerüst** — *umgesetzt.* Raster in `styles/desk.css` mit den Bereichen
   `brand | top` / `bar | main | rail` / `nav | main | rail`, Zuklappen über
   `.is-nav-closed` (Spalte gleitet auf 0, Stand im Browser gemerkt).
   Wortmarke, Klapp-Knopf und Reiterzeile in `src/shell/desk-head.js` und
   `styles/desk-head.css`. Seitenleiste in `src/shell/desk-nav-parts.js` und
   `src/shell/desk-nav.js`: „Neu“, alle sechs Sammlungen, „Personen“ und
   „Pläne“ als „Bald“ (dieselben Karten wie „Demnächst verfügbar“ am Handy),
   Tab-Gruppen (zugeklappte unter `storageKeys.deskGroups`), Fuß mit Stufe und
   Konto in `styles/desk-nav-foot.css`. Ziele und Tasten an einer Stelle in
   `src/shell/desk-links.js`; Kürzel in `src/shell/desk.js`; blaue Schilder in
   `styles/desk-kbd.css` (ersetzt die Tipp-Karte). Kontodaten liegen jetzt in
   `src/data/account.js`, `goForward()` im Router. Übergang bis Schritt 7:
   Unterseiten zeigen noch ihren eigenen Zurück-Pfeil unter der Reiterzeile.
2. **Suche** — *umgesetzt.* `src/shell/search-palette.js` mit
   `styles/search-palette.css`: Dialog oben in der Mitte mit Feld und Gruppen,
   Pfeiltasten, Enter, Esc, Schild „Enter“ an der gewählten Zeile bzw. an
   „Alle Ergebnisse anzeigen“. Die Gruppen baut
   `src/features/search/search-palette-data.js` (über `load("search")`, Suche
   selbst in `search-data.js`). Öffnen über ⌘K, `/`, das Feld der Seitenleiste
   (am Desktop nur lesbar, `setSearchTakeover` in `src/shell/search-bar.js`)
   und den Such-Knopf — die Leiste bleibt dabei zu. Die Palette ist die
   oberste Ebene für Esc und sperrt alle Kürzel; sie legt keinen
   Verlaufsschritt an und schließt bei Browser-Zurück mit. `styles/search.css`:
   am Desktop keine Knöpfe unten.
3. **Kontextspalte** — *umgesetzt.* `src/shell/desk-rail.js` führt je Ansicht
   einen Kartensatz: `registerRailCards(view, importFn)`, die Importe gibt
   `src/main.js` (`railCards`) über `initDesk` herein, damit `shell/` keine
   `features/` importiert; geladen wird erst, wenn die Ansicht offen ist.
   Übersicht und alle übrigen Seiten behalten die Karten aus
   `src/shell/desk-rail-cards.js`. Neu: `calendar-rail.js` (kleiner Monat zum
   Springen, gewählter Tag), `tasks-rail.js` (Stand, Dringlichkeit,
   Demnächst fällig), `media-rail.js` (Speicher nach Art, zuletzt
   hinzugefügt), `search-rail.js` (Vorschau des Treffers unter Maus oder
   Fokus). Gemeinsame Bausteine in `src/ui/rail-parts.js`, Stile in
   `styles/desk-rail-views.css`; Tag- und Trefferwechsel melden sich über
   `events.contextChanged`. Noch offen und in den späteren Schritten: Details
   der markierten Aufgabe und „Ansicht konfigurieren“ (6), Details einer
   markierten Datei (6), Eintrag und Arbeitsbereich (7).
4. **Profil als Seite** — `styles/desk-overlays.css`: das Einstellungs-Blatt
   wird am Desktop eine Ansicht `settings` mit Untermenü
   (`src/features/profile/settings-nav.js`). Neue Unterseite Kurzbefehle
   (`src/features/profile/shortcuts.js`, `styles/shortcuts.css`) mit der
   Liste und den zwei Schaltern; die Seitenleiste liest den Schalter und
   blendet ihre Schilder aus.
5. **Kalender-Woche** — `src/features/calendar/calendar-week.js` und
   `styles/calendar-week.css`: Sieben-Spalten-Raster ab 1024 px, Segment
   Tag / Woche / Monat in der Werkzeugzeile.
6. **Aufgaben und Medien** — Werkzeugzeilen, Spalten der Liste, Kachelgrößen;
   „Ansicht konfigurieren“ in die Kontextspalte.
7. **Eintrag** — Details in die Kontextspalte, Werkzeuge in die Kopfzeile.
8. **Feinschliff** — Seitenleiste einklappen, `?` für Kürzel, Bewegungen,
   Rollbalken, Dunkelmodus in allen Zuständen, 1024 / 1280 / 1440 prüfen.

Neue Werte kommen nach `styles/tokens-desk.css`: `--desk-top-height`,
`--desk-search-width`, `--desk-nav-collapsed`, `--desk-foot-height`.
Grenzen: 1024 (Seitenleiste + Mitte, Reiter nur als Icons), 1280 (plus
Kontextspalte, Reiter mit Namen), 1440 (Lesebreite 720 → 760 px).

## 9. Was gleich bleibt

Handy-Layout unter 1024 px, Datenmodell, Router, Eingabefeld und seine
Kürzel, Tastenkürzel `N`, `/`, `⌘K`, `1–4`, `Esc` (neue kommen dazu), alle Blätter und Menüs
(sie werden am Desktop weiter als Dialoge gezeigt), die Icon-Sammlung.
