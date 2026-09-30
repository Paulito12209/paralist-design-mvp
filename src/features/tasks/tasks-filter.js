/*
 * Das Blatt „Filtern“ der Aufgaben-Seite und die Kurzform, die in der Karte
 * „Ansicht“ in der Zeile „Filtern“ steht. Drei Abschnitte:
 *
 * - Ort: Einfachwahl (alle Orte, Eingang, jeder Ort mit Aufgaben). In der
 *   festen Ansicht „Alle“ steht hier nur ein Satz, wie man eine eigene
 *   Ansicht für einen Ort baut.
 * - Status: Mehrfachwahl. „Erledigt“ ist derselbe Schalter wie „Erledigte
 *   zeigen“ in der Karte. Darunter blass „Archiviert“ — das filtert nicht,
 *   sondern erklärt, wo die älteren Erledigten liegen, und öffnet das Archiv.
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
 * fixedPlaceNote -> Satz unter „Ort“ in der Ansicht „Alle“
 * doneHint / archivedHint / archivedLabel -> die beiden erklärenden Zeilen unter „Status“
 * noneStatus / noneAll / manyPrios -> Kurzform in der Karte, wenn nichts bzw. viel gewählt ist
 *
 * Aussehen: styles/overlays.css und styles/sheet-tabs.css (Blatt, Haken,
 * kleiner Satz unter dem Namen).
 */

import { taskPriorities, taskStatuses } from "../../data/config-tasks.js";
import { parentName, taskPlaces } from "../../data/queries.js";
import { activeTaskView, updateTaskView } from "../../data/task-views.js";
import { openArchive } from "../../ui/router.js";
import { openSheet } from "../../ui/sheet.js";

const headings = { place: "Ort", status: "Status", priority: "Dringlichkeit" };
export const allPlaces = "Alle Orte";
const inboxLabel = "Eingang";
const fixedPlaceNote = "„Alle“ zeigt Aufgaben von jedem Ort. Für einen Ort tippe auf das kleine Plus neben den Pillen und filtere die neue Ansicht.";
const doneHint = "Heute erledigte – wie „Erledigte zeigen“";
const archivedLabel = "Archiviert";
const archivedHint = "Ältere Erledigte liegen im Archiv";
const noneStatus = "Kein Status";
const noneAll = "Keine Dringlichkeit";
const manyPrios = (n) => `${n} Dringlichkeiten`;

/* Die Pille „Aufgaben“ im Archiv (src/data/collections.js, archivePills) */
const archivePill = "aufgabe";

/* Ist dieser Status in der Ansicht zu sehen? „Erledigt“ hängt am Schalter. */
function statusShown(view, status) {
  return status.done ? !view.hideDone : !view.hiddenStatuses.includes(status.id);
}

/* Eine id in einer Liste an- oder abwählen — immer als neue Liste, weil sich
   Kopien einer Ansicht ihre Listen sonst teilen würden. */
function toggled(list, id) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/* Namen einer Auswahl kurz: bis zwei beim Namen, darüber als Anzahl */
function shortList(labels, none, many) {
  if (!labels.length) return none;
  return labels.length > 2 ? many(labels.length) : labels.join(", ");
}

/** Was in der Zeile „Filtern“ steht, z.B. „Alle Orte · Offen, In Arbeit“. */
export function filterSummary(view) {
  const parts = [view.place === "alle" ? allPlaces : view.place === "inbox" ? inboxLabel : parentName(view.place)];
  const statuses = taskStatuses.filter((status) => statusShown(view, status));
  if (statuses.length < taskStatuses.length) {
    parts.push(shortList(statuses.map((status) => status.label), noneStatus, () => ""));
  }
  if (view.hiddenPriorities.length) {
    const prios = taskPriorities.filter((prio) => !view.hiddenPriorities.includes(prio.id));
    parts.push(shortList(prios.map((prio) => prio.label), noneAll, manyPrios));
  }
  return parts.join(" · ");
}

/* Abschnitt „Ort“: Einfachwahl, in „Alle“ nur der erklärende Satz */
function placeOptions(view) {
  if (view.fixed) return [{ note: true, label: fixedPlaceNote }];
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

/* Abschnitt „Status“: die Status mit Haken, darunter der Weg ins Archiv */
function statusOptions(view) {
  const rows = taskStatuses.map((status) => ({
    label: status.label,
    icon: status.icon,
    hint: status.done ? doneHint : "",
    active: statusShown(view, status),
    stay: true,
    onSelect: () =>
      change(status.done ? { hideDone: !view.hideDone } : { hiddenStatuses: toggled(view.hiddenStatuses, status.id) }),
  }));
  rows.push({ label: archivedLabel, icon: "archive", hint: archivedHint, muted: true, more: true, onSelect: () => openArchive(archivePill) });
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
