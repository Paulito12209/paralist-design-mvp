/*
 * Einträge direkt in der Kalenderliste anlegen — wie auf den Seiten Aufgaben
 * (src/features/tasks/tasks-inline.js) und Projekte: ein Tipp in die freie
 * Fläche unter den Reitern lässt eine neue Zeile mit Cursor erscheinen, am
 * leeren Tag an Stelle des Platzhalters. Auch die Pille im Platzhalter öffnet
 * diese Zeile statt des Eingabefelds. Enter legt den Eintrag am gewählten Tag
 * an und öffnet die nächste Zeile; eine leere Zeile verschwindet lautlos,
 * sobald man sie verlässt. Was entsteht, bestimmt die gewählte Spalte
 * (Aufgabe, Termin oder Projekt). Nur ein echter Tipp zählt — wer scrollt,
 * schreibt nicht.
 * Pfad: src/features/calendar/calendar-inline.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * TAP_SLOP_PX -> so weit darf der Finger beim Tippen wandern; wer weiter zieht,
 *                scrollt und bekommt keine neue Zeile
 * placeholders -> grauer Text in der noch leeren Zeile je Spalte
 *
 * Aussehen: styles/tasks.css (.task-inline), styles/rows.css (.workspace-row)
 * und styles/calendar-panel.css (.is-adding blendet den Platzhalter aus).
 */

import { dom } from "../../core/dom.js";
import { icon } from "../../core/html.js";
import { noHistoryForm } from "../../core/no-history.js";
import { calendarSegments } from "../../data/config-calendar.js";
import { createCalendarEntryInline } from "../../data/mutations-calendar.js";
import { state, ui } from "../../data/state.js";
import { isViewActive } from "../../ui/views.js";

const TAP_SLOP_PX = 20;
const placeholders = { aufgabe: "Neue Aufgabe", termin: "Neuer Termin", projekt: "Neues Projekt" };

/* Die offene Zeile: { row, input, list, type } — sonst null. */
let editing = null;
/* Wie es beim Aufsetzen des Fingers war — der Klick kommt erst nach dem Loslassen. */
let down = null;
/* Solange der Eintrag angelegt und die Liste neu gezeichnet wird, bedeutet
   der Fokusverlust der alten Zeile nichts. */
let committing = false;

function currentSegment() {
  return calendarSegments.find((item) => item.id === state.prefs.calendar.seg) || calendarSegments[0];
}

/* Die Liste der Einträge — am leeren Tag gibt es sie nicht, dann entsteht sie hier. */
function listOf(panel) {
  let list = panel.querySelector(".workspace-list");
  if (!list) {
    list = document.createElement("div");
    list.className = "workspace-list";
    panel.querySelector(".cal-seg").after(list);
  }
  return list;
}

function removeRow() {
  if (!editing) return;
  const { row, list } = editing;
  editing = null;
  row.remove();
  /* Eine selbst angelegte, nun wieder leere Liste mit entfernen */
  if (!list.children.length) list.remove();
  dom.calPanel.classList.remove("is-adding");
}

/* Mit Titel entsteht der Eintrag (die Liste zeichnet neu, die Zeile ist weg);
   `chain` öffnet danach gleich die nächste Zeile. */
function commitRow(chain) {
  if (!editing || committing) return;
  const { input, type } = editing;
  const title = input.value.trim();
  if (!title) {
    removeRow();
    return;
  }
  committing = true;
  editing = null;
  dom.calPanel.classList.remove("is-adding");
  createCalendarEntryInline(type, title, ui.calendarDay);
  committing = false;
  if (chain) openRow();
}

/* Eine leere Zeile ans Ende der Liste, mit Cursor. */
function openRow() {
  const panel = dom.calPanel;
  if (editing || !panel.querySelector(".cal-seg")) return;
  const { pick: type, icon: glyph } = currentSegment();
  const list = listOf(panel);
  const row = document.createElement("div");
  /* form: gegen Chromes Verlaufs-Chips über der Tastatur (src/core/no-history.js);
     enterkeyhint: die Enter-Taste heißt „Fertig“, nicht „Weiter“ */
  row.className = type === "aufgabe" ? "task-inline" : "workspace-row project-inline";
  const lead =
    type === "aufgabe"
      ? `<span class="task-check task-inline-ring" aria-hidden="true"></span>`
      : `<span class="row-glyph">${icon(glyph)}</span>`;
  row.innerHTML = `${lead}
    <input class="task-inline-input" type="text" form="${noHistoryForm}" enterkeyhint="done"
      placeholder="${placeholders[type]}" aria-label="${placeholders[type]}" />`;
  list.append(row);
  panel.classList.add("is-adding");
  const input = row.querySelector("input");
  editing = { row, input, list, type };
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

/* Die Pille im Platzhalter öffnet die Zeile statt des Eingabefelds. Aufgefangen
   wird in der Aufnahmephase, damit der Empfänger der Listen (src/ui/list-clicks.js) nicht drankommt. */
function onPillClick(event) {
  if (!isViewActive("calendar") || !event.target.closest(".cal-empty .empty-add")) return;
  down = null;
  event.stopPropagation();
  if (!editing) openRow();
}

/* Tipp in die freie Fläche unter den Reitern: Zeilen, Knöpfe und der Kopf haben ihre eigene Bedeutung. */
function onClick(event) {
  const start = down;
  down = null;
  if (!start || start.wasEditing || editing || !isViewActive("calendar")) return;
  const seg = dom.calPanel.querySelector(".cal-seg");
  if (!seg || event.clientY <= seg.getBoundingClientRect().bottom) return;
  if (event.target.closest("button, a, input, .workspace-row, .task-row, .swipe-actions, .cal-head")) return;
  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP_PX) return;
  openRow();
}

/** Das Anlegen per Tipp in der Kalenderliste einschalten — Zuhörer am ganzen Scrollbereich. */
export function initCalendarInline() {
  dom.content.addEventListener("pointerdown", onPointerDown);
  dom.content.addEventListener("click", onPillClick, true);
  dom.content.addEventListener("click", onClick);
}
