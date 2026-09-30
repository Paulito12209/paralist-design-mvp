/*
 * Das Blatt „Filtern“ der Aufgaben-Seite (src/ui/filter-sheet.js) und was
 * die Karte „Ansicht“ darüber sagt: rechts in der Zeile die Zahl der
 * gefilterten Abschnitte, darunter je Abschnitt ein Chip. Drei Abschnitte:
 *
 * - Ort (nur in eigenen Ansichten): Einfachwahl — alle Orte, Eingang, jeder
 *   Ort mit Aufgaben. „Alle“ zeigt immer jeden Ort; das erklärt dort das ⓘ
 *   an der Pille (src/features/tasks/tasks-views.js).
 * - Status: Offen, In Arbeit, Erledigt, Archiviert. „Erledigt“ ist derselbe
 *   Schalter wie „Erledigte zeigen“ in der Karte, „Archiviert“ holt das
 *   Archiv auf die Seite (src/data/queries.js). Beide erklären sich per ⓘ.
 * - Dringlichkeit: die vier Stufen.
 *
 * Status und Dringlichkeit haben das Segment „ist | ist nicht“. Was die
 * Liste zeigt, steht immer in hiddenStatuses, hideDone, showArchived und
 * hiddenPriorities der Ansicht; das Segment sagt nur, welche Seite davon die
 * Haken tragen: bei „ist“ das Sichtbare, bei „ist nicht“ das Ausgeblendete.
 * Wechselt man das Segment, bleiben die Haken stehen und die Liste dreht
 * sich um — wie in Notion.
 *
 * Als Filter zählt jeder Abschnitt, in dem etwas fehlt — auch das
 * ausgeblendete Erledigte und Archivierte einer frischen Ansicht, sonst
 * stünde „Keine“, obwohl etwas fehlt.
 * Pfad: src/features/tasks/tasks-filter.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title          -> Überschrift des Blatts
 * labels         -> Namen und Icons der drei Abschnitte
 * allLabel / noneLabel / notLabel -> Zusammenfassung in der Übersicht: „Alle“, „Keine“, „nicht …“
 * allPlaces / inboxLabel -> Name der beiden festen Orte
 * archivedLabel  -> Name des Werts „Archiviert“
 * infos          -> Überschrift und Text der Erklärungen hinter den ⓘ
 * notes          -> die Sätze unter der Liste einer Unterseite
 *
 * Aussehen: styles/filter-sheet.css; der Dialog hinter dem ⓘ in
 * styles/info-dialog.css; die Chips in styles/tasks-settings.css.
 */

import { taskPriorities, taskStatuses } from "../../data/config-tasks.js";
import { parentName, taskPlaces } from "../../data/queries.js";
import { activeTaskView, updateTaskView } from "../../data/task-views.js";
import { openFilterSheet } from "../../ui/filter-sheet.js";

const title = "Filtern";
const labels = {
  place: { label: "Ort", icon: "layers" },
  status: { label: "Status", icon: "check-circle" },
  priority: { label: "Dringlichkeit", icon: "flame" },
};
const allLabel = "Alle";
const noneLabel = "Keine";
const notLabel = "nicht";
const allPlaces = "Alle Orte";
const inboxLabel = "Eingang";
const archivedLabel = "Archiviert";
const infos = {
  done: {
    title: "Erledigt",
    text: "Abgehakte Aufgaben bleiben bis Mitternacht stehen. Dieser Haken ist derselbe Schalter wie „Erledigte zeigen“ in der Karte.",
  },
  archived: {
    title: "Archiviert",
    text: "Ab dem Tag nach dem Erledigen liegt eine Aufgabe im Archiv. Mit Haken siehst du sie hier trotzdem, im Board als Spalte rechts neben „Erledigt“. Ziehst du sie heraus, holst du sie zurück.",
  },
};
const notes = {
  only: (names) => `Zeigt nur ${names}.`,
  except: (names) => `Zeigt alle Aufgaben außer ${names}.`,
  none: "Zeigt keine Aufgaben.",
  all: "Zeigt alle Aufgaben.",
};

/* ---------- Status: die vier Werte und ihr Feld in der Ansicht ---------- */

const doneId = "erledigt";
const archivedId = "archiviert";

/* Alle Werte des Abschnitts Status in der Reihenfolge des Blatts */
function statusValues() {
  const values = taskStatuses.map((status) => ({
    id: status.done ? doneId : status.id,
    label: status.label,
    icon: status.icon,
    color: status.color,
    info: status.done ? infos.done : undefined,
  }));
  values.push({ id: archivedId, label: archivedLabel, icon: "archive", info: infos.archived });
  return values;
}

/* Ist dieser Status in der Ansicht zu sehen? */
function statusShown(view, id) {
  if (id === doneId) return !view.hideDone;
  if (id === archivedId) return view.showArchived;
  return !view.hiddenStatuses.includes(id);
}

/* Die Änderung an der Ansicht, die diesen Status zeigt oder ausblendet — immer
   als neue Liste, weil sich Kopien einer Ansicht ihre Listen sonst teilen würden */
function statusChange(view, id, shown) {
  if (id === doneId) return { hideDone: !shown };
  if (id === archivedId) return { showArchived: shown };
  const rest = view.hiddenStatuses.filter((item) => item !== id);
  return { hiddenStatuses: shown ? rest : [...rest, id] };
}

/* ---------- Ein Abschnitt mit Mehrfachwahl, Status wie Dringlichkeit ---------- */

/* Beschreibt, wie ein Abschnitt aus der Ansicht liest und in sie schreibt */
const statusSection = {
  id: "status",
  values: statusValues,
  shown: statusShown,
  change: statusChange,
  not: (view) => view.statusNot,
  notField: "statusNot",
};

const prioritySection = {
  id: "priority",
  values: () => taskPriorities,
  shown: (view, id) => !view.hiddenPriorities.includes(id),
  change: (view, id, shown) => {
    const rest = view.hiddenPriorities.filter((item) => item !== id);
    return { hiddenPriorities: shown ? rest : [...rest, id] };
  },
  not: (view) => view.priorityNot,
  notField: "priorityNot",
};

/* Wird in diesem Abschnitt gefiltert? Ja, sobald ein Wert fehlt. */
function filtered(view, section) {
  return section.values().some((value) => !section.shown(view, value.id));
}

/* Die Werte, die den Haken tragen: bei „ist“ die sichtbaren, bei „ist nicht“ die ausgeblendeten */
function checked(view, section) {
  const not = section.not(view);
  return section.values().filter((value) => section.shown(view, value.id) !== not);
}

/* Alles auf einmal umdrehen: die Haken bleiben, die Liste zeigt das Gegenteil */
function invertAll(view, section) {
  const changes = {};
  for (const value of section.values()) {
    /* jede Änderung baut auf den vorigen auf — sonst überschriebe die zweite Liste die erste */
    Object.assign(changes, section.change({ ...view, ...changes }, value.id, !section.shown(view, value.id)));
  }
  return changes;
}

const names = (values) => values.map((value) => value.label).join(", ");

/* Rechts in der Übersicht: „Alle“, „Offen, In Arbeit“, „nicht Erledigt“ — oder „Keine“, wenn nichts zu sehen ist */
function summary(view, section) {
  if (!filtered(view, section)) return allLabel;
  const marked = checked(view, section);
  if (section.not(view)) return `${notLabel} ${names(marked)}`;
  return marked.length ? names(marked) : noneLabel;
}

/* Der Satz unter der Liste der Unterseite */
function note(view, section) {
  const marked = checked(view, section);
  if (section.not(view)) return marked.length ? notes.except(names(marked)) : notes.all;
  return marked.length ? notes.only(names(marked)) : notes.none;
}

/* Der Abschnitt, wie ihn das Blatt braucht */
function multiSection(view, section) {
  const not = section.not(view);
  return {
    id: section.id,
    ...labels[section.id],
    summary: summary(view, section),
    active: filtered(view, section),
    mode: not ? "not" : "is",
    items: section.values().map((value) => ({ ...value, active: section.shown(view, value.id) !== not })),
    note: note(view, section),
    onMode: (mode) => change({ ...invertAll(view, section), [section.notField]: mode === "not" }),
    onToggle: (id) => change(section.change(view, id, !section.shown(view, id))),
  };
}

/* ---------- Ort: Einfachwahl ---------- */

function placeOptions() {
  return [
    { id: "alle", label: allPlaces, icon: "layers" },
    { id: "inbox", label: inboxLabel, icon: "inbox" },
    ...taskPlaces().map((place) => ({ id: place.ref, label: place.label, icon: place.icon })),
  ];
}

/* Name und Icon des gewählten Orts; ein Ort, den es nicht mehr gibt, zeigt seinen Verweis-Namen */
function chosenPlace(view) {
  if (view.place === "inbox") return { label: inboxLabel, icon: "inbox" };
  const place = taskPlaces().find((item) => item.ref === view.place);
  return place ? { label: place.label, icon: place.icon } : { label: parentName(view.place), icon: "layers" };
}

/* Der Abschnitt „Ort“ — nur in eigenen Ansichten, „Alle“ zeigt immer jeden Ort */
function placeSection(view) {
  const on = view.place !== "alle";
  return {
    id: "place",
    ...labels.place,
    summary: on ? chosenPlace(view).label : allPlaces,
    active: on,
    items: placeOptions().map((option) => ({ ...option, active: option.id === view.place })),
    onToggle: (id) => {
      if (id !== view.place) change({ place: id });
    },
  };
}

/* ---------- Für die Karte „Ansicht“ ---------- */

/**
 * Was gefiltert ist, als Chips je Abschnitt: [{ page, label, icon, count?, not? }]
 * — leer ohne Filter. `page` öffnet die Unterseite, `count` zählt die Haken,
 * `not` heißt „ist nicht“. Der Ort trägt seinen Namen statt einer Zahl.
 */
export function filterChips(view) {
  const chips = [];
  if (view.place !== "alle") chips.push({ page: "place", ...chosenPlace(view) });
  for (const section of [statusSection, prioritySection]) {
    if (!filtered(view, section)) continue;
    chips.push({ page: section.id, ...labels[section.id], count: checked(view, section).length, not: section.not(view) });
  }
  return chips;
}

/* Speichern und das offene Blatt mit dem neuen Stand neu zeichnen */
function change(changes) {
  updateTaskView(changes);
  openTaskFilter();
}

/* Alle Filter der Ansicht zurücksetzen: jeder Ort, jeder Status, jede Dringlichkeit */
function resetAll() {
  change({ place: "alle", hiddenStatuses: [], hiddenPriorities: [], hideDone: false, showArchived: true, statusNot: false, priorityNot: false });
}

/**
 * Das Blatt für die gewählte Ansicht öffnen oder mit neuem Stand neu zeichnen.
 * @param page id der Unterseite, die gleich offen sein soll (Chip in der Karte) — sonst weggelassen
 */
export function openTaskFilter(page) {
  const view = activeTaskView();
  const sections = [multiSection(view, statusSection), multiSection(view, prioritySection)];
  if (!view.fixed) sections.unshift(placeSection(view));
  openFilterSheet({ title, sections, resetActive: filterChips(view).length > 0, onReset: resetAll, page });
}
