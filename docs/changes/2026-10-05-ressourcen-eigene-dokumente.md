# 2026-10-05-ressourcen-eigene-dokumente

## Problem
Auf der Seite „Ressourcen“ fehlten unter der Pille „Eigene Dokumente“
selbst angelegte Dokumente. Einträge vom Typ `dokument` standen dort schon;
es fehlten die Einträge, die das Eingabefeld auf der Medien-Seite anlegt:
Typ `medien` ohne Datei. Die App führt sie als Dokument
(`mediaKindOf` → `"doc"`), sie erschienen auf der Ressourcen-Seite aber nur
unter „Alle“.

## Änderung
- `src/data/queries.js`: neue Funktion `isOwnDocument(entry)`. Sie erkennt
  ein selbst angelegtes Dokument: Typ `dokument` oder Typ `medien` ohne
  `media`-Angabe.
- `src/features/resources/resources.js`: Die Pille „Eigene Dokumente“
  filtert mit `isOwnDocument` statt nur nach Typ `dokument`.

## Begründung
Hochgeladene Dateien tragen immer eine `media`-Angabe
(`src/features/composer/attachments.js`, `src/features/media/media-import.js`).
Daran lassen sich selbst Geschriebenes und Uploads sicher trennen: Eine
hochgeladene PDF bleibt draußen, denn sie ist kein eigenes Dokument.
Verworfen: alle Einträge der Medien-Art „Dokumente“ mitzuzählen, denn dann
stünden auch fremde Dateien unter „Eigene“.
Geltungsbereich: alle Fassungen.

## Visualisierung
Vorher:
```
Alle 13 · Notizen 4 · Zeichnungen 1 · Eigene Dokumente 2
September 2026
  📄 Mietvertrag Leipzig
August 2026
  📄 Exposé Bachelorarbeit
```

Nachher:
```
Alle 13 · Notizen 4 · Zeichnungen 1 · Eigene Dokumente 3
Oktober 2026
  📄 Text von der Medien-Seite (ohne Anhang)
September 2026
  📄 Mietvertrag Leipzig
August 2026
  📄 Exposé Bachelorarbeit
```

## Hinweise
- Die Zahl auf der Pille steigt bei allen, die auf der Medien-Seite Text ohne
  Anhang angelegt haben. Das ist so gewollt.
- Neu anlegen aus der Pille „Eigene Dokumente“ erzeugt weiter den Typ `dokument`.
- Testen: Auf der Medien-Seite Text ohne Anhang anlegen → Ressourcen ›
  Eigene Dokumente zeigt ihn; ein hochgeladenes Foto oder PDF erscheint dort nicht.
