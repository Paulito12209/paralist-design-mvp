/*
 * Die Listenansicht der Aufgaben-Seite: eine schlichte Liste aller Aufgaben,
 * die der Filter durchlässt — Haken-Knopf links, Titel, stille Nebenzeile,
 * Pfeil; dahinter dieselben Wisch-Knöpfe wie in jeder anderen Liste der App.
 * Am Desktop steht statt des Pfeils rechts Datum, Dringlichkeit, Verknüpfung;
 * ein Klick darauf bearbeitet die Angabe (src/features/tasks/tasks-col-edit.js).
 * Wer im Menü gruppiert, bekommt dieselben Gruppen untereinander, die das
 * Board als Spalten zeigt, jede mit dünner Überschrift (Icon in ihrer Farbe,
 * Name, Anzahl, Pfeil); leere Gruppen fehlen dann. Ein Tipp auf die
 * Überschrift klappt die Gruppe zu und wieder auf — gemerkt je Ansicht, bis
 * die App neu lädt.
 *
 * Im Auswahlmodus (src/features/tasks/tasks-select.js) steht vor jeder Zeile
 * ein Kreis zum Wählen und im Kopf jeder Gruppe einer für die ganze Gruppe;
 * die Geister-Zeile fehlt dann.
 *
 * In der Android-Fassung stehen rechts in jeder Zeile drei Punkte
 * (src/ui/rows.js, rowMore): nur ein Tipp darauf öffnet das Menü der Aufgabe.
 * Gedrückt Halten hebt die Zeile an und verschiebt sie innerhalb ihrer Gruppe
 * wie bei den Projekten (data-reorder, src/features/tasks/tasks-drag.js).
 * Die Punkte und das Verschieben fehlen im Auswahlmodus.
 *
 * Solange es gar keine Aufgabe gibt, liegt eine blasse Geister-Zeile da, die
 * das Anlegen durch Tippen ein einziges Mal erklärt
 * (src/features/tasks/tasks-inline.js). In der Android-Fassung steht statt
 * ihrer der Platzhalter wie am leeren Kalendertag (Icon, Satz, Pille); siebt
 * dort nur der Filter alles aus, bleibt die Geister-Zeile — einen Satz unter
 * der Liste gibt es da nicht.
 * Pfad: src/features/tasks/tasks-list.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * ghostLabel  -> Text der Geister-Zeile, solange es keine Aufgabe gibt
 * emptyFilter -> Text, wenn der Ort-Filter keine Aufgabe übrig lässt (iOS)
 * emptyTasks  -> Platzhalter ohne eine einzige Aufgabe (Android): Icon, Satz, Pille
 *
 * Aussehen und Abstände stehen in styles/rows.css und styles/tasks.css, die
 * Spalten am Desktop in styles/tasks-desk.css.
 */

import { icon } from "../../core/html.js";
import { isTaskDone } from "../../data/config-tasks.js";
import { taskEntries, taskGroups } from "../../data/queries.js";
import { emptyState } from "../../ui/empty-state.js";
import { isMobileOs } from "../../ui/platform.js";
import { entryActions, rowMore, swipeRow } from "../../ui/rows.js";
import { taskCheck } from "../../ui/task-status.js";
import { listScope } from "./tasks-drag.js";
import { taskColumns, taskMeta, taskTitle } from "./tasks-parts.js";
import { groupPickMark, isPicked, isSelecting, pickMark } from "./tasks-pick.js";

const ghostLabel = "Neue Aufgabe";
/* Zugeklappte Gruppen als „<Ansicht>|<Gruppe>“ — nur für diese Sitzung, wie unter „Verknüpfte Einträge“ */
const collapsed = new Set();
const sectionKey = (prefs, column) => `${prefs.id}|${column.id}`;
const emptyFilter = "Hier liegt keine offene Aufgabe.";
/* Wortlaut wie in der Spalte „Aufgaben“ der Kalenderliste (calendarSegments in src/data/config.js) */
const emptyTasks = {
  icon: "task",
  accent: "var(--cal-accent)",
  title: "Keine Aufgaben",
  action: { label: "Aufgabe hinzufügen", pick: "aufgabe" },
  plain: true,
};

/**
 * Eine Zeile: Haken-Knopf, Titel mit Nebenzeile, Pfeil (Android: drei Punkte) — dahinter dieselben
 * Wisch-Knöpfe wie in jeder anderen Liste (src/ui/rows.js). Am Desktop stehen die
 * Spalten rechts neben dem Zeilen-Knopf, der Pfeil entfällt dort (styles/tasks-desk.css).
 */
function taskRow(entry, field) {
  const done = isTaskDone(entry);
  const actions = entryActions(entry);
  const picked = isPicked(entry.id) ? " data-picked" : "";
  return swipeRow(
    `data-entry="${entry.id}" data-pick-row="${entry.id}"${picked}`,
    actions.left,
    actions.right,
    `
      ${pickMark(entry.id)}
      ${taskCheck(entry)}
      <button class="workspace-row entry-row task-row" type="button" data-open-entry="${entry.id}">
        <span class="task-main">
          <span class="task-title${done ? " is-done" : ""}">${taskTitle(entry)}</span>
          ${taskMeta(entry, field)}
        </span>
        ${icon("chevron", "chevron")}
        ${rowMore()}
      </button>
      ${taskColumns(entry)}
    `
  );
}

/* Die blasse Zeile, die nur ganz am Anfang da ist: ein leerer Ring, ein
   grauer Text. Ein Tipp darauf macht daraus die erste echte Zeile. */
function ghostRow() {
  return `
    <button class="task-ghost" type="button" data-task-ghost>
      <span class="task-check task-ghost-ring" aria-hidden="true"></span>
      <span class="task-ghost-label">${ghostLabel}</span>
    </button>
  `;
}

/* Die Überschrift einer Gruppe — nur, wenn gruppiert wird. */
function headMarkup(column, field, key, open) {
  if (!field) return "";
  /* Der Auswahlkreis steht neben dem Knopf, nicht in ihm: zwei Knöpfe ineinander gehen nicht */
  return `
    <h2 class="task-section-head">
      ${groupPickMark(column.items.map((entry) => entry.id))}
      <button class="task-section-toggle" type="button" data-toggle-section="${key}" aria-expanded="${open}">
        ${icon(column.icon, "task-section-icon")}
        <span class="task-section-name">${column.label}</span>
        <span class="task-section-count">${column.items.length || ""}</span>
        ${icon("chevron", "task-section-chevron")}
      </button>
    </h2>
  `;
}

/** Eine Gruppe auf- oder zuklappen, ohne die Seite neu zu zeichnen. */
export function toggleTaskSection(button) {
  const section = button.closest(".task-section");
  if (!section) return;
  const open = section.classList.toggle("is-collapsed") === false;
  button.setAttribute("aria-expanded", String(open));
  if (open) collapsed.delete(button.dataset.toggleSection);
  else collapsed.add(button.dataset.toggleSection);
}

/* Eine Gruppe (oder die ganze Liste): data-section und data-field sagen dem
   Inline-Anlegen, wohin eine neue Aufgabe gehört, wenn hierunter getippt wird. */
function sectionMarkup(prefs, column, field, tail) {
  const rows = column.items.map((entry) => taskRow(entry, field)).join("");
  const key = sectionKey(prefs, column);
  const open = !field || !collapsed.has(key);
  return `
    <section class="task-section${open ? "" : " is-collapsed"}" data-pick-scope data-section="${column.id}" data-field="${field || ""}"${column.locked ? " data-no-add" : ""} style="--col-color:${column.color}">
      ${headMarkup(column, field, key, open)}
      <div class="workspace-list task-rows"${isSelecting() ? "" : ` data-reorder="${listScope}"`}>${rows}${tail}</div>
    </section>
  `;
}

/** Die ganze Liste als HTML: flach — oder die Gruppen der Gliederung untereinander. */
export function taskListMarkup(prefs) {
  const { field, columns } = taskGroups(prefs);
  const empty = columns.every((column) => !column.items.length);
  /* Ohne eine einzige Aufgabe lädt die Geister-Zeile zum Schreiben ein; hat
     nur der Filter alles ausgesiebt, sagt die Liste das in einem Satz (Android: wieder die Zeile). */
  const ghost = isSelecting() ? "" : ghostRow();
  const android = isMobileOs("android");
  const none = !taskEntries().length;
  const filtered = !none && !android;
  /* Android ohne eine Aufgabe: der Platzhalter statt der Geister-Zeile. Der leere
     Abschnitt bleibt stehen, damit ✓+ und ein Tipp in die Fläche dort eine Zeile öffnen. */
  const placeholder = android && none && !isSelecting() ? emptyState(emptyTasks) : "";
  const tail = !empty || placeholder ? "" : filtered ? `<p class="task-empty-note">${emptyFilter}</p>` : ghost;
  return `<div class="task-sections">${columns
    .filter((column, index) => index === 0 || column.items.length)
    .map((column, index) => sectionMarkup(prefs, column, field, index === 0 ? tail : ""))
    .join("")}</div>${placeholder}`;
}
