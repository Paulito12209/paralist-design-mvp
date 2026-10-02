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
 * archiveColumn           -> Name, Icon und Farbe der Spalte „Archiviert“ rechts neben „Erledigt“
 * taskGroupings           -> wonach sich Liste und Board gruppieren lassen (Dringlichkeit oder Status)
 * taskSorts               -> wonach die Aufgaben-Seite sortieren kann, samt Wortlaut beider Richtungen
 * taskDefaults            -> womit eine neue Ansicht der Aufgaben-Seite startet
 * timeTypes               -> Kategorien mit Dringlichkeit, Fälligkeit und Status wie eine Aufgabe
 * docStatuses             -> Name, Icon und Farbe des Status eines Dokuments (Entwurf, Fertig, Geprüft)
 * defaultDocStatus        -> Status, mit dem ein neues Dokument startet („Entwurf“)
 */

import { linkFilterDefaults } from "./config.js";

/**
 * Status einer Aufgabe. `done: true` heißt „zählt als erledigt“ — davon hängt
 * ab, ob der Titel durchgestrichen wird und die Zeile ganz nach unten rutscht.
 */
export const taskStatuses = [
  { id: "offen", label: "Offen", icon: "circle", color: "var(--status-open)" },
  { id: "inArbeit", label: "In Arbeit", icon: "history", color: "var(--cal-accent)" },
  { id: "erledigt", label: "Erledigt", icon: "check-circle", color: "var(--xp-done)", done: true },
];

/**
 * Die Spalte für Archiviertes: kein Status, den man einer Aufgabe gibt,
 * sondern der Ort, an dem sie nach dem Tag des Erledigens liegt. Sie steht
 * nur da, wenn die Ansicht „Archiviert“ zeigt und nach Status gruppiert —
 * dann ganz rechts, neben „Erledigt“. Hineinziehen archiviert, Herausziehen
 * holt zurück.
 */
export const archiveColumn = { id: "archiviert", label: "Archiviert", icon: "archive", color: "var(--status-open)" };

/**
 * Diese Kategorien haben eine Zeit, bis zu der sie dran sind: sie tragen
 * Dringlichkeit, Fälligkeit (beim Termin: seinen Tag) und Status mit
 * denselben Listen wie die Aufgabe. Auf der Aufgaben-Seite stehen trotzdem
 * nur Aufgaben — hier geht es um die Karte „Details“ und das Blatt dazu.
 */
export const timeTypes = ["aufgabe", "projekt", "termin"];

/**
 * Status eines Dokuments: es wird nicht abgehakt, es wird fertig. Keins davon
 * zählt als erledigt. „Entwurf“ hat keine Farbe — der Wert steht dann in der
 * normalen Schriftfarbe.
 */
export const docStatuses = [
  { id: "entwurf", label: "Entwurf", icon: "pencil", color: "" },
  { id: "fertig", label: "Fertig", icon: "check", color: "var(--cal-accent)" },
  { id: "geprueft", label: "Geprüft", icon: "check-circle", color: "var(--xp-done)" },
];

/** Status eines neu angelegten Dokuments. */
export const defaultDocStatus = "entwurf";

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
 * `hiddenStatuses` und `hiddenPriorities` zählen auf, was der Filter
 * ausblendet — leer heißt: alles zu sehen. Ob Erledigtes zu sehen ist, sagt
 * allein `hideDone` (der Schalter „Erledigte zeigen“), deshalb steht der
 * Status „erledigt“ nie in `hiddenStatuses`. `showArchived` holt auch die
 * archivierten Aufgaben auf die Seite (im Board als eigene Spalte).
 * `statusNot` und `priorityNot` sagen, wie das Blatt „Filtern“ den Abschnitt
 * zeigt: false heißt „ist“ (Haken an dem, was zu sehen ist), true heißt
 * „ist nicht“ (Haken an dem, was ausgeblendet ist) — was die Liste zeigt,
 * steht in beiden Fällen allein in den Feldern darüber. `linkKinds`,
 * `linkRefs` und `linkNot` sind der Filter „Verknüpft mit“ (Felder und
 * Bedeutung: src/data/link-filter-fields.js); leer heißt nicht gefiltert.
 */
export const taskDefaults = {
  layout: "list",
  group: "none",
  sort: "erstellt",
  sortAsc: true,
  ...linkFilterDefaults,
  hideDone: true,
  hiddenStatuses: [],
  hiddenPriorities: [],
  showArchived: false,
  statusNot: false,
  priorityNot: false,
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

/** Hat diese Kategorie Dringlichkeit und Fälligkeit (Aufgabe, Projekt, Termin)? */
export function isTimeType(type) {
  return timeTypes.includes(type);
}

/** Hat diese Kategorie einen Status? Die drei Zeit-Kategorien und das Dokument. */
export function hasStatus(type) {
  return isTimeType(type) || type === "dokument";
}

/** Die Status-Liste einer Kategorie: beim Dokument Entwurf/Fertig/Geprüft, sonst die der Aufgabe. */
export function statusListFor(type) {
  return type === "dokument" ? docStatuses : taskStatuses;
}

/** Vorgabe-Status einer Kategorie. */
export function defaultStatusFor(type) {
  return type === "dokument" ? defaultDocStatus : defaultTaskStatus;
}

/** Beschreibung des Status eines Eintrags; unbekannte Werte gelten als die erste Stufe. */
export function statusOf(entry) {
  const list = statusListFor(entry.type);
  return list.find((item) => item.id === entry.status) || list[0];
}

/**
 * Status und Dringlichkeit geben, die der Kategorie fehlen, und wegnehmen,
 * was sie nicht hat. Für neue Einträge, das Umwandeln und alte Speicherstände.
 * Ein Status aus der falschen Liste (aus einer Aufgabe wird ein Dokument)
 * fällt auf die Vorgabe zurück. Gibt zurück, ob sich etwas geändert hat.
 */
export function adoptStatusFields(entry) {
  const before = `${entry.status}|${entry.priority}`;
  if (hasStatus(entry.type)) {
    if (!statusListFor(entry.type).some((item) => item.id === entry.status)) entry.status = defaultStatusFor(entry.type);
  } else delete entry.status;
  if (isTimeType(entry.type)) {
    if (typeof entry.priority !== "string") entry.priority = defaultTaskPriority;
  } else delete entry.priority;
  return `${entry.status}|${entry.priority}` !== before;
}
