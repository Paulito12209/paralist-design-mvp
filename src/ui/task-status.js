/*
 * Status und Dringlichkeit einer Aufgabe — überall, wo eine Aufgabe auftaucht,
 * nicht nur auf der Aufgaben-Seite:
 *
 * - der runde Haken-Knopf, der in JEDER Liste vor einer Aufgabe steht (Projekt,
 *   Arbeitsbereich, verknüpfte Einträge, Kalender, Aufgaben-Seite),
 * - auf der Seite der Aufgabe mittig in der Kopfzeile „Aufgabe: Offen | Jetzt“;
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
 * statusTitle -> Abschnitts-Überschrift „Status“ im Blatt
 * prioTitle   -> Abschnitts-Überschrift „Dringlichkeit“ im Blatt
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
  xpKinds,
} from "../data/config.js";
import { setTaskPriority, setTaskStatus, toggleTaskDone } from "../data/mutations.js";
import { findEntry } from "../data/queries.js";
import { openSheet } from "./sheet.js";
import { showToast } from "./toast.js";

const doneTitle = "Erledigt";
const undoLabel = "Rückgängig";
const statusTitle = "Status";
const prioTitle = "Dringlichkeit";

/*
 * Die beiden Felder, die sich im Blatt der Aufgabe wählen lassen. Die
 * Reihenfolge hier ist die Reihenfolge im Blatt und in der Kopfzeile.
 */
const taskFields = {
  status: { title: statusTitle, list: taskStatuses, of: taskStatusOf, set: setTaskStatus },
  priority: { title: prioTitle, list: taskPriorities, of: taskPriorityOf, set: setTaskPriority },
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
 * Mitte der Kopfzeile einer Aufgabe: „Aufgabe: Offen | Jetzt“ mit kleinem
 * Pfeil. Die beiden Werte stehen in ihrer Farbe — so sieht man, dass sie
 * antippbar sind, und liest den Stand ab, ohne etwas zu öffnen.
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
      <span class="task-crumb-type">${escapeHtml(typeName)}:</span>
      ${value("status")}<span class="task-crumb-bar" aria-hidden="true"></span>${value("priority")}
      ${icon("chevron", "task-crumb-chevron")}
    </button>
  `;
}

/* Die Optionen eines Feldes im Blatt; die gewählte Stufe ist markiert. Das
   Blatt bleibt offen (`stay`), damit man Status und Dringlichkeit in einem
   Zug setzen kann, und zeichnet sich nach jeder Wahl neu. */
function fieldOptions(entry, field) {
  const spec = taskFields[field];
  const current = spec.of(entry[field]).id;
  return [
    { heading: true, label: spec.title },
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
        openTaskSheet(entry);
      },
    })),
  ];
}

/** Blatt von unten mit Status und Dringlichkeit einer Aufgabe. */
export function openTaskSheet(entry) {
  openSheet(entry.title || "Aufgabe", [...fieldOptions(entry, "status"), ...fieldOptions(entry, "priority")]);
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
