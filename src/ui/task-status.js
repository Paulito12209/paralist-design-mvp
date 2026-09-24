/*
 * Status und Dringlichkeit einer Aufgabe — überall, wo eine Aufgabe auftaucht,
 * nicht nur auf der Aufgaben-Seite:
 *
 * - der runde Haken-Knopf, der in JEDER Liste vor einer Aufgabe steht (Projekt,
 *   Arbeitsbereich, verknüpfte Einträge, Kalender, Aufgaben-Seite) und auf der
 *   Seite der Aufgabe selbst,
 * - die zwei Wahl-Pillen „Status“ und „Dringlichkeit“ unter dem Titel der
 *   Aufgabenseite; ein Tipp öffnet das Blatt mit allen Stufen,
 * - die kurze Meldung „Erledigt“ mit „Rückgängig“ — ein Tipp auf den
 *   Haken lässt die Zeile oft verschwinden (Filter „Erledigte ausblenden“), und
 *   ein versehentlicher Tipp soll sich ohne Suchen zurücknehmen lassen.
 * Pfad: src/ui/task-status.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * doneTitle   -> Text der Meldung nach dem Abhaken
 * undoLabel   -> Beschriftung des Knopfes in der Meldung
 * statusTitle -> Überschrift des Blatts „Status“
 * prioTitle   -> Überschrift des Blatts „Dringlichkeit“
 *
 * Aussehen steht in styles/tasks.css (Haken) und styles/task-status.css
 * (Pillen auf der Aufgabenseite, Haken in allgemeinen Listen).
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
 * Die beiden Felder, die sich auf der Aufgabenseite wählen lassen. Das Icon der
 * Pille ist das der gewählten Stufe, die Farbe ebenso — so liest man den Stand
 * ab, ohne das Blatt zu öffnen.
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

/** Die Pillen „Status“ und „Dringlichkeit“ unter dem Titel der Aufgabenseite. */
export function taskFieldsMarkup(entry) {
  const pill = (field) => {
    const { title, of } = taskFields[field];
    const value = of(entry[field]);
    return `
      <button class="task-field" type="button" data-task-field="${field}" style="--chip-color:${value.color}"
        aria-label="${title}: ${escapeHtml(value.label)}. Ändern">
        ${icon(value.icon, "task-field-icon")}
        <span>${escapeHtml(value.label)}</span>
        ${icon("chevron", "task-field-chevron")}
      </button>
    `;
  };
  return `${taskCheck(entry)}${pill("status")}${pill("priority")}`;
}

/** Blatt mit allen Stufen eines Feldes; die gewählte ist markiert. */
export function openTaskFieldSheet(entry, field) {
  const spec = taskFields[field];
  if (!spec) return;
  const current = spec.of(entry[field]).id;
  openSheet(
    spec.title,
    spec.list.map((item) => ({
      label: item.label,
      icon: item.icon,
      active: item.id === current,
      onSelect: () => {
        const wasDone = isTaskDone(entry);
        const firstTime = !entry.doneAwarded;
        const before = entry[field];
        spec.set(entry, item.id);
        if (field === "status" && !wasDone && isTaskDone(entry)) announceDone(entry, before, firstTime);
      },
    }))
  );
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
