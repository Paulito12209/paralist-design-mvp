/*
 * Feste Listen der App: Eintragstypen, Übersichtskarten, XP-Arten, Themes.
 * Hier steht nur, WAS es gibt — nicht, wie es aussieht oder was gespeichert ist.
 * Pfad: src/data/config.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * xpItems[*].color        -> Farbe des Typs in Verlauf, Kalenderpunkt und Eingabefeld
 * xpKinds[*].color        -> Farbe im Ring des Fortschritt-Blatts (verweist auf styles/tokens.css)
 * xpKinds[*].amount       -> wie viele XP ein Ereignis bringt
 * composerPlaceholders    -> Platzhaltertext im Eingabefeld je gewähltem Typ
 * levelSteps / levelStep  -> ab wie vielen XP die nächste Stufe beginnt
 */

/*
 * Eintragstypen: bestimmen das Icon vor dem Titel in den Listen.
 * `pick: true` heißt, dass es für den Typ einen eigenen Knopf im Eingabefeld gibt.
 * Ohne gewählten Knopf entsteht ein Dokument.
 */
export const types = [
  { id: "aufgabe", label: "Aufgabe", icon: "task", pick: true },
  { id: "notiz", label: "Notiz", icon: "note", pick: true },
  { id: "termin", label: "Termin", icon: "calendar", pick: true },
  { id: "projekt", label: "Projekte", icon: "rocket", pick: true },
  { id: "dokument", label: "Dokument", icon: "doc" },
  { id: "zeichnung", label: "Zeichnung", icon: "scribble" },
  { id: "medien", label: "Medien", icon: "photos" },
];

/** Typ eines Eintrags ohne ausdrückliche Wahl. */
export const defaultType = "dokument";

/** Diese Typen sammelt die Ressourcen-Karte, egal wo sie abgelegt sind. */
export const resourceTypes = ["dokument", "zeichnung", "medien"];

/* Extra-Knopf neben den Typen: sieht aus wie die Ressourcen-Kachel, legt aber ein Dokument an. */
export const resourcePick = { id: "ressourcen", label: "Ressourcen", icon: "cube", typeId: "dokument" };

/** Platzhalter im Eingabefeld je gewähltem Typ. */
export const composerPlaceholders = {
  aufgabe: "Neue Aufgabe einfügen …",
  notiz: "Neue Notiz einfügen …",
  termin: "Neuen Termin eintragen …",
  projekt: "Neues Projekt einfügen …",
  dokument: "Neue Ressource anlegen …",
  zeichnung: "Neue Zeichnung anlegen …",
  medien: "Neues Medium anlegen …",
};

/*
 * Jede Übersichtskarte ist ein Ablageort: „parent“ verbindet sie mit den Einträgen,
 * „seed“ legt beim allerersten Start Beispieleinträge an.
 * „kind“ markiert Sammlungen, die selbst kein Ablageort sind:
 * Favoriten zeigt nur Markiertes, Ressourcen alle Dokumente, Zeichnungen und Medien.
 */
export const overviewPages = {
  1: { title: "Inbox", icon: "inbox", parent: null },
  2: { title: "Favoriten", icon: "star-outline", kind: "favorites" },
  3: { title: "Projekte", icon: "rocket", parent: "o3" },
  4: { title: "Ressourcen", icon: "cube", kind: "resources" },
};

/** Ablageort der Projekte-Karte — als Name, damit niemand „o3“ abschreiben muss. */
export const projectParent = overviewPages[3].parent;

/** Icons, die man einem Tab oder Arbeitsbereich geben kann. */
export const presetIcons = [
  { id: "smile", label: "Privat" },
  { id: "briefcase", label: "Arbeit" },
  { id: "academic", label: "Schule / Uni" },
];

/** XP-Arten: bestimmen Farbe, Icon und Punkte je Ereignis. */
export const xpKinds = {
  created: { label: "Angelegt", icon: "plus-circle", color: "var(--xp-created)", amount: 1 },
  done: { label: "Erledigt", icon: "check-circle", color: "var(--xp-done)", amount: 2 },
};

/** Was angelegt wurde: Icon und Farbe für Historie, Kalenderpunkte und Typ-Knöpfe. */
export const xpItems = {
  aufgabe: { label: "Aufgabe", icon: "task", color: "#0a84ff" },
  notiz: { label: "Notiz", icon: "note", color: "#ffd60a" },
  termin: { label: "Termin", icon: "calendar", color: "#5ac8fa" },
  medien: { label: "Medien", icon: "photos", color: "#30d158" },
  projekt: { label: "Projekte", icon: "rocket", color: "#af2d3a" },
  dokument: { label: "Dokument", icon: "doc", color: "#64d2ff" },
  zeichnung: { label: "Zeichnung", icon: "scribble", color: "#ff375f" },
  arbeitsbereich: { label: "Arbeitsbereich", icon: "layers", color: "#ff9f0a" },
  tab: { label: "Tab", icon: "tag", color: "#bf5af2" },
};

/** Stufen 1–4 als feste Schwellen; danach wächst der Abstand um `levelStep` je Stufe. */
export const levelSteps = [0, 0, 300, 600, 1000];
export const levelStep = 100;

/** Auswahl in den Einstellungen. */
export const themes = [
  { id: "system", label: "System", icon: "display" },
  { id: "light", label: "Hell", icon: "sun" },
  { id: "dark", label: "Dunkel", icon: "moon" },
];

/** Zeiträume, die die Diagramme im Fortschritt und im Profil anbieten. */
export const chartRanges = [7, 30, 90];

/** Typ-Icon eines Eintrags; unbekannte Typen bekommen das Platzhalter-Icon. */
export function typeIcon(id) {
  const type = types.find((item) => item.id === id);
  return type ? type.icon : "placeholder";
}

/** Anzeigename eines Typs, z.B. „aufgabe“ → „Aufgabe“. */
export function typeLabel(id) {
  const type = types.find((item) => item.id === id);
  return type ? type.label : "Eintrag";
}

/** Icon und Farbe für einen Historien-Posten; unbekannte Posten bleiben grau. */
export function xpItemStyle(item) {
  return xpItems[item] || { label: item, icon: "placeholder", color: "var(--muted)" };
}

/* ---------- Auswahl-Listen der einzelnen Seiten ---------- */

/** Zeitraum des Kalenderstreifens. `id` ist die Zahl der Wochen, 0 steht für den ganzen Monat. */
export const calendarSpans = [
  { id: 1, label: "1 Woche", short: "1 W" },
  { id: 2, label: "2 Wochen", short: "2 W" },
  { id: 0, label: "1 Monat", short: "1 M" },
];

/** Ansicht der grauen Fläche unter dem Kalenderstreifen. */
export const calendarModes = ["grid", "list"];

/** Die drei Spalten der Kalenderliste. */
export const calendarSegments = [
  { id: "aufgaben", label: "Aufgaben", empty: "Keine Aufgaben" },
  { id: "termine", label: "Termine", empty: "Nichts geplant" },
  { id: "projekte", label: "Projekte", empty: "Keine Projekte" },
];

/** Pillen oben auf der Medien-Seite: „Zuletzt erstellt“ zeigt alles, die anderen je eine Art. */
export const mediaFilters = [
  { id: "recent", label: "Zuletzt erstellt", icon: "history", empty: "Noch keine Medien." },
  { id: "image", label: "Bilder", icon: "image", empty: "Noch keine Bilder." },
  { id: "video", label: "Videos", icon: "video", empty: "Noch keine Videos." },
  { id: "audio", label: "Audio", icon: "mic", empty: "Noch keine Aufnahmen." },
  { id: "doc", label: "Dokumente", icon: "doc", empty: "Noch keine Dokumente." },
];

/**
 * Pillen oben auf der Ressourcen-Seite: „Alle“ zeigt alles, „Eigene“ nur
 * Geschriebenes und Gezeichnetes, die übrigen je eine Medienart.
 */
export const resourceFilters = [
  { id: "all", label: "Alle", icon: "cube", empty: "Noch keine Ressourcen." },
  { id: "own", label: "Eigene", icon: "pencil", empty: "Noch nichts Eigenes. Ein Eintrag ohne gewählten Typ wird zum Dokument." },
  { id: "image", label: "Bilder", icon: "image", empty: "Noch keine Bilder." },
  { id: "video", label: "Videos", icon: "video", empty: "Noch keine Videos." },
  { id: "audio", label: "Audio", icon: "mic", empty: "Noch keine Aufnahmen." },
  { id: "doc", label: "Dokumente", icon: "doc", empty: "Noch keine Dokumente." },
];
