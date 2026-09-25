/*
 * Status und Dringlichkeit einer Aufgabe — überall, wo eine Aufgabe auftaucht,
 * nicht nur auf der Aufgaben-Seite:
 *
 * - der runde Haken-Knopf, der in JEDER Liste vor einer Aufgabe steht (Projekt,
 *   Arbeitsbereich, verknüpfte Einträge, Kalender, Aufgaben-Seite),
 * - auf der Seite der Aufgabe mittig in der Kopfzeile „Aufgabe“, darunter „Offen · Jetzt“;
 *   ein Tipp darauf öffnet von unten das Blatt mit Status und Dringlichkeit,
 * - die kurze Meldung „Erledigt“ mit „Rückgängig“ — ein Tipp auf den
 *   Haken lässt die Zeile oft verschwinden (Filter „Erledigte ausblenden“), und
 *   ein versehentlicher Tipp soll sich ohne Suchen zurücknehmen lassen.
 * Pfad: src/ui/task-status.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * doneTitle   -> Text der Meldung nach dem Abhaken
 * undoLabel   -> Beschriftung des Knopfes in der Meldung
 * statusTitle -> Beschriftung des Tabs „Status“ im Blatt
 * prioTitle   -> Beschriftung des Tabs „Dringlichkeit“ im Blatt
 * typeTitle   -> Beschriftung des Tabs „Typ“ im Blatt
 *
 * Aussehen steht in styles/tasks.css (Haken) und styles/task-status.css
 * (Kopfzeile der Aufgabenseite, Haken in allgemeinen Listen).
 */

import { escapeHtml, icon } from "../core/html.js";
import {
  defaultTaskStatus,
  isTaskDone,
  taskPriorities,
  taskPriorityOf,
  taskStatuses,
  taskStatusOf,
  typeIcon,
  xpItemStyle,
  xpKinds,
} from "../data/config.js";
import { setTaskPriority, setTaskStatus, toggleTaskDone } from "../data/mutations.js";
import { findEntry } from "../data/queries.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";
import { typeChangeOptions } from "./type-menu.js";

const doneTitle = "Erledigt";
const undoLabel = "Rückgängig";
const statusTitle = "Status";
const prioTitle = "Dringlichkeit";
const typeTitle = "Typ";

/*
 * Die beiden Felder, die sich im Blatt der Aufgabe wählen lassen. Die
 * Reihenfolge hier ist die Reihenfolge im Blatt und in der Kopfzeile.
 */
const taskFields = {
  status: { list: taskStatuses, of: taskStatusOf, set: setTaskStatus },
  priority: { list: taskPriorities, of: taskPriorityOf, set: setTaskPriority },
};

/**
 * Der runde Haken-Knopf. Er sitzt als eigener Knopf neben der Zeile, damit ein
 * Tipp darauf die Aufgabe abhakt und nicht die Seite öffnet. „In Arbeit“ färbt
 * den Ring ein — so sieht man den Stand auch in Listen ohne Status-Chip.
 */
export function taskCheck(entry) {
  const done = isTaskDone(entry);
  /* Jede Stufe zwischen „Offen“ und „Erledigt“ gilt als angefangen */
  const busy = !done && taskStatusOf(entry.status).id !== defaultTaskStatus;
  const state = done ? " is-done" : busy ? " is-busy" : "";
  return `
    <button class="task-check${state}" type="button" data-task-done="${entry.id}"
      aria-pressed="${done}" aria-label="${done ? "Wieder öffnen" : "Erledigt"}">
      ${icon("check", "task-check-icon")}
    </button>
  `;
}

/**
 * Mitte der Kopfzeile einer Aufgabe, zweizeilig: oben die Kategorie
 * „Aufgabe“ mit kleinem Pfeil, darunter „Offen · Jetzt“ — Status und rechts
 * daneben die Dringlichkeit, je in ihrer Farbe. So liest man den Stand ab,
 * ohne etwas zu öffnen; ein Tipp irgendwo darauf öffnet das Blatt.
 */
export function taskCrumbMarkup(entry, typeName) {
  const value = (field) => {
    const item = taskFields[field].of(entry[field]);
    return `<span class="task-crumb-value" style="--chip-color:${item.color}">${escapeHtml(item.label)}</span>`;
  };
  const status = taskStatusOf(entry.status).label;
  const prio = taskPriorityOf(entry.priority).label;
  return `
    <button class="task-crumb" type="button" data-task-sheet
      aria-label="${escapeHtml(typeName)}, Status ${escapeHtml(status)}, Dringlichkeit ${escapeHtml(prio)}. Ändern">
      <span class="task-crumb-top">
        <span class="task-crumb-type">${escapeHtml(typeName)}</span>
        ${icon("chevron", "task-crumb-chevron")}
      </span>
      <span class="task-crumb-sub">
        ${value("status")}<span class="task-crumb-dot" aria-hidden="true">·</span>${value("priority")}
      </span>
    </button>
  `;
}

/* Die Optionen eines Feldes im Blatt; die gewählte Stufe ist markiert. Das
   Blatt bleibt offen (`stay`), damit man Status und Dringlichkeit in einem
   Zug setzen kann, und zeichnet sich nach jeder Wahl im selben Tab neu. */
function fieldOptions(entry, field) {
  const spec = taskFields[field];
  const current = spec.of(entry[field]).id;
  return [
    ...spec.list.map((item) => ({
      label: item.label,
      icon: item.icon,
      active: item.id === current,
      stay: true,
      onSelect: () => {
        const wasDone = isTaskDone(entry);
        const firstTime = !entry.doneAwarded;
        const before = entry[field];
        spec.set(entry, item.id);
        if (field === "status" && !wasDone && isTaskDone(entry)) announceDone(entry, before, firstTime);
        openTaskSheet(entry, field);
      },
    })),
  ];
}

/*
 * Die Tabs des Blatts: Status, Dringlichkeit und die Typen zum Umwandeln
 * (src/ui/type-menu.js). Ein Tipp auf einen Typ schließt das Blatt — die
 * Aufgabe ist danach keine mehr, oder es folgt die Rückfrage.
 */
const sheetTabs = [
  { id: "status", label: statusTitle, options: (entry) => fieldOptions(entry, "status") },
  { id: "priority", label: prioTitle, options: (entry) => fieldOptions(entry, "priority") },
  { id: "type", label: typeTitle, options: (entry) => typeChangeOptions({ entry }) },
];

/**
 * Blatt von unten für eine Aufgabe: oben ihr Name mit dem Icon der Kategorie,
 * darunter die Tabs Status | Dringlichkeit | Typ — antippen oder waagerecht
 * wischen wechselt. Die Kopfzeile einer Aufgabe öffnet es immer bei „Status“;
 * bei jedem anderen Eintrag öffnet sie das Typ-Blatt direkt.
 */
export function openTaskSheet(entry, tab = sheetTabs[0].id) {
  const current = sheetTabs.find((item) => item.id === tab) || sheetTabs[0];
  openSheet(entry.title || "Aufgabe", current.options(entry), {
    icon: typeIcon(entry.type),
    iconColor: xpItemStyle(entry.type).color,
    tabs: sheetTabs,
    tab: current.id,
    onTab: (id) => {
      const fresh = findEntry(entry.id);
      if (fresh) openTaskSheet(fresh, id);
    },
  });
}

/* Meldung nach dem Abhaken; „Rückgängig“ stellt den Status von vorher wieder
   her. Die Punkte gibt es nur beim ersten Mal (doneAwarded in mutations.js),
   deshalb steht „+2 XP“ nur dann daneben. */
function announceDone(entry, before, awarded) {
  showToast({
    icon: "check-circle",
    accent: "var(--xp-done)",
    title: doneTitle,
    note: awarded ? `+${xpKinds.done.amount} XP` : "",
    action: {
      label: undoLabel,
      icon: "undo",
      onSelect: () => {
        const current = findEntry(entry.id);
        if (current) setTaskStatus(current, before);
      },
    },
  });
}

/**
 * Haken-Knopf gedrückt: erledigt setzen oder wieder öffnen. Beim Erledigen
 * erscheint die Meldung mit „Rückgängig“, beim Wieder-Öffnen nicht — dann
 * bleibt die Zeile ja sichtbar und der Haken ist die Rückmeldung.
 */
export function toggleTaskFromCheck(id) {
  const entry = findEntry(id);
  if (!entry) return;
  const before = entry.status;
  const firstTime = !entry.doneAwarded;
  toggleTaskDone(entry);
  if (isTaskDone(entry)) announceDone(entry, before, firstTime);
}
