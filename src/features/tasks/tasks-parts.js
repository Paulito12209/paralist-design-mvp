/*
 * Die kleinen Bausteine einer Aufgabe, die Liste und Board gemeinsam nutzen:
 * der Titel und die stille Nebenzeile darunter. Keine Chips mit Rahmen — nur
 * grauer Text, durch Punkte getrennt: Fälligkeit, dann der Ablageort. Farbe
 * bekommt einzig, was Aufmerksamkeit verdient: ein überfälliges Datum wird
 * rot. Der Status steht nicht in der Zeile, den zeigt der Ring des Hakens
 * (src/ui/task-status.js); die Dringlichkeit steht nur dann als Wort da, wenn
 * der Abschnitt sie nicht schon sagt (Gliederung nach Status).
 * Pfad: src/features/tasks/tasks-parts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * untitledTask -> wie eine Aufgabe ohne Titel heißt
 *
 * Aussehen und Größen stehen in styles/tasks.css (--task-meta-size, das Rot
 * eines überfälligen Datums ist --prio-jetzt).
 */

import { dayKey } from "../../core/dates.js";
import { escapeHtml } from "../../core/html.js";
import { shortDay } from "../../core/format.js";
import { isTaskDone, taskPriorityOf } from "../../data/config-tasks.js";
import { placesLabel } from "../../data/queries.js";

const untitledTask = "Ohne Titel";

/** Titel einer Aufgabe, abgesichert für die Ausgabe. */
export function taskTitle(entry) {
  return escapeHtml(entry.title || untitledTask);
}

/* Die Fälligkeit — nur, wenn die Aufgabe wirklich ein Datum hat. Der Tag des
   Anlegens ist keine Fälligkeit und bleibt deshalb weg. */
function dueMarkup(entry) {
  if (!entry.date) return "";
  const overdue = !isTaskDone(entry) && entry.date < dayKey(new Date());
  return `<span class="task-due${overdue ? " is-overdue" : ""}">${escapeHtml(shortDay(entry.date))}</span>`;
}

/* Die Dringlichkeit als Wort in ihrer Farbe — nur in Status-Abschnitten. */
function priorityMarkup(entry) {
  const priority = taskPriorityOf(entry.priority);
  return `<span class="task-prio" style="--chip-color:${priority.color}">${escapeHtml(priority.label)}</span>`;
}

/* Der Ablageort — nur, wenn die Aufgabe irgendwo liegt. Im Eingang steht nichts. */
function placeMarkup(entry) {
  if (!(entry.places || []).length) return "";
  return `<span class="task-place">${escapeHtml(placesLabel(entry))}</span>`;
}

/**
 * Die Nebenzeile unter dem Titel. `field` ist das Feld der Gliederung: was
 * der Abschnitt schon sagt, wiederholt die Zeile nicht. Ohne Angaben bleibt
 * die Zeile ganz weg, und die Aufgabe ist eine einzeilige Zeile.
 */
export function taskMeta(entry, field) {
  const parts = [dueMarkup(entry), field === "status" ? priorityMarkup(entry) : "", placeMarkup(entry)].filter(
    Boolean
  );
  if (!parts.length) return "";
  return `<span class="task-meta">${parts.join('<span class="task-meta-dot" aria-hidden="true">·</span>')}</span>`;
}

/**
 * Am Desktop stehen Fälligkeit, Dringlichkeit und Ablageort als ruhige
 * Spalten rechts in der Zeile statt in der Nebenzeile (styles/tasks-desk.css
 * blendet je nach Breite das eine oder das andere aus). Leere Zellen bleiben
 * stehen, damit die Spalten untereinander fluchten.
 */
export function taskColumns(entry) {
  return `
    <span class="task-cols">
      <span class="task-col">${dueMarkup(entry)}</span>
      <span class="task-col">${priorityMarkup(entry)}</span>
      <span class="task-col">${placeMarkup(entry)}</span>
    </span>`;
}
