# 2026-10-16-android-xool-menue-kacheln

## Problem
In „Android (Xool-DB)“ öffnete der Reiter „Menü“ nur ein kleines Blatt; gewünscht war die Seitenleiste der Xool-App, von rechts. Die Übersicht zeigte Eingang, Favoriten, Arbeitsbereiche, Ressourcen statt der vier Ablagen wie in Xool, und „Angepinnt“ trug das falsche Icon. Gilt nur für diese Fassung.

## Änderung
- **Seitenleiste von rechts** (`src/shell/android-xool-drawer.js`, `styles/android-xool-drawer.css`, neu): links bleiben 48px der Seite stehen, Schleier dahinter. Kopf mit Marke PARALIST und ✕ (an der Stelle des Menü-Reiters), Profilbild und Name (Tipp öffnet die Einstellungen), darunter die Bereiche Übersicht, Kalender, Aufgaben, Medien, Archiv (der offene als Pille), unten Hell/Dunkel und Einstellungen. Schließen per Schleier, ✕, Escape, Wischen nach rechts und Browser-Zurück. Das Blatt aus Paket 1 entfällt (`android-xool-nav.js`).
- **Vier Kacheln** (`src/features/overview/overview-xool.js`, `overview.js`): Projekte, Arbeitsbereiche, Ressourcen, Archiv mit Zahl; keine zweite Seite und keine Seitenlinie mehr. Der Eingang steht als Liste unter „Listen“, Favoriten unter „Markiert“; Rakete in der Projektfarbe.
- **Pin-Icon** (`assets/icons/sprite-2.svg`, `icon-pinned`): die Reißzwecke von dir für „Angepinnt“ (Reiter, Listenwahl, Menüpunkt „Anpinnen“); der Kartenmarker `icon-pin` bleibt, er gehört den Standorten.
- `platform-versions.js`, `index.html`, `docs/styles-dateien.md` angepasst.

## Begründung
Aufbau und Maße nach `MenuDrawer.jsx` der Xool-App, gespiegelt; Statistik, Sprache und Update-Knopf bleiben weg, weil es sie im MVP an anderer Stelle gibt (Einstellungen). Verworfen: die Kacheln „Favoriten · Briefing · Erinnerungen“ im Menü (Briefing gibt es im MVP nicht).

## Visualisierung
Vorher:
```
 [Eingang][Favoriten]
 [Arbeitsb.][Ressourcen] ›  Menü = kleines Blatt unten
```

Nachher:
```
 [Projekte 7][Arbeitsb. 5]      ┌ PARALIST    ☰┐
 [Ressourcen][Archiv 4]         │ (DN) Dein Name│
                                │ Bereiche      │
                                │ ▣ Übersicht   │
                                │ ▦ Kalender …  │
                                │        ☀  ⚙   │
```

## Hinweise
- Testen: Zeilen öffnen die Seiten und schließen das Menü, Hell/Dunkel im Menü, Profilbild gesetzt, Wischen nach rechts, Browser-Zurück, hell und dunkel.
- Angepinnt gibt es nur für Einträge; Arbeitsbereiche folgen bei Bedarf.
