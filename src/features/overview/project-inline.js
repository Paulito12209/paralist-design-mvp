/*
 * Projekte direkt in der Liste anlegen — wie die Aufgaben
 * (src/features/tasks/tasks-inline.js): ein Tipp in die freie Fläche unter
 * dem letzten Projekt, bis hinunter zur Leiste, lässt dort eine neue Zeile mit
 * Rakete und Cursor erscheinen. Enter legt das Projekt in der gewählten
 * Ansicht an und öffnet gleich die nächste Zeile; eine leere Zeile
 * verschwindet lautlos, sobald man sie verlässt. Gilt auf der Übersicht (am
 * Handy) und auf der Seite Projekte. Nur ein echter Tipp zählt — wer scrollt,
 * schreibt nicht; im Auswahlmodus wählt ein Tipp nur aus.
 * Android: auch ein Tipp auf die blasse Zeile „Projekt hinzufügen“ öffnet diese
 * Zeile statt des Eingabefelds — in der leeren Liste unter dem letzten Platz und
 * im Board in der leeren Spalte, in der sie steht (src/features/overview/projects-board.js);
 * das Projekt bekommt dann Status bzw. Dringlichkeit dieser Spalte. Ebenso ein Tipp
 * in die freie Fläche des Boards: unter den Projekten einer Spalte oder unter dem
 * ganzen Board bis hinunter zur Leiste — die Zeile kommt in die Spalte, über der
 * der Finger steht. Die Zeile hier
 * kennt nur den Titel. In der iOS-Fassung bleibt „Projekt hinzufügen“ der Weg
 * über das Eingabefeld (Ort, Datum, Anhang).
 * Pfad: src/features/overview/project-inline.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TAP_SLOP_PX -> so weit darf der Finger beim Tippen wandern; wer weiter zieht,
 *                scrollt und bekommt keine neue Zeile
 * placeholder -> grauer Text in der noch leeren Zeile
 *
 * Aussehen: die Zeile ist eine gewöhnliche Projektzeile (styles/rows.css), das
 * Feld darin sieht aus wie das der Aufgaben (styles/tasks.css, .task-inline-input).
 */

import { dom, el } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { noHistoryForm } from "../../core/no-history.js";
import { createProjectInline } from "../../data/mutations-tasks.js";
import { state } from "../../data/state.js";
import { isDesk } from "../../ui/desk-mode.js";
import { isMobileOs } from "../../ui/platform.js";
import { isViewActive } from "../../ui/views.js";
import { isProjectsPageOpen } from "./project-views.js";

const TAP_SLOP_PX = 20;
const placeholder = "Neues Projekt";

/* Die offene Zeile: { row, input, list, column } — sonst null. `list` ist die
   Liste bzw. der Zeilenbereich der Spalte; `column` ({ field, value }) nur im Board. */
let editing = null;
/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Solange das Projekt angelegt und die Liste neu gezeichnet wird, bedeutet
   der Fokusverlust der alten Zeile nichts. */
let committing = false;

/* Die Projektliste der sichtbaren Stelle — oder null, wenn dort keine steht. */
function visibleList() {
  if (isViewActive("home") && !isDesk()) return el("project-list")?.querySelector(".workspace-list:not([data-home-list])") || null;
  if (isProjectsPageOpen()) return el("view-page")?.querySelector(".page-body > .workspace-list") || null;
  return null;
}

/* Das Board der sichtbaren Stelle (Ansicht als Board) — oder null. */
function visibleBoard() {
  if (isViewActive("home") && !isDesk()) return el("project-list")?.querySelector(".project-board") || null;
  if (isProjectsPageOpen()) return el("view-page")?.querySelector(".page-body > .project-board") || null;
  return null;
}

/* Die Spalte, über der der Finger steht — nur unterhalb ihrer Kopfzeile. */
function columnAt(board, x, y) {
  return [...board.querySelectorAll(".board-col")].find((col) => {
    const rect = col.getBoundingClientRect();
    return x >= rect.left && x < rect.right && y >= col.querySelector(".board-head").getBoundingClientRect().bottom;
  }) || null;
}

/* Das Gehäuse, das „is-adding“ trägt: die Liste selbst, im Board die Spalte
   (dort versteckt es die blasse Zeile, styles/tasks-board.css). */
function hostOf(list) {
  return list.closest(".board-col") || list;
}

function removeRow() {
  if (!editing) return;
  const { row, list } = editing;
  editing = null;
  row.remove();
  hostOf(list).classList.remove("is-adding");
}

/* Abschließen: mit Titel entsteht das Projekt (die Liste zeichnet neu, die
   Zeile ist damit weg); `chain` öffnet danach gleich die nächste Zeile. */
function commitRow(chain) {
  if (!editing || committing) return;
  const title = editing.input.value.trim();
  if (!title) {
    removeRow();
    return;
  }
  const { column } = editing;
  committing = true;
  editing = null;
  createProjectInline(title, state.activeProjectViewId, column);
  committing = false;
  if (!chain) return;
  /* Im Board gleich die nächste Zeile in derselben Spalte (die Liste ist neu gezeichnet) */
  const list = column ? boardRows(column) : visibleList();
  if (list) openRow(list, column);
}

/* Der Zeilenbereich der Spalte, die den Wert `column.value` trägt — in der sichtbaren Liste. */
function boardRows(column) {
  const host = isViewActive("home") ? el("project-list") : el("view-page");
  return host?.querySelector(`.board-rows[data-drop="${column.value}"]`) || null;
}

/* Eine leere Zeile ans Ende der Liste bzw. der Spalte (iOS: vor „Projekt hinzufügen“), mit Cursor. */
function openRow(list, column = null) {
  if (editing) return;
  const row = document.createElement("div");
  row.className = column ? "board-row project-inline" : "workspace-row project-inline";
  /* form: gegen Chromes Verlaufs-Chips über der Tastatur (src/core/no-history.js);
     enterkeyhint: die Enter-Taste heißt „Fertig“, nicht „Weiter“ */
  /* row-glyph: dieselbe Icon-Fläche wie in den Zeilen darüber, sonst rückt der Cursor näher ans Icon;
     im Board dasselbe kleine Icon wie vor den Projekten dort (styles/projects-board.css) */
  const glyph = column ? icon("rocket", "board-row-icon") : `<span class="row-glyph">${icon("rocket")}</span>`;
  row.innerHTML = `
    ${glyph}
    <input class="task-inline-input" type="text" form="${noHistoryForm}" enterkeyhint="done"
      placeholder="${placeholder}" aria-label="${placeholder}" />`;
  list.insertBefore(row, list.querySelector(".workspace-add"));
  hostOf(list).classList.add("is-adding");
  const input = row.querySelector("input");
  editing = { row, input, list, column };
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

/* Tipp in die freie Fläche: nur unterhalb der Liste, nie auf einen Knopf. */
function onClick(event) {
  const start = down;
  down = null;
  if (!start || start.wasEditing || editing) return;
  if (document.body.classList.contains("is-selecting")) return;
  const list = visibleList();
  const board = list ? null : visibleBoard();
  if (!list && !board) return;
  const target = event.target;
  if (target.closest("button, a, input, [data-grip], .swipe, .view-panel, .tab-pills-row, .board-row, .project-card-head")) return;
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  if (board) {
    /* Board: in der Spalte unter dem Finger, mit ihrem Status bzw. ihrer Dringlichkeit */
    const box = columnAt(board, event.clientX, event.clientY)?.querySelector(".board-rows");
    if (box) openRow(box, { field: box.dataset.field, value: box.dataset.drop });
    return;
  }
  if (event.clientY < list.getBoundingClientRect().bottom) return;
  openRow(list);
}

/* Tipp auf die blasse Zeile „Projekt hinzufügen“ (Android): die Eingabezeile öffnet
   sich direkt. In der Liste hängt sie an „Projekt hinzufügen“, im Board an der
   leeren Spalte. Aufgefangen wird in der Aufnahmephase, damit der Zuhörer, der sonst
   das Eingabefeld öffnet (project-views.js), nicht mehr drankommt. */
function onAddRowClick(event) {
  if (!isMobileOs("android") || editing) return;
  const inColumn = event.target.closest("[data-board-add]");
  const add = inColumn || event.target.closest(".workspace-add[data-project-add]");
  if (!add) return;
  if (inColumn) {
    const box = inColumn.closest(".board-rows");
    /* Dieselbe blasse Zeile gibt es im Board der Aufgaben — das gehört dem Aufgaben-Empfänger */
    if (!box?.closest(".project-board")) return;
    down = null;
    event.stopPropagation();
    openRow(box, { field: box.dataset.field, value: box.dataset.drop });
    return;
  }
  const list = visibleList();
  if (!list?.contains(add)) return;
  down = null;
  event.stopPropagation();
  openRow(list);
}

/** Das Anlegen per Tipp auf Übersicht und Seite Projekte einschalten.
    Die Zuhörer hängen am ganzen Scrollbereich, nicht an der Seite: ist die
    Liste kurz, endet die Seite über dem Polster für Plus-Knopf und Leiste
    (--m3-content-end, styles/android.css) — auch ein Tipp dorthin soll zählen. */
export function initProjectInline() {
  const content = dom.content;
  content.addEventListener("pointerdown", onPointerDown);
  content.addEventListener("click", onAddRowClick, true);
  content.addEventListener("click", onClick);
}
