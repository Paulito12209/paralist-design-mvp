/*
 * Das Blatt „Filtern“ der Aufgaben-Seite und die Chips, die in der Karte
 * „Ansicht“ unter der Zeile „Filtern“ zeigen, was gefiltert ist. Als Filter
 * zählen der Ort, abgewählte Status und abgewählte Dringlichkeiten — nicht
 * das Ausblenden der Erledigten, das hat seinen eigenen Schalter
 * „Erledigte zeigen“. Ohne Filter steht rechts „Keine“.
 *
 * Das Blatt ist gebaut wie „Sortieren“ (src/ui/filter-sheet.js): Titel und ✕,
 * zwei Spalten nebeneinander, unten „Fertig“.
 *
 * - Ort (nur in eigenen Ansichten): Pillen darüber, Einfachwahl (alle Orte,
 *   Eingang, jeder Ort mit Aufgaben). „Alle“ zeigt immer jeden Ort — das
 *   erklärt dort das ⓘ an der Pille (src/features/tasks/tasks-views.js).
 * - Status, links: Mehrfachwahl. „Erledigt“ ist derselbe Schalter wie
 *   „Erledigte zeigen“ in der Karte. „Archiviert“ holt die archivierten
 *   Aufgaben auf die Seite — nach Status gruppiert als eigene Spalte rechts
 *   neben „Erledigt“ (src/data/queries.js, taskGroups). Beide erklären sich per ⓘ.
 * - Dringlichkeit, rechts: Mehrfachwahl.
 *
 * Das Blatt bleibt beim An- und Abwählen offen und zeichnet sich nach jeder
 * Wahl mit dem neuen Stand neu.
 * Pfad: src/features/tasks/tasks-filter.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * title         -> Überschrift des Blatts
 * headings      -> Überschriften über Ort und den beiden Spalten
 * allPlaces / inboxLabel -> Name der beiden festen Orte
 * infos          -> Überschrift und Text der Erklärungen hinter den ⓘ
 * archivedLabel  -> Name der Option „Archiviert“
 * noneStatus / nonePrio -> Chip, wenn in einem Abschnitt gar nichts gewählt ist
 *
 * Aussehen: styles/filter-sheet.css (Spalten, Band, Ort-Pillen), der Dialog
 * hinter dem ⓘ in styles/info-dialog.css.
 */

import { taskPriorities, taskStatuses } from "../../data/config-tasks.js";
import { parentName, taskPlaces } from "../../data/queries.js";
import { activeTaskView, updateTaskView } from "../../data/task-views.js";
import { openFilterSheet } from "../../ui/filter-sheet.js";

const title = "Filtern";
const headings = { place: "Ort", status: "Status", priority: "Dringlichkeit" };
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

/* Zeile „Ort“ mit Pillen — nur in eigenen Ansichten. „Alle“ zeigt immer
   jeden Ort; das erklärt das ⓘ an ihrer Pille (tasks-views.js). */
function placeRow(view) {
  if (view.fixed) return null;
  return {
    heading: headings.place,
    chosen: view.place,
    options: [
      { id: "alle", label: allPlaces, icon: "layers" },
      { id: "inbox", label: inboxLabel, icon: "inbox" },
      ...taskPlaces().map((place) => ({ id: place.ref, label: place.label, icon: place.icon })),
    ],
    onPick: (place) => change({ place }),
  };
}

/* Spalte „Status“: die Status, darunter „Archiviert“. Die id eines Eintrags
   sagt, welcher Schalter der Ansicht umgelegt wird. */
function statusColumn(view) {
  const items = taskStatuses.map((status) => ({
    id: status.done ? "done" : status.id,
    label: status.label,
    icon: status.icon,
    color: status.color,
    info: status.done ? infos.done : undefined,
    active: statusShown(view, status),
  }));
  items.push({ id: "archived", label: archivedLabel, icon: "archive", info: infos.archived, active: view.showArchived });
  return {
    heading: headings.status,
    items,
    onToggle: (id) => {
      if (id === "done") change({ hideDone: !view.hideDone });
      else if (id === "archived") change({ showArchived: !view.showArchived });
      else change({ hiddenStatuses: toggled(view.hiddenStatuses, id) });
    },
  };
}

/* Spalte „Dringlichkeit“: Mehrfachwahl */
function priorityColumn(view) {
  return {
    heading: headings.priority,
    items: taskPriorities.map((prio) => ({
      id: prio.id,
      label: prio.label,
      icon: prio.icon,
      color: prio.color,
      active: !view.hiddenPriorities.includes(prio.id),
    })),
    onToggle: (id) => change({ hiddenPriorities: toggled(view.hiddenPriorities, id) }),
  };
}

/* Speichern und das offene Blatt mit dem neuen Stand neu zeichnen */
function change(changes) {
  updateTaskView(changes);
  openTaskFilter();
}

/** Das Blatt für die gewählte Ansicht öffnen oder mit neuem Stand neu zeichnen. */
export function openTaskFilter() {
  const view = activeTaskView();
  openFilterSheet({ title, place: placeRow(view), columns: [statusColumn(view), priorityColumn(view)] });
}
