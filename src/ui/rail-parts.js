/*
 * Gemeinsame Bausteine der Karten in der Kontextspalte rechts am Desktop:
 * Kopfzeile, Anlegen-Pille, Aufgabenzeile mit Haken. Die Übersicht
 * (src/shell/desk-rail-cards.js) und die Karten der einzelnen Bereiche
 * (src/features/<bereich>/<bereich>-rail.js) bauen daraus ihr HTML, damit
 * alle Karten gleich aussehen. Nur Markup — was ein Klick auslöst, steht am
 * Knopf als data-rail="…" und entscheidet src/shell/desk-rail.js.
 * Pfad: src/ui/rail-parts.js
 *
 * Keine anpassbaren visuellen Werte: Aussehen und Größen stehen in
 * styles/desk-rail.css, die Karten der Bereiche in styles/desk-rail-views.css.
 */

import { shortDay } from "../core/format.js";
import { escapeHtml, icon } from "../core/html.js";
import { taskPriorityOf } from "../data/config.js";

/** Titel für die Ausgabe: immer abgesichert, ein leerer Titel bekommt einen Platzhalter. */
export function railTitle(entry) {
  return escapeHtml(entry.title || "Ohne Titel");
}

/** Kopfzeile einer Karte: Titel links, rechts ein Chip oder eine Pille. */
export function cardHead(title, end = "") {
  return `<div class="rail-head"><h2 class="rail-title">${title}</h2>${end}</div>`;
}

/**
 * Pille, die etwas anlegt — für leere Karten. `action` sind die data-Angaben,
 * an denen src/shell/desk-rail.js erkennt, was angelegt wird (fester Text, nie Eingaben).
 */
export function createPill(action, label) {
  return `<button class="rail-pill" type="button" ${action}>${icon("plus")}${label}</button>`;
}

/** Eine Aufgabe: runder Haken zum Erledigen, daneben der Titel, rechts Fälligkeit und Dringlichkeit. */
export function railTaskRow(entry) {
  const id = escapeHtml(entry.id);
  const title = railTitle(entry);
  const prio = taskPriorityOf(entry.priority);
  const due = entry.date ? escapeHtml(shortDay(entry.date)) : "";
  const label = `${title}${due ? `, fällig ${due}` : ""}, Dringlichkeit ${escapeHtml(prio.label)}`;
  return `
    <li class="rail-task">
      <button class="rail-check" type="button" data-rail="done" data-id="${id}" aria-label="${title} erledigen">${icon("check")}</button>
      <button class="rail-task-title" type="button" data-rail="entry" data-id="${id}" aria-label="${label}">
        <span class="rail-task-text">${title}</span>
        ${due ? `<span class="rail-task-day">${due}</span>` : ""}
        <span class="rail-prio" style="background:${prio.color}"></span>
      </button>
    </li>
  `;
}
