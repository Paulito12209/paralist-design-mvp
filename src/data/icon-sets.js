/*
 * Die Icons, die man einem Eintrag, Tab oder Arbeitsbereich selbst geben kann
 * — in Gruppen, so wie der Icon-Wähler (src/ui/pickers.js) sie zeigt. Die
 * ersten beiden Gruppen sind die Icons, die die App schon kennt: die
 * Hauptreiter und Sammlungen der Startseite sowie die Kategorien der
 * Einträge. So findet man ein Icon dort wieder, wo man es schon gesehen hat.
 * Pfad: src/data/icon-sets.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * iconGroups[*].label -> Überschrift der Gruppe im Icon-Wähler
 * iconGroups[*].icons -> welche Icons (Name aus assets/icons/sprite*.svg) mit welchem Namen darin stehen
 */

export const iconGroups = [
  {
    label: "Bereiche und Sammlungen",
    icons: [
      { id: "grid", label: "Übersicht" },
      { id: "inbox", label: "Eingang" },
      { id: "star-outline", label: "Favoriten" },
      { id: "cube", label: "Ressourcen" },
      { id: "checklist", label: "Aufgaben" },
      { id: "layers", label: "Arbeitsbereich" },
      { id: "tag", label: "Tab" },
      { id: "folder", label: "Ordner" },
      { id: "archive", label: "Archiv" },
      { id: "profile", label: "Profil" },
    ],
  },
  {
    label: "Kategorien",
    icons: [
      { id: "note", label: "Notiz" },
      { id: "task", label: "Aufgabe" },
      { id: "calendar", label: "Termin" },
      { id: "rocket", label: "Projekt" },
      { id: "doc", label: "Dokument" },
      { id: "scribble", label: "Zeichnung" },
      { id: "photos", label: "Medien" },
    ],
  },
  {
    label: "Weitere",
    icons: [
      { id: "smile", label: "Privat" },
      { id: "briefcase", label: "Arbeit" },
      { id: "academic", label: "Schule / Uni" },
      { id: "flame", label: "Flamme" },
      { id: "trophy", label: "Pokal" },
      { id: "bookmark", label: "Lesezeichen" },
      { id: "pin", label: "Pin" },
      { id: "people", label: "Personen" },
      { id: "globe", label: "Welt" },
      { id: "clock", label: "Uhr" },
      { id: "sun", label: "Sonne" },
      { id: "moon", label: "Mond" },
      { id: "image", label: "Bild" },
      { id: "video", label: "Video" },
      { id: "mic", label: "Mikrofon" },
      { id: "camera", label: "Kamera" },
      { id: "table", label: "Tabelle" },
      { id: "board", label: "Board" },
      { id: "roadmap", label: "Roadmap" },
      { id: "trend", label: "Trend" },
      { id: "link", label: "Verknüpfung" },
      { id: "pencil", label: "Stift" },
    ],
  },
];

/** Alle wählbaren Icons in einer flachen Liste, z.B. zum Prüfen eines Namens. */
export const pickableIcons = iconGroups.flatMap((group) => group.icons);
