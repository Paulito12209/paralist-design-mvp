/*
 * Das Blatt „Filtern“ der Aufgaben-Seite und die Chips, die in der Karte
 * „Ansicht“ unter der Zeile „Filtern“ zeigen, was gefiltert ist. Als Filter
 * zählen der Ort, abgewählte Status und abgewählte Dringlichkeiten — nicht
 * das Ausblenden der Erledigten, das hat seinen eigenen Schalter
 * „Erledigte zeigen“. Ohne Filter steht rechts „Keine“. Drei Abschnitte:
 *
 * - Ort: Einfachwahl (alle Orte, Eingang, jeder Ort mit Aufgaben). In der
 *   festen Ansicht „Alle“ steht nur „Alle Orte“, das ⓘ daneben erklärt,
 *   wie man eine eigene Ansicht für einen Ort baut.
 * - Status: Mehrfachwahl. „Erledigt“ ist derselbe Schalter wie „Erledigte
 *   zeigen“ in der Karte. „Archiviert“ holt die archivierten Aufgaben auf
 *   die Seite — nach Status gruppiert als eigene Spalte rechts neben
 *   „Erledigt“ (src/data/queries.js, taskGroups). Beide erklären sich per ⓘ.
 * - Dringlichkeit: Mehrfachwahl.
 *
 * Das Blatt bleibt beim An- und Abwählen offen und zeichnet sich nach jeder
 * Wahl mit dem neuen Stand neu — wie das Blatt „Sortieren“.
 * Pfad: src/features/tasks/tasks-filter.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * headings      -> die drei Zwischenüberschriften im Blatt
 * allPlaces / inboxLabel -> Name der beiden festen Orte
 * infos          -> Überschrift und Text der Erklärungen hinter den ⓘ
 * archivedLabel  -> Name der Option „Archiviert“
 * noneStatus / nonePrio -> Chip, wenn in einem Abschnitt gar nichts gewählt ist
 *
 * Aussehen: styles/overlays.css und styles/sheet-tabs.css (Blatt, Haken, ⓘ),
 * der Dialog hinter dem ⓘ in styles/info-dialog.css.
 */

import { taskPriorities, taskStatuses } from "../../data/config-tasks.js";
import { parentName, taskPlaces } from "../../data/queries.js";
import { activeTaskView, updateTaskView } from "../../data/task-views.js";
import { openSheet } from "../../ui/sheet.js";

const headings = { place: "Ort", status: "Status", priority: "Dringlichkeit" };
const allPlaces = "Alle Orte";
const inboxLabel = "Eingang";
const archivedLabel = "Archiviert";
const infos = {
  fixedPlace: {
    title: "Alle Orte",
    text: "„Alle“ zeigt Aufgaben von jedem Ort. Für einen Ort tippe auf das kleine Plus neben den Pillen und filtere die neue Ansicht.",
  },
  done: {
    title: "Erledigt",
    text: "Abgehakte Aufgaben bleiben bis Mitternacht stehen. Dieser Haken ist derselbe Schalter wie „Erledigte zeigen“ in der Karte.",
  },
  archived: {
    title: "Archiviert",
    text: "Ab dem Tag nach dem Erledigen liegt eine Aufgabe im Archiv. Mit Haken siehst du sie hier trotzdem, im Board als Spalte rechts neben „Erledigt“. Ziehst du sie heraus, holst du sie zurück.",
  },
};
const noneStatus = "Kein Status";
const nonePrio = "Keine Dringlichkeit";

/* Ist dieser Status in der Ansicht zu sehen? „Erledigt“ hängt am Schalter. */
function statusShown(view, status) {
  return status.done ? !view.hideDone : !view.hiddenStatuses.includes(status.id);
}

/* Eine id in einer Liste an- oder abwählen — immer als neue Liste, weil sich
   Kopien einer Ansicht ihre Listen sonst teilen würden. */
function toggled(list, id) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/* Chip für den gewählten Ort; „alle“ ist kein Filter */
function placeChip(view) {
  if (view.place === "alle") return [];
  if (view.place === "inbox") return [{ label: inboxLabel, icon: "inbox" }];
  const place = taskPlaces().find((item) => item.ref === view.place);
  return [{ label: parentName(view.place), icon: place ? place.icon : "layers" }];
}

/* Chips für einen Abschnitt: nur wenn darin etwas abgewählt ist, dann das Gewählte */
function listChips(items, hidden, none) {
  if (!hidden.length) return [];
  const shown = items.filter((item) => !hidden.includes(item.id));
  if (!shown.length) return [{ label: none, icon: "close" }];
  return shown.map((item) => ({ label: item.label, icon: item.icon, color: item.color }));
}

/**
 * Was gefiltert ist, als Chips: [{ label, icon, color? }] — leer ohne Filter.
 * Reihenfolge wie im Blatt: Ort, Status, Dringlichkeit.
 */
export function filterChips(view) {
  const openStatuses = taskStatuses.filter((status) => !status.done);
  return [
    ...placeChip(view),
    ...listChips(openStatuses, view.hiddenStatuses, noneStatus),
    ...listChips(taskPriorities, view.hiddenPriorities, nonePrio),
  ];
}

/* Abschnitt „Ort“: Einfachwahl; in „Alle“ steht nur „Alle Orte“ mit ⓘ */
function placeOptions(view) {
  if (view.fixed) return [{ label: allPlaces, icon: "layers", active: true, stay: true, info: infos.fixedPlace }];
  const option = (ref, label, iconName) => ({
    label,
    icon: iconName,
    active: view.place === ref,
    stay: true,
    onSelect: () => change({ place: ref }),
  });
  return [
    option("alle", allPlaces, "layers"),
    option("inbox", inboxLabel, "inbox"),
    ...taskPlaces().map((place) => option(place.ref, place.label, place.icon)),
  ];
}

/* Abschnitt „Status“: die Status mit Haken, darunter „Archiviert“ */
function statusOptions(view) {
  const rows = taskStatuses.map((status) => ({
    label: status.label,
    icon: status.icon,
    info: status.done ? infos.done : undefined,
    active: statusShown(view, status),
    stay: true,
    onSelect: () =>
      change(status.done ? { hideDone: !view.hideDone } : { hiddenStatuses: toggled(view.hiddenStatuses, status.id) }),
  }));
  rows.push({
    label: archivedLabel,
    icon: "archive",
    info: infos.archived,
    active: view.showArchived,
    stay: true,
    onSelect: () => change({ showArchived: !view.showArchived }),
  });
  return rows;
}

/* Abschnitt „Dringlichkeit“: Mehrfachwahl */
function priorityOptions(view) {
  return taskPriorities.map((prio) => ({
    label: prio.label,
    icon: prio.icon,
    active: !view.hiddenPriorities.includes(prio.id),
    stay: true,
    onSelect: () => change({ hiddenPriorities: toggled(view.hiddenPriorities, prio.id) }),
  }));
}

/* Speichern und das offene Blatt mit dem neuen Stand neu zeichnen */
function change(changes) {
  updateTaskView(changes);
  openTaskFilter();
}

/** Das Blatt für die gewählte Ansicht öffnen. Es hat keinen Titel — die drei Überschriften sagen genug. */
export function openTaskFilter() {
  const view = activeTaskView();
  openSheet("", [
    { heading: true, label: headings.place },
    ...placeOptions(view),
    { heading: true, label: headings.status },
    ...statusOptions(view),
    { heading: true, label: headings.priority },
    ...priorityOptions(view),
  ]);
}
