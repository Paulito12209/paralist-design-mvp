/*
 * Die kleinen Bausteine einer Aufgabe, die Liste und Board gemeinsam nutzen:
 * der runde Haken-Knopf, das Label mit dem Ablageort und die Chips für Status,
 * Dringlichkeit und Datum.
 * Pfad: src/features/tasks/tasks-parts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * untitledTask       -> wie eine Aufgabe ohne Titel heißt
 * priorityFieldIcon  -> Icon vor der Dringlichkeit in einer Zeile; kommt aus
 *                       taskGroupings in src/data/config.js
 *
 * Aussehen und Größen stehen in styles/tasks.css (--task-check-size,
 * --task-meta-size, --task-chip-size).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { shortDay } from "../../core/format.js";
import { isTaskDone, taskGroupings, taskPriorityOf, taskStatusOf } from "../../data/config.js";
import { entryDay, mainPlace, parentIcon, placesLabel } from "../../data/queries.js";

const untitledTask = "Ohne Titel";

/*
 * Welches Icon in einer Zeile vor der Dringlichkeit steht. Nicht das der
 * einzelnen Stufe: die Uhr bei „Später“ sagt nichts darüber, um welches Feld
 * es überhaupt geht, und sieht dem Verlaufs-Icon von „In Arbeit“ zum
 * Verwechseln ähnlich. Stattdessen das Icon der Gruppierung „Dringlichkeit“ —
 * dasselbe, das auch die Pille „Gruppieren“ trägt. Die Spaltenköpfe im Board
 * behalten ihr eigenes Icon je Stufe: dort ist die Stufe ja die Überschrift.
 */
const priorityGroup = taskGroupings.find((group) => group.field === "priority");
const priorityFieldIcon = priorityGroup ? priorityGroup.icon : "flame";

/** Titel einer Aufgabe, abgesichert für die Ausgabe. */
export function taskTitle(entry) {
  return escapeHtml(entry.title || untitledTask);
}

/**
 * Der runde Haken-Knopf. Er sitzt als eigener Knopf neben der Zeile, damit ein
 * Tipp darauf die Aufgabe abhakt und nicht den Editor öffnet.
 */
export function taskCheck(entry) {
  const done = isTaskDone(entry);
  return `
    <button class="task-check${done ? " is-done" : ""}" type="button" data-task-done="${entry.id}"
      aria-pressed="${done}" aria-label="${done ? "Wieder öffnen" : "Erledigt"}">
      ${icon("check", "task-check-icon")}
    </button>
  `;
}

/** Wozu die Aufgabe gehört: Projekt, Arbeitsbereich oder „Inbox“. */
export function taskPlaceLabel(entry) {
  return `
    <span class="task-place">
      ${icon(parentIcon(mainPlace(entry)), "task-place-icon")}
      <span class="task-place-name">${escapeHtml(placesLabel(entry))}</span>
    </span>
  `;
}

/** Ein Chip: kleines Icon, kurzer Text, Farbe aus der Angabe. */
function chip(iconName, label, color, extra = "") {
  return `
    <span class="task-chip${extra}" style="--chip-color:${color}">
      ${icon(iconName, "task-chip-icon")}${escapeHtml(label)}
    </span>
  `;
}

/** Status-Chip mit der Farbe des Status. */
export function taskStatusChip(entry) {
  const status = taskStatusOf(entry.status);
  return chip(status.icon, status.label, status.color);
}

/** Dringlichkeits-Chip: Icon des Feldes, Name und Farbe der Stufe. */
export function taskPriorityChip(entry) {
  const priority = taskPriorityOf(entry.priority);
  return chip(priorityFieldIcon, priority.label, priority.color);
}

/** Datums-Chip: „Heute“, „Morgen“, sonst der kurze Tag. */
export function taskDateChip(entry) {
  return chip("calendar", shortDay(entryDay(entry)), "var(--muted)", " task-chip-date");
}
