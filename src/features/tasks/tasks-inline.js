/*
 * Aufgaben direkt in der Liste anlegen — so, wie man es von Erinnerungen
 * kennt: Ein Tipp in die freie Fläche der Seite lässt am Ende der Liste (bzw.
 * der Gruppe, unter der man getippt hat) eine neue Zeile mit leerem Ring und
 * Cursor erscheinen. Enter legt die Aufgabe an und öffnet gleich die nächste Zeile;
 * eine leere Zeile verschwindet lautlos, sobald man sie verlässt. Im Board
 * gilt dasselbe je Spalte. Nur ein echter Tipp zählt: wer scrollt oder wischt,
 * schreibt nicht — dieselbe Regel wie in src/ui/write-tap.js.
 *
 * Das Eingabefeld unten bleibt der Weg für alles Weitere (Datum, Ort, Anhang);
 * die Zeile hier kennt nur den Titel.
 * Pfad: src/features/tasks/tasks-inline.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TAP_SLOP_PX  -> so weit darf der Finger beim Tippen wandern; wer weiter
 *                 zieht, scrollt und bekommt keine neue Zeile
 * placeholder  -> grauer Text in der noch leeren Zeile
 *
 * Aussehen der Zeile: styles/tasks.css (.task-inline).
 */

import { el } from "../../core/dom.js";
import { noHistoryForm } from "../../core/no-history.js";
import { createTaskInline } from "../../data/mutations.js";
import { isViewActive } from "../../ui/views.js";

const TAP_SLOP_PX = 20;
const placeholder = "Neue Aufgabe";

/* Die offene Zeile: { row, input, column } — sonst null. */
let editing = null;
/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Solange die Aufgabe angelegt und die Seite neu gezeichnet wird, bedeutet
   der Fokusverlust der alten Zeile nichts. */
let committing = false;

/* Welcher Abschnitt zu einer Tipp-Stelle gehört: in der Liste der letzte,
   dessen Oberkante über dem Finger liegt — eine Zeile erscheint also immer
   direkt unter dem, was man gerade ansieht. Im Board die angetippte Spalte. */
function sectionAt(target, y) {
  const column = target.closest(".board-col");
  if (column) return column;
  if (target.closest(".board")) return null;
  const sections = [...el("tasks-body").querySelectorAll(".task-section")];
  let pick = sections[0] || null;
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= y) pick = section;
  });
  return pick;
}

/* Die leere Zeile wieder entfernen — ohne Aufgabe. */
function removeRow() {
  if (!editing) return;
  const { row, section } = editing;
  editing = null;
  row.remove();
  section.classList.remove("is-adding");
}

/*
 * Die Zeile abschließen. Steht ein Titel darin, wird die Aufgabe angelegt —
 * das zeichnet die Seite neu, die Zeile ist damit weg. `chain` öffnet danach
 * gleich die nächste Zeile im selben Abschnitt (Enter); ohne `chain` (Feld
 * verlassen) bleibt es bei der einen.
 */
function commitRow(chain) {
  if (!editing || committing) return;
  const { input, column, section } = editing;
  const title = input.value.trim();
  if (!title) {
    removeRow();
    return;
  }
  committing = true;
  const id = section.dataset.section;
  editing = null;
  createTaskInline(title, column);
  committing = false;
  if (!chain) return;
  const next = el("tasks-body").querySelector(`[data-section="${id}"]`);
  if (next) openRow(next);
}

/** Eine neue leere Zeile am Ende des Abschnitts öffnen und den Cursor hineinsetzen. */
function openRow(section) {
  if (editing) return;
  const box = section.querySelector(".task-rows, .board-rows");
  if (!box) return;
  const board = section.classList.contains("board-col");
  const row = document.createElement("div");
  row.className = `task-inline${board ? " board-row" : ""}`;
  /* form: gegen Chromes Verlaufs-Chips über der Tastatur (src/core/no-history.js);
     enterkeyhint: die Enter-Taste soll „Fertig“ heißen, nicht „Weiter“.
     Die untere Leiste weicht der Tastatur wie bei jedem Feld auf der Seite
     (src/shell/writing.js). */
  row.innerHTML = `
    <span class="task-check task-inline-ring" aria-hidden="true"></span>
    <input class="task-inline-input" type="text" form="${noHistoryForm}" enterkeyhint="done"
      placeholder="${placeholder}" aria-label="${placeholder}" />
  `;
  box.append(row);
  section.classList.add("is-adding");
  const input = row.querySelector("input");
  /* In der ungruppierten Liste (kein Feld) bekommt die Aufgabe nur die Vorgaben. */
  const { field } = section.dataset;
  editing = { row, input, section, column: field ? { field, value: section.dataset.section } : null };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRow(true);
    } else if (event.key === "Escape") {
      removeRow();
    }
  });
  input.addEventListener("blur", () => commitRow(false));
  input.focus();
}

function onPointerDown(event) {
  down = { x: event.clientX, y: event.clientY, wasEditing: Boolean(editing) };
}

/* Tipp in die freie Fläche: die Zeile kommt in den Abschnitt darüber. */
function onClick(event) {
  const start = down;
  down = null;
  if (!start || !isViewActive("tasks")) return;
  const target = event.target;
  const ghost = target.closest("[data-task-ghost]");
  /* Ein Tipp während des Schreibens hat nur die Zeile abgeschlossen. */
  if (start.wasEditing || editing) return;
  if (!ghost) {
    /* Zeilen, Knöpfe, Griffe und Wisch-Knöpfe haben ihre eigene Bedeutung. */
    if (target.closest("button, a, input, [data-grip], .swipe-actions, .board-row, .board-head, .tasks-tools")) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  }
  const section = ghost ? el("tasks-body").querySelector(".task-section") : sectionAt(target, event.clientY);
  if (section) openRow(section);
}

/** Das Anlegen in der Liste einschalten — ein Empfänger für die ganze Seite. */
export function initTaskInline() {
  const view = el("view-tasks");
  view.addEventListener("pointerdown", onPointerDown);
  view.addEventListener("click", onClick);
}
