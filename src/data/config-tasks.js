/*
 * Die festen Listen der Aufgaben-Seite: Status, Dringlichkeit, Gruppieren,
 * Sortieren und womit eine neue Ansicht startet. Hier steht nur, WAS es gibt —
 * wie sortiert und gefiltert wird, steht in src/data/queries.js, was eine
 * Ansicht speichert, in src/data/task-views.js.
 * Pfad: src/data/config-tasks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * taskPriorities          -> Name, Icon und Farbe der vier Board-Spalten
 * defaultTaskPriority     -> Priorität, mit der eine NEUE Aufgabe startet („Später“)
 * defaultTaskStatus       -> Status, mit dem eine neue Aufgabe startet („Offen“)
 * taskStatuses            -> Name, Icon und Farbe der Status-Chips
 * taskGroupings           -> wonach sich Liste und Board gruppieren lassen (Dringlichkeit oder Status)
 * taskSorts               -> wonach die Aufgaben-Seite sortieren kann, samt Wortlaut beider Richtungen
 * taskDefaults            -> womit eine neue Ansicht der Aufgaben-Seite startet
 */

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
export const taskLayouts = ["list", "board"];

/**
 * Wonach die Board-Spalten gruppieren. `columns` sagt, welche Liste die Spalten
 * liefert — ein weiteres Kriterium ist nur ein weiteres Objekt hier plus seine
 * Liste oben.
 *
 * Der Status steht bewusst vorn: mit „offen, in Arbeit, erledigt“ kann fast
 * jeder etwas anfangen, mit „Dringlichkeit“ erst nach kurzem Nachdenken. Diese
 * Reihenfolge bestimmt zugleich, was das Menü „Gruppieren“ zuerst anbietet und
 * worauf die Seite zurückfällt, wenn eine gespeicherte Wahl nicht mehr gilt.
 */
export const taskGroupings = [
  { id: "status", label: "Status", icon: "check-circle", field: "status", columns: taskStatuses },
  { id: "priority", label: "Dringlichkeit", icon: "flame", field: "priority", columns: taskPriorities },
];

/**
 * Sortierarten der Aufgaben-Seite. Welche Regel dahintersteckt, steht in
 * `sortTasks` in src/data/queries.js; „erstellt“ ist zugleich die von Hand
 * im Board gezogene Reihenfolge. `up` und `down` sind der Wortlaut der beiden
 * Richtungen im Blatt „Sortieren“ (src/ui/sort-sheet.js), `asc` die
 * Richtung, die beim Wechsel auf diese Option gilt.
 */
export const taskSorts = [
  { id: "erstellt", label: "Erstellt", icon: "history", up: "Älteste zuerst", down: "Neueste zuerst", asc: true },
  { id: "faellig", label: "Fällig", icon: "calendar", up: "Früheste zuerst", down: "Späteste zuerst", asc: true },
  { id: "titel", label: "Titel", icon: "text", up: "A bis Z", down: "Z bis A", asc: true },
];

/**
 * Womit eine Ansicht der Aufgaben-Seite startet: als Liste aller Aufgaben,
 * nicht gruppiert, älteste zuerst (Neues hängt sich unten an), Erledigtes
 * ausgeblendet. `group` ist "none" oder eine id aus taskGroupings; `place`
 * ist "alle", "inbox" oder ein Verweis wie „w:3“ / „e:12“.
 */
export const taskDefaults = {
  layout: "list",
  group: "none",
  sort: "erstellt",
  sortAsc: true,
  place: "alle",
  hideDone: true,
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
