/*
 * Die kleinen Bausteine einer Aufgabe, die Liste und Board gemeinsam nutzen:
 * der runde Haken-Knopf, das Label mit dem Ablageort und die Chips für Status,
 * Dringlichkeit und Datum.
 * Pfad: src/features/tasks/tasks-parts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * untitledTask -> wie eine Aufgabe ohne Titel heißt
 *
 * Aussehen und Größen stehen in styles/tasks.css (--task-check-size,
 * --task-meta-size, --task-chip-size).
 */

import { escapeHtml, icon } from "../../core/html.js";
import { shortDay } from "../../core/format.js";
import { isTaskDone, taskPriorityOf, taskStatusOf } from "../../data/config.js";
import { entryDay, mainPlace, parentIcon, placesLabel } from "../../data/queries.js";

const untitledTask = "Ohne Titel";

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

/** Dringlichkeits-Chip mit der Farbe der Dringlichkeit. */
export function taskPriorityChip(entry) {
  const priority = taskPriorityOf(entry.priority);
  return chip(priority.icon, priority.label, priority.color);
}

/** Datums-Chip: „Heute“, „Morgen“, sonst der kurze Tag. */
export function taskDateChip(entry) {
  return chip("calendar", shortDay(entryDay(entry)), "var(--muted)", " task-chip-date");
}
