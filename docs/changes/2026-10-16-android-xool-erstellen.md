# 2026-10-16-android-xool-erstellen

## Problem
In „Android (Xool-DB)“ standen unter dem Kopf der Übersicht noch Werkzeugzeile (Archiv, Sortieren) und rechts der Pfeil „Seite öffnen“, die es in der Xool-App nicht gibt. Der Pfeil zur Listenwahl sollte nach rechts. Das Regler-Zeichen sollte überall das der Übersicht sein. Das Plus sprang beim Tippen (seitlich und beim ✕ senkrecht), sollte „Erstellen“ heißen, und das Anlege-Blatt brauchte Überschrift, mittige Abschnitte mit Linien und Chips in einer Zeile. Gilt nur für diese Fassung.

## Änderung
- **Kopf der Übersicht** (`src/features/overview/home-xool.js`, `home-list.js`, `styles/android-xool-overview.css`): links Name und Anzahl, rechts der Pfeil nach unten; beides öffnet die Listenwahl. Der Pfeil „Seite öffnen“ entfällt (die Seiten öffnen die Kacheln). Die Werkzeugzeile der Projekte ist ausgeblendet, nicht gelöscht — Archiv und Sortieren bleiben auf der Seite Projekte und im Blatt hinter dem Regler.
- **Regler-Zeichen** (`src/shell/android-xool-nav.js`): in dieser Fassung trägt das Symbol „tune“ überall das Zeichen „sliders“ (Kalender, Aufgaben, Übersicht).
- **Plus ruhig** (`styles/android-xool-nav.css`): kein Rutschen und Abblenden mehr beim Tippen (aus der ersten Fassung); das ✕ steht bei weggeblendeter Leiste auf derselben Höhe wie der runde Plus-Knopf (`styles/android-xool-create.css`), dadurch springt nichts mehr.
- **„Erstellen“** statt „Neu“ unter dem Plus (`index.html`).
- **Anlege-Blatt** (`src/shell/android-xool-create.js`, `styles/android-xool-create.css`): Überschrift „Erstellen“ mittig mit Linie über die ganze Breite; Abschnittsnamen mittig mit Linien links und rechts, 4px mehr Luft zu den Chips; Chips in einer Zeile, die waagerecht rollt und beim Öffnen mittig steht; Ressourcen in der Reihenfolge Dokument, Zeichnung, Datei, Lesezeichen.

## Begründung
Funktionen des MVP, die Xool nicht hat, werden nur ausgeblendet, damit die Logik bleibt. Das Regler-Zeichen wird über das Symbol getauscht, so ändert sich kein Markup der anderen Fassungen.

## Visualisierung
Vorher:
```
 ╭ Projekte ˅ 7              ↗ ╮
 │ ▤ Archiv               ⇅    │
 Plus: „Neu“, rutscht beim Tippen
```

Nachher:
```
 ╭ Projekte 7                 ˅ ╮
 │ 🚀 Umzug nach Leipzig      ⋮ │
 ╭────────── Erstellen ──────────╮
 │ ─────────── Lernen ─────────── │
 │   (Karteikarte)(Kartendeck)    │
 │ ───────── Ressourcen ───────── │
 │ ument)(Zeichnung)(Datei)(Lese  │  rollt waagerecht
 ╰───────────────────────────────╯
            (✕)  Erstellen
```

## Hinweise
- Testen am Android-Gerät: Plus und ✕ tippen (nichts springt), mit und ohne weggeblendete Leiste; Ressourcen-Zeile wischen; Listenwahl über Name und Pfeil; Regler-Zeichen in Kalender und Aufgaben.
