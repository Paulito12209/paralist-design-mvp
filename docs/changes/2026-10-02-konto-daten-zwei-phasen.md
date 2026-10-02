# 2026-10-02-konto-daten-zwei-phasen

## Problem
„Konto → Kontoeinstellungen → Sicherheit → Passwort ändern“ war doppelt benannt und zu tief verschachtelt. Außerdem fehlte ein Weg für die erste Android-App, die ohne Cloud und damit ohne Konto startet.

## Änderung
- **Phase 1** (Fassung „Android“, ohne Konto): Abschnitte „Profil“ (Persönliche Daten) und „Daten“ (Exportieren, Importieren, Alle Daten löschen – nur auf diesem Gerät). Kein „Plan verwalten“, keine E-Mail im Profilkopf, kein „Abmelden“.
- **Phase 2** (Android Experiment, iOS, Erster Test, Desktop; mit Cloud-Sync): Abschnitt „Konto“ mit Persönliche Daten, Passwort ändern, Synchronisierung, Plan verwalten; darunter „Daten“ und eine einzelne rote Karte „Konto löschen“ (eigene Seite).
- „Persönliche Daten“: Name, E-Mail, Telefon, Links, je Zeile ein Kopier-Knopf (Haken als Rückmeldung).
- Die Android-Fassungen zeigen „Analyse“ nicht mehr in den Einstellungen (Desktop und andere Fassungen unverändert).
- Neu: `src/features/profile/account-phase.js`, `account-delete.js`, `styles/account.css`. Neu geschrieben: `account.js`. Angepasst: `profile-cards.js`, `profile.js`, `settings-cards.js`, `settings-nav.js`, `src/data/account.js`, `styles/profile.css`, `styles/tokens-pages.css`, `styles/tokens.css` (Dateiliste), `index.html` (CSS-Zeile), `src/data/version.js`.

## Begründung
- Die Phasen hängen an der gewählten Fassung, so lassen sich beide im Entwurf ohne extra Schalter vergleichen.
- Google Play verlangt Löschen in der App, sobald man darin ein Konto anlegen kann; ohne Konto genügt „Alle Daten löschen“.
- Löschen liegt auf einer eigenen Seite, damit ein Tipp beim Scrollen nichts auslöst.
- Haken am Kopier-Knopf statt Meldung: die Meldung läge hinter dem Einstellungs-Blatt.
- Verworfen: „Plan verwalten“ in Phase 1 – ohne Cloud gibt es keinen Plan.

## Visualisierung
Vorher:
```
Konto
 Kontoeinstellungen >  → Angaben · Sicherheit (Passwort ändern >) · Gefahrenzone (Konto löschen)
 Plan verwalten >
```

Nachher:
```
Phase 1 (Android)          Phase 2 (mit Konto)
Profil                     Konto
 └ Persönliche Daten >      ├ Persönliche Daten >
Daten                       ├ Passwort ändern   >
 ├ Exportieren              ├ Synchronisierung  >
 ├ Importieren              └ Plan verwalten    >
 └ Alle Daten löschen      Daten · Konto löschen (rot) · Abmelden
```

## Hinweise
- Export, Import, Lösch-Knöpfe, „Passwort ändern“ und „Link hinzufügen“ zeigen nur den Aufbau; die Werte in „Persönliche Daten“ sind Beispielwerte und noch nicht bearbeitbar (eigene Aufgabe).
- Die alte Adresse `#/einstellungen/konto` gibt es nicht mehr.
- Testen: Mehr › Versionen zwischen „Android“ und „Android (Experiment)“ wechseln; 375 px, hell/dunkel, Zurück-Pfeil und Browser-Zurück.
