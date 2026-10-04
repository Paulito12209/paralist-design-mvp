# 2026-10-04-aufgaben-liste-haken-oben

## Problem
- In der Aufgabenliste ragte der Titel rechts bis zum Geräterand und wurde ohne „…“ abgeschnitten; rechts fehlte der Abstand, den links der Haken hat.
- Der Haken stand mittig zur Zeile statt bei der ersten Titelzeile, und er war mit 24px recht groß. Lange Titel sollten wie in Google Tasks bis zu drei Zeilen umbrechen und die Zeile nach unten wachsen lassen.

## Änderung
- `styles/tasks.css`: `.task-row` darf schmaler werden als ihr Titel (`min-width: 0`), der Pfeil rechts schrumpft nicht mehr (`.task-row .chevron`). Gilt in allen Fassungen.
- `styles/android-list.css`: Block „Aufgaben-Liste: Haken oben bei der ersten Titelzeile“ — rechts derselbe Rand wie links (`--m3-tab-edge`), Haken und Auswahlkreis oben auf Höhe der ersten Zeile, Titel bis zu drei Zeilen mit „…“, unsichtbar größere Tippfläche am Haken, weniger Luft unten bei Zeilen mit Nebenzeile.
- `styles/tokens-android.css`: `--m3-task-check-size` (20px), `--m3-task-line-h` (24px), `--m3-task-title-lines` (3).
- Zentrale Dateien berührt: `styles/tokens-android.css`, `styles/tasks.css`.

## Begründung
- Ursache des abgeschnittenen Titels war die fehlende Mindestbreite der Zeile neben dem Haken-Knopf, nicht ein fehlendes Padding.
- Der kleinere Haken wird nur an der Liste gesetzt (`--task-check-size` am `.task-rows`), damit das Board unverändert bleibt; Geister- und Eingabezeile der Liste sind so gleich groß.
- Die Höhe einer einzeiligen Aufgabe bleibt `--m3-list-row-h`, weil der Abstand oben aus Zeilenhöhe und Zeilenhöhe des Titels errechnet wird.
- **Geltungsbereich:** Randfix und Pfeil gelten in allen Fassungen. Drei Zeilen, 20px-Haken und Ausrichtung gelten nur in Android (beide Android-Fassungen); iOS und Desktop brechen den Titel weiter nach einer Zeile mit „…“.
- Verworfen: Haken mittig zur ganzen Zeile; den kleineren Haken auch im Board.

## Visualisierung
Vorher:
```
○ Aufgaben: padding right fällt bei e|nträ    (läuft zum Rand, kein „…“)
```

Nachher:
```
○ Langer Titel, damit Claude weiß, wie
  ein Eintrag in der Aufgaben Reiter
  Weite auszusehen hat. Und die…
  02.10. · Bachelorarbeit
○ Zweite Aufgabe
  Bachelorarbeit · Studium
```

## Hinweise
- Am Gerät prüfen: lange Titel mit Nebenzeile und Durchstreichung, Auswahlmodus (Kreis und Haken auf einer Höhe mit der ersten Zeile), Wischen der Zeile.
- Zeilen mit Nebenzeile sind etwas höher als vorher (etwa 63 statt 58px).
