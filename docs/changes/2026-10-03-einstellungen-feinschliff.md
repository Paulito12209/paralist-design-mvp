# 2026-10-03-einstellungen-feinschliff

## Problem
- „Persönliche Daten“ stand fest im Code (Name, Mail) und ließ sich nicht ändern; „Dabei seit“ war ein fester Text.
- Unter Tabs hatten die beiden Zeilen „Neue Ansichten erscheinen“ unterschiedliche Pfeile.
- Am Ende der Einstellungen stand die Versionszeile links, der Nach-oben-Knopf lag fast auf der letzten Zeile und hatte ein Glühen.
- Es gab keine Einstellung dafür, ob leere Sammlungen Emblem und Erklärsatz zeigen.

## Änderung
- **Neu** `src/data/profile.js`: Name, E-Mail, Telefon, Links und „Dabei seit“ liegen unter dem Schlüssel `paralist-profile`. Vorgabe: „Dein Name“, leere Felder („Hinzufügen“). `trackFirstOpen()` (aufgerufen in `src/main.js` vor `loadState()`) merkt den Tag des ersten Öffnens; Geräte, die schon Daten hatten, bekommen „Juni 2025“.
- `src/data/account.js` liest Name, Mail, Telefon, Links, „Dabei seit“ und Initialen per `get` aus dem Profil.
- **Neu** `src/features/profile/account-personal.js`: Seite „Persönliche Daten“. Tipp auf eine Zeile = Eingabefeld (Enter speichert, Esc bricht ab, lange Werte enden mit „…“), „Link hinzufügen“ legt weitere Links an, Zeile „Dabei seit“ und die Zeile im Profilkopf öffnen den Kalender des Systems (`openDayPicker`); Tage in der Zukunft gelten nicht. `account.js` behält Passwort, Synchronisierung und Kopier-Knopf.
- `src/features/profile/app-settings.js`, `styles/settings.css`: beide Zeilen unter „Neue Ansichten erscheinen“ nutzen den Pfeil nach rechts, der linke gespiegelt (`is-flipped`); neue Zeile „Erklärung zeigen“ unter Design.
- `src/data/design-prefs.js`, `src/core/storage.js`, `src/ui/empty-state.js` und sechs Sammlungen (Projekte, Arbeitsbereiche, Archiv, Lesezeichen, Medien, Ressourcen): `collectionEmptyState()` zeigt Emblem und Erklärsatz nur bei gesetztem Haken.
- `styles/modal-top.css`, `styles/profile.css`, `styles/android-pages-content.css`, `styles/android-settings-google.css`: Versionszeile mittig, so hoch wie der Nach-oben-Knopf; Knopf 16 px unter der letzten Zeile und 16 px vom rechten Rand, ohne Schatten.
- `styles/account.css`: Eingabefeld in der Zeile, Beschriftung bricht nie um.

## Begründung
- Eigener Speicherschlüssel statt Zustand: der Zustand enthält Beispieldaten und würde beim Zurücksetzen alles überschreiben.
- Zeilen werden einzeln neu gezeichnet, damit ein Tipp auf die nächste Zeile nicht ins Leere geht.
- System-Kalender für „Dabei seit“: dasselbe wie bei Fälligkeiten und genau das, was die native Android-App zeigt.
- Knopf `bottom` 24 px = unterer Innenabstand der Blätter, damit er am Seitenende neben der Versionszeile sitzt. Neue Maße stehen in `modal-top.css`, weil `tokens-pages.css` mit 397 Zeilen voll ist.
- Verworfen: den Knopf in den Seitenfluss legen (verschwindet bei jedem Neuzeichnen); für alte Geräte „heute“ als „Dabei seit“ nehmen.

## Visualisierung
Vorher:
```
Name   Paul Angeles ⧉      Tabs:  <  Vor „Alle“
E-Mail paul@paralist.app ⧉        →  Am Ende, rechts
+ Link hinzufügen (ohne Wirkung)
 Danksagungen
 PARALIST 0.1.0 (MVP)   (⌃)  ← 6 px Abstand, Glühen
```

Nachher:
```
Name        Dein Name          Tabs:  ←  Vor „Alle“
E-Mail      Hinzufügen                →  Am Ende, rechts
Telefon     Hinzufügen
Dabei seit  März 2025   ← Kalender
 Danksagungen
        16 px
   PARALIST 0.1.0 (MVP)   (⌃)  ← mittig, kein Glühen
```

## Hinweise
- Alle, die den Link vor dieser Änderung geöffnet haben, zeigen „Juni 2025“ (echtes Datum nicht rekonstruierbar); sie können es über den Kalender ändern.
- Bisherige Angaben (Name, Mail) sind weg und müssen neu eingegeben werden.
- Der Nach-oben-Knopf sitzt in allen Blättern 8 px höher als zuvor.
- „Erklärung zeigen“ aus: leere Sammlungen zeigen nur Überschrift und Knopf; „Keine Aufgaben“ hat keinen Erklärsatz und bleibt unverändert.
- Am Gerät testen: Eingabe mit der Android-Tastatur, Kalender, Fußzeile ganz unten.
- Zentrale Dateien: `src/main.js`, `src/core/storage.js`, `src/data/version.js`.
