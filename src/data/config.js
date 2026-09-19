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
 * typeOrder               -> Reihenfolge der Gruppen unter „Verknüpfte Inhalte“
 * workspaceDefaultName    -> Vorgabename eines neuen Arbeitsbereichs
 * levelSteps / levelStep  -> ab wie vielen XP die nächste Stufe beginnt
 * taskPriorities          -> Name, Icon und Farbe der vier Board-Spalten
 * defaultTaskPriority     -> Priorität, mit der eine NEUE Aufgabe startet („Später“)
 * defaultTaskStatus       -> Status, mit dem eine neue Aufgabe startet („Offen“)
 * taskStatuses            -> Name, Icon und Farbe der Status-Chips
 * taskSorts / taskGroupings -> was die Pillen „Sortieren“ und „Gruppieren“ anbieten
 * taskDefaults            -> womit die Aufgaben-Seite beim allerersten Mal startet
 * calendarSegments[*].add -> Beschriftung der Pille am leeren Kalendertag
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

/**
 * Diese Typen sammelt die Ressourcen-Karte, egal wo sie abgelegt sind.
 * Medien sind nicht dabei: die haben einen eigenen Reiter „Medien“.
 */
export const resourceTypes = ["notiz", "dokument", "zeichnung"];

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
 * Die vier Übersichtskarten. Nur die Inbox ist ein Ablageort (parent null =
 * „nirgends abgelegt“). Die anderen drei sind Sammlungen („kind“): Favoriten
 * zeigt Markiertes, Projekte alle Projekte, Ressourcen alle Dokumente,
 * Zeichnungen und Medien — egal, wo sie liegen.
 */
export const overviewPages = {
  1: { title: "Inbox", icon: "inbox", parent: null },
  2: { title: "Favoriten", icon: "star-outline", kind: "favorites" },
  3: { title: "Projekte", icon: "rocket", kind: "projects" },
  4: { title: "Ressourcen", icon: "cube", kind: "resources" },
};

/*
 * Das Archiv ist keine Karte auf der Startseite, sondern hängt an der Pille
 * unter der Liste der Arbeitsbereiche. Es benutzt dieselbe Unterseite wie die
 * Karten, deshalb steht es hier neben ihnen.
 */
export const archivePage = { title: "Archiv", kind: "archive" };

/*
 * Die Ordnung der Dinge: Arbeitsbereiche ganz oben, darin Projekte, darin alles
 * andere. Nur diese Typen dürfen selbst Einträge aufnehmen. Ein Projekt kann
 * nicht in einem Projekt liegen — so kann nie ein Kreis entstehen.
 */
export const containerTypes = ["projekt"];

/** Reihenfolge der Gruppen unter „Verknüpfte Inhalte“: Projekte zuerst. */
export const typeOrder = ["projekt", "aufgabe", "notiz", "termin", "dokument", "zeichnung", "medien"];

/** Mehrzahl je Typ für die Gruppenüberschriften. */
export const typePlurals = {
  projekt: "Projekte",
  aufgabe: "Aufgaben",
  notiz: "Notizen",
  termin: "Termine",
  dokument: "Dokumente",
  zeichnung: "Zeichnungen",
  medien: "Medien",
};

/** Vorgabename eines neuen Arbeitsbereichs; ab dem zweiten mit Nummer. */
export const workspaceDefaultName = "Arbeitsbereich";

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

/**
 * Die drei Spalten der Kalenderliste. `pick` sagt, welchen Typ das Eingabefeld
 * vorwählt, wenn man am leeren Tag auf die Pille zum Anlegen tippt.
 */
export const calendarSegments = [
  { id: "aufgaben", label: "Aufgaben", empty: "Keine Aufgaben", pick: "aufgabe", add: "Aufgabe hinzufügen" },
  { id: "termine", label: "Termine", empty: "Nichts geplant", pick: "termin", add: "Termin eintragen" },
  { id: "projekte", label: "Projekte", empty: "Keine Projekte", pick: "projekt", add: "Projekt anlegen" },
];

/** Pillen oben auf der Medien-Seite: „Zuletzt erstellt“ zeigt alles, die anderen je eine Art. */
export const mediaFilters = [
  { id: "recent", label: "Zuletzt erstellt", icon: "history" },
  { id: "image", label: "Bilder", icon: "image" },
  { id: "video", label: "Videos", icon: "video" },
  { id: "audio", label: "Audio", icon: "mic" },
  { id: "doc", label: "Dokumente", icon: "doc" },
];

/**
 * Pillen oben auf der Ressourcen-Seite: „Alle“ zeigt alles, „Notizen“ nur
 * Notizen, „Eigene Dokumente“ das selbst Geschriebene, „Zeichnungen“ das
 * Gezeichnete. Was eine leere Seite zeigt, steht in
 * src/features/resources/resources.js.
 */
export const resourceFilters = [
  { id: "all", label: "Alle", icon: "cube" },
  { id: "notes", label: "Notizen", icon: "note" },
  { id: "own", label: "Eigene Dokumente", icon: "doc" },
  { id: "drawings", label: "Zeichnungen", icon: "scribble" },
];

/* ---------- Aufgaben-Seite: Status, Prioritäten und die drei Bedien-Listen ---------- */

/**
 * Status einer Aufgabe. `done: true` heißt „zählt als erledigt“ — davon hängt
 * ab, ob der Titel durchgestrichen wird und die Zeile ganz nach unten rutscht.
 */
export const taskStatuses = [
  { id: "offen", label: "Offen", icon: "circle", color: "var(--muted)" },
  { id: "inArbeit", label: "In Arbeit", icon: "history", color: "var(--cal-accent)" },
  { id: "erledigt", label: "Erledigt", icon: "check-circle", color: "var(--xp-done)", done: true },
];

/** Status einer neu angelegten Aufgabe. */
export const defaultTaskStatus = "offen";

/** Status, den der runde Haken-Knopf setzt. */
export const doneTaskStatus = "erledigt";

/**
 * Prioritäten in der Reihenfolge, in der sie im Board als Spalten stehen:
 * die dringendste links. Ein weiterer Eintrag hier ist eine weitere Spalte.
 */
export const taskPriorities = [
  { id: "jetzt", label: "Jetzt", icon: "flame", color: "var(--prio-jetzt)" },
  { id: "next", label: "Als Nächstes", icon: "arrow-right", color: "var(--prio-next)" },
  { id: "spaeter", label: "Später", icon: "clock", color: "var(--prio-spaeter)" },
  { id: "irgendwann", label: "Irgendwann", icon: "moon", color: "var(--prio-irgendwann)" },
];

/** Priorität einer neu angelegten Aufgabe. */
export const defaultTaskPriority = "spaeter";

/** Die beiden Ansichten der Aufgaben-Seite. */
export const taskViews = ["list", "board"];

/**
 * Wonach die Board-Spalten gruppieren. `columns` sagt, welche Liste die Spalten
 * liefert — ein weiteres Kriterium ist nur ein weiteres Objekt hier plus seine
 * Liste oben.
 */
export const taskGroupings = [
  { id: "priority", label: "Dringlichkeit", icon: "flame", field: "priority", columns: taskPriorities },
  { id: "status", label: "Status", icon: "check-circle", field: "status", columns: taskStatuses },
];

/**
 * Sortierarten. Welche Regel dahintersteckt, steht in `sortTasks` in
 * src/data/queries.js; „neu“ berücksichtigt dabei die von Hand gezogene Reihenfolge.
 */
export const taskSorts = [
  { id: "neu", label: "Neueste zuerst", icon: "history" },
  { id: "alt", label: "Älteste zuerst", icon: "clock" },
  { id: "prio", label: "Dringlichkeit", icon: "flame" },
  { id: "titel", label: "Titel A–Z", icon: "list" },
];

/** Vorgabe der Bedienzeile, solange nichts anderes gewählt wurde. */
export const taskDefaults = {
  view: "list",
  group: "priority",
  sort: "neu",
  status: "alle",
  place: "alle",
  hideDone: false,
};

/** Beschreibung eines Status; unbekannte Werte aus alten Ständen gelten als offen. */
export function taskStatusOf(id) {
  return taskStatuses.find((item) => item.id === id) || taskStatuses[0];
}

/** Beschreibung einer Priorität; unbekannte Werte gelten als die Vorgabe. */
export function taskPriorityOf(id) {
  return (
    taskPriorities.find((item) => item.id === id) ||
    taskPriorities.find((item) => item.id === defaultTaskPriority)
  );
}

/** Gilt diese Aufgabe als erledigt? */
export function isTaskDone(entry) {
  return Boolean(taskStatusOf(entry && entry.status).done);
}
