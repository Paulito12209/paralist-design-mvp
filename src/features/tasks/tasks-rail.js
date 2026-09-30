/*
 * Die Karten der Aufgaben-Seite in der rechten Spalte am Desktop: oben
 * „Ansicht“ (dieselben Zeilen wie die Karte unten am Handy,
 * src/features/tasks/tasks-settings.js), darunter die Details der markierten
 * Aufgabe — markiert ist die Zeile unter der Maus oder mit dem
 * Tastatur-Fokus —, „Stand“ mit vier Zahlen, die offenen Aufgaben nach
 * Dringlichkeit als Balken und „Demnächst fällig“ zum direkten Abhaken.
 * Geladen über registerRailCards in src/main.js.
 * Pfad: src/features/tasks/tasks-rail.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * dueLimit -> wie viele Aufgaben „Demnächst fällig“ höchstens zeigt
 *
 * Aussehen in styles/desk-rail-views.css, die Farben der Dringlichkeit in
 * src/data/config.js (taskPriorities).
 */

import { emit, events } from "../../core/bus.js";
import { dayKey } from "../../core/dates.js";
import { dom } from "../../core/dom.js";
import { formatNumber, shortDay } from "../../core/format.js";
import { escapeHtml, icon } from "../../core/html.js";
import { isTaskDone, taskPriorities, taskPriorityOf, taskStatusOf } from "../../data/config-tasks.js";
import { findEntry, placesLabel, taskEntries } from "../../data/queries.js";
import { activeTaskView } from "../../data/task-views.js";
import { cardHead, createPill, railTaskRow, railTitle } from "../../ui/rail-parts.js";
import { handleSettingsClick, taskSettingsMarkup } from "./tasks-settings.js";

const dueLimit = 5;

/* Zeilen, die eine Aufgabe tragen: in der Liste und im Board. */
const ROWS = "[data-open-entry], [data-board-row]";

/* Die markierte Aufgabe (ihre Nummer) oder null. */
let marked = null;

function openTasks() {
  return taskEntries().filter((entry) => !isTaskDone(entry));
}

/* Eine Zahl mit Beschriftung darunter; `tone` färbt Überfälliges. */
function stat(value, label, tone = "") {
  return `<div class="rail-stat${tone}"><span class="rail-stat-num">${formatNumber(value)}</span><span class="rail-muted">${label}</span></div>`;
}

/** Karte „Stand“: vier Zahlen über alle offenen Aufgaben. */
function statusCard() {
  const open = openTasks();
  const todayKey = dayKey(new Date());
  const today = open.filter((entry) => entry.date === todayKey).length;
  const late = open.filter((entry) => entry.date && entry.date < todayKey).length;
  const undated = open.filter((entry) => !entry.date).length;
  return `
    ${cardHead("Stand")}
    <div class="rail-stats">
      ${stat(open.length, "offen")}
      ${stat(today, "heute fällig")}
      ${stat(late, "überfällig", late ? " is-late" : "")}
      ${stat(undated, "ohne Datum")}
    </div>`;
}

/** Karte „Dringlichkeit“: je Stufe ein Balken, so lang wie ihr Anteil an allem Offenen. */
function priorityCard() {
  const open = openTasks();
  if (!open.length) return "";
  const counts = new Map(taskPriorities.map((prio) => [prio.id, 0]));
  open.forEach((entry) => {
    const id = taskPriorityOf(entry.priority).id;
    counts.set(id, counts.get(id) + 1);
  });
  const rows = taskPriorities
    .map((prio) => {
      const count = counts.get(prio.id);
      const share = Math.round((count / open.length) * 100);
      /* --share und --tone: Länge und Farbe des Balkens, gelesen von styles/desk-rail-views.css */
      return `
        <li class="rail-bar-row" aria-label="${escapeHtml(prio.label)}: ${formatNumber(count)}">
          <span class="rail-bar-label">${escapeHtml(prio.label)}</span>
          <span class="rail-bar" style="--share:${share}%;--tone:${prio.color}"></span>
          <span class="rail-bar-num">${formatNumber(count)}</span>
        </li>`;
    })
    .join("");
  return `${cardHead("Dringlichkeit")}<ul class="rail-bars">${rows}</ul>`;
}

/** Karte „Demnächst fällig“: offene Aufgaben mit Datum, die früheste zuerst — abhakbar. */
function dueCard() {
  const due = openTasks()
    .filter((entry) => entry.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, dueLimit);
  const body = due.length
    ? `<ul class="rail-task-list">${due.map(railTaskRow).join("")}</ul>`
    : `<p class="rail-empty">Nichts mit Datum.</p>${createPill('data-rail="create" data-pick="aufgabe"', "Aufgabe anlegen")}`;
  return cardHead("Demnächst fällig") + body;
}

/** Karte „Ansicht“: die Einstellungen der gewählten Ansicht. */
function viewCard() {
  return cardHead("Ansicht") + taskSettingsMarkup(activeTaskView());
}

/* Zwei Spalten „Angabe | Wert“; leere Werte fallen weg. */
function facts(pairs) {
  return `<div class="rail-facts">${pairs
    .filter(([, value]) => value)
    .map(([label, value]) => `<span class="rail-muted">${label}</span><span>${escapeHtml(value)}</span>`)
    .join("")}</div>`;
}

/** Karte „Details“ der markierten Aufgabe — leer (und ausgeblendet), solange keine markiert ist. */
function detailsCard() {
  const entry = marked && findEntry(marked);
  if (!entry || entry.type !== "aufgabe") return "";
  const id = escapeHtml(entry.id);
  const done = isTaskDone(entry);
  const open = `<button class="rail-pill rail-head-end" type="button" data-rail="entry" data-id="${id}">Öffnen${icon("arrow-right")}</button>`;
  return `
    ${cardHead("Details", open)}
    <div class="rail-preview">${icon("task", "rail-preview-icon")}<h3 class="rail-preview-title">${railTitle(entry)}</h3></div>
    ${facts([
      ["Status", taskStatusOf(entry.status).label],
      ["Fällig", entry.date ? shortDay(entry.date) : "ohne Datum"],
      ["Dringlichkeit", taskPriorityOf(entry.priority).label],
      ["Ablageort", placesLabel(entry)],
    ])}
    ${done ? "" : `<button class="rail-pill" type="button" data-rail="done" data-id="${id}">${icon("check")}Erledigen</button>`}`;
}

/** Die Plätze der Spalte auf der Aufgaben-Seite (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [
  { name: "view", className: "rail-card rail-view-card", render: viewCard },
  { name: "details", className: "rail-card", render: detailsCard },
  { name: "status", className: "rail-card", render: statusCard },
  { name: "priority", className: "rail-card", render: priorityCard },
  { name: "due", className: "rail-card rail-tasks", render: dueCard },
];

/** Klicks auf die Schalter von „Ansicht“ — derselbe Weg wie in der Karte am Handy. */
export function railClick(event) {
  if (!event.target.closest("[data-settings]")) return false;
  handleSettingsClick(event, activeTaskView());
  return true;
}

/* Zeile markieren: getönt in der Liste und rechts als Details. */
function onPointer(event) {
  const row = event.target.closest?.(ROWS);
  if (!row) return;
  const id = row.dataset.openEntry || row.dataset.boardRow;
  if (id === marked) return;
  dom.tasksBody.querySelector(".is-marked")?.classList.remove("is-marked");
  row.classList.add("is-marked");
  marked = id;
  emit(events.contextChanged);
}

/* Einmal beim Laden: Maus und Tastatur-Fokus markieren Aufgaben. */
dom.tasksBody.addEventListener("pointerover", onPointer);
dom.tasksBody.addEventListener("focusin", onPointer);
