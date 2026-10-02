/*
 * Aufgaben direkt in der Liste anlegen — so, wie man es von Erinnerungen
 * kennt: Ein Tipp in die freie Fläche der Seite lässt am Ende der Liste (bzw.
 * der Gruppe, unter der man getippt hat) eine neue Zeile mit leerem Ring und
 * Cursor erscheinen. Enter legt die Aufgabe an und öffnet gleich die nächste Zeile;
 * eine leere Zeile verschwindet lautlos, sobald man sie verlässt. Im Board
 * gilt dasselbe je Spalte — auch für die Fläche unter den Zeilen, die zu
 * der Spalte darüber gehört. Nur ein echter Tipp zählt: wer scrollt oder wischt,
 * schreibt nicht — dieselbe Regel wie in src/ui/write-tap.js.
 *
 * Der runde Knopf ✓+ oben rechts (tasks-views.js) öffnet dieselbe Zeile —
 * am Ende der Liste bzw. der ersten Gruppe, im Board in der ersten Spalte —
 * und scrollt dorthin: bei einer langen Liste muss man dafür nicht erst
 * nach unten.
 *
 * Auch ein Tipp auf die blasse Zeile in einer leeren Board-Spalte (Android,
 * tasks-board.js) öffnet die Zeile in genau dieser Spalte.
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
 * ROW_SCROLL_SHARE -> wo die neue Zeile nach einem Tipp auf ✓+ steht, gemessen
 *                 von oben (0.3 = im oberen Drittel, über der Tastatur)
 *
 * Aussehen der Zeile: styles/tasks.css (.task-inline).
 */

import { dom, el } from "../../core/dom.js";
import { noHistoryForm } from "../../core/no-history.js";
import { createTaskInline } from "../../data/mutations-tasks.js";
import { isViewActive } from "../../ui/views.js";
import { isSelecting } from "./tasks-pick.js";

const TAP_SLOP_PX = 20;
const placeholder = "Neue Aufgabe";
const ROW_SCROLL_SHARE = 0.3;

/* Die offene Zeile: { row, input, column } — sonst null. */
let editing = null;
/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Solange die Aufgabe angelegt und die Seite neu gezeichnet wird, bedeutet
   der Fokusverlust der alten Zeile nichts. */
let committing = false;

/* Welcher Abschnitt zu einer Tipp-Stelle gehört: in der Liste der letzte,
   dessen Oberkante über dem Finger liegt — eine Zeile erscheint also immer
   direkt unter dem, was man gerade ansieht. Im Board die angetippte Spalte;
   unter den Spalten (das Board reicht bis zur Karte „Ansicht“) die, unter
   der der Finger steht. */
function sectionAt(target, x, y) {
  const column = target.closest(".board-col");
  if (column) return column;
  const board = target.closest(".board");
  if (board) {
    const columns = [...board.querySelectorAll(".board-col:not([data-no-add])")];
    return columns.find((col) => {
      const rect = col.getBoundingClientRect();
      return x >= rect.left && x < rect.right;
    }) || null;
  }
  /* Unter „Archiviert“ entsteht nichts Neues — der Tipp gilt dem Abschnitt davor */
  const sections = [...el("tasks-body").querySelectorAll(".task-section:not([data-no-add])")];
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
function openRow(section, reveal = false) {
  if (editing || section.hasAttribute("data-no-add")) return;
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
  if (!reveal) {
    input.focus();
    return;
  }
  /* Selbst scrollen statt dem Browser das Scrollen beim Fokus zu überlassen:
     der legt die Zeile an den unteren Rand — hinter Navigation und Tastatur. */
  input.focus({ preventScroll: true });
  const content = dom.content;
  const top = content.scrollTop + row.getBoundingClientRect().top - content.getBoundingClientRect().top;
  content.scrollTo({ top: Math.max(0, top - content.clientHeight * ROW_SCROLL_SHARE), behavior: "smooth" });
  row.closest(".board")?.scrollTo({ left: 0, behavior: "smooth" });
}

/** Knopf ✓+: dieselbe Zeile wie ein Tipp in die Liste, im ersten Abschnitt. */
export function startTaskRow() {
  const section = el("tasks-body").querySelector(".task-section, .board-col");
  if (section) openRow(section, true);
}

function onPointerDown(event) {
  down = { x: event.clientX, y: event.clientY, wasEditing: Boolean(editing) };
}

/* Tipp in die freie Fläche: die Zeile kommt in den Abschnitt darüber. */
function onClick(event) {
  const start = down;
  down = null;
  /* Im Auswahlmodus wählt ein Tipp nur aus — er legt nichts an */
  if (!start || !isViewActive("tasks") || isSelecting()) return;
  const target = event.target;
  /* Die blasse Zeile der Liste und die der leeren Board-Spalte (Android) */
  const ghost = target.closest("[data-task-ghost], [data-board-add]");
  /* Ein Tipp während des Schreibens hat nur die Zeile abgeschlossen. */
  if (start.wasEditing || editing) return;
  if (!ghost) {
    /* Zeilen, Knöpfe, Griffe und Wisch-Knöpfe haben ihre eigene Bedeutung. */
    if (target.closest("button, a, input, [data-grip], .swipe-actions, .board-row, .board-head, .tasks-tools, .project-card-head")) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  }
  const section = ghost
    ? ghost.closest("[data-section]") || el("tasks-body").querySelector(".task-section")
    : sectionAt(target, event.clientX, event.clientY);
  if (section) openRow(section);
}

/** Das Anlegen in der Liste einschalten — ein Empfänger für die ganze Seite. */
export function initTaskInline() {
  const view = el("view-tasks");
  view.addEventListener("pointerdown", onPointerDown);
  view.addEventListener("click", onClick);
}
