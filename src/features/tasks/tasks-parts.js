/*
 * Die kleinen Bausteine einer Aufgabe, die Liste und Board gemeinsam nutzen:
 * der Titel und die stille Nebenzeile darunter. Keine Chips mit Rahmen — nur
 * Text, durch Punkte getrennt, die bunten Dinge zuerst: Dringlichkeit (in
 * ihrer Farbe), dann Fälligkeit, dann der eine übergeordnete Ort. Bunt ist
 * so alles nah am farbigen Ring des Hakens, der Rest ist ruhiger grauer Text;
 * ein überfälliges Datum wird rot. Der Status steht nicht in der Zeile, den
 * zeigt der Ring (src/ui/task-status.js). Was die Gliederung schon sagt
 * (Spaltenkopf nach Dringlichkeit), wiederholt die Zeile nicht.
 * Pfad: src/features/tasks/tasks-parts.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * untitledTask -> wie eine Aufgabe ohne Titel heißt
 * colLabels    -> Vorlese-Text der drei Spalten am Desktop (Datum, Dringlichkeit, Verknüpfung)
 *
 * Aussehen und Größen stehen in styles/tasks.css (--task-meta-size, das Rot
 * eines überfälligen Datums ist --prio-jetzt).
 */

import { dayKey } from "../../core/dates.js";
import { escapeHtml, icon } from "../../core/html.js";
import { shortDay } from "../../core/format.js";
import { isTaskDone, taskPriorityOf } from "../../data/config-tasks.js";
import { parentName } from "../../data/queries.js";
import { isEntryRef } from "../../data/refs.js";

const untitledTask = "Ohne Titel";
const colLabels = { date: "Datum ändern", priority: "Dringlichkeit wählen", place: "Verknüpfung ändern" };

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

/* Die Dringlichkeit als Wort in ihrer Farbe, davor das eine Dringlichkeits-Icon
   (nicht das der Stufe): so erkennt man das Feld, auch ohne das Wort zu lesen. */
function priorityMarkup(entry) {
  const priority = taskPriorityOf(entry.priority);
  return `<span class="task-prio" style="--chip-color:${priority.color}">${icon("urgency", "task-prio-icon")}${escapeHtml(priority.label)}</span>`;
}

/** Der eine übergeordnete Ort: das Projekt, sonst der Arbeitsbereich. Liegt die
   Aufgabe in beiden, gewinnt das Projekt — es ist enger. Im Eingang: null. */
export function mainPlace(entry) {
  const places = entry.places || [];
  return places.find(isEntryRef) || places[0] || null;
}

function placeMarkup(entry) {
  const main = mainPlace(entry);
  return main ? `<span class="task-place">${escapeHtml(parentName(main))}</span>` : "";
}

/**
 * Die Nebenzeile unter dem Titel. `field` ist das Feld der Gliederung: was
 * der Abschnitt schon sagt, wiederholt die Zeile nicht. Ohne Angaben bleibt
 * die Zeile ganz weg, und die Aufgabe ist eine einzeilige Zeile.
 */
export function taskMeta(entry, field) {
  const parts = [field === "priority" ? "" : priorityMarkup(entry), dueMarkup(entry), placeMarkup(entry)].filter(
    Boolean
  );
  if (!parts.length) return "";
  return `<span class="task-meta">${parts.join('<span class="task-meta-dot" aria-hidden="true">·</span>')}</span>`;
}

/* Eine Spalte als eigener Knopf: ein Klick bearbeitet genau diese Angabe
   (src/features/tasks/tasks-col-edit.js). Fehlt die Angabe, steht nur ein
   blasses Icon da, das erst beim Überfahren der Zeile erscheint. */
function colButton(entry, field, markup, emptyIcon, label) {
  return `
      <button class="task-col${markup ? "" : " is-empty"}" type="button" data-task-edit="${field}" data-task-id="${entry.id}" aria-label="${label}">
        ${markup || icon(emptyIcon, "task-col-add")}
      </button>`;
}

/**
 * Am Desktop stehen Fälligkeit, Dringlichkeit und Verknüpfung als ruhige,
 * eng beieinander stehende Spalten ganz rechts in der Zeile statt in der
 * Nebenzeile (styles/tasks-desk.css blendet je nach Breite das eine oder das
 * andere aus). Sie liegen neben dem Zeilen-Knopf, nicht in ihm: ein Knopf im
 * Knopf wäre ungültiges HTML. Leere Zellen bleiben stehen, damit die Spalten
 * untereinander fluchten.
 */
export function taskColumns(entry) {
  return `
    <span class="task-cols">
      ${colButton(entry, "date", dueMarkup(entry), "calendar", colLabels.date)}
      ${colButton(entry, "priority", priorityMarkup(entry), "urgency", colLabels.priority)}
      ${colButton(entry, "place", placeMarkup(entry), "folder-move", colLabels.place)}
    </span>`;
}
