/*
 * Die Karten der Aufgaben-Seite in der rechten Spalte am Desktop: „Stand“ mit
 * vier Zahlen (offen, heute fällig, überfällig, ohne Datum), die offenen
 * Aufgaben nach Dringlichkeit als Balken und „Demnächst fällig“ zum direkten
 * Abhaken. „Ansicht konfigurieren“ kommt in Schritt 6 des Desktop-Plans dazu.
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

import { dayKey } from "../../core/dates.js";
import { formatNumber } from "../../core/format.js";
import { escapeHtml } from "../../core/html.js";
import { isTaskDone, taskPriorities, taskPriorityOf } from "../../data/config.js";
import { taskEntries } from "../../data/queries.js";
import { cardHead, createPill, railTaskRow } from "../../ui/rail-parts.js";

const dueLimit = 5;

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

/** Die Plätze der Spalte auf der Aufgaben-Seite (Aufbau wie in src/shell/desk-rail.js). */
export const railCards = [
  { name: "status", className: "rail-card", render: statusCard },
  { name: "priority", className: "rail-card", render: priorityCard },
  { name: "due", className: "rail-card rail-tasks", render: dueCard },
];
