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

Drei Spalten, jede mit einer Aufgabe:

```
┌──────────┬────────────────────────────────────────┬──────────────┐
│ Seiten-  │ Suchfeld (volle Breite)  · Aktionen    │              │
│ leiste   ├────────────────────────────────────────┤  Kontext     │
│          │                                        │  (je Seite   │
│ Neu      │  Seite                                 │  anders,     │
│ Seiten   │                                        │  einklappbar)│
│ Sammlung │                                        │              │
│ Bereiche │                                        │              │
│          │                                        │              │
│ Stufe    │  Eingabefeld (Glas, schwebt)           │              │
│ Konto ⚙  │                                        │              │
└──────────┴────────────────────────────────────────┴──────────────┘
  264 px      Rest                                    320 px (ab 1280)
```

- **Seitenleiste** = Navigation. Sie zeigt nie Inhalte, nur Wege und Zahlen.
- **Kopfzeile der Mitte** = Suche und die Werkzeuge der offenen Seite.
- **Mitte** = die Seite selbst, breit oder in Lesebreite.
- **Kontextspalte** = das, was zur offenen Seite gehört: Details, Filter,
  Vorschau, Tagesplan. Auf 1024–1279 px eingeklappt, über einen Knopf in
  der Kopfzeile aufklappbar (wie das „i“ in Drive).

## 3. Die Seitenleiste

Von oben nach unten:

1. **Tab-Wähler** statt Logo: der aktive Tab („Meine“) als Kopfzeile mit
   Pfeil, ein Klick zeigt alle Tabs (wie der Projekt-Wechsler in Codex).
   Die Tab-Pillen unter „Arbeitsbereiche“ entfallen dadurch.
2. **Neu** — ein Knopf, schwarz, mit `N`. Kürzer als „Neu anlegen“; das Menü
   dahinter nennt die Typen.
3. **Seiten:** Übersicht, Kalender, Aufgaben, Medien. Zahl rechts nur, wenn
   sie etwas Neues sagt: Kalender = Termine heute, Aufgaben = heute fällig.
4. **Sammlungen:** Eingang (Zahl = unsortiert), Favoriten, Projekte,
   Ressourcen.
5. **Arbeitsbereiche** des aktiven Tabs, Plus rechts neben der Überschrift.
6. **Fuß, fest unten** (rollt nicht mit):
   - **Stufe**: kleiner Ring, „Stufe 1 · 300 XP bis Stufe 2“. Klick öffnet
     Fortschritt. Das ist die einzige Stelle mit dem Ring; der Level-Ring
     links oben und die Kachel rechts entfallen.
   - **Einstellungen** mit Zahnrad, Kürzel `⌘,`.
   - **Konto**: Profilbild, Name, darunter „Pro“. Klick öffnet Einstellungen
     auf „Konto“.
   - Die Tipp-Karte entfällt. Tastenkürzel liegen auf `?` und im Menü
     „Hilfe“ unter Einstellungen.

Einklappen auf 72 px (nur Icons) über `⌘\` oder den Griff am Rand; die
Einstellung wird gemerkt.

## 4. Suche

- **Ein Suchfeld**, in der Kopfzeile der Mitte, volle Breite bis 720 px,
  Platzhalter „Suchen oder Befehl … ⌘K“.
- Tippen öffnet eine **Ergebnisliste direkt unter dem Feld** (Palette), in
  Gruppen: Zuletzt geöffnet, Einträge, Aufgaben, Termine, Arbeitsbereiche.
  Pfeiltasten wählen, Enter öffnet, Esc schließt. Die Seite dahinter bleibt.
- Enter im leeren Feld oder „Alle Ergebnisse“ öffnet die **Suchseite in
  der Mitte**: Treffer in voller Breite, Filter als Pillen darüber (Alle,
  Aufgaben, Notizen, Termine, Medien), rechts die Vorschau des markierten
  Treffers. Keine Pillen „Suchen / Abbrechen“ unten mehr — die Tastatur
  ist immer da.
- Die Handy-Pillen „Zuletzt geöffnet / Am häufigsten / Zuletzt gesucht“
  werden am Desktop die Gruppen der leeren Palette.

## 5. Kontextspalte je Seite

| Seite | Kontextspalte rechts |
| --- | --- |
| Übersicht | **Heute**: nächster Termin mit Tagesleiste, heute fällige Aufgaben mit Haken. Darunter **Zuletzt geöffnet**. |
| Kalender | **Monat** als kleines Raster zum Springen. Darunter **der gewählte Tag oder Termin**: Titel, Zeit, Ablageort, Notiz. |
| Aufgaben | **Ansicht**: Liste / Board, Gruppieren nach, Sortieren, Erledigte zeigen. Bei markierter Aufgabe: **Details** (Datum, Status, Dringlichkeit, Ablageort). |
| Medien | **Details** der markierten Datei: Vorschau, Typ, Größe, Datum, Ablageort, „Öffnen“. Ohne Auswahl: Speicherbelegung nach Typ. |
| Suche | **Vorschau** des markierten Treffers. |
| Eintrag / Arbeitsbereich | **Details** (heute die Karte am Textende): Kennzahlen, Ablageort, Verknüpfte Einträge, Cover und Icon. Der Text in der Mitte bleibt allein und ruhig. |
| Einstellungen | keine; die Seite hat links ein eigenes Untermenü. |

Ein Kontextteil ist eine Karte mit Titel. Was leer ist, sagt es in einem
Satz („Heute frei“) und bietet eine Aktion („Termin anlegen“).

## 6. Die Seiten

**Übersicht.** Kopf: „Übersicht“ und das Datum. Darunter drei Kennzahlen
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

**Einstellungen.** Eine Seite in der Mitte statt eines Dialogs. Links ein
Untermenü: Konto, Darstellung, Navigation, Analyse, Feedback, Hilfe. Rechts
der Inhalt der heutigen Karten. Zurück-Pfeil führt dorthin, woher man kam.

## 7. Copy

- „Neu anlegen“ → **„Neu“** (Knopf), „Neu im Eingang“ bleibt als Aktion.
- „Alle sortiert“ / „Nichts offen.“ / „Keine Termine in Sicht“ →
  **„Eingang leer“**, **„Nichts fällig“**, **„Heute frei“**.
- Zahlen tragen immer ihr Wort: „3 heute“, „12 offen“, nie eine nackte 3.
- Werkzeuge heißen, was sie tun: „Ansicht“, „Filter“, „Gruppieren“.

## 8. Umsetzung in Schritten

Jeder Schritt ist für sich lauffähig, wird geprüft (`tools/version.py`,
`tools/check.py`, Browser) und einzeln committet.

1. **Gerüst** — `styles/desk.css`: Raster `nav | top | rail`, die Kopfzeile
   wandert über die Mitte, Level-Ring und Profil-Knopf am Desktop aus.
   `src/shell/desk-nav-parts.js`: Fuß mit Stufe, Einstellungen, Konto;
   Tipp-Karte raus (`desk-nav-tip.css` wird zum Tasten-Schild-Stil).
   Neue Datei `styles/desk-nav-foot.css`.
2. **Suche** — `styles/search.css` und `desk.css`: Feld volle Breite, keine
   Pillen unten. Neue Datei `src/shell/search-palette.js` mit Ergebnisliste
   unter dem Feld (nutzt `src/features/search/search-data.js` über
   `load("search")`).
3. **Kontextspalte** — `src/shell/desk-rail.js` bekommt Karten je Ansicht:
   `registerRailCards(view, cards)` wird von `src/main.js` gefüllt, damit
   `shell/` keine `features/` importiert. Karten in
   `src/shell/desk-rail-cards.js` (Übersicht) und je Bereich eine Datei
   `src/features/<bereich>/<bereich>-rail.js`.
4. **Einstellungen als Seite** — `styles/desk-overlays.css`: das
   Einstellungs-Blatt wird am Desktop eine Ansicht `settings` mit Untermenü
   (`src/features/profile/settings-nav.js`).
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
Grenzen: 1024 (Seitenleiste + Mitte), 1280 (plus Kontextspalte), 1440
(Lesebreite 720 → 760 px).

## 9. Was gleich bleibt

Handy-Layout unter 1024 px, Datenmodell, Router, Eingabefeld und seine
Kürzel, Tastenkürzel `N`, `/`, `⌘K`, `1–4`, `Esc`, alle Blätter und Menüs
(sie werden am Desktop weiter als Dialoge gezeigt), die Icon-Sammlung.
