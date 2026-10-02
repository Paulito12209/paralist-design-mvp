# 2026-10-02-android-ohne-plan

## Problem
Die Android-Fassung bietet zunächst kein Abo und keinen Cloud-Sync an (alles
läuft offline). Trotzdem zeigten die Einstellungen „Plan verwalten“, die Zeile
„Plan: Pro“ in den Kontoeinstellungen und „Pro ·“ im Profilkopf.

## Änderung
- `src/features/profile/profile-cards.js`: Neue Hilfen `showsPlan()` und
  `metaLine()`. Der Profilkopf zeigt in Android nur „Dabei seit Juni 2025“.
  Zeilen mit `plan: true` filtert `sectionMarkup()` in Android heraus;
  „Plan verwalten“ trägt diese Markierung.
- `src/features/profile/account.js`: Die Zeile „Plan“ in den
  Kontoeinstellungen trägt `plan: true`.
- `src/data/account.js`: Feld `meta` heißt jetzt `since` („Dabei seit Juni
  2025“); der Plan wird beim Zeichnen davorgesetzt. Header angepasst.
- `src/data/version.js`: neuer Versionsstempel.

## Begründung
Die Weiche läuft über `isMobileOs("android")` wie die übrigen
Android-Unterschiede; sie greift nur am Handy und Tablet, nicht in der
Desktop-Fassung. Die Plan-Zeilen bleiben markiert im Code, damit ein späteres
Abo sie leicht wieder einschalten kann. Verworfen: Ausblenden per CSS (Zeilen
blieben im Bedienbaum, Trennlinien und Abstände müssten nachgezogen werden).

## Visualisierung
Vorher (Android):
```
Profilkopf:   Pro · Dabei seit Juni 2025
Konto         ┌ Kontoeinstellungen   > ┐
              └ Plan verwalten       > ┘
Angaben       ┌ Name     Paul Angeles ┐
              │ E-Mail   paul@para…   │
              └ Plan     Pro          ┘
```

Nachher (Android):
```
Profilkopf:   Dabei seit Juni 2025
Konto         ┌ Kontoeinstellungen   > ┐
              └─────────────────────────┘
Angaben       ┌ Name     Paul Angeles ┐
              └ E-Mail   paul@para…   ┘
```

## Hinweise
- iOS, „Erster Test“ und Desktop zeigen den Plan weiterhin.
- Beim Wechsel unter Einstellungen › Mehr › Versionen wird das Blatt neu
  gezeichnet; die Plan-Zeilen erscheinen und verschwinden dabei sofort.
- Geprüft bei 375 px im dunklen Design, Konsole leer.
