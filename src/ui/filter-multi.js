/*
 * Die Abschnitte des Blatts „Filtern“ mit Mehrfachwahl und dem Segment
 * „ist | ist nicht“ — Status und Dringlichkeit, für die Aufgaben-Seite
 * (src/features/tasks/tasks-filter.js) und die Projekte
 * (src/features/overview/project-filter.js) gleich.
 *
 * Was die Liste zeigt, steht immer in den Feldern der Ansicht (zum Beispiel
 * hiddenPriorities); das Segment sagt nur, welche Seite davon die Haken
 * trägt: bei „ist“ das Sichtbare, bei „ist nicht“ das Ausgeblendete. Wechselt
 * man das Segment, bleiben die Haken stehen und die Liste dreht sich um —
 * wie in Notion.
 *
 * Das Chip-Blatt der Android-Fassung (src/ui/filter-sheet-chips.js) liest
 * dieselben Felder anders: Angetippt ist nur, was gerade filtert — nichts
 * angetippt heißt „nicht gefiltert, alles zu sehen“, wie bei Filter-Chips in
 * Material 3. Tippt man alle Werte an, ist das wieder dasselbe wie keinen.
 * Dafür tragen die Abschnitte `chipItems`, `chipToggle` und `chipMode`
 * neben `items`, `onToggle` und `onMode` (iOS und Desktop lesen die zweiten).
 *
 * Ein Abschnitt wird hier als Beschreibung übergeben: { id, values(), shown(view, id),
 * change(view, id, shown), not(view), notField }. Daraus macht multiSection
 * den Abschnitt, wie ihn src/ui/filter-sheet.js braucht.
 * Pfad: src/ui/filter-multi.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * sectionLabels -> Namen und Icons der Abschnitte Status und Dringlichkeit
 * allLabel / noneLabel / notLabel -> Zusammenfassung in der Übersicht: „Alle“, „Keine“, „nicht …“
 * notes         -> die Sätze unter der Liste einer Unterseite
 * doneWords     -> Wortlaut des Knopfs unten im Chip-Blatt („7 Aufgaben anzeigen“)
 */

import { taskPriorities, taskStatuses } from "../data/config-tasks.js";

export const sectionLabels = {
  status: { label: "Status", icon: "check-circle" },
  priority: { label: "Dringlichkeit", icon: "flame" },
};
export const allLabel = "Alle";
export const noneLabel = "Keine";
export const notLabel = "nicht";
const notes = {
  only: (names) => `Zeigt nur ${names}.`,
  except: (noun, names) => `Zeigt alle ${noun} außer ${names}.`,
  none: (noun) => `Zeigt keine ${noun}.`,
  all: (noun) => `Zeigt alle ${noun}.`,
};
const doneWords = {
  show: (count, noun) => `${count} ${count === 1 ? noun.one : noun.many} anzeigen`,
  empty: (noun) => `Keine ${noun.many}`,
};

/** Der Knopf unten im Chip-Blatt: „7 Aufgaben anzeigen“ — oder „Keine Aufgaben“. */
export function doneText(count, noun) {
  return count === 0 ? doneWords.empty(noun) : doneWords.show(count, noun);
}

/* ---------- Die zwei Abschnitte, die für Aufgaben und Projekte gleich sind ---------- */

/** Dringlichkeit: Felder `hiddenPriorities` und `priorityNot` der Ansicht. */
export const prioritySection = {
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

/** Status ohne Sonderfälle (die Projekte): Felder `hiddenStatuses` und `statusNot`. */
export const plainStatusSection = {
  id: "status",
  values: () => taskStatuses,
  shown: (view, id) => !view.hiddenStatuses.includes(id),
  change: (view, id, shown) => {
    const rest = view.hiddenStatuses.filter((item) => item !== id);
    return { hiddenStatuses: shown ? rest : [...rest, id] };
  },
  not: (view) => view.statusNot,
  notField: "statusNot",
};

/* ---------- Was ein Abschnitt aus der Ansicht liest ---------- */

/** Wird in diesem Abschnitt gefiltert? Ja, sobald ein Wert fehlt. */
export function filtered(view, section) {
  return section.values().some((value) => !section.shown(view, value.id));
}

/** Die Werte, die den Haken tragen: bei „ist“ die sichtbaren, bei „ist nicht“ die ausgeblendeten. */
export function checked(view, section) {
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
function note(view, section, noun) {
  if (!filtered(view, section)) return notes.all(noun);
  const marked = checked(view, section);
  if (section.not(view)) return marked.length ? notes.except(noun, names(marked)) : notes.all(noun);
  return marked.length ? notes.only(names(marked)) : notes.none(noun);
}

/** Der Chip in der Karte „Ansicht“ für einen gefilterten Abschnitt. */
export function sectionChip(view, section) {
  return { page: section.id, ...sectionLabels[section.id], count: checked(view, section).length, not: section.not(view) };
}

/* Die Werte, die im Chip-Blatt angetippt stehen: nur, was filtert */
function ticked(view, section) {
  return filtered(view, section) ? checked(view, section).map((value) => value.id) : [];
}

/* Die Änderung, nach der genau diese Werte zu sehen sind — Wert für Wert aufgebaut, jede Änderung baut auf der vorigen auf */
function showOnly(view, section, shownIds) {
  const changes = {};
  for (const value of section.values()) {
    Object.assign(changes, section.change({ ...view, ...changes }, value.id, shownIds.includes(value.id)));
  }
  return changes;
}

/* Ein Tipp im Chip-Blatt: nichts oder alles angetippt heißt ungefiltert, sonst zeigt (bei „ist nicht“: versteckt) das Angetippte */
function chipChange(view, section, id) {
  const all = section.values().map((value) => value.id);
  const now = ticked(view, section);
  const next = now.includes(id) ? now.filter((item) => item !== id) : [...now, id];
  if (!next.length || next.length === all.length) return showOnly(view, section, all);
  return showOnly(view, section, section.not(view) ? all.filter((item) => !next.includes(item)) : next);
}

/**
 * Der Abschnitt, wie ihn das Blatt braucht.
 * @param view    die Ansicht (Aufgaben oder Projekte)
 * @param section Beschreibung wie oben
 * @param noun    Mehrzahl für die Sätze („Aufgaben“, „Projekte“)
 * @param change  speichert Änderungen an der Ansicht und zeichnet das Blatt neu
 */
export function multiSection(view, section, noun, change) {
  const not = section.not(view);
  return {
    id: section.id,
    ...sectionLabels[section.id],
    summary: summary(view, section),
    active: filtered(view, section),
    mode: not ? "not" : "is",
    items: section.values().map((value) => ({ ...value, active: section.shown(view, value.id) !== not })),
    note: note(view, section, noun),
    onMode: (mode) => change({ ...invertAll(view, section), [section.notField]: mode === "not" }),
    onToggle: (id) => change(section.change(view, id, !section.shown(view, id))),
    chipItems: section.values().map((value) => ({ ...value, active: ticked(view, section).includes(value.id) })),
    chipToggle: (id) => change(chipChange(view, section, id)),
    /* Ohne Haken gibt es nichts umzudrehen: nur die Seite des Segments wechselt */
    chipMode: (mode) => (filtered(view, section) ? change({ ...invertAll(view, section), [section.notField]: mode === "not" }) : change({ [section.notField]: mode === "not" })),
  };
}
