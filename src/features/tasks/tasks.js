/*
 * Die Aufgaben-Seite hinter dem dritten Reiter: hier entstehen Liste und
 * Kanban-Board. Vorläufig zeigt sie nur, was an Aufgaben da ist.
 * Wird erst beim ersten Öffnen nachgeladen.
 * Pfad: src/features/tasks/tasks.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * emptyNote -> Text, solange es keine Aufgabe gibt
 */

import { events, on } from "../../core/bus.js";
import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { state } from "../../data/state.js";
import { isViewActive } from "../../ui/views.js";

const emptyNote = "Noch keine Aufgaben. Leg eine über das Plus unten an.";

/** Alle Aufgaben, die neueste zuerst. */
function taskEntries() {
  return state.entries
    .filter((entry) => entry.type === "aufgabe" && !entry.archived)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Die Seite zeichnen. */
export function renderTasks() {
  const list = taskEntries();
  dom.tasksTools.innerHTML = "";
  dom.tasksBody.innerHTML = list.length
    ? `<div class="task-list">${list
        .map(
          (entry) => `
            <div class="task-row">
              ${icon("task", "task-row-icon")}
              <span class="task-row-title">${escapeHtml(entry.title || "Ohne Titel")}</span>
            </div>`
        )
        .join("")}</div>`
    : `<p class="empty-note">${emptyNote}</p>`;
}

/* Beim Laden des Moduls anmelden: die Seite frischt sich auf, solange sie offen ist. */
function init() {
  on(events.dataChanged, () => {
    if (isViewActive("tasks")) renderTasks();
  });
  on(events.viewOpened, (name) => {
    if (name === "tasks") renderTasks();
  });
  renderTasks();
}

init();
