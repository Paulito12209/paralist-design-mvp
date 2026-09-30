/*
 * Die beiden Leisten des Auswahlmodus auf der Aufgaben-Seite:
 *
 * - oben an der Stelle der Pillen die Zählzeile: ✕ beendet die Auswahl, in
 *   der Mitte „3 ausgewählt“ (im Board mit der Zahl der Spalten, in denen die
 *   Auswahl liegt), rechts „Alle“ bzw. „Keine“,
 * - unten an der Stelle der Navigation die Aktionsleiste: Status,
 *   Dringlichkeit, Datum, Archivieren (bzw. Zurückholen) und Mehr. Am
 *   Desktop schwebt sie als Glaspille unter der Seite.
 *
 * Solange nichts gewählt ist, sind die Knöpfe unten blass und tun nichts.
 * Was ein Knopf tut, steht in src/features/tasks/tasks-select-actions.js.
 * Pfad: src/features/tasks/tasks-select-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * barActions -> Reihenfolge, Icons und Beschriftungen der Knöpfe unten
 * labels     -> Texte der Zählzeile
 *
 * Aussehen: styles/tasks-select.css.
 */

import { dom } from "../../core/dom.js";
import { escapeHtml, icon } from "../../core/html.js";
import { isPicked, pickedCount } from "./tasks-pick.js";
import { allArchived, runSelectAction } from "./tasks-select-actions.js";

const barActions = [
  { id: "status", icon: "check-circle", label: "Status" },
  { id: "priority", icon: "flame", label: "Dringlichkeit" },
  { id: "date", icon: "calendar", label: "Datum" },
  { id: "archive", icon: "archive", label: "Archivieren", restore: { icon: "history", label: "Zurückholen" } },
  { id: "more", icon: "dots", label: "Mehr" },
];

const labels = {
  none: "Aufgaben wählen",
  picked: "ausgewählt",
  columns: "Spalten",
  all: "Alle",
  clear: "Keine",
  exit: "Auswahl beenden",
};

/* Wie viele Spalten des Boards gewählte Zeilen enthalten. */
function pickedColumns() {
  const columns = dom.tasksBody.querySelectorAll(".board-col");
  return [...columns].filter((column) => column.querySelector("[data-picked]")).length;
}

/* Sind alle gezeichneten Zeilen gewählt? Dann heißt der Knopf rechts „Keine“. */
function allRowsPicked() {
  const rows = dom.tasksBody.querySelectorAll("[data-pick-row]");
  return rows.length > 0 && [...rows].every((row) => isPicked(row.dataset.pickRow));
}

/* Der Text in der Mitte: „3 ausgewählt“, im Board „3 ausgewählt · 2 Spalten“. */
function countText() {
  const count = pickedCount();
  if (!count) return labels.none;
  const columns = pickedColumns();
  return columns > 1 ? `${count} ${labels.picked} · ${columns} ${labels.columns}` : `${count} ${labels.picked}`;
}

/** Die Zählzeile an der Stelle der Pillen. */
export function selectRowMarkup() {
  return `
    <div class="tab-pills-row select-row">
      <button class="select-exit" type="button" data-select-exit aria-label="${labels.exit}" title="${labels.exit} (Esc)">
        ${icon("close")}
      </button>
      <span class="select-count" data-select-count aria-live="polite"></span>
      <button class="select-all" type="button" data-select-all></button>
    </div>
  `;
}

/* Die Aktionsleiste unten; entsteht beim ersten Mal und bleibt dann stehen. */
let bar = null;

function barMarkup() {
  return barActions
    .map(
      (action) => `
      <button class="select-act" type="button" data-select-act="${action.id}">
        <span class="select-act-icon">${icon(action.icon)}</span>
        <span class="select-act-label">${escapeHtml(action.label)}</span>
      </button>`
    )
    .join("");
}

function ensureBar() {
  if (bar && bar.isConnected) return bar;
  bar = document.createElement("div");
  bar.className = "select-bar";
  bar.hidden = true;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Gewählte Aufgaben");
  bar.innerHTML = barMarkup();
  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-act]");
    if (button && !button.disabled) runSelectAction(button.dataset.selectAct, button);
  });
  /* An die Stelle der Navigation: im selben Behälter, direkt davor */
  dom.navShell.before(bar);
  return bar;
}

/* „Archivieren“ oder „Zurückholen“, je nachdem, ob alle gewählten schon im Archiv liegen. */
function updateArchiveButton(root) {
  const button = root.querySelector('[data-select-act="archive"]');
  const spec = barActions.find((action) => action.id === "archive");
  const shown = allArchived() ? spec.restore : spec;
  button.querySelector(".select-act-icon").innerHTML = icon(shown.icon);
  button.querySelector(".select-act-label").textContent = shown.label;
}

/** Zählzeile und Aktionsleiste auf den Stand der Auswahl bringen — ohne die Liste neu zu zeichnen. */
export function updateSelectBars(on) {
  const root = ensureBar();
  root.hidden = !on;
  if (!on) return;
  const empty = pickedCount() === 0;
  root.querySelectorAll("[data-select-act]").forEach((button) => {
    button.disabled = empty;
  });
  updateArchiveButton(root);
  const count = dom.tasksTools.querySelector("[data-select-count]");
  if (count) count.textContent = countText();
  const all = dom.tasksTools.querySelector("[data-select-all]");
  if (all) all.textContent = allRowsPicked() ? labels.clear : labels.all;
}
