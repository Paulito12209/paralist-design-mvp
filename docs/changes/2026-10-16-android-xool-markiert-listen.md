# 2026-10-16-android-xool-markiert-listen

## Problem
In „Android (Xool-DB)“ fehlte unter „Markiert“ die Liste „Angepinnt“, Lesezeichen standen fälschlich unter „Markiert“ statt unter „Listen“, unter der Liste war noch Seitengrund statt der weißen Fläche wie in Xool, das Plus war eine gefüllte Pille statt des Xool-Zeichens, und die Namen unter den Icons hingen an der Einstellung. Außerdem zeigte der Simulator alte Stände. Gilt nur für diese Fassung.

## Änderung
- **„Markiert“ / „Listen“ wie in Xool** (`src/features/overview/home-xool.js`): Markiert = Angepinnt (Vorgabe), Favoriten; Listen = Eingang (Vorgabe), Aufgaben, Termine · Lesezeichen · Projekte, Arbeitsbereiche, Ressourcen, Archiv. Im Blatt „Liste wählen“ steht die gewählte allein oben, darunter die Gruppen mit Strich. Ohne gespeicherte Wahl ist „Markiert“ offen.
- **Anpinnen** (neu): `togglePinned()` in `src/data/mutations.js`, Menüpunkt „Anpinnen“/„Lösen“ im Eintragsmenü (`src/ui/entry-menu.js`, nur in dieser Fassung), Zeilen der Liste „Angepinnt“ in `src/features/overview/home-list.js` (Feld `entry.pinned`).
- **Fläche bis zur Leiste** (`styles/android-xool-overview.css`): die Übersicht füllt die Höhe, unter der letzten Zeile reicht eine leere Karte bis nach unten.
- **Plus** (`styles/android-xool-nav.css`, `index.html`, `assets/icons/sprite-2.svg`): Zeichen der Xool-App (`icon-spark-plus`) ohne Pille, dunkles Silberblau im Hellen, helles im Dunkeln.
- **Namen unter den Icons immer an** (`src/shell/nav-bar.js`).
- `src/data/platform-versions.js`: Zeilen „Navigationsleiste“ und „Übersicht“ angepasst.
- Simulator: Safari speicherte die Dateien von Port 4173 zwischen (der einfache Server sendet kein Cache-Control). Für den Simulator läuft `tools/serve.py` auf Port 4176 (kein Zwischenspeichern); `.claude/launch.json` bleibt unverändert.

## Begründung
Gruppen und Vorgaben aus `overviewStore.js` und `listPicker.js` der Xool-App. Anpinnen ist neue Logik, aber nur in dieser Fassung sichtbar; die anderen Fassungen bleiben, wie sie sind. Verworfen: „Erinnerungen“, Notizen, Dokumente, Zeichnungen, Personen, Pläne, Tags als eigene Listen (gibt es im MVP so nicht).

## Visualisierung
Vorher:
```
 Markiert ˅ (Favoriten, Lesezeichen)   Listen
 ╭ Favoriten 6 ╮
 ...Seitengrund bis zur Leiste...
 ▣  ▦  (＋)  ☑  ☰
```

Nachher:
```
 Markiert ˅ (Angepinnt, Favoriten)   Listen ⤓
 ╭ Angepinnt 1            ╮
 │ ▤ Eintrag            ⋮ │
 │                        │  leere Karte bis zur Leiste
 ╰────────────────────────╯
 ▣      ▦      ✚      ☑      ☰
Übers. Kal.   Neu   Aufg.  Menü
```

## Hinweise
- Testen: Eintrag über ⋮ anpinnen und lösen, Listenwahl in beiden Reitern, leere Listen, hell und dunkel.
- Arbeitsbereiche lassen sich noch nicht anpinnen (nur Einträge).
