/*
 * Projekte direkt in der Liste anlegen — wie die Aufgaben
 * (src/features/tasks/tasks-inline.js): ein Tipp in die freie Fläche unter
 * dem letzten Projekt, bis hinunter zur Leiste, lässt dort eine neue Zeile mit
 * Rakete und Cursor erscheinen. Enter legt das Projekt in der gewählten
 * Ansicht an und öffnet gleich die nächste Zeile; eine leere Zeile
 * verschwindet lautlos, sobald man sie verlässt. Gilt auf der Übersicht (am
 * Handy) und auf der Seite Projekte. Nur ein echter Tipp zählt — wer scrollt,
 * schreibt nicht; im Auswahlmodus wählt ein Tipp nur aus.
 * Auch ein Tipp auf „Projekt hinzufügen“ öffnet in der Android-Fassung diese
 * Zeile statt des Eingabefelds; die Zeile hier kennt nur den Titel. In der
 * iOS-Fassung bleibt „Projekt hinzufügen“ der Weg über das Eingabefeld (Ort,
 * Datum, Anhang).
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

import { el } from "../../core/dom.js";
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

/* Die offene Zeile: { row, input, list } — sonst null. */
let editing = null;
/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Solange das Projekt angelegt und die Liste neu gezeichnet wird, bedeutet
   der Fokusverlust der alten Zeile nichts. */
let committing = false;

/* Die Projektliste der sichtbaren Stelle — oder null, wenn dort keine steht. */
function visibleList() {
  if (isViewActive("home") && !isDesk()) return el("project-list")?.querySelector(".workspace-list") || null;
  if (isProjectsPageOpen()) return el("view-page")?.querySelector(".page-body > .workspace-list") || null;
  return null;
}

function removeRow() {
  if (!editing) return;
  const { row, list } = editing;
  editing = null;
  row.remove();
  list.classList.remove("is-adding");
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
  committing = true;
  editing = null;
  createProjectInline(title, state.activeProjectViewId);
  committing = false;
  if (!chain) return;
  const list = visibleList();
  if (list) openRow(list);
}

/* Eine leere Zeile ans Ende der Liste, vor „Projekt hinzufügen“, mit Cursor. */
function openRow(list) {
  if (editing) return;
  const row = document.createElement("div");
  row.className = "workspace-row project-inline";
  /* form: gegen Chromes Verlaufs-Chips über der Tastatur (src/core/no-history.js);
     enterkeyhint: die Enter-Taste heißt „Fertig“, nicht „Weiter“ */
  /* row-glyph: dieselbe Icon-Fläche wie in den Zeilen darüber, sonst rückt der Cursor näher ans Icon */
  row.innerHTML = `
    <span class="row-glyph">${icon("rocket")}</span>
    <input class="task-inline-input" type="text" form="${noHistoryForm}" enterkeyhint="done"
      placeholder="${placeholder}" aria-label="${placeholder}" />`;
  list.insertBefore(row, list.querySelector(".workspace-add"));
  list.classList.add("is-adding");
  const input = row.querySelector("input");
  editing = { row, input, list };
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
  if (!list) return;
  const target = event.target;
  if (target.closest("button, a, input, [data-grip], .swipe, .view-panel, .tab-pills-row")) return;
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  if (event.clientY < list.getBoundingClientRect().bottom) return;
  openRow(list);
}

/* Tipp auf „Projekt hinzufügen“ in der Liste (Android): die Zeile öffnet sich
   direkt. Aufgefangen wird in der Aufnahmephase, damit der Zuhörer, der sonst
   das Eingabefeld öffnet (project-views.js), nicht mehr drankommt. */
function onAddRowClick(event) {
  const add = event.target.closest(".workspace-add[data-project-add]");
  if (!add || !isMobileOs("android")) return;
  const list = visibleList();
  if (!list?.contains(add)) return;
  down = null;
  event.stopPropagation();
  openRow(list);
}

/** Das Anlegen per Tipp auf Übersicht und Seite Projekte einschalten. */
export function initProjectInline() {
  ["view-home", "view-page"].forEach((id) => {
    const view = el(id);
    view.addEventListener("pointerdown", onPointerDown);
    view.addEventListener("click", onAddRowClick, true);
    view.addEventListener("click", onClick);
  });
}
