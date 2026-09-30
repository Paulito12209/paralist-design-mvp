/*
 * Die Leisten des Auswahlmodus auf der Aufgaben-Seite — gebaut mit den
 * gemeinsamen Leisten aus src/ui/select-bar.js:
 *
 * - oben die Zählzeile: im Board mit der Zahl der Spalten, in denen die
 *   Auswahl liegt („3 ausgewählt · 2 Spalten“),
 * - unten Status, Dringlichkeit, Datum, Archivieren (bzw. Zurückholen, wenn
 *   alle gewählten schon im Archiv liegen) und Mehr.
 *
 * Was ein Knopf tut, steht in src/features/tasks/tasks-select-actions.js.
 * Pfad: src/features/tasks/tasks-select-bar.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * barActions -> Reihenfolge, Icons und Beschriftungen der Knöpfe unten
 * labels     -> Zusatz „Spalten“ und der Text ohne Auswahl
 *
 * Aussehen: styles/tasks-select.css.
 */

import { dom } from "../../core/dom.js";
import { createSelectBar, updateSelectRow } from "../../ui/select-bar.js";
import { pickedCount, taskSelection } from "./tasks-pick.js";
import { allArchived, runSelectAction } from "./tasks-select-actions.js";

const barActions = [
  { id: "status", icon: "check-circle", label: "Status" },
  { id: "priority", icon: "flame", label: "Dringlichkeit" },
  { id: "date", icon: "calendar", label: "Datum" },
  { id: "archive", icon: "archive", label: "Archivieren" },
  { id: "more", icon: "dots", label: "Mehr" },
];
const restoreLook = { icon: "history", label: "Zurückholen" };

const labels = { columns: "Spalten", none: "Aufgaben wählen" };

/* Die Leiste unten; entsteht beim ersten Mal. */
let bar = null;

/* Wie viele Spalten des Boards gewählte Zeilen enthalten. */
function pickedColumns() {
  const columns = dom.tasksBody.querySelectorAll(".board-col");
  return [...columns].filter((column) => column.querySelector("[data-picked]")).length;
}

/** Zählzeile und Aktionsleiste auf den Stand der Auswahl bringen — ohne die Liste neu zu zeichnen. */
export function updateSelectBars(on) {
  if (!bar) bar = createSelectBar("Gewählte Aufgaben", barActions, runSelectAction);
  const empty = pickedCount() === 0;
  const restore = allArchived();
  bar.update(on, {
    disabled: () => empty,
    shown: (action) => (action.id === "archive" && restore ? restoreLook : action),
  });
  if (!on) return;
  const columns = pickedColumns();
  updateSelectRow(dom.tasksTools, {
    count: pickedCount(),
    extra: columns > 1 ? `${columns} ${labels.columns}` : "",
    none: labels.none,
    allPicked: taskSelection.allRowsPicked(),
  });
}
